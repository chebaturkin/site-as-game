import os
import re

from playwright.sync_api import sync_playwright

BASE_URL = f"http://127.0.0.1:{os.environ.get('TEST_PORT', '4173')}"


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        page.goto(BASE_URL, wait_until="networkidle")
        pairs = [("n1", "n2"), ("n1", "n3"), ("n2", "n3")]
        for source, target in pairs:
            forward = page.locator(f'[data-edge-from="{source}"][data-edge-to="{target}"] .edge-label')
            reverse = page.locator(f'[data-edge-from="{target}"][data-edge-to="{source}"] .edge-label')
            a = list(map(float, re.findall(r"-?\d+(?:\.\d+)?", forward.get_attribute("transform"))))
            b = list(map(float, re.findall(r"-?\d+(?:\.\d+)?", reverse.get_attribute("transform"))))
            assert abs(a[0] - b[0]) > 10 or abs(a[1] - b[1]) > 10, (source, target, a, b)
        browser.close()


if __name__ == "__main__":
    main()
    print("map reciprocal labels: ok")
