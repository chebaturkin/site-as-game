import os
import tempfile
import zipfile
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE = os.environ.get('I18N_URL', 'http://127.0.0.1:4412')
with sync_playwright() as p:
    browser = p.chromium.launch()
    for language in ('en-US', 'ru-RU'):
        page = browser.new_page(locale=language, viewport={'width': 1440, 'height': 1000})
        page.goto(BASE + '/?keep=yes#editor')
        page.wait_for_function('window.I18n && document.documentElement.lang === navigator.language.slice(0,2)')
        if 'static-studio' == 'site-as-game':
            page.locator('[data-action="choose-template"][data-template="note"]').click()
        if 'decision-capsule' == 'site-as-game':
            page.locator('[data-action="new"]').first.click()
        field = page.locator('#roomTitle')
        field.fill('my unsaved text / мой текст')
        before = page.evaluate('location.hash')
        page.evaluate('window.__localeTestToken = "keep-me"')
        target = 'ru' if language == 'en-US' else 'en'
        page.locator('[data-locale="' + target + '"]').focus()
        page.locator('[data-locale="' + target + '"]').press('Enter')
        assert field.input_value() == 'my unsaved text / мой текст'
        assert page.evaluate('document.documentElement.lang') == target
        assert page.evaluate('location.hash') == before
        assert page.evaluate('window.__localeTestToken') == 'keep-me'
        assert 'keep=yes' in page.url
        assert page.locator('[data-locale="' + target + '"]').get_attribute('aria-pressed') == 'true'
        page.reload()
        assert page.evaluate('document.documentElement.lang') == target
        for width in (1440, 320, 390, 768, 1440):
            page.set_viewport_size({'width': width, 'height': 1000})
            page.evaluate('() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), width
        page.close()
    # Explicit links override a stored preference; invalid links fall through.
    context = browser.new_context(locale='ru-RU')
    context.add_init_script("localStorage.setItem('site-as-game:locale', 'en')")
    page = context.new_page()
    page.goto(BASE + '/?lang=bad&keep=1')
    assert page.evaluate('I18n.locale') == 'en'
    page.goto(BASE + '/?lang=ru&keep=1')
    assert page.evaluate('I18n.locale') == 'ru'
    context.close()
    # The selector still works when persistence and URL history are blocked.
    context = browser.new_context(locale='en-US')
    context.add_init_script("Storage.prototype.getItem = () => { throw Error('blocked') }; Storage.prototype.setItem = () => { throw Error('blocked') }; history.replaceState = () => { throw Error('blocked') }")
    page = context.new_page()
    page.goto(BASE + '/?lang=en')
    if 'site-as-game' == 'static-studio':
        page.locator('[data-action="choose-template"][data-template="note"]').click()
    page.locator('[data-locale="ru"]').click()
    assert page.evaluate('document.documentElement.lang') == 'ru'
    context.close()
    context = browser.new_context(locale='en-US', accept_downloads=True, viewport={'width':1440,'height':1000})
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(BASE + '/?lang=en')
    assert 'alley after the rain' in page.locator('body').inner_text()
    page.locator('[data-locale="ru"]').click()
    assert page.locator('#roomTitle').input_value() == 'переулок после дождя'
    page.locator('[data-locale="en"]').click()
    assert page.locator('#roomTitle').input_value() == 'alley after the rain'
    page.locator('#roomTitle').fill('my room / моя комната')
    page.locator('[data-locale="ru"]').click()
    assert page.locator('#roomTitle').input_value() == 'my room / моя комната'
    assert page.locator('#roomBody').input_value().startswith('the rain stopped')
    page.locator('[data-locale="en"]').click()
    page.locator('#projectFile').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':b'bad'})
    assert 'could not open json' in page.locator('#toast').inner_text()
    with page.expect_download() as download:
        page.locator('#exportZip').click()
    with tempfile.TemporaryDirectory() as temporary:
        with zipfile.ZipFile(download.value.path()) as archive:
            html = archive.read('index.html').decode()
            script = archive.read('play.js').decode()
            assert '<html lang="en">' in html
            assert 'start again' in script and 'начать заново' not in script
            archive.extractall(temporary)
        exported = context.new_page()
        exported.on('pageerror', lambda e: errors.append(str(e)))
        exported.goto((Path(temporary)/'index.html').as_uri())
        assert exported.locator('h1').inner_text() == 'my room / моя комната'
        assert 'progress:' in exported.locator('body').inner_text()
        exported.locator('[data-transition="t1"]').click()
        assert exported.locator('h1').inner_text() == 'lamp on the corner'
        exported.close()
    assert errors == [], errors
    context.close()
    # Previously persisted content is owned by the user, even when it resembles a template.
    with browser.new_context(locale='en-US', viewport={'width':1440,'height':1000}) as saved:
        saved_page = saved.new_page()
        saved_page.goto(BASE + '/?lang=en')
        saved_page.wait_for_selector('#roomTitle')
        saved_page.wait_for_timeout(500)
        saved_page.reload()
        saved_page.locator('[data-locale="ru"]').click()
        assert saved_page.locator('#roomTitle').input_value() == 'alley after the rain'
    browser.close()
print('i18n browser: ok')
