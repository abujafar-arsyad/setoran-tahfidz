"""
Generates placeholder brand assets for the Catatan Tahfidz app:
 - icon-1024.png: 1024x1024 master app icon (plum-purple background, book + checkmark motif, "ST" monogram)
 - icon-foreground-1024.png: transparent-background version of the motif, for use as an Android adaptive icon foreground
 - icon-background-1024.png: solid plum-purple 1024x1024, for use as an Android adaptive icon background
 - splash-2732.png: 2732x2732 splash screen (same brand colors, logo centered) source for @capacitor/assets

These are simple, original vector-style illustrations drawn with Pillow (no external
image assets or third-party copyrighted material used).
"""
import os
from PIL import Image, ImageDraw, ImageFont

PLUM = (91, 42, 107, 255)       # #5b2a6b
PLUM_DARK = (68, 28, 82, 255)   # slightly darker shade for depth
CREAM = (250, 244, 230, 255)    # warm off-white for the "book" pages
GOLD = (212, 175, 90, 255)      # accent gold for checkmark / trim

SIZE = 1024


def draw_book_checkmark(draw: ImageDraw.ImageDraw, cx: int, cy: int, scale: float):
    """Draws a simple open-book glyph with a checkmark, centered at (cx, cy)."""
    w = int(360 * scale)
    h = int(240 * scale)

    spine_x = cx
    top_y = cy - h // 2
    bottom_y = cy + h // 2

    left_page = [
        (spine_x, top_y),
        (spine_x - w // 2, top_y + int(20 * scale)),
        (spine_x - w // 2, bottom_y),
        (spine_x, bottom_y - int(10 * scale)),
    ]
    right_page = [
        (spine_x, top_y),
        (spine_x + w // 2, top_y + int(20 * scale)),
        (spine_x + w // 2, bottom_y),
        (spine_x, bottom_y - int(10 * scale)),
    ]
    draw.polygon(left_page, fill=CREAM)
    draw.polygon(right_page, fill=CREAM)

    line_color = (191, 175, 150, 255)
    for i in range(3):
        ly = top_y + int(60 * scale) + i * int(35 * scale)
        draw.line(
            [(spine_x - int(140 * scale), ly), (spine_x - int(30 * scale), ly)],
            fill=line_color, width=max(2, int(6 * scale)),
        )
        draw.line(
            [(spine_x + int(30 * scale), ly), (spine_x + int(140 * scale), ly)],
            fill=line_color, width=max(2, int(6 * scale)),
        )

    draw.line([(spine_x, top_y), (spine_x, bottom_y - int(10 * scale))],
              fill=PLUM_DARK, width=max(3, int(8 * scale)))

    badge_r = int(110 * scale)
    badge_cx = cx + int(150 * scale)
    badge_cy = cy + int(110 * scale)
    draw.ellipse(
        [badge_cx - badge_r, badge_cy - badge_r, badge_cx + badge_r, badge_cy + badge_r],
        fill=GOLD,
    )
    check_w = max(6, int(18 * scale))
    p1 = (badge_cx - int(50 * scale), badge_cy + int(5 * scale))
    p2 = (badge_cx - int(10 * scale), badge_cy + int(45 * scale))
    p3 = (badge_cx + int(60 * scale), badge_cy - int(45 * scale))
    draw.line([p1, p2], fill=CREAM, width=check_w)
    draw.line([p2, p3], fill=CREAM, width=check_w)


def make_background(size=SIZE, solid=True):
    img = Image.new("RGBA", (size, size), PLUM if solid else (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    if solid:
        steps = 40
        for i in range(steps):
            t = i / steps
            r = int(size * 0.75 * (1 - t * 0.5))
            shade = tuple(
                int(PLUM[c] + (PLUM_DARK[c] - PLUM[c]) * (t * 0.3)) for c in range(3)
            ) + (255,)
            draw.ellipse(
                [size / 2 - r, size / 2 - r, size / 2 + r, size / 2 + r],
                outline=shade, width=6,
            )
    return img, draw


def try_load_font(size):
    candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf",
        r"C:\Windows\Fonts\arialbd.ttf",
        r"C:\Windows\Fonts\arial.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    return ImageFont.load_default()


def build_full_icon():
    img, draw = make_background(SIZE, solid=True)
    draw_book_checkmark(draw, SIZE // 2, int(SIZE * 0.42), scale=1.5)

    font = try_load_font(int(SIZE * 0.16))
    text = "ST"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(
        (SIZE / 2 - tw / 2 - bbox[0], SIZE * 0.72 - th / 2 - bbox[1]),
        text, font=font, fill=CREAM,
    )
    img.save("assets-src/icon-1024.png")
    return img


def build_foreground():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_book_checkmark(draw, SIZE // 2, int(SIZE * 0.44), scale=1.15)
    font = try_load_font(int(SIZE * 0.12))
    text = "ST"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(
        (SIZE / 2 - tw / 2 - bbox[0], SIZE * 0.68 - th / 2 - bbox[1]),
        text, font=font, fill=CREAM,
    )
    img.save("assets-src/icon-foreground-1024.png")


def build_background_only():
    img, _ = make_background(SIZE, solid=True)
    img.save("assets-src/icon-background-1024.png")


def build_splash():
    size = 2732
    img = Image.new("RGBA", (size, size), PLUM)
    draw = ImageDraw.Draw(img)
    scale = size / SIZE
    draw_book_checkmark(draw, size // 2, int(size * 0.46), scale=1.5 * scale)
    font = try_load_font(int(size * 0.09))
    text = "Catatan Tahfidz"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(
        (size / 2 - tw / 2 - bbox[0], size * 0.62 - th / 2 - bbox[1]),
        text, font=font, fill=CREAM,
    )
    img.save("assets-src/splash-2732.png")


if __name__ == "__main__":
    os.makedirs("assets-src", exist_ok=True)
    build_full_icon()
    build_foreground()
    build_background_only()
    build_splash()
    print("Generated icon-1024.png, icon-foreground-1024.png, icon-background-1024.png, splash-2732.png")
