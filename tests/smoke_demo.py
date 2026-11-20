"""Recorridos de aceptación de la demo, con fixtures y servidor efímero local."""
import functools
import http.server
import json
from pathlib import Path
import threading
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'qa-output'
OUT.mkdir(exist_ok=True)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT / 'dist')))
threading.Thread(target=server.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{server.server_port}'
errors, external, checks = [], [], []


def check(name):
    checks.append(name)
    print('OK:', name, flush=True)


try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={'width': 1440, 'height': 1050})
        page = context.new_page()
        page.on('pageerror', lambda err: errors.append(str(err)))
        context.on('request', lambda req: external.append(req.url) if urlparse(req.url).hostname not in ('127.0.0.1', None) else None)
        page.goto(URL)
        expect(page.get_by_role('heading', name='Menos revisión manual.')).to_be_visible()
        page.screenshot(path=str(OUT / 'inicio-desktop.png'), full_page=True)
        check('Inicio con tres módulos y sin login ficticio')
        page.goto(URL + '/#federales')
        page.get_by_role('button', name='Revisar ahora', exact=True).click()
        expect(page.get_by_role('button', name='Revisar ahora', exact=True)).to_be_visible(timeout=10000)
        assert page.evaluate("JSON.parse(sessionStorage.getItem('monitor-demo-v1')).publications.length") == 3
        check('Revisión de Federales guarda tres publicaciones ficticias')
        page.get_by_role('button', name='Revisar ahora', exact=True).click()
        expect(page.get_by_role('button', name='Revisar ahora', exact=True)).to_be_visible(timeout=10000)
        assert page.evaluate("JSON.parse(sessionStorage.getItem('monitor-demo-v1')).publications.length") == 3
        check('Repetir revisión no duplica publicaciones')
        page.get_by_role('link', name='Ver reporte', exact=True).click()
        expect(page.get_by_text('Cobertura incompleta:', exact=False)).to_be_visible()
        page.get_by_role('link', name='404/2026', exact=True).click()
        page.get_by_role('button', name='Vincular enlace de muestra').click()
        assert page.evaluate("JSON.parse(sessionStorage.getItem('monitor-demo-v1')).cases.find(c=>c.id==='f4').linked")
        check('Omitido visible y enlace ficticio corregible')
        page.goto(URL + '/#consecutivo/f1')
        page.get_by_label('Licenciado responsable').fill('Licenciada Ficticia Demo')
        page.get_by_role('button', name='Generar vista para imprimir / PDF').click()
        expect(page.get_by_text('Se unieron 2 publicaciones en una sola ficha.')).to_be_visible()
        assert page.locator('.sheet-card').count() == 1
        assert page.locator('.sheet-card .publication').count() == 2
        page.emulate_media(media='print')
        page.pdf(path=str(OUT / 'consecutivo-ficticio.pdf'), format='A4', print_background=True)
        page.emulate_media(media='screen')
        check('Consecutivo une dos publicaciones y genera PDF imprimible')
        page.goto(URL + '/#locales')
        page.get_by_role('button', name='Revisar ahora', exact=True).click()
        expect(page.get_by_role('button', name='Revisar ahora', exact=True)).to_be_visible(timeout=10000)
        assert page.evaluate("JSON.parse(sessionStorage.getItem('monitor-demo-v1')).publications.filter(p=>p.caseId.startsWith('l')).length") == 2
        check('Boletín simulado de Locales y dos acuerdos')
        page.goto(URL + '/#amparos')
        page.get_by_role('button', name='Abrir consulta de muestra').click()
        page.get_by_role('button', name='Mostrar resultados de ejemplo').click()
        expect(page.get_by_text('Confirma que estás en una consulta ficticia.', exact=True)).to_be_visible()
        page.get_by_role('checkbox').check()
        page.get_by_role('button', name='Mostrar resultados de ejemplo').click()
        page.locator('input[name="case"][value="a2"]').uncheck()
        page.get_by_role('button', name='Confirmar y guardar seleccionados').click()
        assert page.evaluate("JSON.parse(sessionStorage.getItem('monitor-demo-v1')).publications.filter(p=>p.caseId.startsWith('a')).map(p=>p.caseId)") == ['a1']
        check('Amparos guarda únicamente el asunto seleccionado, no el ajeno')
        page.goto(URL + '/#agenda')
        page.locator('.day.today').click()
        page.get_by_role('button', name='Agregar evento este día').click()
        page.get_by_label('Descripción', exact=True).fill('Término ficticio de aceptación')
        page.get_by_label('Tipo', exact=True).select_option('Término')
        page.get_by_role('checkbox').check()
        page.get_by_role('button', name='Guardar evento', exact=True).click()
        expect(page.get_by_text('Término ficticio de aceptación', exact=True)).to_be_visible()
        page.get_by_role('button', name='Agregar evento', exact=True).click()
        page.get_by_label('Descripción', exact=True).fill('Segunda audiencia ficticia')
        page.get_by_role('checkbox').check()
        page.get_by_role('button', name='Guardar evento', exact=True).click()
        assert page.locator('.day.today .event-pill').count() >= 2
        page.get_by_role('button', name='‹', exact=True).click()
        page.get_by_role('button', name='Hoy', exact=True).click()
        page.screenshot(path=str(OUT / 'calendario-desktop.png'), full_page=True)
        check('Calendario agrega varios eventos al día y navega meses')
        page.goto(URL + '/#correo')
        expect(page.get_by_text('No se ha enviado ningún correo.', exact=False)).to_be_visible()
        assert page.locator('.mail-item').count() == 4
        assert '601/2026' not in page.locator('.mail').inner_text()
        page.goto(URL + '/#expediente/f2')
        page.get_by_role('button', name='Desactivar monitoreo').click()
        page.goto(URL + '/#correo')
        assert page.locator('.mail-item').count() == 3
        check('Correo excluye Amparos y expedientes inactivos; no envía mensajes')
        page.goto(URL + '/#federales')
        page.get_by_role('button', name='Importar lista de ejemplo').click()
        page.get_by_role('button', name='Confirmar importación de ejemplo').click()
        page.get_by_role('button', name='Importar lista de ejemplo').click()
        page.get_by_role('button', name='Confirmar importación de ejemplo').click()
        assert page.evaluate("JSON.parse(sessionStorage.getItem('monitor-demo-v1')).cases.filter(c=>c.id==='import-federales').length") == 1
        page.get_by_role('button', name='Agregar expediente', exact=True).click()
        page.get_by_label('Número / año').fill('909/2026')
        page.get_by_label('Parte actora / promovente', exact=True).fill('<img src=x onerror=alert(1)>')
        page.get_by_label('Parte demandada / autoridad', exact=True).fill('Persona Ficticia Test')
        page.get_by_role('button', name='Guardar ficha de muestra').click()
        expect(page.get_by_text('<img src=x onerror=alert(1)>', exact=False)).to_be_visible()
        assert page.locator('#contenido img').count() == 0
        check('Importación sin duplicados y texto introducido escapado')
        page.reload()
        expect(page.get_by_text('909/2026', exact=True)).to_be_visible()
        page.get_by_label('Buscar expediente').fill('no existe')
        expect(page.get_by_text('No hay coincidencias', exact=True)).to_be_visible()
        check('Persistencia de sesión y filtro vacío')
        mobile = browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1)
        mobile.on('request', lambda req: external.append(req.url) if urlparse(req.url).hostname not in ('127.0.0.1', None) else None)
        mp = mobile.new_page()
        mp.on('pageerror', lambda err: errors.append(str(err)))
        for route in ['inicio','federales','locales','amparos','agenda','avisos','correo','expediente/f1']:
            mp.goto(URL + '/#' + route)
            assert mp.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), route
        mp.goto(URL + '/#amparos')
        mp.get_by_role('button', name='Activar modo oscuro').click()
        assert mp.locator('html').get_attribute('data-theme') == 'dark'
        mp.wait_for_function('() => getComputedStyle(document.querySelector("[data-action=import]")).backgroundColor === "rgb(36, 38, 43)"')
        mp.screenshot(path=str(OUT / 'amparos-movil-oscuro.png'), full_page=True)
        mp.goto(URL + '/#agenda')
        mp.locator('.day.today').tap()
        expect(mp.get_by_role('button', name='Agregar evento este día')).to_be_visible()
        check('Ocho vistas a 390 px sin desbordar; modo oscuro y toque en calendario')
        page.get_by_role('button', name='Cómo probar').click()
        page.get_by_role('button', name='Restablecer demo', exact=True).last.click()
        page.get_by_role('button', name='Restablecer demo', exact=True).last.click()
        assert page.evaluate("JSON.parse(sessionStorage.getItem('monitor-demo-v1')).publications.length") == 0
        assert page.evaluate("JSON.parse(sessionStorage.getItem('monitor-demo-v1')).cases.length") == 9
        check('Restablecer recupera nueve fixtures originales sin publicaciones')
        browser.close()
    assert not errors, errors
    assert not external, external
    check('Sin errores JavaScript ni solicitudes de Internet')
    (OUT / 'resultados.json').write_text(json.dumps({'checks':checks,'javascript_errors':errors,'external_requests':external},ensure_ascii=False,indent=2),encoding='utf-8')
finally:
    server.shutdown()
    server.server_close()
