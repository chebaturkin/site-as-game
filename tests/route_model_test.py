import os

from playwright.sync_api import sync_playwright


BASE_URL = f"http://127.0.0.1:{os.environ.get('TEST_PORT', '4175')}"


def test_route_diagnostics_and_progress():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"{BASE_URL}/")
        page.wait_for_load_state("networkidle")
        result = page.evaluate(
            """() => {
                const project = window.RoomRoom.normalizeProject({
                  id: 'diagnostic-fixture', title: 'Fixture',
                  flags: [{ id: 'key', label: 'ключ', default: false }], startRoomId: 'a',
                  rooms: [
                    { id: 'a', title: 'Старт', transitions: [{ id: 'ab', label: 'дальше', target: 'b', requires: 'key' }] },
                    { id: 'b', title: 'Запертая', transitions: [] },
                    { id: 'c', title: 'Отдельная', transitions: [] }
                  ]
                });
                const report = window.RoomRoom.routeDiagnostics(project);
                const progress = window.RoomRoom.normalizeProgress(
                  { currentRoomId: 'a', visited: ['a'], flags: { key: false } }, project
                );
                return { report, progress };
            }"""
        )
        browser.close()

    assert len(result["report"]["unreachableRooms"]) == 2
    assert len(result["report"]["blockedTransitions"]) == 1
    assert len(result["report"]["deadEnds"]) == 2
    assert result["progress"]["completed"] is False
    assert result["progress"]["visited"] == ["a"]


if __name__ == "__main__":
    test_route_diagnostics_and_progress()
    print("route model: ok")
