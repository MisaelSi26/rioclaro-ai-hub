import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cookieSession from 'cookie-session';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import multer from 'multer';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { BlobServiceClient } from '@azure/storage-blob';
import sql from 'mssql';
import { demoData, getDemoDashboard } from './data.js';

const app = express();
const port = Number(process.env.PORT || 8080);
const isProduction = process.env.NODE_ENV === 'production';
const isDevAuthEnabled = !isProduction && process.env.DEV_AUTH_ENABLED === 'true';
const dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(dirname, '..');
const staticDir = path.join(rootDir, 'dist');
const allowedRoles = ['Administrador', 'Dirección', 'Compras', 'Ventas', 'Bodega', 'Finanzas'];
const roleAliases = new Map([
  ['administrator', 'Administrador'],
  ['director', 'Dirección'],
  ['purchasing', 'Compras'],
  ['sales', 'Ventas'],
  ['warehouse', 'Bodega'],
  ['finance', 'Finanzas'],
]);

const requiredEntraSettings = [
  'ENTRA_CLIENT_ID',
  'ENTRA_CLIENT_SECRET',
  'ENTRA_TENANT_ID',
  'ENTRA_REDIRECT_URI',
];
const entraConfigured = requiredEntraSettings.every((name) => Boolean(process.env[name]));
const msalClient = entraConfigured
  ? new ConfidentialClientApplication({
      auth: {
        clientId: process.env.ENTRA_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}`,
        clientSecret: process.env.ENTRA_CLIENT_SECRET,
      },
    })
  : null;

if (isProduction && (!process.env.SESSION_KEYS || process.env.SESSION_KEYS.split(',').some((key) => key.trim().length < 32))) {
  throw new Error('SESSION_KEYS must contain production secrets of at least 32 characters.');
}

app.disable('x-powered-by');
if (isProduction) app.set('trust proxy', 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', 'https://images.unsplash.com'],
        'style-src': ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(
  cookieSession({
    name: 'rioclaro_session',
    keys: (process.env.SESSION_KEYS || 'local-development-key-change-me').split(','),
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
  }),
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const validMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validMimeTypes.includes(file.mimetype)) {
      callback(new Error('Solo se aceptan archivos PDF, JPG y PNG.'));
      return;
    }
    callback(null, true);
  },
});

let sqlPoolPromise;
function getSqlPool() {
  if (!process.env.SQL_CONNECTION_STRING) {
    if (isProduction) throw new Error('SQL_CONNECTION_STRING must be configured in production.');
    return null;
  }
  if (!sqlPoolPromise) {
    sqlPoolPromise = new sql.ConnectionPool(process.env.SQL_CONNECTION_STRING).connect().catch((error) => {
      sqlPoolPromise = undefined;
      throw error;
    });
  }
  return sqlPoolPromise;
}

function getUser(req) {
  return req.session?.user || null;
}

function requireAuth(req, res, next) {
  const user = getUser(req);
  if (!user) {
    res.status(401).json({ error: 'Se requiere una sesión autenticada.' });
    return;
  }
  next();
}

function requireRoles(...roles) {
  return (req, res, next) => {
    const user = getUser(req);
    if (!user) {
      res.status(401).json({ error: 'Se requiere una sesión autenticada.' });
      return;
    }
    if (!roles.some((role) => user.roles.includes(role))) {
      res.status(403).json({ error: 'Tu rol no tiene permiso para esta acción.' });
      return;
    }
    next();
  };
}

function roleClaims(claims) {
  const roles = Array.isArray(claims?.roles) ? claims.roles : [];
  return roles.map((role) => roleAliases.get(role.toLowerCase()) || role).filter((role) => allowedRoles.includes(role));
}

function createUser(claims, fallbackRole) {
  const roles = roleClaims(claims);
  return {
    id: claims?.oid || claims?.sub || crypto.randomUUID(),
    name: claims?.name || claims?.preferred_username || 'Usuario',
    email: claims?.preferred_username || claims?.email || '',
    roles: roles.length ? roles : fallbackRole ? [fallbackRole] : [],
  };
}

async function getInvoices() {
  const pool = await getSqlPool();
  if (!pool) return demoData.invoices;
  const result = await pool.request().query(`
    SELECT f.id, f.rfc, COALESCE(p.nombre, f.proveedor_nombre) AS supplier, f.fecha AS [date], f.folio,
      f.subtotal, f.iva AS tax, f.total, f.confianza_ocr AS confidence, f.estado AS status,
      CAST(CASE WHEN EXISTS (
        SELECT 1 FROM facturas d
        WHERE d.id <> f.id AND d.rfc = f.rfc AND d.proveedor_id = f.proveedor_id
          AND d.fecha = f.fecha AND d.folio = f.folio AND d.total = f.total
      ) THEN 1 ELSE 0 END AS bit) AS duplicate
    FROM facturas f LEFT JOIN proveedores p ON p.id = f.proveedor_id ORDER BY f.id DESC
  `);
  return result.recordset;
}

async function getInventory() {
  const pool = await getSqlPool();
  if (!pool) return demoData.inventory;
  const result = await pool.request().query(`
    SELECT p.sku, p.nombre_oficial AS name, i.existencia AS stock,
      s.nombre AS branch, p.categoria AS category
    FROM inventario i
    JOIN productos p ON p.id = i.producto_id
    JOIN sucursales s ON s.id = i.sucursal_id
    ORDER BY p.nombre_oficial, s.nombre
  `);
  return result.recordset;
}

async function getTickets() {
  const pool = await getSqlPool();
  if (!pool) return demoData.tickets;
  const result = await pool.request().query(`
    SELECT t.id, c.nombre AS client, c.sector AS [group], t.asunto AS subject,
      t.tipo AS channel, t.estatus AS status, t.asignado_a AS owner
    FROM tickets_cliente t JOIN clientes c ON c.id = t.cliente_id
    ORDER BY t.created_at DESC
  `);
  return result.recordset;
}

async function getClients() {
  const pool = await getSqlPool();
  if (!pool) return demoData.clients;
  const result = await pool.request().query(`
    SELECT id, nombre AS name, sector
    FROM clientes
    ORDER BY nombre
  `);
  return result.recordset;
}

async function getDashboard() {
  const pool = await getSqlPool();
  if (!pool) return getDemoDashboard();
  const [invoiceResult, ticketResult, branchResult, clientResult, monthlyResult] = await Promise.all([
    pool.request().query(`
      SELECT COUNT(*) AS processed,
        (SELECT COUNT(*) FROM facturas f
          WHERE EXISTS (
            SELECT 1 FROM facturas d
            WHERE d.id < f.id AND d.rfc=f.rfc AND d.proveedor_id=f.proveedor_id
              AND d.fecha=f.fecha AND d.folio=f.folio AND d.total=f.total
          )
        ) AS duplicates
      FROM facturas
    `),
    pool.request().query(`SELECT COUNT(*) AS openTickets FROM tickets_cliente WHERE estatus <> 'Resuelto'`),
    pool.request().query(`SELECT s.nombre AS branch, SUM(v.total) AS sales FROM ventas v JOIN sucursales s ON s.id=v.sucursal_id GROUP BY s.nombre`),
    pool.request().query(`SELECT COUNT(*) AS clients FROM clientes`),
    pool.request().query(`SELECT MONTH(fecha) AS monthNumber, SUM(total) AS sales FROM ventas GROUP BY MONTH(fecha) ORDER BY MONTH(fecha)`),
  ]);
  const salesByBranch = branchResult.recordset.map((row) => ({ branch: row.branch, sales: Number(row.sales || 0) }));
  return {
    salesTotal: salesByBranch.reduce((sum, row) => sum + row.sales, 0),
    salesByBranch,
    invoicesProcessed: invoiceResult.recordset[0]?.processed || 0,
    duplicatesDetected: invoiceResult.recordset[0]?.duplicates || 0,
    clientsServed: clientResult.recordset[0]?.clients || 0,
    openTickets: ticketResult.recordset[0]?.openTickets || 0,
    monthlySales: monthlyResult.recordset.map((row) => ({
      month: new Intl.DateTimeFormat('es-MX', { month: 'short' }).format(new Date(2026, row.monthNumber - 1, 1)),
      sales: Number(row.sales || 0),
    })),
  };
}

app.get('/api/health', async (_req, res) => {
  let database = 'demo';
  if (isProduction && !process.env.SQL_CONNECTION_STRING) {
    res.status(503).json({ status: 'degraded', database: 'not-configured' });
    return;
  }
  if (process.env.SQL_CONNECTION_STRING) {
    try {
      const pool = await getSqlPool();
      await pool.request().query('SELECT 1 AS healthy');
      database = 'connected';
    } catch (error) {
      console.error('SQL health check failed:', error.message);
      res.status(503).json({ status: 'degraded', database: 'unavailable' });
      return;
    }
  }
  if (isProduction && !entraConfigured) {
    res.status(503).json({ status: 'degraded', database, authentication: 'not-configured' });
    return;
  }
  res.json({ status: 'ok', database, authentication: entraConfigured ? 'entra-id' : 'not-configured' });
});

app.get('/api/auth/config', (_req, res) => {
  res.json({ entraConfigured, devLoginEnabled: isDevAuthEnabled });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ user: getUser(req) });
});

app.get('/auth/login', authLimiter, async (req, res, next) => {
  if (!msalClient) {
    res.status(503).send('Azure Entra ID no está configurado. Revisa las variables ENTRA_*.');
    return;
  }
  try {
    const state = crypto.randomBytes(24).toString('hex');
    const returnTo = typeof req.query.returnTo === 'string' && req.query.returnTo.startsWith('/') && !req.query.returnTo.startsWith('//')
      ? req.query.returnTo
      : '/dashboard';
    req.session.oauthState = state;
    req.session.returnTo = returnTo;
    const url = await msalClient.getAuthCodeUrl({
      scopes: ['openid', 'profile', 'email'],
      redirectUri: process.env.ENTRA_REDIRECT_URI,
      state,
      prompt: 'select_account',
    });
    res.redirect(url);
  } catch (error) {
    next(error);
  }
});

app.get('/auth/callback', authLimiter, async (req, res, next) => {
  if (!msalClient) {
    res.status(503).send('Azure Entra ID no está configurado.');
    return;
  }
  if (!req.query.code || !req.query.state || req.query.state !== req.session.oauthState) {
    req.session = null;
    res.status(400).send('Respuesta de autenticación inválida. Inicia sesión nuevamente.');
    return;
  }
  try {
    const result = await msalClient.acquireTokenByCode({
      code: String(req.query.code),
      scopes: ['openid', 'profile', 'email'],
      redirectUri: process.env.ENTRA_REDIRECT_URI,
    });
    const destination = req.session.returnTo || '/dashboard';
    req.session = null;
    req.session = {
      user: createUser(result.idTokenClaims, null),
    };
    res.redirect(destination);
  } catch (error) {
    req.session = null;
    next(error);
  }
});

app.post('/auth/dev-login', authLimiter, (req, res) => {
  if (!isDevAuthEnabled) {
    res.status(404).json({ error: 'No encontrado.' });
    return;
  }
  req.session = {
    user: createUser(
      { sub: 'local-demo-user', name: 'Usuario Demo', preferred_username: 'demo@rioclaro.local' },
      'Administrador',
    ),
  };
  res.json({ user: req.session.user });
});

app.post('/auth/logout', (req, res) => {
  req.session = null;
  const postLogoutRedirect = process.env.APP_BASE_URL
    || process.env.ENTRA_REDIRECT_URI?.replace(/\/auth\/callback\/?$/, '/')
    || 'http://localhost:5173/';
  const logoutUrl = msalClient
    ? `https://login.microsoftonline.com/${encodeURIComponent(process.env.ENTRA_TENANT_ID)}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirect)}`
    : '/';
  res.json({ logoutUrl });
});

app.use('/api', (req, res, next) => {
  if (isProduction && !process.env.SQL_CONNECTION_STRING) {
    res.status(503).json({ error: 'La base Azure SQL no está configurada.' });
    return;
  }
  next();
});

app.get('/api/dashboard', requireRoles('Administrador', 'Dirección', 'Finanzas'), async (_req, res, next) => {
  try {
    res.json(await getDashboard());
  } catch (error) {
    next(error);
  }
});

app.get('/api/invoices', requireRoles('Administrador', 'Compras', 'Finanzas'), async (_req, res, next) => {
  try {
    res.json(await getInvoices());
  } catch (error) {
    next(error);
  }
});

app.post('/api/invoices', requireRoles('Administrador', 'Compras', 'Finanzas'), upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    res.status(400).json({ error: 'Selecciona un archivo PDF, JPG o PNG.' });
    return;
  }
  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;
  if (isProduction && (!process.env.AZURE_STORAGE_CONNECTION_STRING || !process.env.AZURE_STORAGE_CONTAINER)) {
    res.status(503).json({ error: 'Azure Blob Storage no está configurado para conservar documentos.' });
    return;
  }
  if (!endpoint || !key) {
    res.status(503).json({ error: 'Document Intelligence no está configurado; no se procesó el documento.' });
    return;
  }
  try {
    let blobName;
    const analyzeUrl = `${endpoint.replace(/\/$/, '')}/documentintelligence/documentModels/prebuilt-invoice:analyze?api-version=2024-11-30`;
    const submitted = await fetch(analyzeUrl, {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': req.file.mimetype },
      body: req.file.buffer,
    });
    if (!submitted.ok) {
      throw new Error(`Document Intelligence respondió ${submitted.status}.`);
    }
    const operationUrl = submitted.headers.get('operation-location');
    if (!operationUrl) throw new Error('Document Intelligence no devolvió operation-location.');
    let analysis;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const poll = await fetch(operationUrl, { headers: { 'Ocp-Apim-Subscription-Key': key } });
      if (!poll.ok) throw new Error(`No se pudo consultar el análisis (${poll.status}).`);
      analysis = await poll.json();
      if (analysis.status === 'succeeded') break;
      if (analysis.status === 'failed') throw new Error('Document Intelligence no pudo analizar el archivo.');
    }
    if (analysis?.status !== 'succeeded') throw new Error('El análisis excedió el tiempo de espera.');
    if (process.env.AZURE_STORAGE_CONNECTION_STRING && process.env.AZURE_STORAGE_CONTAINER) {
      const blobService = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
      const container = blobService.getContainerClient(process.env.AZURE_STORAGE_CONTAINER);
      await container.createIfNotExists();
      blobName = `${crypto.randomUUID()}-${path.basename(req.file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      await container.getBlockBlobClient(blobName).uploadData(req.file.buffer, {
        blobHTTPHeaders: { blobContentType: req.file.mimetype },
      });
    }
    const fields = analysis.analyzeResult?.documents?.[0]?.fields || {};
    const getField = (name) => fields[name]?.valueString ?? fields[name]?.valueDate ?? fields[name]?.valueCurrency?.amount ?? null;
    const confidence = Math.min(...Object.values(fields).map((field) => Number(field?.confidence ?? 1))) * 100;
    const invoice = {
      rfc: getField('VendorTaxId'),
      supplier: getField('VendorName'),
      date: getField('InvoiceDate'),
      folio: getField('InvoiceId'),
      subtotal: getField('SubTotal'),
      tax: getField('TotalTax'),
      total: getField('InvoiceTotal'),
      confidence: Number.isFinite(confidence) ? Number(confidence.toFixed(2)) : 0,
      status: confidence < 90 ? 'Revisión Humana Requerida' : 'Pendiente',
      documentName: blobName || req.file.originalname,
    };
    const requiredOcrFields = [invoice.rfc, invoice.supplier, invoice.date, invoice.folio, invoice.total];
    if (requiredOcrFields.some((value) => value == null || value === '')) {
      invoice.status = 'Revisión Humana Requerida';
    }
    const pool = await getSqlPool();
    if (pool) {
      if (invoice.rfc && invoice.folio && invoice.total != null && invoice.date) {
        const existing = await pool.request()
          .input('rfc', sql.NVarChar(20), invoice.rfc)
          .input('folio', sql.NVarChar(60), invoice.folio)
          .input('total', sql.Decimal(18, 2), Number(invoice.total))
          .input('date', sql.NVarChar(30), String(invoice.date || ''))
          .query(`SELECT TOP 1 id FROM facturas
            WHERE rfc=@rfc AND folio=@folio AND total=@total AND fecha=@date`);
        if (existing.recordset.length) {
          invoice.duplicate = true;
          invoice.status = 'Posible Factura Duplicada';
        }
      }
      const provider = await pool.request()
        .input('rfc', sql.NVarChar(20), invoice.rfc)
        .query('SELECT TOP 1 id FROM proveedores WHERE rfc=@rfc');
      const inserted = await pool.request()
        .input('rfc', sql.NVarChar(20), invoice.rfc)
        .input('providerId', sql.Int, provider.recordset[0]?.id || null)
        .input('supplier', sql.NVarChar(200), invoice.supplier)
        .input('folio', sql.NVarChar(60), invoice.folio)
        .input('date', sql.NVarChar(30), String(invoice.date || ''))
        .input('subtotal', sql.Decimal(18, 2), invoice.subtotal == null ? null : Number(invoice.subtotal))
        .input('tax', sql.Decimal(18, 2), invoice.tax == null ? null : Number(invoice.tax))
        .input('total', sql.Decimal(18, 2), invoice.total == null ? null : Number(invoice.total))
        .input('confidence', sql.Decimal(5, 2), invoice.confidence)
        .input('status', sql.NVarChar(40), invoice.status)
        .input('documentUrl', sql.NVarChar(500), blobName || null)
        .query(`INSERT INTO facturas (rfc, proveedor_id, proveedor_nombre, folio, fecha, subtotal, iva, total, confianza_ocr, estado, documento_url)
          OUTPUT INSERTED.id VALUES (@rfc, @providerId, @supplier, @folio, @date, @subtotal, @tax, @total, @confidence, @status, @documentUrl)`);
      invoice.id = inserted.recordset[0].id;
    } else {
      invoice.id = Date.now();
      invoice.duplicate = Boolean(invoice.rfc && invoice.supplier && invoice.date && invoice.folio && invoice.total != null)
        && demoData.invoices.some((row) => (
        row.rfc === invoice.rfc
        && row.supplier === invoice.supplier
        && row.date === invoice.date
        && row.folio === invoice.folio
        && Number(row.total) === Number(invoice.total)
      ));
      if (invoice.duplicate) invoice.status = 'Posible Factura Duplicada';
      demoData.invoices.unshift(invoice);
    }
    res.status(201).json(invoice);
  } catch (error) {
    next(error);
  }
});

app.get('/api/inventory', requireRoles('Administrador', 'Dirección', 'Compras', 'Bodega'), async (_req, res, next) => {
  try {
    res.json(await getInventory());
  } catch (error) {
    next(error);
  }
});

app.get('/api/tickets', requireRoles('Administrador', 'Dirección', 'Ventas'), async (_req, res, next) => {
  try {
    res.json(await getTickets());
  } catch (error) {
    next(error);
  }
});

app.get('/api/clients', requireRoles('Administrador', 'Dirección', 'Ventas'), async (_req, res, next) => {
  try {
    res.json(await getClients());
  } catch (error) {
    next(error);
  }
});

app.post('/api/tickets', requireRoles('Administrador', 'Ventas'), async (req, res, next) => {
  const { clientId, subject, channel, owner } = req.body || {};
  const validChannels = ['Llamada', 'WhatsApp', 'Correo', 'Incidencia'];
  if (
    !Number.isInteger(clientId)
    || clientId < 1
    || typeof subject !== 'string'
    || !subject.trim()
    || subject.trim().length > 200
    || !validChannels.includes(channel)
    || (owner !== undefined && (typeof owner !== 'string' || owner.length > 120))
  ) {
    res.status(400).json({ error: 'Datos del ticket inválidos. Revisa cliente, asunto (máximo 200 caracteres) y canal.' });
    return;
  }
  try {
    const pool = await getSqlPool();
    if (!pool) {
      const client = demoData.clients.find((item) => item.id === clientId);
      if (!client) {
        res.status(404).json({ error: 'No se encontró el cliente seleccionado.' });
        return;
      }
      const ticket = { id: Date.now(), client: client.name, group: client.sector, subject: subject.trim(), channel, status: 'Abierto', owner: owner || req.session.user.name };
      demoData.tickets.unshift(ticket);
      res.status(201).json(ticket);
      return;
    }
    const clientResult = await pool.request()
      .input('clientId', sql.Int, clientId)
      .query('SELECT id FROM clientes WHERE id=@clientId');
    if (!clientResult.recordset.length) {
      res.status(404).json({ error: 'No se encontró el cliente seleccionado.' });
      return;
    }
    const inserted = await pool.request()
      .input('clientId', sql.Int, clientId)
      .input('subject', sql.NVarChar(200), subject.trim())
      .input('channel', sql.NVarChar(60), channel)
      .input('owner', sql.NVarChar(120), owner || req.session.user.name)
      .query(`INSERT INTO tickets_cliente (cliente_id, asunto, tipo, estatus, asignado_a)
        OUTPUT INSERTED.id VALUES (@clientId, @subject, @channel, 'Abierto', @owner)`);
    const ticket = await pool.request()
      .input('ticketId', sql.Int, inserted.recordset[0].id)
      .query(`SELECT t.id, c.nombre AS client, c.sector AS [group], t.asunto AS subject,
        t.tipo AS channel, t.estatus AS status, t.asignado_a AS owner
        FROM tickets_cliente t JOIN clientes c ON c.id=t.cliente_id WHERE t.id=@ticketId`);
    res.status(201).json(ticket.recordset[0]);
  } catch (error) {
    next(error);
  }
});

app.post('/api/chat', requireRoles('Administrador', 'Dirección', 'Compras', 'Ventas', 'Bodega'), async (req, res, next) => {
  const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
  if (!question || question.length > 1000) {
    res.status(400).json({ error: 'La consulta debe tener entre 1 y 1000 caracteres.' });
    return;
  }
  const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT;
  const searchKey = process.env.AZURE_SEARCH_KEY;
  const indexName = process.env.AZURE_SEARCH_INDEX;
  const openAiEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const openAiKey = process.env.AZURE_OPENAI_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  if (!searchEndpoint || !searchKey || !indexName || !openAiEndpoint || !openAiKey || !deployment) {
    res.status(503).json({ error: 'Azure AI Search y Azure OpenAI deben configurarse para responder consultas.' });
    return;
  }
  try {
    const searchResponse = await fetch(`${searchEndpoint.replace(/\/$/, '')}/indexes/${encodeURIComponent(indexName)}/docs/search?api-version=2024-07-01`, {
      method: 'POST',
      headers: { 'api-key': searchKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ search: question, top: 5, select: 'content,source,title' }),
    });
    if (!searchResponse.ok) throw new Error(`Azure AI Search respondió ${searchResponse.status}.`);
    const documents = (await searchResponse.json()).value || [];
    if (!documents.length) {
      res.json({ answer: 'No encontré evidencia documental suficiente para responder. Solicita revisión a tu equipo.', sources: [], model: 'Azure OpenAI GPT-4o' });
      return;
    }
    const context = documents.map((doc) => `Documento: ${doc.title || doc.source || 'Sin título'}\n${doc.content || ''}`).join('\n\n');
    const completion = await fetch(`${openAiEndpoint.replace(/\/$/, '')}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=2024-10-21`, {
      method: 'POST',
      headers: { 'api-key': openAiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        temperature: 0,
        messages: [
          { role: 'system', content: 'Responde en español solo con la evidencia del contexto. Si no basta, indícalo. No inventes datos y cita el documento utilizado.' },
          { role: 'user', content: `Pregunta: ${question}\n\nEvidencia:\n${context}` },
        ],
      }),
    });
    if (!completion.ok) throw new Error(`Azure OpenAI respondió ${completion.status}.`);
    const answer = (await completion.json()).choices?.[0]?.message?.content;
    res.json({
      answer: answer || 'No se recibió una respuesta del modelo.',
      sources: documents.map((doc) => doc.title || doc.source).filter(Boolean),
      model: deployment,
    });
  } catch (error) {
    next(error);
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.use(express.static(staticDir, { index: false, maxAge: isProduction ? '1h' : 0 }));
  app.get('/{*path}', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
      res.status(404).json({ error: 'Ruta no encontrada.' });
      return;
    }
    res.sendFile(path.join(staticDir, 'index.html'), (error) => {
      if (error) next(error);
    });
  });
}

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: error.message });
    return;
  }
  if (error.message?.startsWith('Solo se aceptan')) {
    res.status(400).json({ error: error.message });
    return;
  }
  console.error('Request failed:', error);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, '0.0.0.0', () => {
    console.log(`RioClaro AI Hub API listening on ${port}`);
  });
}

export { app };
