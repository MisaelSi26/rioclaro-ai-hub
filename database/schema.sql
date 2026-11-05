CREATE TABLE sucursales (
    id INT PRIMARY KEY IDENTITY(1,1),
    nombre NVARCHAR(100) NOT NULL,
    ciudad NVARCHAR(100) NOT NULL,
    estado NVARCHAR(100) NOT NULL,
    activo BIT DEFAULT 1
);

CREATE TABLE proveedores (
    id INT PRIMARY KEY IDENTITY(1,1),
    rfc NVARCHAR(20) NOT NULL,
    nombre NVARCHAR(200) NOT NULL,
    categoria NVARCHAR(100) NOT NULL,
    estatus NVARCHAR(30) NOT NULL DEFAULT 'Activo'
);

CREATE TABLE clientes (
    id INT PRIMARY KEY IDENTITY(1,1),
    nombre NVARCHAR(200) NOT NULL,
    tipo NVARCHAR(80) NOT NULL,
    sector NVARCHAR(80) NOT NULL,
    sucursal_id INT NULL,
    telefono NVARCHAR(30) NULL,
    email NVARCHAR(200) NULL,
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id)
);

CREATE TABLE productos (
    id INT PRIMARY KEY IDENTITY(1,1),
    sku NVARCHAR(50) NOT NULL UNIQUE,
    nombre_oficial NVARCHAR(200) NOT NULL,
    categoria NVARCHAR(100) NOT NULL,
    precio_unitario DECIMAL(18,2) NOT NULL DEFAULT 0
);

CREATE TABLE inventario (
    producto_id INT NOT NULL,
    sucursal_id INT NOT NULL,
    existencia INT NOT NULL DEFAULT 0,
    actualizado_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (producto_id, sucursal_id),
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id)
);

CREATE TABLE facturas (
    id INT PRIMARY KEY IDENTITY(1,1),
    rfc NVARCHAR(20) NULL,
    proveedor_id INT NULL,
    proveedor_nombre NVARCHAR(200) NULL,
    folio NVARCHAR(60) NULL,
    fecha NVARCHAR(30) NULL,
    subtotal DECIMAL(18,2) NULL,
    iva DECIMAL(18,2) NULL,
    total DECIMAL(18,2) NULL,
    confianza_ocr DECIMAL(5,2) NOT NULL DEFAULT 0,
    estado NVARCHAR(40) NOT NULL DEFAULT 'Pendiente',
    documento_url NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
);

CREATE TABLE tickets_cliente (
    id INT PRIMARY KEY IDENTITY(1,1),
    cliente_id INT NOT NULL,
    asunto NVARCHAR(200) NOT NULL,
    tipo NVARCHAR(60) NOT NULL,
    estatus NVARCHAR(30) NOT NULL DEFAULT 'Abierto',
    asignado_a NVARCHAR(120) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

CREATE TABLE usuarios (
    id INT PRIMARY KEY IDENTITY(1,1),
    nombre NVARCHAR(120) NOT NULL,
    email NVARCHAR(200) NOT NULL UNIQUE,
    rol NVARCHAR(50) NOT NULL,
    activo BIT DEFAULT 1
);

CREATE TABLE ventas (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    sucursal_id INT NOT NULL,
    fecha DATE NOT NULL,
    total DECIMAL(18,2) NOT NULL,
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id)
);

CREATE INDEX IX_facturas_duplicado
    ON facturas (rfc, folio, total);

CREATE INDEX IX_tickets_estatus_fecha
    ON tickets_cliente (estatus, created_at);
