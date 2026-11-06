import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

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
});
