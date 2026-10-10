# Asistente de Palcazu Travel

El sitio conserva HTML, CSS y JavaScript locales en `public/`. La búsqueda y la guía rápida funcionan sin servidor. La guía muestra respuestas documentadas y no se presenta como inteligencia artificial.

El chat usa un servidor Vinext con la integración de Sites. Las rutas están implementadas y el secreto se lee exclusivamente en el servidor. **La generación real no está activada ni verificada con OpenAI mientras falte configurar `OPENAI_API_KEY`.** La interfaz comprueba disponibilidad antes de mostrar el formulario del chat.

## Activación en el sitio alojado

1. Habilitar OpenAI Developers y usar su flujo autorizado para obtener/configurar una clave de proyecto.
2. Guardar `OPENAI_API_KEY` como secreto de ejecución del Site. No ponerla en HTML, JavaScript del navegador, Git ni hosting.json.
3. El modelo por defecto es `gpt-5.6-terra`; puede seleccionarse un modelo compatible mediante `OPENAI_MODEL` en el servidor.
4. Comprobar `/api/assistant/status`, luego una pregunta real y un seguimiento en la web. Revisar exactitud, latencia y consumo antes de ampliar la audiencia.

No se ha configurado facturación, modificado una cuenta ni creado una clave para esta entrega. El Site conserva su audiencia privada.

## Contrato

- `GET /api/assistant/status` responde `{ "available": true|false }`. Requiere identidad autenticada del Site.
- `POST /api/assistant` acepta `{ "messages": [{ "role": "user", "content": "…" }] }`. Requiere identidad y Origin del mismo sitio; solo JSON, hasta 32 KiB, máximo ocho mensajes, 1.000 caracteres por pregunta y 2.000 por respuesta histórica.
- Responde `{ "text": "…", "links": [{ "href": "guia.html", "label": "…" }], "mode": "ai" }`.
- Usa Responses API, instrucciones de orientación y una base de 15 temas. No navega en tiempo real ni consulta inventarios o reservas. Tarifas, canales comerciales, disponibilidad y condiciones no confirmadas se marcan como pendientes.
- Las claves y errores del proveedor no se devuelven al cliente. El texto se representa como texto, sin interpretar HTML. Los enlaces están limitados a rutas propias del sitio.
- Historial temporal en memoria de la página; se pierde al recargar. La web no guarda conversaciones en una base de datos. Las preguntas sí se envían al proveedor de IA cuando está activo. La solicitud usa `store: false`; eso no significa ausencia de toda retención por parte del proveedor.
- Tiempo máximo de petición: 20 segundos en servidor, 25 en cliente. Incluye detener, reintentar y reiniciar la conversación.
- Protección de ráfagas: cinco solicitudes por minuto por usuario e isolate, y una simultánea. No es un límite global de gasto; antes de abrir el sitio al público se necesita una cuota duradera y controles adecuados a esa audiencia.

## Archivos del servidor incluidos en el ZIP

`servidor-ia/` contiene los manejadores y la base de conocimiento para revisión o integración. El ZIP estático por sí solo no ejecuta estas rutas. La versión alojada utiliza el proyecto de servidor completo.

## Validación y fuentes

Las rutas se comprueban con peticiones HTTP modeladas y un proveedor simulado, incluyendo autorización, origen, tamaño, historial, respuesta válida, errores y límites. La guía y búsqueda se comprueban con DOM modelado. Estos controles no sustituyen una conversación real con OpenAI ni una revisión visual en navegador.

- https://developers.openai.com/api/reference/overview
- https://developers.openai.com/api/reference/resources/responses/methods/create
- https://developers.openai.com/api/docs/models/gpt-5.6-terra
- Investigación y créditos del territorio: `fuentes.html` y `CREDITOS.txt`.
