"""Génère les textures utilisées par les effets holo (approximations locales,
remplaçant les images du repo original) + une carte exemple."""
import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter

random.seed(42)

OUT = os.path.join(os.path.dirname(__file__), "..", "img")
os.makedirs(OUT, exist_ok=True)


def save(img, name):
    path = os.path.join(OUT, name)
    img.save(path)
    print("ok", name, img.size)


def star(draw, cx, cy, r, color):
    draw.line([(cx - r, cy), (cx + r, cy)], fill=color, width=max(1, r // 3))
    draw.line([(cx, cy - r), (cx, cy + r)], fill=color, width=max(1, r // 3))
    if r >= 3:
        d = r // 3
        draw.line([(cx - d, cy - d), (cx + d, cy + d)], fill=color, width=1)
        draw.line([(cx - d, cy + d), (cx + d, cy - d)], fill=color, width=1)


def make_glitter(size=512, count=700):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for _ in range(count):
        x, y = random.uniform(0, size), random.uniform(0, size)
        r = random.choice([1, 1, 2, 2, 3, 4])
        a = random.randint(90, 255)
        tint = random.choice([(255, 255, 255), (255, 240, 200), (200, 230, 255), (255, 210, 240)])
        star(d, x, y, r, tint + (a,))
    save(img, "glitter.png")


def make_grain(size=256):
    img = Image.new("L", (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            px[x, y] = random.randint(0, 255)
    img = img.filter(ImageFilter.GaussianBlur(0.6))
    save(img.convert("RGB"), "grain.png")


def space_base(w, h):
    img = Image.new("RGB", (w, h))
    top = (8, 6, 32)
    bottom = (38, 12, 64)
    for y in range(h):
        t = y / h
        img.paste(tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)), (0, y, w, y + 1))
    return img


def add_nebula(img, blobs):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for (cx, cy, rx, ry, color, alpha) in blobs:
        d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=color + (alpha,))
    layer = layer.filter(ImageFilter.GaussianBlur(40))
    img.paste(Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB"), (0, 0))
    return img


def add_stars(img, count, alpha_max=255, size_max=2, transparent=False):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    w, h = img.size
    for _ in range(count):
        x, y = random.uniform(0, w), random.uniform(0, h)
        r = random.uniform(0.5, size_max)
        a = random.randint(60, alpha_max)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, a))
    layer = layer.filter(ImageFilter.GaussianBlur(0.4))
    base = img.convert("RGBA") if not transparent else Image.new("RGBA", img.size, (0, 0, 0, 0))
    return Image.alpha_composite(base, layer)


def make_cosmos():
    w, h = 660, 921
    base = space_base(w, h)
    add_nebula(base, [
        (w * 0.3, h * 0.3, 180, 120, (120, 40, 160), 90),
        (w * 0.7, h * 0.6, 200, 140, (20, 90, 140), 80),
        (w * 0.5, h * 0.85, 160, 100, (160, 60, 120), 60),
    ])
    bottom = add_stars(base, 420, 255, 2)
    save(bottom.convert("RGB"), "cosmos-bottom.png")

    mid = add_nebula(Image.new("RGBA", (w, h), (0, 0, 0, 0)), [
        (w * 0.6, h * 0.4, 150, 100, (90, 60, 180), 70),
    ])
    mid = add_stars(mid.convert("RGB").convert("RGBA"), 260, 160, 2, transparent=True)
    save(mid, "cosmos-middle-trans.png")

    top = add_stars(Image.new("RGBA", (w, h), (0, 0, 0, 0)), 140, 220, 2.5, transparent=True)
    save(top, "cosmos-top-trans.png")


def make_illusion(size=512):
    img = Image.new("RGB", (size, size), (20, 20, 20))
    d = ImageDraw.Draw(img)
    cx = cy = size / 2
    for r in range(0, size, 4):
        v = int(127 + 120 * math.sin(r * 0.35))
        v = max(0, min(255, v))
        jitter = random.randint(-2, 2)
        d.ellipse([cx - r + jitter, cy - r + jitter, cx + r + jitter, cy + r + jitter], outline=(v, v, v), width=2)
    img = img.filter(ImageFilter.GaussianBlur(0.5))
    save(img, "illusion.png")


def make_illusion_mask(size=512):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([size * 0.08, size * 0.1, size * 0.92, size * 0.55], radius=size * 0.04, fill=(255, 255, 255, 235))
    img = img.filter(ImageFilter.GaussianBlur(6))
    save(img, "illusion-mask.png")


def make_geometric(size=512):
    img = Image.new("RGB", (size, size), (30, 24, 8))
    d = ImageDraw.Draw(img)
    gold = (201, 162, 39)
    step = 32
    for y in range(-size, size, step):
        d.line([(0, y), (size, y + size)], fill=gold, width=1)
        d.line([(0, y + size), (size, y)], fill=(90, 70, 20), width=1)
    for x in range(0, size, step):
        d.line([(x, 0), (x, size)], fill=gold, width=1)
    save(img, "geometric.png")


def make_trainerbg(size=512):
    img = Image.new("RGB", (size, size), (245, 245, 245))
    d = ImageDraw.Draw(img)
    for y in range(-size, size * 2, 24):
        d.line([(0, y), (size, y - size)], fill=(210, 210, 210), width=8)
    save(img, "trainerbg.png")


def make_vmaxbg(w=660, h=921):
    img = Image.new("RGB", (w, h), (10, 20, 50))
    d = ImageDraw.Draw(img)
    cx, cy = w / 2, h / 2
    for r in range(0, int(max(w, h)), 28):
        v = 40 + int(30 * math.sin(r * 0.1))
        d.ellipse([cx - r, cy - r * 1.4, cx + r, cy + r * 1.4], outline=(v, v + 20, v + 60), width=3)
    img = img.filter(ImageFilter.GaussianBlur(1.5))
    save(img, "vmaxbg.jpg")


def make_ancient(size=512):
    img = Image.new("RGB", (size, size), (24, 18, 30))
    d = ImageDraw.Draw(img)
    gold = (216, 178, 92)
    cx = cy = size / 2
    for r in range(20, size, 26):
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=gold, width=2)
        for a in range(0, 360, 30):
            rad = math.radians(a)
            x1, y1 = cx + r * math.cos(rad), cy + r * math.sin(rad)
            x2, y2 = cx + (r + 14) * math.cos(rad), cy + (r + 14) * math.sin(rad)
            d.line([(x1, y1), (x2, y2)], fill=gold, width=1)
    save(img, "ancient.png")


def make_sample_card(w=660, h=921):
    img = Image.new("RGB", (w, h), (247, 244, 233))
    d = ImageDraw.Draw(img)
    margin = 28
    d.rounded_rectangle([margin, margin, w - margin, h - margin], radius=26, fill=(255, 253, 240), outline=(210, 200, 160), width=3)
    d.rectangle([margin, margin, w - margin, 110], fill=(250, 205, 48))
    d.rounded_rectangle([margin, margin, w - margin, 110], radius=26, fill=(250, 205, 48))
    d.rectangle([margin, 80, w - margin, 110], fill=(250, 205, 48))
    try:
        from PIL import ImageFont
        font_big = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 44)
        font_med = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 30)
        font_sm = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
    except Exception:
        font_big = font_med = font_sm = ImageFont.load_default()
    d.text((margin + 24, 42), "Pikachu", font=font_big, fill=(40, 30, 10))
    hp = "PV 60"
    d.text((w - margin - 24 - d.textlength(hp, font=font_med), 48), hp, font=font_med, fill=(40, 30, 10))
    art = [margin + 16, 130, w - margin - 16, 560]
    d.rounded_rectangle(art, radius=18, fill=(120, 190, 250))
    sky = Image.new("RGB", (art[2] - art[0], art[3] - art[1]))
    for y in range(sky.size[1]):
        t = y / sky.size[1]
        sky.paste((int(120 + 60 * t), int(190 + 40 * t), int(250 + 5 * t)), (0, y, sky.size[0], y + 1))
    sd = ImageDraw.Draw(sky)
    sd.ellipse([sky.size[0] * 0.55, 30, sky.size[0] * 0.9, 110], fill=(255, 255, 255))
    sd.ellipse([sky.size[0] * 0.15, 60, sky.size[0] * 0.45, 130], fill=(255, 255, 255))
    sd.ellipse([sky.size[0] * 0.35, 260, sky.size[0] * 0.75, 340], fill=(90, 190, 90))
    sky = sky.filter(ImageFilter.GaussianBlur(1))
    img.paste(sky, (art[0], art[1]))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle(art, radius=18, outline=(60, 60, 60), width=4)
    cx, cy = (art[0] + art[2]) / 2, (art[1] + art[3]) / 2 + 20
    d.ellipse([cx - 110, cy - 110, cx + 110, cy + 110], fill=(250, 205, 48), outline=(120, 90, 10), width=5)
    d.ellipse([cx - 55, cy - 45, cx - 25, cy - 15], fill=(30, 30, 30))
    d.ellipse([cx + 25, cy - 45, cx + 55, cy - 15], fill=(30, 30, 30))
    d.arc([cx - 40, cy - 10, cx + 40, cy + 40], start=20, end=160, fill=(30, 30, 30), width=5)
    bolt = [(cx + 10, cy - 130), (cx - 35, cy - 40), (cx - 5, cy - 40), (cx - 20, cy + 60), (cx + 45, cy - 70), (cx + 10, cy - 70)]
    d.polygon(bolt, fill=(255, 235, 60), outline=(120, 90, 10))
    y = 600
    d.text((margin + 24, y), "Éclair", font=font_med, fill=(40, 40, 40))
    d.ellipse([w - margin - 90, y + 4, w - margin - 50, y + 44], fill=(250, 205, 48), outline=(120, 90, 10), width=3)
    d.text((w - margin - 130, y + 44), "30", font=font_sm, fill=(60, 60, 60))
    d.rounded_rectangle([margin + 16, y + 70, w - margin - 16, y + 130], radius=10, outline=(200, 190, 160), width=2)
    d.line([margin + 40, y + 100, w - margin - 40, y + 100], fill=(190, 180, 150), width=3)
    d.line([margin + 40, y + 116, w - margin - 90, y + 116], fill=(190, 180, 150), width=3)
    y2 = 780
    labels = ["Faiblesse", "Résistance", "Coût de retraite"]
    for i, lab in enumerate(labels):
        x = margin + 30 + i * 200
        d.text((x, y2), lab, font=font_sm, fill=(90, 90, 90))
        d.ellipse([x, y2 + 34, x + 34, y2 + 68], fill=(230, 225, 210), outline=(150, 140, 120), width=2)
    d.text((margin + 24, h - 80), "Carte de démonstration — remplace-la par ton PNG !", font=font_sm, fill=(140, 130, 110))
    save(img, "sample-card.png")


if __name__ == "__main__":
    make_glitter()
    make_grain()
    make_cosmos()
    make_illusion()
    make_illusion_mask()
    make_geometric()
    make_trainerbg()
    make_vmaxbg()
    make_ancient()
    make_sample_card()
    print("done")
