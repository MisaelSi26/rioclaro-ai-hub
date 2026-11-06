# RioClaro AI Hub

Aplicación web para la operación de Distribuidora Río Claro. Incluye landing pública, módulos con rutas protegidas, API Node/Express, autenticación Microsoft Entra ID, RBAC y conexiones opcionales/obligatorias a servicios de Azure según el módulo.

> El código queda preparado para desplegarse, pero publicar en una suscripción real requiere crear los recursos Azure, registrar la aplicación Entra y configurar secretos propios. No se incluyen credenciales.

## Arquitectura

- **Web:** React 19, Vite, React Router, Framer Motion y Recharts.
- **API:** Node.js 20 + Express 5, servido desde el mismo origen que la web.
- **Autenticación:** OAuth 2.0 Authorization Code con Microsoft Entra ID y cookie firmada, HTTP-only, Secure en producción y SameSite=Lax.
- **Datos:** Azure SQL Database; datos de demostración en memoria solo en desarrollo.
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
| `/` | Landing pública | Público |
| `/login` | Inicio de sesión | Público |
| `/demo` | Dashboard del recorrido interactivo | Público, datos ficticios |
| `/demo/facturas` | Simulación de OCR y detección de duplicados | Público, datos ficticios |
| `/demo/inventario` | Búsqueda homologada por producto y sucursal | Público, datos ficticios |
| `/demo/chat` | Asistente con respuestas y fuentes de ejemplo | Público, datos ficticios |
| `/demo/voz` | Interacción de voz simulada | Público, datos ficticios |
| `/demo/clientes` | CRM con tickets locales a la sesión | Público, datos ficticios |
| `/facturas` | Captura OCR y revisión de duplicados | Administrador, Compras, Finanzas |
| `/inventario` | Catálogo e inventario por sucursal | Administrador, Dirección, Compras, Bodega |
| `/chat` | Asistente con búsqueda documental | Administrador, Dirección, Compras, Ventas, Bodega |
| `/voz` | Vista del módulo de voz | Administrador, Dirección, Compras, Ventas, Bodega |
| `/clientes` | Seguimiento de clientes | Administrador, Dirección, Ventas |
| `/dashboard` | Indicadores ejecutivos | Administrador, Dirección, Finanzas |

El backend verifica los roles en cada API; ocultar o abrir una ruta en el navegador no concede acceso.

### Modo demostración

Abre `/demo` desde la landing o directamente para recorrer todos los módulos sin iniciar sesión. El dashboard, OCR, inventario, asistente, voz y CRM usan datos ficticios y estado local del navegador: no llaman a las APIs de negocio, no escriben en SQL ni suben documentos. En OCR, el archivo seleccionado se usa solo para ilustrar el flujo y no se transmite ni conserva. La lectura en voz alta, si el navegador la soporta, usa la síntesis local; no es una conexión con Azure Speech. La demo no debe usarse como fuente de datos operativos.

## API

- `GET /api/health` — salud del servicio y base de datos.
- `GET /api/auth/config`, `GET /api/auth/me` — configuración no sensible y sesión actual.
- `GET /auth/login`, `GET /auth/callback`, `POST /auth/logout` — ciclo de sesión Entra.
- `GET /api/invoices`, `POST /api/invoices` — consulta y análisis OCR de facturas.
- `GET /api/inventory` — existencia por sucursal.
- `GET /api/tickets`, `POST /api/tickets` — tickets CRM.
- `GET /api/dashboard` — KPI por sucursal.
- `POST /api/chat` — búsqueda RAG y generación de respuesta con citas.

Los endpoints de negocio requieren autenticación y rol. Las rutas de facturas requieren Document Intelligence; en producción también requieren Blob Storage para conservar el original. Chat requiere AI Search y Azure OpenAI.

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

5. Abre `http://localhost:5173` y usa **Entrar como usuario demo**. El login demo solo está habilitado fuera de producción.

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

En App Service guarda secretos en Key Vault y vincúlalos como app settings. No subas `.env` al repositorio.

## Base de datos y datos demo

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

La aplicación escucha en `PORT` (8080 por defecto). App Service debe configurar `NODE_ENV=production`, `DEV_AUTH_ENABLED=false`, `SESSION_KEYS` y todos los settings de los servicios usados. En producción, SQL no configurado devuelve servicio degradado; no se usa el fallback demo.

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

- La pantalla `/voz` conserva una demostración visual; Speech Services aún no tiene flujo de micrófono/texto a voz conectado.
- El listado y alta de tickets están conectados a API/SQL; falta habilitar edición y cierre en la UI.
- El catálogo SQL de inventario se consulta; la edición del catálogo no está expuesta en la UI.
- Las respuestas de IA dependen de que el índice tenga documentos y campos `content`, `source` y opcionalmente `title`.
- Validar los recursos reales, roles, privacidad, monitoreo y carga en el tenant antes de liberar a usuarios.
