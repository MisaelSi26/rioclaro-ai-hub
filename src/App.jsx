import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  FileText,
  Lock,
  Mic,
  ShieldCheck,
  TrendingUp,
  Users,
  Warehouse,
  Zap,
} from 'lucide-react';
import {
  Bar,
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
import LoginPage from './components/LoginPage.jsx';
import DemoHub from './components/DemoHub.jsx';

const productCards = [
  { title: 'Cloro industrial', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80', subtitle: 'Desinfectantes y sanitizantes' },
  { title: 'Detergentes líquidos', image: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1200&q=80', subtitle: 'Limpieza profesional' },
  { title: 'Artículos de limpieza', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80', subtitle: 'Kits y consumibles' },
  { title: 'Suministros hoteleros', image: 'https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?auto=format&fit=crop&w=1200&q=80', subtitle: 'Hoteles y restaurantes' },
  { title: 'Higiene institucional', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', subtitle: 'Escuelas y hospitales' },
  { title: 'Inventario de bodega', image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80', subtitle: 'Inventarios inteligentes' },
];

const benefitCards = [
  { icon: Zap, title: 'Operación más rápida', description: 'Reducimos tiempos de aprobación, validación y clasificación documental con automatización inteligente.' },
  { icon: Warehouse, title: 'Inventario centralizado', description: 'Tener una visión precisa de stock, surtido y disponibilidad por sucursal, 24/7.' },
  { icon: ShieldCheck, title: 'Control de riesgos', description: 'Detectamos duplicados, validamos proveedores y reforzamos cumplimiento operativo.' },
  { icon: Bot, title: 'Asistente IA útil', description: 'Consulta de políticas, clientes, proveedores y ventas con evidencia documental y trazabilidad.' },
];

const workflowSteps = [
  { number: '01', title: 'Captura inteligente', text: 'Facturas PDF, JPG o PNG se cargan y se validan automáticamente con Document Intelligence.' },
  { number: '02', title: 'Clasificación IA', text: 'Se extraen RFC, proveedor, importe, folio y confianza de OCR con revisión humana en casos críticos.' },
  { number: '03', title: 'Sincronización', text: 'Los datos se centralizan por sucursal y se comparan contra la base de inventario y proveedores.' },
  { number: '04', title: 'Acción ejecutiva', text: 'Dashboards y asistente IA permiten decidir con rapidez, reducir fraude y mejorar la atención.' },
];

const useCases = [
  'Validación de facturas con OCR y reglas de negocio',
  'Detección de duplicados y prevención de pagos erróneos',
  'Homologación de productos para una misma categoría y SKU',
  'Seguimiento de quejas y resolución de incidencias por cliente',
  'Consultas de inventario y ventas por texto o voz',
  'Monitoreo ejecutivo por sucursal con KPI centralizados',
];

const metrics = [
  { label: 'Ventas totales', value: '$18.4M', delta: '+14.8%' },
  { label: 'Facturas procesadas', value: '8,640', delta: '+21.3%' },
  { label: 'Duplicados detectados', value: '146', delta: '-8.7%' },
  { label: 'Clientes atendidos', value: '1,820', delta: '+9.2%' },
];

const salesData = [
  { mes: 'Ene', ventas: 320 },
  { mes: 'Feb', ventas: 410 },
  { mes: 'Mar', ventas: 380 },
  { mes: 'Abr', ventas: 520 },
  { mes: 'May', ventas: 600 },
  { mes: 'Jun', ventas: 690 },
  { mes: 'Jul', ventas: 760 },
];

const branchMix = [
  { name: 'Guadalajara', value: 32 },
  { name: 'Zapopan', value: 26 },
  { name: 'León', value: 18 },
  { name: 'Querétaro', value: 15 },
  { name: 'Aguascalientes', value: 9 },
];

const colors = ['#2563EB', '#0F172A', '#10B981', '#F59E0B', '#DC2626'];

const responsibleItems = [
  { title: 'Equidad', description: 'Se evalúan sesgos en procesos y se exige revisión humana para decisiones impactantes.' },
  { title: 'Transparencia', description: 'Cada respuesta del asistente incluye la fuente documental utilizada y el modelo aplicado.' },
  { title: 'Rendición de cuentas', description: 'Los responsables tienen trazabilidad del origen y contexto de cada decisión automatizada.' },
  { title: 'Privacidad', description: 'La información sensible se protege con Azure Entra ID, Key Vault y control de acceso por rol.' },
  { title: 'Inclusión', description: 'El sistema está preparado para usuarios en distintos canales: web, móvil y voz.' },
  { title: 'Confiabilidad', description: 'Se exige intervención humana cuando la confianza o el impacto del dato no cumplen el umbral.' },
];

const testimonials = [
  { name: 'Ana García', role: 'Director de Compras, Grupo Hotelero', quote: 'RioClaro AI Hub nos ayudó a reducir errores de facturación y a centralizar información en minutos, no en días.' },
  { name: 'Luis Romero', role: 'Gerente de Operación, Distribución', quote: 'La trazabilidad y la IA responsable nos dieron mayor confianza para escalar procesos de inventario y atención.' },
  { name: 'María Torres', role: 'Coordinadora de Bodega', quote: 'Los reportes por sucursal y la clasificación automática de productos cambiaron completamente nuestra operación.' },
];

const moduleTabs = [
  { id: 'facturas', label: 'Facturas', icon: FileText },
  { id: 'inventario', label: 'Inventario', icon: Warehouse },
  { id: 'chat', label: 'Asistente IA', icon: Bot },
  { id: 'voz', label: 'Voz', icon: Mic },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
];

const moduleRoleAccess = {
  facturas: ['Administrador', 'Compras', 'Finanzas'],
  inventario: ['Administrador', 'Dirección', 'Compras', 'Bodega'],
  chat: ['Administrador', 'Dirección', 'Compras', 'Ventas', 'Bodega'],
  voz: ['Administrador', 'Dirección', 'Compras', 'Ventas', 'Bodega'],
  clientes: ['Administrador', 'Dirección', 'Ventas'],
  dashboard: ['Administrador', 'Dirección', 'Finanzas'],
};

function HubApp({ user, onLogout }) {
  const [darkMode, setDarkMode] = useState(false);
  const [apiData, setApiData] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoiceStatus, setInvoiceStatus] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatStatus, setChatStatus] = useState('');
  const [clientOptions, setClientOptions] = useState([]);
  const [ticketDraft, setTicketDraft] = useState({ clientId: '', subject: '', channel: 'Llamada' });
  const [ticketStatus, setTicketStatus] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const pathToTab = {
    '/facturas': 'facturas',
    '/inventario': 'inventario',
    '/chat': 'chat',
    '/voz': 'voz',
    '/clientes': 'clientes',
    '/dashboard': 'dashboard',
  };
  const activeTab = pathToTab[location.pathname] || 'facturas';
  const isLanding = location.pathname === '/';
  const canAccessModule = isLanding || moduleRoleAccess[activeTab]?.some((role) => user.roles.includes(role));
  const canCreateTickets = user.roles.some((role) => ['Administrador', 'Ventas'].includes(role));
  const currentInvoice = activeTab === 'facturas' && Array.isArray(apiData) ? apiData[0] : null;
  const visibleTabs = isLanding
    ? moduleTabs
    : moduleTabs.filter(({ id }) => moduleRoleAccess[id]?.some((role) => user.roles.includes(role)));

  useEffect(() => {
    if (isLanding) {
      setApiData(null);
      setApiError('');
      setApiLoading(false);
      return undefined;
    }
    const endpoint = {
      facturas: 'invoices',
      inventario: 'inventory',
      clientes: 'tickets',
      dashboard: 'dashboard',
    }[activeTab];
    if (!endpoint) {
      setApiData(null);
      setApiLoading(false);
      return undefined;
    }
    let active = true;
    setApiData(null);
    setApiLoading(true);
    setApiError('');
    fetch(`/api/${endpoint}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'No se pudieron cargar los datos.');
        return result;
      })
      .then((result) => {
        if (active) setApiData(result);
      })
      .catch((error) => {
        if (active) setApiError(error.message);
      })
      .finally(() => {
        if (active) setApiLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeTab, isLanding]);

  useEffect(() => {
    if (isLanding || activeTab !== 'clientes') return undefined;
    let active = true;
    fetch('/api/clients')
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'No se pudieron cargar los clientes.');
        return result;
      })
      .then((result) => {
        if (!active) return;
        setClientOptions(result);
        setTicketDraft((draft) => ({ ...draft, clientId: draft.clientId || String(result[0]?.id || '') }));
      })
      .catch((error) => {
        if (active) setApiError(error.message);
      });
    return () => {
      active = false;
    };
  }, [activeTab, isLanding]);

  async function uploadInvoice(event) {
    event.preventDefault();
    if (!invoiceFile) return;
    setInvoiceStatus('Procesando con Azure AI Document Intelligence...');
    const formData = new FormData();
    formData.append('file', invoiceFile);
    try {
      const response = await fetch('/api/invoices', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo procesar la factura.');
      setInvoiceStatus(`${result.status} · confianza OCR ${result.confidence}%`);
      setApiData((previous) => [result, ...(Array.isArray(previous) ? previous : [])]);
      setInvoiceFile(null);
      event.target.reset();
    } catch (error) {
      setInvoiceStatus(error.message);
    }
  }

  function chooseInvoice(file) {
    if (!file) return;
    const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const acceptedExtensions = /\.(pdf|jpe?g|png)$/i.test(file.name);
    if (!acceptedTypes.includes(file.type) || !acceptedExtensions) {
      setInvoiceFile(null);
      setInvoiceStatus('Solo se aceptan archivos PDF, JPG y PNG.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setInvoiceFile(null);
      setInvoiceStatus('El documento no puede superar los 10 MB.');
      return;
    }
    setInvoiceFile(file);
    setInvoiceStatus('');
  }

  async function submitChat(event) {
    event.preventDefault();
    const question = chatQuestion.trim();
    if (!question) return;
    setChatQuestion('');
    setChatStatus('Buscando evidencia documental...');
    setChatHistory((messages) => [...messages, { from: 'user', text: question }]);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo consultar el asistente.');
      setChatHistory((messages) => [
        ...messages,
        { from: 'assistant', text: result.answer },
        { from: 'source', text: `Fuente: ${result.sources.join(', ') || 'Sin documento'} · Modelo: ${result.model}` },
      ]);
      setChatStatus('');
    } catch (error) {
      setChatStatus(error.message);
    }
  }

  async function submitTicket(event) {
    event.preventDefault();
    setTicketStatus('Guardando seguimiento...');
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ticketDraft, clientId: Number(ticketDraft.clientId) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo guardar el seguimiento.');
      setApiData((previous) => [result, ...(Array.isArray(previous) ? previous : [])]);
      setTicketDraft((draft) => ({ ...draft, subject: '' }));
      setTicketStatus('Seguimiento registrado.');
    } catch (error) {
      setTicketStatus(error.message);
    }
  }

  return (
    <div className={`rioclaro-app ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      <header className="topbar">
        <Link to="/" className="brand-wrap">
          <div className="brand-mark">RC</div>
          <div>
            <span className="brand-name">RioClaro</span>
            <small>AI Hub</small>
          </div>
        </Link>

        <nav className="main-nav" aria-label="Navegación principal">
          {isLanding ? (
            <>
              <a href="#productos">Productos</a>
              <a href="#beneficios">Beneficios</a>
              <a href="#documentacion">IA Responsable</a>
              <Link to="/demo">Modo demo</Link>
            </>
          ) : (
            <span className="user-greeting">{user.name} · {user.roles.join(', ') || 'Sin rol asignado'}</span>
          )}
        </nav>

        <div className="top-actions">
          <button className="ghost-button" type="button" onClick={() => setDarkMode((prev) => !prev)}>
            {darkMode ? 'Modo claro' : 'Modo oscuro'}
          </button>
          {isLanding ? (
            <>
              <Link to="/demo" className="secondary-button inline-button">Probar demo</Link>
              <Link to="/login" className="primary-button inline-button">Ingresar al Sistema</Link>
            </>
          ) : (
            <button type="button" className="primary-button inline-button" onClick={onLogout}>Cerrar sesión</button>
          )}
        </div>
      </header>

      <main className="page-shell">
        {isLanding && <motion.section
          className="hero-section"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="hero-copy">
            <span className="eyebrow">Distribución inteligente</span>
            <h1>Transformando la Distribución con Inteligencia Artificial</h1>
            <p>
              Automatización de facturas, inventarios inteligentes y atención inmediata para clientes y colaboradores.
            </p>
            <div className="hero-actions">
              <Link to="/login" className="primary-button">
                Ingresar al Sistema
              </Link>
              <Link to="/demo" className="secondary-button">
                Explorar demo interactiva
              </Link>
            </div>
            <div className="stat-row">
              {metrics.map((item) => (
                <div key={item.label} className="mini-stat">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                  <small>{item.delta}</small>
                </div>
              ))}
            </div>
            <p className="demo-data-note">Indicadores ilustrativos; los datos operativos solo se muestran tras iniciar sesión.</p>
          </div>

          <div className="hero-visual" aria-label="Productos de limpieza e higiene">
            <div className="visual-grid">
              {productCards.slice(0, 4).map((product, index) => (
                <div key={product.title} className={`photo-card card-${index + 1}`}>
                  <img src={product.image} alt={product.title} />
                </div>
              ))}
            </div>
          </div>
        </motion.section>}

        {isLanding && <>
        <section id="productos" className="content-section">
          <div className="section-heading">
            <span className="eyebrow">Portafolio</span>
            <h2>Productos distribuidos</h2>
          </div>

          <div className="product-grid">
            {productCards.map((product) => (
              <article key={product.title} className="product-card">
                <img src={product.image} alt={product.title} />
                <div className="product-copy">
                  <h3>{product.title}</h3>
                  <p>{product.subtitle}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="beneficios" className="content-section alt-panel">
          <div className="section-heading">
            <span className="eyebrow">Valor empresarial</span>
            <h2>Beneficios de la plataforma</h2>
          </div>

          <div className="feature-grid">
            {benefitCards.map(({ icon: Icon, title, description }) => (
              <motion.article whileHover={{ y: -4 }} className="feature-card" key={title}>
                <div className="icon-pill">
                  <Icon size={20} />
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <span className="eyebrow">Flujo operativo</span>
            <h2>Cómo funciona</h2>
          </div>

          <div className="workflow-grid">
            {workflowSteps.map((step) => (
              <div key={step.number} className="workflow-card">
                <span className="step-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="content-section alt-panel">
          <div className="section-heading">
            <span className="eyebrow">Casos de uso</span>
            <h2>Valor para cada área</h2>
          </div>

          <div className="use-cases-grid">
            {useCases.map((caseItem) => (
              <div key={caseItem} className="use-case-item">
                <CheckCircle2 size={18} />
                <span>{caseItem}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="content-section metrics-section">
          <div className="section-heading">
            <span className="eyebrow">Vista ilustrativa</span>
            <h2>Métricas de negocio</h2>
          </div>

          <div className="metrics-grid">
            {metrics.map((item) => (
              <div key={item.label} className="metric-card">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <em>{item.delta}</em>
              </div>
            ))}
          </div>

          <div className="dashboard-grid">
            <div className="chart-card large">
              <div className="chart-header">
                <h3>Ventas por mes</h3>
                <TrendingUp size={18} />
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                  <XAxis dataKey="mes" stroke="#64748B" />
                  <YAxis stroke="#64748B" />
                  <Tooltip />
                  <Line type="monotone" dataKey="ventas" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3>Participación por sucursal</h3>
                <Building2 size={18} />
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={branchMix} dataKey="value" innerRadius={54} outerRadius={82} paddingAngle={2} nameKey="name">
                    {branchMix.map((entry, index) => (
                      <Cell key={entry.name} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="legend-list">
                {branchMix.map((item, idx) => (
                  <div key={item.name} className="legend-item">
                    <span className="dot" style={{ backgroundColor: colors[idx % colors.length] }} />
                    {item.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="content-section alt-panel" id="documentacion">
          <div className="section-heading">
            <span className="eyebrow">IA responsable</span>
            <h2>Principios de IA responsable</h2>
          </div>

          <div className="responsible-grid">
            {responsibleItems.map((item) => (
              <div key={item.title} className="responsible-card">
                <div className="icon-pill small">
                  <ShieldCheck size={18} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="content-section testimonials-section">
          <div className="section-heading">
            <span className="eyebrow">Clientes</span>
            <h2>Testimonios</h2>
          </div>

          <div className="testimonial-grid">
            {testimonials.map((item) => (
              <blockquote key={item.name} className="testimonial-card">
                <p>“{item.quote}”</p>
                <footer>
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
        </>}

        {!isLanding && <section id="plataforma" className="content-section platform-section">
          <div className="section-heading">
            <span className="eyebrow">Plataforma</span>
            <h2>Panel operativo de negocio</h2>
          </div>

          <div className="platform-shell">
            <aside className="module-tabs">
              {visibleTabs.map(({ id, label, icon: Icon }) => (
                <Link
                  key={id}
                  to={`/${id}`}
                  className={activeTab === id ? 'tab active' : 'tab'}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
            </aside>

            <div className="module-panel">
              {apiError && <p className="api-error" role="alert">{apiError}</p>}
              {!isLanding && !apiError && <p className="api-status">Conectado a la API de RioClaro AI Hub · {user.roles.join(', ') || 'sin rol configurado'}</p>}
              {!canAccessModule && <div className="access-denied" role="alert"><Lock size={20} /><span>Tu rol no tiene permiso para consultar este módulo.</span></div>}
              {canAccessModule && <>
              {activeTab === 'facturas' && (
                <div className="module-content">
                  <div className="module-head">
                    <div>
                      <span className="eyebrow dark">Automatización de facturas</span>
                      <h3>Validación documental</h3>
                    </div>
                    <span className="pill neutral">PDF · JPG · PNG · máximo 10 MB</span>
                  </div>

                  <div className="invoice-grid">
                    <form
                      className="upload-box"
                      onSubmit={uploadInvoice}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        chooseInvoice(event.dataTransfer.files?.[0]);
                      }}
                    >
                      <div className="upload-icon"><FileText size={28} /></div>
                      <strong>Arrastra PDFs, JPG o PNG</strong>
                      <span>Se soporta PDF, JPG y PNG con validación OCR.</span>
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                        onChange={(event) => chooseInvoice(event.target.files?.[0])}
                        aria-label="Selecciona una factura"
                      />
                      {invoiceFile && <span>{invoiceFile.name}</span>}
                      <button className="primary-button small-button" type="submit" disabled={!invoiceFile}>Procesar factura</button>
                      {invoiceStatus && <span role="status">{invoiceStatus}</span>}
                      <div className="upload-types">
                        <span>PDF</span>
                        <span>JPG</span>
                        <span>PNG</span>
                      </div>
                    </form>

                    <div className="confidence-card">
                      <label>Confianza OCR</label>
                      <div className="progress-wrap">
                        <div className="progress-bar" style={{ width: `${currentInvoice?.confidence || 0}%` }} />
                      </div>
                      <strong>{currentInvoice ? `${currentInvoice.confidence}%` : '—'}</strong>
                      <small>{currentInvoice?.status || 'Carga una factura para iniciar el análisis.'}</small>
                    </div>
                  </div>

                  <div className="table-card">
                    <table>
                      <tbody>
                        {(currentInvoice ? [
                          { field: 'RFC', value: currentInvoice.rfc },
                          { field: 'Proveedor', value: currentInvoice.supplier },
                          { field: 'Fecha', value: currentInvoice.date },
                          { field: 'Folio', value: currentInvoice.folio },
                          { field: 'Subtotal', value: currentInvoice.subtotal },
                          { field: 'IVA', value: currentInvoice.tax },
                          { field: 'Total', value: currentInvoice.total },
                        ] : []).map((row) => (
                          <tr key={row.field}>
                            <th>{row.field}</th>
                            <td>{row.value ?? '—'}</td>
                          </tr>
                        ))}
                        {!currentInvoice && <tr><td colSpan="2">{apiLoading ? 'Cargando facturas…' : 'No hay facturas cargadas.'}</td></tr>}
                      </tbody>
                    </table>
                  </div>

                  {Array.isArray(apiData) && apiData.some((invoice) => invoice.duplicate) && <div className="duplicate-alert">
                    <AlertTriangle size={18} />
                    <span>Posible Factura Duplicada · no se permite aprobación automática.</span>
                  </div>}
                </div>
              )}

              {activeTab === 'inventario' && (
                <div className="module-content">
                  <div className="module-head">
                    <div>
                      <span className="eyebrow dark">Catálogo maestro</span>
                      <h3>Inventario por sucursal</h3>
                    </div>
                    <span className="pill success">Homologación IA activa</span>
                  </div>

                  <div className="table-card inventory-table">
                    <table>
                      <thead>
                        <tr>
                          <th>SKU</th>
                          <th>Nombre oficial</th>
                          <th>Existencia</th>
                          <th>Sucursal</th>
                          <th>Categoría</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(Array.isArray(apiData) ? apiData : []).map((row, index) => (
                          <tr key={`${row.sku}-${index}`}>
                            <td>{row.sku}</td>
                            <td>{row.name}</td>
                            <td>{row.stock}</td>
                            <td>{row.branch}</td>
                            <td>{row.category}</td>
                          </tr>
                        ))}
                        {(!Array.isArray(apiData) || !apiData.length) && <tr><td colSpan="5">{apiLoading ? 'Cargando inventario…' : 'Sin productos disponibles.'}</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="module-content">
                  <div className="module-head">
                    <div>
                      <span className="eyebrow dark">Asistente IA</span>
                      <h3>Consulta de negocio</h3>
                    </div>
                    <span className="pill neutral">RAG activado</span>
                  </div>

                  <div className="chat-panel">
                    {chatHistory.map((message, index) => (
                      <div key={index} className={message.from === 'user' ? 'bubble user' : 'bubble assistant'}>
                        {message.text}
                      </div>
                    ))}
                    {!chatHistory.length && <p className="chat-empty">La respuesta se generará a partir de documentos autorizados y mostrará sus fuentes.</p>}
                    <form className="chat-input" onSubmit={submitChat}>
                      <input aria-label="Pregunta para el asistente" value={chatQuestion} onChange={(event) => setChatQuestion(event.target.value)} placeholder="Pregunta sobre inventario, ventas o políticas..." />
                      <button type="submit" className="primary-button small-button">Consultar</button>
                    </form>
                    {chatStatus && <p className="api-error" role="status">{chatStatus}</p>}
                  </div>
                </div>
              )}

              {activeTab === 'voz' && (
                <div className="module-content">
                  <div className="module-head">
                    <div>
                      <span className="eyebrow dark">Consultas por voz</span>
                      <h3>Speech to text y text to speech</h3>
                    </div>
                    <span className="pill neutral">Pendiente de configurar Azure Speech</span>
                  </div>

                  <div className="voice-box">
                    <p>Configura Azure Speech Services para habilitar reconocimiento de voz y lectura de respuestas.</p>
                  </div>
                </div>
              )}

              {activeTab === 'clientes' && (
                <div className="module-content">
                  <div className="module-head">
                    <div>
                      <span className="eyebrow dark">CRM interno</span>
                      <h3>Atención a clientes</h3>
                    </div>
                    <span className="pill neutral">CRM interno</span>
                  </div>

                  {canCreateTickets && <form className="ticket-form" onSubmit={submitTicket}>
                    <label>
                      Cliente
                      <select value={ticketDraft.clientId} onChange={(event) => setTicketDraft((draft) => ({ ...draft, clientId: event.target.value }))} required>
                        {clientOptions.map((client) => <option key={client.id} value={client.id}>{client.name} · {client.sector}</option>)}
                      </select>
                    </label>
                    <label>
                      Asunto
                      <input value={ticketDraft.subject} onChange={(event) => setTicketDraft((draft) => ({ ...draft, subject: event.target.value }))} maxLength="200" required />
                    </label>
                    <label>
                      Canal
                      <select value={ticketDraft.channel} onChange={(event) => setTicketDraft((draft) => ({ ...draft, channel: event.target.value }))}>
                        <option>Llamada</option>
                        <option>WhatsApp</option>
                        <option>Correo</option>
                        <option>Incidencia</option>
                      </select>
                    </label>
                    <button type="submit" className="primary-button small-button" disabled={!clientOptions.length}>Registrar</button>
                    {ticketStatus && <span role="status">{ticketStatus}</span>}
                  </form>}

                  <div className="table-card">
                    <table>
                      <thead>
                        <tr>
                          <th>Cliente</th>
                          <th>Sector</th>
                          <th>Estatus</th>
                          <th>Responsable</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(Array.isArray(apiData) ? apiData : []).map((ticket) => (
                          <tr key={ticket.client}>
                            <td>{ticket.client}</td>
                            <td>{ticket.group}</td>
                            <td><span className={`status ${ticket.status.toLowerCase().replace(/\s+/g, '-')}`}>{ticket.status}</span></td>
                            <td>{ticket.owner}</td>
                          </tr>
                        ))}
                        {(!Array.isArray(apiData) || !apiData.length) && <tr><td colSpan="4">{apiLoading ? 'Cargando seguimientos…' : 'No hay seguimientos disponibles.'}</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'dashboard' && (
                <div className="module-content">
                  <div className="module-head">
                    <div>
                      <span className="eyebrow dark">Dashboard ejecutivo</span>
                      <h3>KPIs del negocio</h3>
                    </div>
                    <span className="pill neutral">Actualización en tiempo real</span>
                  </div>

                  <div className="kpi-grid">
                    <div className="kpi-box">
                      <span>Ventas Totales</span>
                      <strong>{apiData ? `$${(apiData.salesTotal / 1000000).toFixed(1)}M` : '—'}</strong>
                    </div>
                    <div className="kpi-box">
                      <span>Ventas por sucursal</span>
                      <strong>{apiData ? `${apiData.salesByBranch.length} sucursales` : '—'}</strong>
                    </div>
                    <div className="kpi-box">
                      <span>Facturas Procesadas</span>
                      <strong>{apiData?.invoicesProcessed ?? '—'}</strong>
                    </div>
                    <div className="kpi-box">
                      <span>Duplicadas Detectadas</span>
                      <strong>{apiData?.duplicatesDetected ?? '—'}</strong>
                    </div>
                  </div>

                  <div className="chart-card compact-chart">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={apiData?.monthlySales?.map((row) => ({ mes: row.month, ventas: row.sales })) || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" />
                        <XAxis dataKey="mes" stroke="#64748B" />
                        <YAxis stroke="#64748B" />
                        <Tooltip />
                        <Bar dataKey="ventas" fill="#10B981" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              </>}
            </div>
          </div>
        </section>}

        <footer id="contacto" className="site-footer">
          <div>
            <div className="brand-wrap footer-brand">
              <div className="brand-mark">RC</div>
              <div>
                <span className="brand-name">RioClaro</span>
                <small>AI Hub</small>
              </div>
            </div>
            <p>Plataforma empresarial de distribución, atención y análisis con IA generativa.</p>
          </div>

          <div className="footer-links">
            <div>
              <h4>Soluciones</h4>
              <Link to="/demo">Explorar modo demo</Link>
              <Link to="/facturas">Facturas</Link>
              <Link to="/inventario">Inventario</Link>
              <Link to="/clientes">Atención a clientes</Link>
            </div>
            <div>
              <h4>IA responsable</h4>
              <Link to="/#documentacion">Transparencia</Link>
              <Link to="/#documentacion">Privacidad</Link>
              <Link to="/#documentacion">Control de acceso</Link>
            </div>
            <div>
              <h4>Azure</h4>
              <Link to="/#documentacion">App Service</Link>
              <Link to="/#documentacion">Azure OpenAI</Link>
              <Link to="/#documentacion">AI Search</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function AppRouter() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const location = useLocation();
  const isPublicRoute = location.pathname === '/' || location.pathname === '/login' || location.pathname.startsWith('/demo');

  useEffect(() => {
    if (location.pathname.startsWith('/demo')) {
      setAuthReady(true);
      return undefined;
    }
    let active = true;
    fetch('/api/auth/me')
      .then((response) => response.json())
      .then((result) => {
        if (active) setUser(result.user);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    try {
      const response = await fetch('/auth/logout', { method: 'POST' });
      const result = await response.json();
      setUser(null);
      window.location.assign(result.logoutUrl || '/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  if (!authReady && !isPublicRoute) {
    return <main className="login-page"><p role="status">Verificando sesión...</p></main>;
  }

  const protectedElement = <HubApp user={user} onLogout={logout} />;
  const loginElement = user
    ? <Navigate to="/dashboard" replace />
    : <LoginPage onLogin={setUser} />;

  return (
    <Routes>
      <Route path="/login" element={loginElement} />
      <Route path="/demo" element={<DemoHub />} />
      <Route path="/demo/:module" element={<DemoHub />} />
      <Route path="/" element={<HubApp user={user || { name: 'Visitante', roles: [] }} onLogout={logout} />} />
      <Route path="/facturas" element={user ? protectedElement : <Navigate to="/login" state={{ returnTo: location.pathname }} replace />} />
      <Route path="/inventario" element={user ? protectedElement : <Navigate to="/login" state={{ returnTo: location.pathname }} replace />} />
      <Route path="/chat" element={user ? protectedElement : <Navigate to="/login" state={{ returnTo: location.pathname }} replace />} />
      <Route path="/voz" element={user ? protectedElement : <Navigate to="/login" state={{ returnTo: location.pathname }} replace />} />
      <Route path="/clientes" element={user ? protectedElement : <Navigate to="/login" state={{ returnTo: location.pathname }} replace />} />
      <Route path="/dashboard" element={user ? protectedElement : <Navigate to="/login" state={{ returnTo: location.pathname }} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return <BrowserRouter><AppRouter /></BrowserRouter>;
}

export default App;
