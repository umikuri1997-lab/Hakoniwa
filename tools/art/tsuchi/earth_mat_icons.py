"""土のステージの素材のアイコン（仮）：砂岩・いわ草・かれすすき。
もとのアイコン（丸石・あし・がま）の色を、土の谷の色にかえただけの仮の絵（3Dから写す絵は、あとのPR）。
使い方: python3 tools/art/tsuchi/earth_mat_icons.py  → assets/g/<sha1の先10字>.webp を作り、名前を出す（draw-spirits.js の ICONS に書く）"""
import hashlib, io, colorsys, os
from PIL import Image
ROOT = os.path.join(os.path.dirname(__file__), '..', '..', '..')
SRC = {'sagan': ('92b1bb4533', (0.08, 0.42, 1.06)), 'iwakusa': ('1e24c24eb5', (0.24, 0.55, 1.0)), 'susuki': ('4d5984b133', (0.11, 0.40, 1.08))}
def tint(im, h, sm, vm):
    im = im.convert('RGBA'); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if not a: continue
            _, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            rr, gg, bb = colorsys.hsv_to_rgb(h, min(1, max(s, .25) * sm), min(1, v * vm))
            px[x, y] = (round(rr * 255), round(gg * 255), round(bb * 255), a)
    return im
for k, (src, (h, sm, vm)) in SRC.items():
    im = tint(Image.open(os.path.join(ROOT, 'assets/g', src + '.webp')), h, sm, vm)
    buf = io.BytesIO(); im.save(buf, 'WEBP', lossless=True, exact=True); data = buf.getvalue()
    name = hashlib.sha1(data).hexdigest()[:10]
    open(os.path.join(ROOT, 'assets/g', name + '.webp'), 'wb').write(data)
    print(k, 'assets/g/%s.webp' % name)
