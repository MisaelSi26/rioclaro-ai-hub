import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { demoData } from './data.js';

process.env.NODE_ENV = 'test';
process.env.DEV_AUTH_ENABLED = 'true';
process.env.SESSION_KEYS = 'test-session-key-long-enough-for-cookie-signing';
process.env.SQL_CONNECTION_STRING = '';

const { app } = await import('./index.js');
let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

test('requires a session, serves role-protected data, and creates a ticket', async () => {
  const anonymousResponse = await fetch(`${baseUrl}/api/inventory`);
  assert.equal(anonymousResponse.status, 401);

  const anonymousSpeechToken = await fetch(`${baseUrl}/api/speech/token`);
  assert.equal(anonymousSpeechToken.status, 401);

  const anonymousInvoiceDelete = await fetch(`${baseUrl}/api/invoices/latest`, { method: 'DELETE' });
  assert.equal(anonymousInvoiceDelete.status, 401);
  const anonymousSelectedInvoiceDelete = await fetch(`${baseUrl}/api/invoices/1`, { method: 'DELETE' });
  assert.equal(anonymousSelectedInvoiceDelete.status, 401);
  const anonymousInvoiceDocument = await fetch(`${baseUrl}/api/invoices/1/document`);
  assert.equal(anonymousInvoiceDocument.status, 401);
  const anonymousInvoiceValidation = await fetch(`${baseUrl}/api/invoices/3/validate`, { method: 'POST' });
  assert.equal(anonymousInvoiceValidation.status, 401);

  const anonymousChatResponse = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'cloro' }),
  });
  assert.equal(anonymousChatResponse.status, 401);

  const loginResponse = await fetch(`${baseUrl}/auth/dev-login`, { method: 'POST' });
  assert.equal(loginResponse.status, 200);
  const cookie = loginResponse.headers.getSetCookie().map((value) => value.split(';', 1)[0]).join('; ');
  assert.ok(cookie);

  const inventoryResponse = await fetch(`${baseUrl}/api/inventory`, { headers: { Cookie: cookie } });
  assert.equal(inventoryResponse.status, 200);
  const inventory = await inventoryResponse.json();
  assert.equal(inventory.length, 5);

  const invoicePageResponse = await fetch(`${baseUrl}/api/invoices?page=1`, { headers: { Cookie: cookie } });
  assert.equal(invoicePageResponse.status, 200);
  const invoicePage = await invoicePageResponse.json();
  assert.equal(invoicePage.items.length, 4);
  assert.equal(invoicePage.page, 1);
  assert.equal(invoicePage.pageSize, 10);
  assert.equal(invoicePage.total, 4);
  assert.equal(invoicePage.totalPages, 1);

  const humanReviewPage = await (await fetch(
    `${baseUrl}/api/invoices?assignment=${encodeURIComponent('Requiere validación humana')}`,
    { headers: { Cookie: cookie } },
  )).json();
  assert.equal(humanReviewPage.total, 0);

  const demoInvoiceForReview = demoData.invoices.find((invoice) => invoice.id === 3);
  demoInvoiceForReview.confidence = 50;
  const thresholdInvoicePage = await (await fetch(
    `${baseUrl}/api/invoices?assignment=${encodeURIComponent('Requiere validación humana')}`,
    { headers: { Cookie: cookie } },
  )).json();
  assert.equal(thresholdInvoicePage.total, 0);

  demoInvoiceForReview.confidence = 35;
  demoInvoiceForReview.status = 'Revisión Humana Requerida';
  const unreadableInvoicePage = await (await fetch(
    `${baseUrl}/api/invoices?assignment=${encodeURIComponent('Requiere validación humana')}`,
    { headers: { Cookie: cookie } },
  )).json();
  assert.equal(unreadableInvoicePage.total, 1);
  assert.equal(unreadableInvoicePage.items[0].id, 3);

  const validateInvoice = await fetch(`${baseUrl}/api/invoices/3/validate`, {
    method: 'POST',
    headers: { Cookie: cookie },
  });
  assert.equal(validateInvoice.status, 200);
  assert.equal((await validateInvoice.json()).invoice.status, 'Validada');
  const humanReviewAfterValidation = await (await fetch(
    `${baseUrl}/api/invoices?assignment=${encodeURIComponent('Requiere validación humana')}`,
    { headers: { Cookie: cookie } },
  )).json();
  assert.equal(humanReviewAfterValidation.total, 0);

  const missingInvoiceValidation = await fetch(`${baseUrl}/api/invoices/999/validate`, {
    method: 'POST',
    headers: { Cookie: cookie },
  });
  assert.equal(missingInvoiceValidation.status, 404);
  const invalidInvoiceValidation = await fetch(`${baseUrl}/api/invoices/not-an-id/validate`, {
    method: 'POST',
    headers: { Cookie: cookie },
  });
  assert.equal(invalidInvoiceValidation.status, 400);

  const duplicatedInvoicePageResponse = await fetch(
    `${baseUrl}/api/invoices?page=1&assignment=${encodeURIComponent('Presunta duplicada')}`,
    { headers: { Cookie: cookie } },
  );
  assert.equal(duplicatedInvoicePageResponse.status, 200);
  const duplicatedInvoicePage = await duplicatedInvoicePageResponse.json();
  assert.equal(duplicatedInvoicePage.total, 1);
  assert.equal(duplicatedInvoicePage.items[0].id, 4);

  const invalidInvoicePage = await fetch(`${baseUrl}/api/invoices?page=0`, { headers: { Cookie: cookie } });
  assert.equal(invalidInvoicePage.status, 400);
  const invalidInvoiceAssignment = await fetch(`${baseUrl}/api/invoices?assignment=Unknown`, { headers: { Cookie: cookie } });
  assert.equal(invalidInvoiceAssignment.status, 400);

  const inventoryChatResponse = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: '¿Cuánto cloro queda?' }),
  });
  assert.equal(inventoryChatResponse.status, 200);
  const inventoryAnswer = await inventoryChatResponse.json();
  assert.match(inventoryAnswer.answer, /426 unidades/);
  assert.deepEqual(inventoryAnswer.sources, ['Azure SQL · Inventario actual']);

  const branchInventoryChatResponse = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: '¿Cuánto cloro queda en Guadalajara?' }),
  });
  assert.equal(branchInventoryChatResponse.status, 200);
  const branchInventoryAnswer = await branchInventoryChatResponse.json();
  assert.match(branchInventoryAnswer.answer, /240 unidades/);
  assert.match(branchInventoryAnswer.answer, /Guadalajara: 240 unidades/);

  const unconfiguredSpeechToken = await fetch(`${baseUrl}/api/speech/token`, { headers: { Cookie: cookie } });
  assert.equal(unconfiguredSpeechToken.status, 503);

  const ticketResponse = await fetch(`${baseUrl}/api/tickets`, {
    method: 'POST',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: 1, subject: 'Prueba automatizada', channel: 'Llamada' }),
  });
  assert.equal(ticketResponse.status, 201);
  assert.equal((await ticketResponse.json()).status, 'Abierto');

  const invalidTicket = await fetch(`${baseUrl}/api/tickets`, {
    method: 'POST',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: 0, subject: '', channel: 'otro' }),
  });
  assert.equal(invalidTicket.status, 400);

  const deleteLatestInvoice = await fetch(`${baseUrl}/api/invoices/latest`, {
    method: 'DELETE',
    headers: { Cookie: cookie },
  });
  assert.equal(deleteLatestInvoice.status, 200);
  const deletedInvoice = await deleteLatestInvoice.json();
  assert.equal(deletedInvoice.deletedInvoice.id, 4);
  const remainingAfterLatestDelete = await (await fetch(`${baseUrl}/api/invoices`, { headers: { Cookie: cookie } })).json();
  assert.equal(remainingAfterLatestDelete.total, 3);

  const unavailableDemoDocument = await fetch(`${baseUrl}/api/invoices/3/document`, { headers: { Cookie: cookie } });
  assert.equal(unavailableDemoDocument.status, 404);
  const deleteSelectedInvoice = await fetch(`${baseUrl}/api/invoices/3`, {
    method: 'DELETE',
    headers: { Cookie: cookie },
  });
  assert.equal(deleteSelectedInvoice.status, 200);
  assert.equal((await deleteSelectedInvoice.json()).deletedInvoice.id, 3);

  const missingInvoice = await fetch(`${baseUrl}/api/invoices/999`, {
    method: 'DELETE',
    headers: { Cookie: cookie },
  });
  assert.equal(missingInvoice.status, 404);
  const invalidInvoiceId = await fetch(`${baseUrl}/api/invoices/not-an-id`, {
    method: 'DELETE',
    headers: { Cookie: cookie },
  });
  assert.equal(invalidInvoiceId.status, 400);
  assert.equal((await (await fetch(`${baseUrl}/api/invoices`, { headers: { Cookie: cookie } })).json()).total, 2);
});
