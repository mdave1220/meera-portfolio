#!/usr/bin/env python3
"""Remove white/light-gray backgrounds from scrapbook PNG assets."""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SCRAP = ROOT / "assets" / "scrapbook"
CURSOR_ASSETS = Path("/Users/meeradave/.cursor/projects/Users-meeradave-Desktop-portfolio/assets")

CROPS = {
    "cardboard.png": (0, 0, 230, 228),
    "clipboard.png": (0, 232, 230, 498),
    "newspaper.png": (0, 518, 230, 758),
    "notebook-tape.png": (0, 772, 230, 902),
}


def is_background_pixel(r: int, g: int, b: int) -> bool:
    mx, mn = max(r, g, b), min(r, g, b)
    if (mx - mn) > 8:
        return False
    return mx >= 190


def color_close(c1: tuple[int, int, int], c2: tuple[int, int, int], tol: int) -> bool:
    return all(abs(a - b) <= tol for a, b in zip(c1, c2))


def remove_background(img: Image.Image, tolerance: int = 34) -> Image.Image:
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()

    corners = [px[0, 0][:3], px[w - 1, 0][:3], px[0, h - 1][:3], px[w - 1, h - 1][:3]]
    bg_colors = list({c for c in corners if is_background_pixel(*c)})

    if not bg_colors:
        bg_colors = [tuple(sum(c[i] for c in corners) // 4 for i in range(3))]

    visited = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    def matches_bg(rgb: tuple[int, int, int]) -> bool:
        if not is_background_pixel(*rgb):
            return False
        return any(color_close(rgb, bg, tolerance) for bg in bg_colors)

    def seed(x: int, y: int) -> None:
        if visited[y][x]:
            return
        rgb = px[x, y][:3]
        if matches_bg(rgb):
            visited[y][x] = True
            q.append((x, y))

    for x in range(w):
        seed(x, 0)
        seed(x, h - 1)
    for y in range(h):
        seed(0, y)
        seed(w - 1, y)

    while q:
        x, y = q.popleft()
        r, g, b, _ = px[x, y]
        px[x, y] = (r, g, b, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                rgb = px[nx, ny][:3]
                if matches_bg(rgb):
                    visited[ny][nx] = True
                    q.append((nx, ny))

    return img


def trim_transparent(img: Image.Image, padding: int = 4) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(img.width, right + padding)
    bottom = min(img.height, bottom + padding)
    return img.crop((left, top, right, bottom))


def process(path: Path) -> None:
    img = Image.open(path)
    img = remove_background(img)
    img = trim_transparent(img)
    img.save(path, "PNG")
    print(f"processed {path.name} -> {img.size[0]}x{img.size[1]}")


def rebuild_from_collage() -> None:
    sheet = CURSOR_ASSETS / "Screenshot_2026-06-18_at_2.36.30_PM-286b131a-9fab-4d88-8e3d-42dfb451adce.png"
    if not sheet.exists():
        sheet = SCRAP / "collage-sheet.png"
    img = Image.open(sheet)
    img.save(SCRAP / "collage-sheet.png", "PNG")
    for name, box in CROPS.items():
        img.crop(box).save(SCRAP / name, "PNG")
        print(f"cropped {name}")


def copy_sources() -> None:
    mapping = {
        "paperclip.png": "Screenshot_2026-06-18_at_2.35.22_PM-51183c17-3480-4d9a-8cf3-75922257ae55.png",
        "binder-clip.png": "Screenshot_2026-06-18_at_2.35.51_PM-03c48504-1e67-4a1c-80ba-1923b57c1ce7.png",
        "pushpin.png": "Screenshot_2026-06-18_at_2.38.16_PM-9d4b8793-1cb0-404e-bf8e-029b0015d19c.png",
        "pinned-note.png": "Screenshot_2026-06-18_at_2.38.42_PM-334cf910-1302-4329-a33c-0d3bf1e7aa39.png",
    }
    for dest, src in mapping.items():
        src_path = CURSOR_ASSETS / src
        if src_path.exists():
            Image.open(src_path).save(SCRAP / dest, "PNG")
            print(f"copied {dest}")


def main() -> None:
    SCRAP.mkdir(parents=True, exist_ok=True)
    copy_sources()
    rebuild_from_collage()

    skip = {"collage-sheet.png"}
    for path in sorted(SCRAP.glob("*.png")):
        if path.name in skip:
            continue
        process(path)


if __name__ == "__main__":
    main()
