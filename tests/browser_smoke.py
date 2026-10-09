import os
import zipfile

from playwright.sync_api import sync_playwright


BASE_URL = f"http://127.0.0.1:{os.environ.get('TEST_PORT', '4173')}"


def exercise(page, viewport):
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(f"{BASE_URL}/#/edit", wait_until="networkidle")
    page.evaluate("localStorage.clear()")
    page.reload(wait_until="networkidle")

    assert page.locator("#welcomeTitle").inner_text() == "соберите короткий мир из комнат"
    assert page.locator("#projectMetrics").inner_text().startswith("3 комнаты")
    assert page.locator("#templateGrid [data-template]").count() == 3
    assert page.locator("#roomList .room-button").count() == 3
    assert page.locator("#mapSvg [data-map-room]").count() == 3
    assert page.locator("#exportZip").is_enabled()

    page.locator("#projectTitle").fill("маршрут для проверки")
    page.locator("#projectTitle").blur()
    assert page.title().startswith("маршрут для проверки")

    if viewport["width"] > 760:
        node = page.locator('[data-map-room="n1"]')
        before = page.evaluate("() => JSON.parse(localStorage.getItem('room-room-project-v2')).rooms[0].position")
        box = node.bounding_box()
        page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        page.mouse.down()
        page.mouse.move(box["x"] + box["width"] / 2 + 80, box["y"] + box["height"] / 2 + 30)
        page.mouse.up()
        page.wait_for_timeout(250)
        after = page.evaluate("() => JSON.parse(localStorage.getItem('room-room-project-v2')).rooms[0].position")
        assert after != before
        page.locator('[data-map-room="n1"]').press("ArrowRight")
        page.wait_for_timeout(100)
        after_keyboard = page.evaluate("() => JSON.parse(localStorage.getItem('room-room-project-v2')).rooms[0].position")
        assert after_keyboard["x"] > after["x"]
        page.locator("#undoAction").click()
        restored = page.evaluate("() => JSON.parse(localStorage.getItem('room-room-project-v2')).rooms[0].position")
        assert restored == after
        page.locator("#redoAction").click()
        redone = page.evaluate("() => JSON.parse(localStorage.getItem('room-room-project-v2')).rooms[0].position")
        assert redone == after_keyboard

    page.locator("#addRoom").click()
    assert page.locator("#roomList .room-button").count() == 4
    page.locator("#duplicateRoom").click()
    assert page.locator("#roomList .room-button").count() == 5
    page.once("dialog", lambda dialog: dialog.accept())
    page.locator("#deleteRoom").click()
    assert page.locator("#roomList .room-button").count() == 4

    page.locator("#addTransition").click()
    assert page.locator("#exportZip").is_disabled()
    page.once("dialog", lambda dialog: dialog.accept())
    page.locator('[data-template="notes"]').click()
    assert page.locator("#exportZip").is_enabled()

    page.locator('[data-mode="play"]').click()
    assert page.locator("#playView").is_visible()
    assert page.locator("#playProgress").inner_text().startswith("01 /")
    assert "#/play/" in page.url
    page.locator("#playReset").click()
    assert page.locator("#playProgress").inner_text().startswith("01 /")
    page.locator("#backToMap").click()

    with page.expect_download() as download_info:
        page.locator("#exportZip").click()
        download = download_info.value
        assert download.suggested_filename.endswith("-room-room.zip")
        with zipfile.ZipFile(download.path()) as archive:
            assert {"index.html", "styles.css", "play.js", "project.json"}.issubset(archive.namelist())
            assert "routeReachable" in archive.read("play.js").decode("utf-8")

    with page.expect_download() as download_info:
        page.locator("#saveJson").click()
    assert download_info.value.suggested_filename.endswith(".json")

    assert errors == []


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        desktop = browser.new_page(viewport={"width": 1440, "height": 1000})
        exercise(desktop, {"width": 1440, "height": 1000})
        mobile = browser.new_page(viewport={"width": 390, "height": 844})
        mobile.goto(f"{BASE_URL}/#/edit", wait_until="networkidle")
        assert mobile.evaluate("() => document.documentElement.scrollWidth <= window.innerWidth")
        assert mobile.locator("#welcomeTitle").inner_text() == "соберите короткий мир из комнат"
        browser.close()


if __name__ == "__main__":
    main()
    print("browser smoke: ok")
