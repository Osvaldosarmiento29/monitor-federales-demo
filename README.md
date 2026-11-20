# Monitor de Expedientes — demostración

Demo comercial autónoma inspirada en los recorridos del Monitor de Expedientes. Todos los nombres, órganos, expedientes y acuerdos se inventaron para esta muestra. No incluye código de scraping, bases, documentos, claves ni historial Git del sistema operativo del despacho.

## Abrir localmente

Con Python instalado, desde esta carpeta:

```powershell
python -m http.server 8010 --bind 127.0.0.1 --directory dist
```

Abrir http://127.0.0.1:8010. No necesita Django, Docker, cuenta, extensión ni servicios de correo. Usar HTTP local en lugar de abrir el HTML como archivo.

## Recorrido sugerido

1. Federales → Revisar ahora. Ver dos asuntos con publicación y uno omitido por falta de enlace.
2. Abrir 101/2026 → Generar consecutivo. Completar un nombre ficticio y unir sus dos publicaciones en una ficha. Usar Imprimir / guardar PDF.
3. Ejecutar otra vez la revisión: no se duplican publicaciones.
4. Abrir 404/2026 → Vincular enlace de muestra; repetir revisión y comprobar cobertura.
5. Locales → Revisar ahora → Ver reporte. Se simula un boletín preparado, no una descarga ni OCR reales.
6. Amparos → Abrir consulta de muestra. Confirmar sólo los expedientes de interés. La fila ajena no se guarda.
7. Calendario de términos → tocar un día → agregar uno o varios eventos. Las fechas las captura el usuario, no se calculan términos legales.
8. Avisos / Vista del correo: ver novedades de activos de Federales y Locales, sin enviar mensajes.
9. Cambiar apariencia y comprobar el recorrido en móvil.

También hay ficha editable, activación de monitoreo, seguimiento manual de suspensión e importación preparada. La descarga CSV es ilustrativa: la demo no procesa archivos del visitante. No introducir datos reales.

## Alcance y límites

- Es una simulación de producto, **no una copia desplegada del backend ni evidencia de cobertura o rendimiento judicial**.
- No tiene login real. La demo es pública por naturaleza: contiene sólo fixtures ficticios. El sistema real sí exige autenticación y permisos.
- No hace peticiones a portales externos ni envía correos. La validación asistida no es un CAPTCHA.
- Amparos muestra el comportamiento propuesto de selección de asuntos propios; ese criterio todavía requiere aceptación en el sistema real.
- Las revisiones devuelven resultados deterministas preparados. Crear una ficha nueva no provoca una búsqueda real.
- Los cambios se conservan en sessionStorage en esta pestaña. “Restablecer demo” recupera las muestras iniciales. No hay almacenamiento compartido ni tareas en segundo plano.
- No promete detectar todas las publicaciones ni calcula vencimientos legales.

## Repositorio y publicación

Se prepara como repositorio **nuevo**, rama `demo/comercial`, sin remoto. No crear una rama pública del repositorio real: copiar su historial puede revelar datos anteriores aunque se borren en el último commit.

Antes de subir: revisar los archivos incluidos y decidir visibilidad/licencia. No se incluye licencia de código abierto por defecto. Para portafolio se puede publicar el sitio conservando privado el código.

Para alojar, servir únicamente `dist/`. No hay compilación ni secretos. Puede usarse un alojamiento estático; no requiere subir la aplicación judicial ni contratar una base de datos. No está publicado todavía.

## Verificación

`tests/smoke_demo.py` usa Playwright para recorrer revisiones, deduplicación, consecutivo, Amparos selectivo, agenda, entradas escapadas, modo oscuro y vista móvil. Requiere Playwright y su Chromium disponibles. También comprueba que no se soliciten recursos de Internet durante esos recorridos.

```powershell
python tests/smoke_demo.py
```

El programa abre su propio servidor temporal de prueba y guarda capturas en `qa-output/` (ignorado por Git).
