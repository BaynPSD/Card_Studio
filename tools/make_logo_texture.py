"""Génère logo-outer.webp / logo-inner.webp : le logo éclair en OUTLINE (contour),
aux mêmes positions et mêmes tailles que les poké balls d'origine
(pokeball-outer.webp / pokeball-inner.webp, 1500x1500, grille 2x2),
même épaisseur de trait."""
import os
from collections import deque
from PIL import Image, ImageFilter

HERE = os.path.dirname(__file__)
FOILS = os.path.join(HERE, "..", "img", "foils", "151")
LOGO_SRC = "/mnt/vibefs/uploads/3a7a0ac4-488c-4e17-b847-2d24107adf22/S7Sa8OfD-image.png"


def raw_components(img, thresh, down=4, min_px=150):
    a = img.getchannel("A").point(lambda p: 255 if p > thresh else 0)
    w, h = img.size
    small = a.resize((w // down, h // down), Image.BOX)
    sw, sh = small.size
    px = small.load()
    seen = bytearray(sw * sh)
    comps = []
    for yy in range(sh):
        for xx in range(sw):
            if px[xx, yy] and not seen[yy * sw + xx]:
                seen[yy * sw + xx] = 1
                q = deque([(xx, yy)])
                minx = maxx = xx
                miny = maxy = yy
                n = 0
                while q:
                    x, y = q.popleft()
                    n += 1
                    minx = min(minx, x); maxx = max(maxx, x)
                    miny = min(miny, y); maxy = max(maxy, y)
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < sw and 0 <= ny < sh and px[nx, ny] and not seen[ny * sw + nx]:
                            seen[ny * sw + nx] = 1
                            q.append((nx, ny))
                if n > min_px:
                    comps.append((minx * down, miny * down, (maxx + 1) * down, (maxy + 1) * down))
    return comps


def cluster_balls(comps, img_size):
    """regroupe les arcs par centre de quadrant (grille 2x2) -> 4 bbox de balles."""
    half = img_size[0] // 2
    centers = [(half // 2, half // 2), (half + half // 2, half // 2),
               (half // 2, half + half // 2), (half + half // 2, half + half // 2)]
    groups = {i: [] for i in range(4)}
    for bb in comps:
        cx, cy = (bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2
        i = min(range(4), key=lambda k: (cx - centers[k][0]) ** 2 + (cy - centers[k][1]) ** 2)
        groups[i].append(bb)
    balls = []
    for g in groups.values():
        if g:
            balls.append((min(b[0] for b in g), min(b[1] for b in g),
                          max(b[2] for b in g), max(b[3] for b in g)))
    return balls


def stroke_of(img, bb, thresh):
    """épaisseur de trait: plus grand k tel que MinFilter(2k+1) garde des pixels dans la bbox."""
    a = img.getchannel("A").point(lambda p: 255 if p > thresh else 0).crop(bb)
    for k in range(16, 0, -1):
        if a.filter(ImageFilter.MinFilter(2 * k + 1)).getbbox() is None:
            return k + 1
    return 1


def bolt_filled():
    im = Image.open(LOGO_SRC).convert("L")
    alpha = im.point(lambda p: 255 if p < 140 else 0)
    return alpha.crop(alpha.getbbox())


def outline_of(filled, stroke):
    k = max(1, int(round(stroke)))
    eroded = filled.filter(ImageFilter.MinFilter(2 * k + 1))
    pa = filled.load()
    pe = eroded.load()
    out = Image.new("L", filled.size, 0)
    po = out.load()
    for y in range(filled.size[1]):
        for x in range(filled.size[0]):
            po[x, y] = max(0, min(255, pa[x, y] - pe[x, y]))
    rgba = Image.new("RGBA", filled.size, (255, 255, 255, 0))
    rgba.putalpha(out)
    return rgba


def build(orig_name, out_name, thresh, ref_stroke):
    orig = Image.open(os.path.join(FOILS, orig_name)).convert("RGBA")
    comps = raw_components(orig, thresh)
    balls = cluster_balls(comps, orig.size)
    if len(balls) != 4:
        raise RuntimeError(f"{orig_name}: {len(balls)} balles détectées (attendu 4), comps={comps}")
    print(orig_name, "balls:", balls, "-> stroke", ref_stroke)

    bolt = bolt_filled()
    canvas = Image.new("RGBA", orig.size, (0, 0, 0, 0))
    for bb in balls:
        d = max(bb[2] - bb[0], bb[3] - bb[1])
        cx, cy = (bb[0] + bb[2]) // 2, (bb[1] + bb[3]) // 2
        scaled = bolt.resize((d, d), Image.LANCZOS)
        outline = outline_of(scaled, ref_stroke)
        canvas.alpha_composite(outline, (round(cx - d / 2), round(cy - d / 2)))
    canvas.save(os.path.join(FOILS, out_name), "WEBP", quality=95, method=6)
    print("saved", out_name, canvas.size)


if __name__ == "__main__":
    build("pokeball-outer.webp", "logo-outer.webp", thresh=128, ref_stroke=48)
    build("pokeball-inner.webp", "logo-inner.webp", thresh=30, ref_stroke=22)
