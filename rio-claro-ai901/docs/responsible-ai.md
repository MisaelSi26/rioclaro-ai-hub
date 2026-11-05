# IA Responsable

La aplicación presenta medidas iniciales alineadas con los seis principios de IA Responsable de Microsoft. No sustituyen una evaluación de impacto, validaciones de seguridad ni la supervisión operativa.

| Principio | Medida en el proyecto | Validación recomendada |
|---|---|---|
| Equidad | No automatiza decisiones sobre personas. | Comparar extracción en documentos de distintas calidades, formatos y proveedores; analizar errores y corregir sesgos de cobertura. |
| Inclusión | Interfaz responsive, etiquetas semánticas y contenido en español. | Pruebas de accesibilidad con usuarios y lectores de pantalla. |
| Confiabilidad y seguridad | Lista permitida de extensiones, comprobación de firma, límite de carga y aviso para confianza inferior al 80%. | Pruebas de carga, monitoreo, autenticación, análisis de amenazas y respuesta a incidentes. |
| Privacidad | Secretos fuera del código y almacenamiento configurable. | Identidad administrada/Key Vault, mínimo privilegio, cifrado, política de retención y control de acceso a documentos. |
| Transparencia | Chat con fuentes recuperadas; mensaje explícito cuando no hay resultados; confianza de extracción visible. | Revisar precisión de citas y comunicar limitaciones a usuarios finales. |
| Rendición de cuentas | Revisión humana de salidas inciertas y documentación de alcance. | Nombrar responsables de datos/modelos, conservar auditoría proporcional y habilitar reporte de errores. |

No usar una salida del modelo como decisión final sin verificación humana y controles propios del proceso de negocio.
