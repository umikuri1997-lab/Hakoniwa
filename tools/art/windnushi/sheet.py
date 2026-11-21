"""風のヌシ様の絵（GPT の H-5）を、1まいのシート（assets/g、ロスレス WebP）にまとめて、js/wind-story.js の WNSPR を書きかえる。

  python3 tools/art/windnushi/sheet.py

とぶ16コマ（fly0〜fly15、100ミリ秒ずつ）・島をささえる姿（support）・顔（face）。
WNSPR.r の名前 → [シートの x, y, はば, 高さ, 基準点からの x, y]（1マス64ドット。ゲームでは半分の大きさで描く）。
マップチップのアトラスに入れないのは、大きいから（ぜんぶで約600万ドット）。風のステージで、ヌシ様が出るときだけ読みこむ。
"""
import hashlib, io, json, os, re
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
SRC = os.path.join(ROOT, 'handoff', 'files', 'H-5')


def main():
    A = json.load(open(os.path.join(SRC, 'anchors.json')))['frames']
    items = []
    for k, a in A.items():
        im = Image.open(os.path.join(SRC, k + '.png')).convert('RGBA')
        b = im.getbbox(); items.append((k.replace('fly_', 'fly').replace('fly0', 'fly') if k.startswith('fly_0') else k.replace('fly_', 'fly'), im.crop(b), b[0] - a['origin_x'], b[1] - a['origin_y']))
    PW = 2048; x = y = sh = 0; pos = {}
    for k, im, ox, oy in sorted(items, key=lambda t: -t[1].height):
        if x + im.width > PW: x = 0; y += sh + 1; sh = 0
        pos[k] = (x, y); x += im.width + 1; sh = max(sh, im.height)
    sheet = Image.new('RGBA', (PW, y + sh), (0, 0, 0, 0)); R = {}
    for k, im, ox, oy in items:
        sheet.paste(im, pos[k]); R[k] = [pos[k][0], pos[k][1], im.width, im.height, ox, oy]
    b = io.BytesIO(); sheet.save(b, 'WEBP', lossless=True, exact=True, quality=100, method=6); data = b.getvalue()
    name = 'assets/g/' + hashlib.sha1(data).hexdigest()[:10] + '.webp'; open(os.path.join(ROOT, name), 'wb').write(data)
    js = os.path.join(ROOT, 'js', 'wind-story.js'); s = open(js, encoding='utf8').read()
    line = 'const WNSPR=' + json.dumps({'src': name, 'ms': 100, 'r': R}, separators=(',', ':')) + ';'
    s, n = re.subn(r'const WNSPR=\{.*?\};', line, s)
    if not n: raise SystemExit('js/wind-story.js に const WNSPR= がない')
    open(js, 'w', encoding='utf8').write(s)
    print(name, sheet.size, len(data))


if __name__ == '__main__':
    main()
