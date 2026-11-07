# RioClaro AI Hub

Aplicación web administrativa para la operación de Distribuidora Río Claro. Incluye módulos con rutas protegidas, API Node/Express, autenticación Microsoft Entra ID, RBAC y conexiones opcionales/obligatorias a servicios de Azure según el módulo.

> El código queda preparado para desplegarse, pero publicar en una suscripción real requiere crear los recursos Azure, registrar la aplicación Entra y configurar secretos propios. No se incluyen credenciales.

## Arquitectura

- **Web:** React 19, Vite, React Router, Framer Motion y Recharts.
- **API:** Node.js 20 + Express 5, servido desde el mismo origen que la web.
- **Autenticación:** OAuth 2.0 Authorization Code con Microsoft Entra ID y cookie firmada, HTTP-only, Secure en producción y SameSite=Lax.
- **Datos:** Azure SQL Database; datos de prueba en memoria únicamente en desarrollo.
- **Documentos:** Azure AI Document Intelligence (modelo `prebuilt-invoice`) y Azure Blob Storage.
- **Asistente:** Azure AI Search + Azure OpenAI, respuestas limitadas al contexto recuperado y fuentes devueltas.
- **Despliegue:** Docker o Azure App Service Linux con Node 24.

```text
Browser ── same-origin ──> Express ──> Entra ID
                              ├──────> Azure SQL
                              ├──────> Blob Storage
                              ├──────> Document Intelligence
                              └──────> AI Search ──> Azure OpenAI
```

## Rutas web

| Ruta | Módulo | Acceso |
|---|---|---|
| `/` | Redirección a inicio de sesión o dashboard | Usuarios autenticados |
| `/login` | Inicio de sesión | Público |
| `/facturas` | Captura OCR y revisión de duplicados | Administrador, Compras, Finanzas |
| `/inventario` | Catálogo e inventario por sucursal | Administrador, Dirección, Compras, Bodega |
| `/chat` | Asistente con búsqueda documental | Administrador, Dirección, Compras, Ventas, Bodega |
| `/voz` | Vista del módulo de voz | Administrador, Dirección, Compras, Ventas, Bodega |
| `/clientes` | Seguimiento de clientes | Administrador, Dirección, Ventas |
| `/dashboard` | Indicadores ejecutivos | Administrador, Dirección, Finanzas |

El backend verifica los roles en cada API; ocultar o abrir una ruta en el navegador no concede acceso. Los módulos operativos requieren inicio de sesión empresarial.

## API

- `GET /api/health` — salud del servicio y base de datos.
- `GET /api/auth/config`, `GET /api/auth/me` — configuración no sensible y sesión actual.
- `GET /auth/login`, `GET /auth/callback`, `POST /auth/logout` — ciclo de sesión Entra.
- `GET /api/invoices?page=1&assignment=Todas`, `POST /api/invoices`, `GET /api/invoices/:id/document`, `POST /api/invoices/:id/validate`, `DELETE /api/invoices/:id` — consulta paginada (10 por página), análisis OCR, vista protegida del documento original, validación manual de facturas y eliminación junto con su archivo almacenado. Solo el OCR por debajo de 50% o campos esenciales ilegibles requieren revisión humana. `DELETE /api/invoices/latest` se conserva como alias para eliminar la más reciente.
- `GET /api/inventory` — existencia por sucursal.
- `GET /api/tickets`, `POST /api/tickets` — tickets CRM.
- `GET /api/dashboard` — KPI por sucursal.
- `POST /api/chat` — consultas de inventario se responden con existencias actuales de SQL; otras consultas usan búsqueda RAG y generación de respuesta con citas.

Los endpoints de negocio requieren autenticación y rol. Las rutas de facturas requieren Document Intelligence; en producción también requieren Blob Storage para conservar el original. Las consultas generales del chat requieren AI Search y Azure OpenAI; las consultas de inventario usan Azure SQL y los roles con acceso al inventario.

## Ejecución local

Requisitos: Node.js 24 o superior.

1. Instala dependencias y crea la configuración local:

   ```powershell
   npm ci
   Copy-Item .env.example .env
   ```

2. Deja `DEV_AUTH_ENABLED=true` solamente en el entorno local y reemplaza `SESSION_KEYS` por una cadena aleatoria.
3. En una terminal inicia la API:

   ```powershell
   npm run dev:api
   ```

4. En otra terminal inicia Vite:

   ```powershell
   npm run dev
   ```

5. Abre `http://localhost:5173` y usa **Entrar como usuario de desarrollo**. Este acceso solo está habilitado fuera de producción.

También se puede crear el build de producción y servir web/API en un único proceso:

```powershell
npm run build
npm start
```

## Configuración

Usa `.env.example` como plantilla. Las claves y cadenas de conexión se leen **solo en el servidor**; no uses variables `VITE_*` para secretos.

| Variable | Necesaria | Uso |
|---|---:|---|
| `SESSION_KEYS` | Sí en producción | Clave(s) de firma cookie; usar secretos aleatorios y rotables |
| `ENTRA_CLIENT_ID`, `ENTRA_CLIENT_SECRET`, `ENTRA_TENANT_ID` | Producción | Registro de aplicación Entra |
| `ENTRA_REDIRECT_URI` | Producción | URL absoluta terminada en `/auth/callback` |
| `SQL_CONNECTION_STRING` | Producción | Conexión Azure SQL |
| `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_CONTAINER` | Facturas producción | Retención de originales |
| `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT`, `AZURE_DOCUMENT_INTELLIGENCE_KEY` | OCR | Extracción de factura |
| `AZURE_SEARCH_ENDPOINT`, `AZURE_SEARCH_KEY`, `AZURE_SEARCH_INDEX` | Chat | Recuperación de documentos |
| `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_KEY`, `AZURE_OPENAI_DEPLOYMENT` | Chat | Generación de respuesta |
| `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` | Voz | Reconocimiento y lectura de respuestas |

En App Service guarda secretos en Key Vault y vincúlalos como app settings. No subas `.env` al repositorio.

## Base de datos y datos de prueba

Ejecuta una sola vez en una base vacía, en este orden:

1. `database/schema.sql`
2. `database/seed.sql`

El seed genera 5 sucursales, 60 proveedores, 1,800 clientes, 500 productos, inventario por sucursal, 2,000 facturas y datos para CRM y ventas. No ejecutes el seed repetidamente sobre la misma base: no es un script de migración idempotente.

## Autenticación y roles

En el registro de Entra configura el tipo de cuenta organizacional y agrega redirect URI de plataforma Web:

```text
https://<app-service>.azurewebsites.net/auth/callback
```

Configura App Roles con los nombres exactos `Administrador`, `Dirección`, `Compras`, `Ventas`, `Bodega` y `Finanzas`; asigna usuarios o grupos. El API solo autoriza roles conocidos. La cookie de sesión contiene claims mínimos, no access tokens. El endpoint de login valida state y la cookie de producción es Secure/HTTP-only.

## Despliegue Azure

Consulta [docs/azure-deployment.md](./docs/azure-deployment.md) para crear App Service, registrar Entra, guardar configuración, desplegar y verificar el health check. Para contenedor:

```powershell
docker compose up --build
```

La aplicación escucha en `PORT` (8080 por defecto). App Service debe configurar `NODE_ENV=production`, `DEV_AUTH_ENABLED=false`, `SESSION_KEYS` y todos los settings de los servicios usados. En producción, SQL no configurado devuelve servicio degradado; no se usan datos ficticios de respaldo.

### GitHub Actions

El workflow de `.github/workflows/azure-webapp.yml` prepara el paquete y despliega a App Service al actualizar `main`. Requiere secrets `AZURE_WEBAPP_NAME` y `AZURE_WEBAPP_PUBLISH_PROFILE`, además de variables de aplicación en App Service.

## Seguridad y operación

- Nunca habilitar `DEV_AUTH_ENABLED` en producción.
- Restringir usuarios y grupos por App Roles y proteger el SQL y el Storage con firewall/red privada según la arquitectura de la organización.
- Limitar archivos cargados a 10 MB y PDF/JPG/PNG.
- Configurar alertas, logs y retención con Application Insights/Azure Monitor.
- Revisar permisos, fuentes RAG, costo, retención y respuesta a incidentes antes del go-live.
- Mantener copias de seguridad y un proceso de migración para cambios futuros del esquema.

## Alcance actual / pendientes antes de producción

- `/voz` usa Azure Speech para reconocer preguntas en español y leer las respuestas del asistente; requiere permiso de micrófono, HTTPS y configuración de la clave y región del recurso.
- El listado y alta de tickets están conectados a API/SQL; falta habilitar edición y cierre en la UI.
- El catálogo SQL de inventario se consulta; la edición del catálogo no está expuesta en la UI.
- Las respuestas de IA dependen de que el índice tenga documentos y campos `content`, `source` y opcionalmente `title`.
- Validar los recursos reales, roles, privacidad, monitoreo y carga en el tenant antes de liberar a usuarios.
