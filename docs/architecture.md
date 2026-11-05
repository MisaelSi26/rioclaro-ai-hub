# Arquitectura de RioClaro AI Hub

## Contexto

Una aplicación web de mismo origen con cliente React/Vite y API Node/Express. El API sirve el build estático y atiende las rutas `/api/*` y `/auth/*`; el fallback SPA permite cargar las URLs profundas de React Router en recargas directas.

## Capas

### Presentación

- React 19 y React Router para landing y rutas de negocio.
- Vistas adaptables a dispositivos, con modo claro/oscuro.
- El cliente no recibe secretos de Azure.

### API y seguridad

- Express valida sesión y rol antes de atender operaciones de negocio.
- OAuth Authorization Code con Microsoft Entra ID y MSAL Node.
- Cookie de sesión firmada y HTTP-only; Secure en producción.
- Helmet, limitación de frecuencia en login y subida multipart limitada a 10 MB.
- Las rutas de UI no sustituyen autorización: el servidor aplica RBAC.

### Datos

- Azure SQL es la persistencia de negocio en producción.
- La app usa datos demo en memoria solo fuera de producción cuando no se ha configurado SQL.
- Azure Blob Storage conserva documentos de facturas. Los documentos se cargan en contenedor privado y se identifica el blob por nombre aleatorio.
- Esquema relacional en `database/schema.sql`, datos sintéticos en `database/seed.sql`.

### IA

- Document Intelligence analiza facturas con `prebuilt-invoice`.
- La confianza menor a 90% marca revisión humana; coincidencias RFC/proveedor/fecha/folio/total se marcan como posible duplicado.
- AI Search recupera documentos antes de invocar Azure OpenAI.
- El asistente devuelve referencias de origen y no responde con contenido generado si no hay documentos.

## Rutas y autorización

| Rol | Módulos |
|---|---|
| Administrador | Todos |
| Dirección | Inventario, chat, voz, clientes, dashboard |
| Compras | Facturas, inventario, chat, voz |
| Ventas | Chat, voz, clientes |
| Bodega | Inventario, chat, voz |
| Finanzas | Facturas, dashboard |

Las mismas restricciones se aplican en React para la experiencia y en Express como frontera de seguridad.

## Flujo de sesión

1. `/auth/login` genera state aleatorio y redirige al tenant configurado.
2. `/auth/callback` valida state, canjea el authorization code y obtiene los claims ID token mediante MSAL.
3. La cookie contiene solo identificador, nombre, correo y roles permitidos.
4. El middleware comprueba sesión y rol en cada endpoint protegido.
5. `/auth/logout` limpia cookie y finaliza sesión en Entra cuando está configurado.

## API principal

- `/api/auth/*`: información de sesión y estado de configuración.
- `/api/dashboard`: agregados de ventas, facturas, clientes y tickets.
- `/api/invoices`: listado y procesamiento de archivos.
- `/api/inventory`: existencia por sucursal.
- `/api/tickets`: consulta y creación de incidencias.
- `/api/chat`: búsqueda documental y generación contextual.
- `/api/health`: estado de DB y configuración de autenticación.

## Producción

- Node 24 o contenedor Docker en App Service Linux.
- Secretos y cadenas en Key Vault/App Settings; nunca en el bundle.
- `NODE_ENV=production` exige `SESSION_KEYS` y una conexión SQL, y deshabilita el login demo.
- Definir private networking/firewall, telemetría, copias, retención y alertas según el ambiente.
- Speech Services y las operaciones de edición/cierre de tickets e inventario aún requieren su integración antes de incluirse en un alcance productivo.
