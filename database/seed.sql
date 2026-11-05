SET NOCOUNT ON;

INSERT INTO sucursales (nombre, ciudad, estado, activo) VALUES
('Guadalajara', 'Guadalajara', 'Jalisco', 1),
('Zapopan', 'Zapopan', 'Jalisco', 1),
('León', 'León', 'Guanajuato', 1),
('Querétaro', 'Querétaro', 'Querétaro', 1),
('Aguascalientes', 'Aguascalientes', 'Aguascalientes', 1);

DECLARE @Numbers TABLE (n INT NOT NULL PRIMARY KEY);
INSERT INTO @Numbers (n)
SELECT TOP (2000) ROW_NUMBER() OVER (ORDER BY (SELECT NULL))
FROM sys.all_objects a CROSS JOIN sys.all_objects b;

INSERT INTO proveedores (rfc, nombre, categoria, estatus)
SELECT
    CONCAT('PRV', RIGHT(CONCAT('0000', n), 4), 'ABC'),
    CONCAT('Proveedor de Higiene ', RIGHT(CONCAT('000', n), 3)),
    CASE n % 4 WHEN 0 THEN 'Desinfectantes' WHEN 1 THEN 'Limpieza' WHEN 2 THEN 'Higiene' ELSE 'Suministros' END,
    'Activo'
FROM @Numbers
WHERE n <= 60;

INSERT INTO clientes (nombre, tipo, sector, sucursal_id, telefono, email)
SELECT
    CONCAT('Cliente Institucional ', RIGHT(CONCAT('0000', n), 4)),
    CASE n % 4 WHEN 0 THEN 'Hotel' WHEN 1 THEN 'Restaurante' WHEN 2 THEN 'Institución' ELSE 'Comercio' END,
    CASE n % 4 WHEN 0 THEN 'Hospitalidad' WHEN 1 THEN 'Food & Beverage' WHEN 2 THEN 'Educación' ELSE 'Retail' END,
    ((n - 1) % 5) + 1,
    CONCAT('33', RIGHT(CONCAT('00000000', n), 8)),
    CONCAT('cliente', n, '@ejemplo.rioclaro.com')
FROM @Numbers
WHERE n <= 1800;

INSERT INTO productos (sku, nombre_oficial, categoria, precio_unitario)
SELECT
    CONCAT('SKU-', RIGHT(CONCAT('0000', n), 4)),
    CONCAT(
      CASE n % 5 WHEN 0 THEN 'Cloro' WHEN 1 THEN 'Detergente' WHEN 2 THEN 'Desinfectante' WHEN 3 THEN 'Jabón industrial' ELSE 'Sanitizante' END,
      ' presentación ',
      n
    ),
    CASE n % 5 WHEN 0 THEN 'Desinfectante' WHEN 1 THEN 'Limpieza' WHEN 2 THEN 'Sanitizante' WHEN 3 THEN 'Higiene' ELSE 'Sanitizante' END,
    CAST(25 + (n % 450) * 1.25 AS DECIMAL(18,2))
FROM @Numbers
WHERE n <= 500;

INSERT INTO inventario (producto_id, sucursal_id, existencia)
SELECT p.id, s.id, 20 + ((p.id * s.id * 17) % 480)
FROM productos p CROSS JOIN sucursales s;

INSERT INTO facturas (rfc, proveedor_id, folio, fecha, subtotal, iva, total, confianza_ocr, estado)
SELECT
    p.rfc,
    p.id,
    CONCAT('F-', RIGHT(CONCAT('000000', CASE WHEN n.n % 100 = 0 THEN n.n - 1 ELSE n.n END), 6)),
    CONVERT(NVARCHAR(30), DATEADD(DAY, -(sourceRow.duplicate_source % 730), CAST(GETDATE() AS DATE)), 23),
    amounts.subtotal,
    CAST(amounts.subtotal * 0.16 AS DECIMAL(18,2)),
    CAST(amounts.subtotal * 1.16 AS DECIMAL(18,2)),
    CAST(80 + (n.n % 2000) / 100.0 AS DECIMAL(5,2)),
    CASE WHEN n.n % 17 = 0 THEN 'Revisión Humana Requerida' ELSE 'Validada' END
FROM @Numbers n
JOIN proveedores p ON p.id = CASE WHEN n.n % 100 = 0 THEN ((n.n - 2) % 60) + 1 ELSE ((n.n - 1) % 60) + 1 END
CROSS APPLY (SELECT CASE WHEN n.n % 100 = 0 THEN n.n - 1 ELSE n.n END AS duplicate_source) sourceRow
CROSS APPLY (SELECT CAST(1000 + (sourceRow.duplicate_source % 50000) * 0.73 AS DECIMAL(18,2)) AS subtotal) amounts
WHERE n.n <= 2000;

INSERT INTO ventas (sucursal_id, fecha, total)
SELECT ((n - 1) % 5) + 1, DATEADD(MONTH, -(n % 12), CAST(GETDATE() AS DATE)), CAST(15000 + (n % 80) * 925.50 AS DECIMAL(18,2))
FROM @Numbers
WHERE n <= 60;

INSERT INTO tickets_cliente (cliente_id, asunto, tipo, estatus, asignado_a)
SELECT
    n,
    CONCAT('Seguimiento comercial ', n),
    CASE n % 3 WHEN 0 THEN 'WhatsApp' WHEN 1 THEN 'Llamada' ELSE 'Correo' END,
    CASE n % 3 WHEN 0 THEN 'Abierto' WHEN 1 THEN 'En proceso' ELSE 'Resuelto' END,
    CASE n % 3 WHEN 0 THEN 'Ventas' WHEN 1 THEN 'Operación' ELSE 'Atención a clientes' END
FROM @Numbers
WHERE n <= 100;

INSERT INTO usuarios (nombre, email, rol, activo) VALUES
('Ana López', 'ana.lopez@rioclaro.com', 'Administrador', 1),
('Carlos Ruiz', 'carlos.ruiz@rioclaro.com', 'Dirección', 1),
('María Solis', 'maria.solis@rioclaro.com', 'Compras', 1),
('Roberto Jiménez', 'roberto.jimenez@rioclaro.com', 'Ventas', 1),
('Laura Gómez', 'laura.gomez@rioclaro.com', 'Bodega', 1),
('José Ramírez', 'jose.ramirez@rioclaro.com', 'Finanzas', 1);
