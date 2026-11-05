# IA responsable para RioClaro AI Hub

## Principios aplicados

### 1. Equidad

Las decisiones impulsadas por IA deben revisarse para evitar sesgos de origen, proveedor, sucursal o tipo de cliente.

### 2. Transparencia

Cada respuesta del asistente debe indicar la fuente documental usada. Cuando el contenido se extrae de un archivo, el sistema debe mostrar su nombre o referencia.

### 3. Rendición de cuentas

Las decisiones críticas deben conservar trazabilidad del origen del dato, del modelo y del responsable humano que valida la decisión.

### 4. Privacidad

Los datos sensibles se manejan con control de acceso mediante Azure Entra ID y Azure Key Vault. Los documentos y datos de clientes requieren protección y minimización.

### 5. Inclusión

El sistema debe permitir acceso desde distintas plataformas y dispositivos, con lectura por voz, texto y soporte de diseño accesible.

### 6. Confiabilidad

Cuando la confianza OCR o la respuesta del modelo se encuentre por debajo de umbrales aceptables, se requiere intervención humana.

## Reglas del asistente IA

- Nunca inventar información.
- Mostrar la fuente utilizada en toda respuesta con impacto crítico.
- Si no se encuentra evidencia documental, responder con una limitación y pedir revisión.
- Indicar claramente el modelo usado, por ejemplo: `Azure OpenAI GPT-4o`.
- Si la confianza es baja, sugerir validación con un analista humano.

## Intervención humana requerida

Se requiere revisión manual cuando:

- la confianza OCR es menor a 90%;
- la factura presenta coincidencias de duplicado;
- la consulta del asistente no tiene evidencia documental;
- existen decisiones con impacto financiero o de seguridad.
