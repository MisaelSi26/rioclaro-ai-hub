import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  BarChart3,
  Bot,
  CheckCircle2,
  FileText,
  Headphones,
  Mic,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Warehouse,
} from 'lucide-react';
import {
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const demoModules = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'facturas', label: 'Facturas', icon: FileText },
  { id: 'inventario', label: 'Inventario', icon: Warehouse },
  { id: 'chat', label: 'Asistente IA', icon: Bot },
  { id: 'voz', label: 'Consultas por voz', icon: Mic },
  { id: 'clientes', label: 'Atención a clientes', icon: Users },
];

const initialInvoices = [
  { id: 'F-20189', supplier: 'Distribuidora del Sur S.A.', rfc: 'RCO980102XYZ', total: 14476.8, confidence: 96, status: 'Validada', duplicate: false },
  { id: 'F-21450', supplier: 'Higiene Industrial MX', rfc: 'PQR120315ABC', total: 9802, confidence: 88, status: 'Revisión humana requerida', duplicate: false },
  { id: 'F-20189', supplier: 'Distribuidora del Sur S.A.', rfc: 'RCO980102XYZ', total: 14476.8, confidence: 97, status: 'Posible factura duplicada', duplicate: true },
];

const initialInventory = [
  { sku: 'CLORO-001', name: 'Cloro 1L', aliases: 'cloro litro blanqueador 1000 ml', stock: 240, branch: 'Guadalajara', category: 'Desinfectante' },
  { sku: 'CLORO-001', name: 'Cloro 1L', aliases: 'cloro litro blanqueador 1000 ml', stock: 186, branch: 'Zapopan', category: 'Desinfectante' },
  { sku: 'DETER-440', name: 'Detergente líquido 4L', aliases: 'detergente líquido limpiador', stock: 92, branch: 'León', category: 'Limpieza' },
  { sku: 'DESINF-620', name: 'Desinfectante multiuso', aliases: 'sanitizante multiusos', stock: 143, branch: 'Querétaro', category: 'Sanitizante' },
  { sku: 'JABON-120', name: 'Jabón industrial 1L', aliases: 'jabón líquido higiene', stock: 79, branch: 'Aguascalientes', category: 'Higiene' },
];

const initialTickets = [
  { id: 1, client: 'Hotel Los Encinos', channel: 'WhatsApp', subject: 'Pedido de desinfectante', status: 'Abierto', owner: 'Ventas' },
  { id: 2, client: 'San José Restaurant', channel: 'Llamada', subject: 'Entrega incompleta', status: 'En proceso', owner: 'Operación' },
  { id: 3, client: 'Escuela Primaria México', channel: 'Correo', subject: 'Cotización de sanitizantes', status: 'Resuelto', owner: 'Atención' },
];

const sales = [
  { month: 'Ene', amount: 320 },
  { month: 'Feb', amount: 410 },
  { month: 'Mar', amount: 380 },
  { month: 'Abr', amount: 520 },
  { month: 'May', amount: 600 },
  { month: 'Jun', amount: 690 },
  { month: 'Jul', amount: 760 },
];

const branches = [
  { name: 'Guadalajara', share: 32 },
  { name: 'Zapopan', share: 26 },
  { name: 'León', share: 18 },
  { name: 'Querétaro', share: 15 },
  { name: 'Aguascalientes', share: 9 },
];

const chartColors = ['#2563eb', '#0f172a', '#10b981', '#f59e0b', '#dc2626'];

const demoAnswers = [
  { match: /cloro|blanqueador/i, answer: 'Hay 426 unidades de Cloro 1L: 240 en Guadalajara y 186 en Zapopan.', source: 'Inventario por sucursal · datos demo' },
  { match: /factura|duplicad/i, answer: 'En este escenario hay 3 facturas de ejemplo, incluida una posible duplicada que requiere revisión antes de aprobarse.', source: 'Registro de facturas demo' },
  { match: /pol[ií]tica|devoluci/i, answer: 'La demostración no incluye políticas documentales reales. En producción, el asistente solo debe responder con evidencia indexada y mostrar su fuente.', source: 'Guía de IA responsable · demo' },
  { match: /venta|sucursal/i, answer: 'Guadalajara aporta 32% de las ventas demo, seguida de Zapopan con 26%.', source: 'Indicadores ejecutivos · datos demo' },
];

function DemoHub() {
  const { module = 'dashboard' } = useParams();
  const [darkMode, setDarkMode] = useState(false);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [inventorySearch, setInventorySearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('Todas');
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [voiceText, setVoiceText] = useState('¿Cuánto cloro de litro nos queda?');
  const [voiceNotice, setVoiceNotice] = useState('');
  const [tickets, setTickets] = useState(initialTickets);
  const [ticketDraft, setTicketDraft] = useState({ client: '', channel: 'Llamada', subject: '' });
  const [ticketNotice, setTicketNotice] = useState('');
  const [invoiceNotice, setInvoiceNotice] = useState('');
  const selectedModule = demoModules.find((item) => item.id === module);
  const inventory = initialInventory.filter((item) => (
    (branchFilter === 'Todas' || item.branch === branchFilter)
    && `${item.name} ${item.sku} ${item.aliases} ${item.category}`.toLowerCase().includes(inventorySearch.trim().toLowerCase())
  ));

  if (!selectedModule) return <Navigate to="/demo/dashboard" replace />;

  function simulateInvoice(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get('invoice');
    if (!file || !file.name) {
      setInvoiceNotice('Selecciona un PDF, JPG o PNG para ejecutar la simulación.');
      return;
    }
    const demoInvoice = {
      id: `DEMO-${String(invoices.length + 1).padStart(3, '0')}`,
      supplier: 'Higiene Industrial MX',
      rfc: 'PQR120315ABC',
      total: 9802,
      confidence: invoices.length % 2 ? 88 : 96,
      status: invoices.length % 2 ? 'Revisión humana requerida' : 'Validada',
      duplicate: false,
    };
    setInvoices((current) => [demoInvoice, ...current]);
    setInvoiceNotice(`Simulación completada para ${file.name}. El archivo no se envió ni se guardó.`);
    event.currentTarget.reset();
  }

  function submitQuestion(event) {
    event.preventDefault();
    const prompt = question.trim();
    if (!prompt) return;
    const matched = demoAnswers.find((item) => item.match.test(prompt));
    setMessages((current) => [
      ...current,
      { from: 'user', text: prompt },
      {
        from: 'assistant',
        text: matched?.answer || 'En la demo solo respondo con estos temas de ejemplo. Prueba preguntar por cloro, facturas, políticas o ventas.',
        source: matched?.source || 'Sin fuente real · respuesta de demostración',
      },
    ]);
    setQuestion('');
  }

  function submitTicket(event) {
    event.preventDefault();
    if (!ticketDraft.client.trim() || !ticketDraft.subject.trim()) return;
    setTickets((current) => [{
      id: Date.now(),
      ...ticketDraft,
      status: 'Abierto',
      owner: 'Usuario demo',
    }, ...current]);
    setTicketNotice('Seguimiento agregado solo a esta sesión de demostración.');
    setTicketDraft({ client: '', channel: 'Llamada', subject: '' });
  }

  function playDemoSpeech(text) {
    if (!('speechSynthesis' in window)) {
      setVoiceNotice('La lectura en voz alta no está disponible en este navegador.');
      return;
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    setVoiceNotice('Lectura local del navegador (no es Azure Speech).');
  }

  return (
    <div className={`rioclaro-app ${darkMode ? 'theme-dark' : 'theme-light'} demo-app`}>
      <header className="topbar">
        <Link to="/" className="brand-wrap">
          <div className="brand-mark">RC</div>
          <div><span className="brand-name">RioClaro</span><small>AI Hub</small></div>
        </Link>
        <div className="demo-header-badge"><Sparkles size={16} /> Modo demostración</div>
        <div className="top-actions">
          <button className="ghost-button" type="button" onClick={() => setDarkMode((value) => !value)}>
            {darkMode ? 'Modo claro' : 'Modo oscuro'}
          </button>
          <Link className="secondary-button inline-button" to="/">Salir de la demo</Link>
        </div>
      </header>

      <main className="page-shell demo-shell">
        <div className="demo-notice" role="note">
          <ShieldCheck size={18} />
          <span><strong>Entorno seguro de muestra.</strong> Datos ficticios e interacciones locales; no se consulta ni modifica información productiva.</span>
        </div>

        <div className="section-heading demo-heading">
          <span className="eyebrow">Recorrido interactivo</span>
          <h1>{selectedModule.label}</h1>
          <p>Explora las soluciones de RioClaro AI Hub con escenarios de demostración.</p>
        </div>

        <div className="platform-shell demo-platform">
          <aside className="module-tabs" aria-label="Módulos de demostración">
            {demoModules.map(({ id, label, icon: Icon }) => (
              <Link key={id} to={`/demo/${id}`} className={module === id ? 'tab active' : 'tab'}>
                <Icon size={18} />{label}
              </Link>
            ))}
          </aside>

          <section className="module-panel demo-panel">
            {module === 'dashboard' && (
              <div className="module-content">
                <div className="demo-kpis">
                  <div className="kpi-box"><span>Ventas totales · demo</span><strong>$18.4M</strong></div>
                  <div className="kpi-box"><span>Facturas procesadas</span><strong>8,640</strong></div>
                  <div className="kpi-box"><span>Duplicados detectados</span><strong>146</strong></div>
                  <div className="kpi-box"><span>Tickets abiertos</span><strong>{tickets.filter((item) => item.status !== 'Resuelto').length}</strong></div>
                </div>
                <div className="dashboard-grid">
                  <div className="chart-card">
                    <div className="chart-header"><h3>Ventas por mes · miles MXN</h3><BarChart3 size={18} /></div>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={sales}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                        <XAxis dataKey="month" stroke="#64748b" /><YAxis stroke="#64748b" /><Tooltip />
                        <Line dataKey="amount" name="Ventas" stroke="#2563eb" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="chart-card">
                    <div className="chart-header"><h3>Ventas por sucursal</h3><Warehouse size={18} /></div>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={branches} dataKey="share" nameKey="name" innerRadius={48} outerRadius={86}>
                          {branches.map((branch, index) => <Cell key={branch.name} fill={chartColors[index]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="legend-list">{branches.map((branch, index) => <div className="legend-item" key={branch.name}><span className="dot" style={{ backgroundColor: chartColors[index] }} />{branch.name} · {branch.share}%</div>)}</div>
                  </div>
                </div>
              </div>
            )}

            {module === 'facturas' && (
              <div className="module-content">
                <div className="module-head"><div><span className="eyebrow dark">OCR simulado</span><h3>Procesa una factura de muestra</h3></div><span className="pill neutral">Nada se transmite</span></div>
                <form className="upload-box demo-upload" onSubmit={simulateInvoice}>
                  <FileText size={28} />
                  <strong>Selecciona un PDF, JPG o PNG</strong>
                  <span>El archivo solo se usa para simular una extracción visual en esta página.</span>
                  <input name="invoice" type="file" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" />
                  <button type="submit" className="primary-button small-button">Simular lectura OCR</button>
                  {invoiceNotice && <span role="status">{invoiceNotice}</span>}
                </form>
                <div className="table-card demo-table">
                  <table><thead><tr><th>Folio</th><th>Proveedor</th><th>Total</th><th>Confianza</th><th>Estado</th></tr></thead>
                    <tbody>{invoices.map((invoice, index) => <tr key={`${invoice.id}-${index}`}><td>{invoice.id}</td><td>{invoice.supplier}</td><td>${invoice.total.toLocaleString('es-MX')}</td><td>{invoice.confidence}%</td><td><span className={`status ${invoice.duplicate ? 'abierto' : invoice.confidence < 90 ? 'en-proceso' : 'resuelto'}`}>{invoice.status}</span></td></tr>)}</tbody>
                  </table>
                </div>
                {invoices.some((invoice) => invoice.duplicate) && <div className="duplicate-alert"><CheckCircle2 size={18} /> Escenario incluido: una factura duplicada bloquea la aprobación automática.</div>}
              </div>
            )}

            {module === 'inventario' && (
              <div className="module-content">
                <div className="module-head"><div><span className="eyebrow dark">Catálogo homologado</span><h3>Inventario por sucursal</h3></div><span className="pill success">Alias agrupados por SKU</span></div>
                <div className="demo-filters">
                  <label className="demo-search"><Search size={18} /><input value={inventorySearch} onChange={(event) => setInventorySearch(event.target.value)} placeholder="Buscar nombre, alias o SKU" /></label>
                  <select value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)} aria-label="Filtrar sucursal">
                    <option>Todas</option>{branches.map((branch) => <option key={branch.name}>{branch.name}</option>)}
                  </select>
                </div>
                <p className="demo-hint">Prueba “cloro litro” o “blanqueador”: los alias se agrupan bajo el SKU CLORO-001.</p>
                <div className="table-card inventory-table demo-table">
                  <table><thead><tr><th>SKU</th><th>Nombre oficial</th><th>Existencia</th><th>Sucursal</th><th>Categoría</th></tr></thead>
                    <tbody>{inventory.map((item, index) => <tr key={`${item.sku}-${item.branch}-${index}`}><td>{item.sku}</td><td>{item.name}</td><td>{item.stock}</td><td>{item.branch}</td><td>{item.category}</td></tr>)}
                      {!inventory.length && <tr><td colSpan="5">No hay coincidencias para esos filtros.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {module === 'chat' && (
              <div className="module-content">
                <div className="module-head"><div><span className="eyebrow dark">RAG de muestra</span><h3>Pregunta sobre el negocio</h3></div><span className="pill neutral">Respuestas predefinidas · demo</span></div>
                <div className="chat-panel demo-chat">
                  {!messages.length && <p className="chat-empty">Prueba: “¿Cuánto cloro queda?”, “¿Hay facturas duplicadas?” o “¿Cómo van las ventas?”.</p>}
                  {messages.map((item, index) => <div key={`${index}-${item.from}`} className="demo-message">
                    <div className={`bubble ${item.from}`}>{item.text}</div>
                    {item.source && <small className="demo-source">Fuente: {item.source}</small>}
                  </div>)}
                  <form className="chat-input" onSubmit={submitQuestion}>
                    <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Escribe una pregunta para la demo" aria-label="Pregunta de demostración" />
                    <button className="primary-button small-button" type="submit">Consultar</button>
                  </form>
                </div>
              </div>
            )}

            {module === 'voz' && (
              <div className="module-content">
                <div className="module-head"><div><span className="eyebrow dark">Voz y accesibilidad</span><h3>Consulta hablada</h3></div><span className="pill neutral">Speech simulado</span></div>
                <div className="voice-box demo-voice">
                  <Headphones size={28} />
                  <label htmlFor="demo-voice-text">Frase reconocida (escenario de muestra)</label>
                  <textarea id="demo-voice-text" value={voiceText} onChange={(event) => setVoiceText(event.target.value)} />
                  <div className="demo-voice-actions">
                    <button type="button" className="secondary-button" onClick={() => { setVoiceText('¿Cuánto cloro de litro nos queda?'); setVoiceNotice('Frase de voz demo cargada.'); }}><Mic size={17} /> Simular reconocimiento</button>
                    <button type="button" className="primary-button" onClick={() => playDemoSpeech('En Guadalajara hay 240 unidades y en Zapopan hay 186 unidades de cloro de un litro.')}><Headphones size={17} /> Escuchar respuesta</button>
                  </div>
                  <div className="demo-answer"><strong>Respuesta de muestra</strong><p>En Guadalajara hay 240 unidades y en Zapopan 186 unidades de cloro de un litro.</p><small>Fuente: Inventario por sucursal · datos demo</small></div>
                  {voiceNotice && <span role="status">{voiceNotice}</span>}
                  <p className="demo-hint">La voz usa la síntesis local del navegador cuando está disponible; no conecta con Azure Speech.</p>
                </div>
              </div>
            )}

            {module === 'clientes' && (
              <div className="module-content">
                <div className="module-head"><div><span className="eyebrow dark">CRM de muestra</span><h3>Seguimiento de clientes</h3></div><span className="pill neutral">Cambios locales a esta sesión</span></div>
                <form className="ticket-form demo-ticket-form" onSubmit={submitTicket}>
                  <label>Cliente<input value={ticketDraft.client} onChange={(event) => setTicketDraft((current) => ({ ...current, client: event.target.value }))} placeholder="Nombre del cliente" maxLength="120" required /></label>
                  <label>Asunto<input value={ticketDraft.subject} onChange={(event) => setTicketDraft((current) => ({ ...current, subject: event.target.value }))} placeholder="Motivo del seguimiento" maxLength="200" required /></label>
                  <label>Canal<select value={ticketDraft.channel} onChange={(event) => setTicketDraft((current) => ({ ...current, channel: event.target.value }))}><option>Llamada</option><option>WhatsApp</option><option>Correo</option><option>Incidencia</option></select></label>
                  <button className="primary-button small-button" type="submit">Agregar seguimiento</button>
                  {ticketNotice && <span role="status">{ticketNotice}</span>}
                </form>
                <div className="table-card demo-table"><table><thead><tr><th>Cliente</th><th>Canal</th><th>Asunto</th><th>Estatus</th><th>Responsable</th></tr></thead>
                  <tbody>{tickets.map((ticket) => <tr key={ticket.id}><td>{ticket.client}</td><td>{ticket.channel}</td><td>{ticket.subject}</td><td><span className={`status ${ticket.status.toLowerCase().replace(/\s+/g, '-')}`}>{ticket.status}</span></td><td>{ticket.owner}</td></tr>)}</tbody>
                </table></div>
              </div>
            )}

            <section className="demo-responsibility">
              <ShieldCheck size={20} />
              <div><strong>Transparencia de esta demo</strong><p>Datos ficticios, resultados simulados y sin acceso a información real. En producción, cada respuesta debe citar evidencia y respetar los roles del usuario.</p></div>
            </section>
          </section>
        </div>
        <footer className="demo-footer"><Link to="/">Volver a RioClaro AI Hub</Link><span>Modo demostración · no usar como fuente de datos operativos</span></footer>
      </main>
    </div>
  );
}

export default DemoHub;
