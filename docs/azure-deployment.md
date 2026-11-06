# Despliegue en Azure App Service

## Alcance

La app sirve el build React y la API Express desde el mismo origen, simplificando cookies de sesión y rutas SPA. El runtime de producción es Node 24 (por compatibilidad con los SDK de Azure del lockfile). El despliegue no crea recursos automáticamente: primero hay que provisionar Azure SQL, Storage, servicios de IA, App Service y una app de Entra en la suscripción del operador.

## 1. Crear App Service Node 24

```bash
az login
az group create --name rg-rioclaro-ai --location eastus
az appservice plan create --name asp-rioclaro-ai --resource-group rg-rioclaro-ai --is-linux --sku B1
az webapp create --name <nombre-global-unico> --resource-group rg-rioclaro-ai --plan asp-rioclaro-ai --runtime "NODE:24-lts"
az webapp config set --name <nombre-global-unico> --resource-group rg-rioclaro-ai --startup-file "npm start"
```

Configura App Service en HTTPS y agrega el health check `/api/health`. Para el deployment por GitHub Actions, el workflow empaqueta Node production dependencies y `dist`.

## 2. Crear base de datos

Provisiona Azure SQL Database, autoriza la red de App Service y ejecuta en una base vacía:

1. `database/schema.sql`
2. `database/seed.sql` (opcional; datos sintéticos)

Configura `SQL_CONNECTION_STRING` como secreto de App Service/Key Vault. No habilites conectividad pública amplia. El servicio responde como degradado si falta la conexión en producción.

## 3. Crear Blob Storage

Crear Storage Account y contenedor privado `invoices`. Configurar `AZURE_STORAGE_CONNECTION_STRING` y `AZURE_STORAGE_CONTAINER=invoices` por Key Vault. La app genera un nombre aleatorio para el blob y no publica la URL del documento.

La carga de facturas en producción exige Blob Storage y Document Intelligence configurados. Define políticas de retención, cifrado, acceso y eliminación según las obligaciones de la empresa.

## 4. Configurar Microsoft Entra ID

1. Crear App registration de cuentas organizacionales.
2. En **Authentication**, agrega la URI tipo Web:

   ```text
   https://<nombre-global-unico>.azurewebsites.net/auth/callback
   ```

3. Crear un client secret con vencimiento y mantenerlo en Key Vault.
4. Crear App Roles con los nombres exactos: `Administrador`, `Dirección`, `Compras`, `Ventas`, `Bodega`, `Finanzas`.
5. Asignar roles a grupos/usuarios de la organización.
6. Agregar `ENTRA_CLIENT_ID`, `ENTRA_CLIENT_SECRET`, `ENTRA_TENANT_ID` y `ENTRA_REDIRECT_URI` a la configuración segura de App Service.
7. Usa `APP_BASE_URL=https://<nombre-global-unico>.azurewebsites.net/` como URL de retorno de logout.

Si un usuario inicia sesión sin un rol reconocido, no obtiene acceso a módulos ni APIs de negocio.

## 5. Configurar servicios IA

Configura endpoints y claves como referencias de Key Vault en los settings de App Service:

- `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT` / `AZURE_DOCUMENT_INTELLIGENCE_KEY`
- `AZURE_SEARCH_ENDPOINT` / `AZURE_SEARCH_KEY` / `AZURE_SEARCH_INDEX`
- `AZURE_OPENAI_ENDPOINT` / `AZURE_OPENAI_KEY` / `AZURE_OPENAI_DEPLOYMENT`
- `AZURE_SPEECH_KEY` / `AZURE_SPEECH_REGION`

El índice de Search debe tener campos `content` y `source`, además de `title` opcional. Se deben validar permisos, región, cuotas, modelo desplegado y versión de API con los recursos de la suscripción.
Speech Services usa un token temporal emitido por el backend: la clave permanece en App Service y el navegador recibe únicamente el token de corta duración. El cliente necesita permiso de micrófono y una conexión HTTPS. El módulo de voz está disponible para los roles autorizados al chat.

## 6. App settings mínimos

```text
NODE_ENV=production
DEV_AUTH_ENABLED=false
PORT=8080
SESSION_KEYS=<secreto aleatorio de al menos 32 caracteres>
APP_BASE_URL=https://<nombre-global-unico>.azurewebsites.net/
ENTRA_CLIENT_ID=<app-id>
ENTRA_CLIENT_SECRET=<secret>
ENTRA_TENANT_ID=<tenant-id>
ENTRA_REDIRECT_URI=https://<nombre-global-unico>.azurewebsites.net/auth/callback
SQL_CONNECTION_STRING=<cadena almacenada en Key Vault>
AZURE_STORAGE_CONNECTION_STRING=<cadena almacenada en Key Vault>
AZURE_STORAGE_CONTAINER=invoices
```

Agrega variables de IA solo si vas a habilitar sus respectivas funciones. Para Speech configura `AZURE_SPEECH_KEY` como referencia de Key Vault y `AZURE_SPEECH_REGION` con la región del recurso (por ejemplo `westus3`). En el portal, habilita la identidad administrada del App Service con permiso `get` de secretos.

## 7. Configurar GitHub Actions

En el repositorio agrega los GitHub Actions secrets:

- `AZURE_WEBAPP_NAME`: nombre del App Service.
- `AZURE_WEBAPP_PUBLISH_PROFILE`: contenido descargado desde **App Service > Get publish profile**.

Los dos secretos deben estar definidos en el repositorio exacto `MisaelSi26/rioclaro-ai-hub` (no solo como variables de entorno locales). El workflow valida que ambos existan antes de construir; si falta el XML publish profile, el error identifica el secreto ausente en lugar de fallar en el paso de despliegue. El workflow `.github/workflows/azure-webapp.yml` publica cada push a `main`. Protege la rama y exige pruebas/revisión antes de merge. La configuración de Azure permanece fuera del workflow y del repositorio.

## 8. Alternativa Docker

```bash
docker build -t rioclaro-ai-hub .
docker run --env-file .env -p 8080:8080 rioclaro-ai-hub
```

No uses `.env` con secretos en una imagen o repositorio. Para App Service con contenedor, publica la imagen en un registro privado (por ejemplo ACR), define el registro como fuente del Web App y configura las mismas app settings.

## 9. Verificación y operación

- `GET https://<app>/api/health` debe devolver `status: ok`, `database: connected` y `authentication: entra-id`.
- Probar login, logout, callback, expiración y usuarios con/sin cada rol.
- Verificar subida OCR, almacenamiento privado y duplicados con documentos de prueba no sensibles.
- Probar consultas RAG con fuentes válidas y con ausencia de evidencia.
- Activar Application Insights, Azure Monitor, alertas, copias de seguridad y revisiones periódicas de costo.
