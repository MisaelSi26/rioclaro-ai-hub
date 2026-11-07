export const demoData = {
  clients: [
    { id: 1, name: 'H. Los Encinos', sector: 'Hospitalidad' },
    { id: 2, name: 'San José Restaurant', sector: 'Food & Beverage' },
    { id: 3, name: 'Escuela Primaria México', sector: 'Educación' },
    { id: 4, name: 'Farmacias del Norte', sector: 'Salud' },
    { id: 5, name: 'Grupo Hotelero del Bajío', sector: 'Hospitalidad' },
  ],
  invoices: [
    { id: 1, rfc: 'RCO980102XYZ', supplier: 'Distribuidora del Sur S.A.', date: '2026-09-12', folio: 'F-20189', subtotal: 12480, tax: 1996.8, total: 14476.8, confidence: 94.2, status: 'Validada', duplicate: false },
    { id: 2, rfc: 'PQR120315ABC', supplier: 'Higiene Industrial MX', date: '2026-09-18', folio: 'F-21450', subtotal: 8450, tax: 1352, total: 9802, confidence: 96.1, status: 'Validada', duplicate: false },
    { id: 3, rfc: 'MKT101120DEF', supplier: 'Hotelaria Plus', date: '2026-09-20', folio: 'F-21990', subtotal: 6560, tax: 1049.6, total: 7609.6, confidence: 88.5, status: 'Validada', duplicate: false },
    { id: 4, rfc: 'RCO980102XYZ', supplier: 'Distribuidora del Sur S.A.', date: '2026-09-12', folio: 'F-20189', subtotal: 12480, tax: 1996.8, total: 14476.8, confidence: 97.4, status: 'Posible Factura Duplicada', duplicate: true },
  ],
  inventory: [
    { sku: 'CLORO-001', name: 'Cloro 1L', stock: 240, branch: 'Guadalajara', category: 'Desinfectante' },
    { sku: 'CLORO-001', name: 'Cloro 1L', stock: 186, branch: 'Zapopan', category: 'Desinfectante' },
    { sku: 'DETER-440', name: 'Detergente líquido 4L', stock: 92, branch: 'León', category: 'Limpieza' },
    { sku: 'DESINF-620', name: 'Desinfectante multiuso', stock: 143, branch: 'Querétaro', category: 'Sanitizante' },
    { sku: 'JABON-120', name: 'Jabón industrial 1L', stock: 79, branch: 'Aguascalientes', category: 'Higiene' },
  ],
  tickets: [
    { id: 1, client: 'H. Los Encinos', group: 'Hotel', subject: 'Pedido retrasado de desinfectante', channel: 'WhatsApp', status: 'Abierto', owner: 'Ventas' },
    { id: 2, client: 'San José Restaurant', group: 'Restaurante', subject: 'Queja por entrega incompleta', channel: 'Llamada', status: 'En proceso', owner: 'Operación' },
    { id: 3, client: 'Escuela Primaria México', group: 'Educación', subject: 'Solicitud de cotización', channel: 'Correo', status: 'Resuelto', owner: 'Atención a clientes' },
  ],
};

export function getDemoDashboard() {
  return {
    salesTotal: 18400000,
    salesByBranch: [
      { branch: 'Guadalajara', sales: 5888000 },
      { branch: 'Zapopan', sales: 4784000 },
      { branch: 'León', sales: 3312000 },
      { branch: 'Querétaro', sales: 2760000 },
      { branch: 'Aguascalientes', sales: 1656000 },
    ],
    invoicesProcessed: 8640,
    duplicatesDetected: demoData.invoices.filter((invoice) => invoice.duplicate).length,
    clientsServed: 1820,
    openTickets: demoData.tickets.filter((ticket) => ticket.status !== 'Resuelto').length,
    monthlySales: [
      { month: 'Ene', sales: 320 },
      { month: 'Feb', sales: 410 },
      { month: 'Mar', sales: 380 },
      { month: 'Abr', sales: 520 },
      { month: 'May', sales: 600 },
      { month: 'Jun', sales: 690 },
      { month: 'Jul', sales: 760 },
    ],
  };
}
