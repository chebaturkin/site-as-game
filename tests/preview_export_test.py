import os
import tempfile
import zipfile
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE_URL = f"http://127.0.0.1:{os.environ.get('TEST_PORT', '4173')}"


def main():
    with sync_playwright() as p, tempfile.TemporaryDirectory() as temporary:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(BASE_URL, wait_until="networkidle")
        page.locator("#roomTitle").fill("комната для проверки")
        assert page.locator("#previewTitle").inner_text(timeout=1500) == "комната для проверки"
        page.locator("#roomBody").fill("текст сразу появляется в предпросмотре.")
        assert page.locator("#previewBody").inner_text() == "текст сразу появляется в предпросмотре."

        page.locator('[data-room-id="n2"]').first.click()
        assert page.locator("#previewTitle").inner_text() == "фонарь на углу"
        page.locator("#previewPlay").click()
        assert page.locator("#sceneTitle").inner_text() == "фонарь на углу"
        assert page.locator("#sceneImage svg").count() == 1
        page.locator("#backToMap").click()

        # Uploaded images take precedence in the preview, game, and export.
        image_path = Path(temporary) / "uploaded.png"
        page.locator(".brand-mark").screenshot(path=str(image_path))
        page.locator("#roomImage").set_input_files(str(image_path))
        page.wait_for_selector("#previewImage img")
        assert page.locator("#previewImage img").get_attribute("src").startswith("data:image/png")
        page.locator("#previewPlay").click()
        assert page.locator("#sceneImage img").count() == 1
        page.locator("#backToMap").click()
        with page.expect_download() as downloaded:
            page.locator("#exportZip").click()
        with zipfile.ZipFile(downloaded.value.path()) as archive:
            assert "assets/room-02.png" in archive.namelist()
            assert "assets/illustration.svg" in archive.namelist()
            archive.extractall(temporary)

        # The downloaded story must run from disk without the editor or a server.
        exported = browser.new_page()
        exported.on("pageerror", lambda error: errors.append(str(error)))
        exported.goto((Path(temporary) / "index.html").as_uri(), wait_until="load")
        assert exported.locator("h1").inner_text() == "комната для проверки"
        assert exported.locator(".image").evaluate("img => img.complete && img.naturalWidth > 0")
        exported.locator('[data-transition="t1"]').click()
        assert exported.locator("h1").inner_text() == "фонарь на углу"
        assert exported.locator(".image").get_attribute("src") == "assets/room-02.png"
        assert errors == []
        browser.close()


if __name__ == "__main__":
    main()
    print("preview and offline export: ok")
