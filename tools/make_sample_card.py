"""Génère uniquement la carte exemple (img/sample-card.png).
Les textures holo (img/foils/) proviennent du repo fyk0620/ribi-holo (GPL-3.0)."""
import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter

random.seed(42)
OUT = os.path.join(os.path.dirname(__file__), "..", "img")


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
    img.save(os.path.join(OUT, "sample-card.png"))
    print("ok sample-card.png")


if __name__ == "__main__":
    make_sample_card()
