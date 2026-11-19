#!/usr/bin/env python3
"""icons32 で作った 32×32 のアイコンを、ゲームに入れる。
もらった絵は src/（a1〜a3：おまもり・専用品・食べ物など、b01〜b10：料理・防具・武器・矢）。
どの絵がどの物かは、tools/art/models/tripo/prompts-icons.md と tools/art/cookfood/order.json の順。
延べ棒・鉱石は、灰色の形1つに、物ごとの色（gear.js の ORE_COL）をのせる（持ち主がきめた）。
ゲームでは、ドットを3つずつにのばした 96×96 の絵を assets/g に入れ、js/draw-spirits.js の ICONS に書く
（そうびは 'g_<id>'、ほかは id）。前の絵のファイルは消す。
  python3 tools/art/icons32/game.py [見本の出力フォルダ]"""
import os, sys, io, re, hashlib
import numpy as np
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); R = os.path.abspath(os.path.join(D, '..', '..', '..'))
sys.path.insert(0, D)
import icons32 as I

A_IDS = {  # icons32.SHEETS の名前 → ゲームの id
 'bell_copper': 'g_gc01', 'medal_iron': 'g_gc02', 'necklace': 'g_gc03', 'hairpin_flower': 'g_gc04', 'crystal_pink': 'g_gc05',
 'pouch': 'g_gc06', 'bell_leaf': 'g_gc07', 'flute': 'g_gc08', 'ring_copper': 'g_gc09', 'bracelet': 'g_gc10', 'drop_purple': 'g_gc11',
 'pin_flower': 'g_gc12', 'medal_gold': 'g_gc13', 'feather': 'g_gc14', 'scythe': 'g_gt01', 'watering_can': 'g_gt02',
 'shears': 'g_gt03', 'pickaxe_copper': 'g_gt04', 'pickaxe_iron': 'g_gt16', 'pickaxe_silver': 'g_gt17', 'hammer': 'g_gt05',
 'shovel': 'g_gt06', 'pot': 'g_gt07', 'ore_hook': 'g_gt08', 'torch_heart': 'g_gt09', 'bucket': 'g_gt10', 'ladle': 'g_gt11',
 'bottle': 'g_gt12', 'basket': 'g_gt13', 'feather_silver': 'g_gt14', 'scarf': 'g_gt15',
 'acorn': 'donguri', 'egg': 'egg', 'milk': 'milk', 'cotton': 'wool', 'flour': 'komugiko', 'dango': 'dango', 'sandwich': 'tamasand',
 'milkshake': 'milkshake', 'berry_milk': 'berrymilk', 'pancake': 'pancake', 'map_piece': 'mapPc', 'treasure_map': 'tmap',
 'lucky_bag': 'fukuro', 'letter': 'letter'}
ck = lambda a, b: ['ck%d' % i for i in range(a, b + 1)]
B_IDS = {  # b のシート → 上の行から、左からの id
 'b01': ck(1, 18), 'b02': ck(19, 36), 'b03': ck(55, 72), 'b04': ['g_ga%02d' % i for i in range(14, 27)],
 'b05': ['g_gw%02d' % i for i in range(19, 37)], 'b06': ['g_gar%02d' % i for i in range(1, 14)],
 'b07': ck(37, 54), 'b08': ck(73, 90), 'b09': ck(91, 108), 'b10': ck(109, 125)}
ORE_COL = {'copper': '#e0a07a', 'iron': '#bcc4cc', 'obsidian': '#8f86a8', 'silver': '#e4eaf0', 'gold': '#f2d47a', 'crystal': '#f3a6ac', 'sulfur': '#ecdf86'}
GEAR_ORES = ['copper', 'iron', 'obsidian', 'silver', 'gold', 'sulfur', 'crystal']
INGOTS = ['copper', 'iron', 'silver', 'gold']

def tint(im, col):
    """灰色の絵に色をのせる：明るさのまん中が col になるように、明るさのわりあいをかける"""
    a = np.asarray(im).astype(float); m = a[..., 3] > 0
    L = a[..., :3] @ (.3, .59, .11); mid = np.median(L[m])
    c = np.array([int(col[i:i + 2], 16) for i in (1, 3, 5)], float)
    o = a.copy(); o[..., :3] = np.where(m[..., None], np.clip(c[None, None] * (L / mid)[..., None], 0, 255), a[..., :3])
    return Image.fromarray(o.round().astype(np.uint8), 'RGBA')

def build():
    out = {}
    for (cols, rows, names), p in zip(I.SHEETS, ['a1', 'a2', 'a3']):
        src = I.cutout(Image.open(os.path.join(D, 'src', p + '.webp'))); W, H = src.size; m = np.asarray(src)[..., 3] > 0
        for k, nm in enumerate(names.split()):
            cx, cy = k % cols, k // cols
            x0, x1, y0, y1 = W * cx // cols, W * (cx + 1) // cols, H * cy // rows, H * (cy + 1) // rows
            sub = m[y0:y1, x0:x1]; lab, n = I.label(I.binary_dilation(sub, iterations=8))
            sizes = [(lab == i).sum() for i in range(1, n + 1)]; keep = np.zeros_like(sub)
            for i, s in enumerate(sizes):
                if s >= max(sizes) * .05: keep |= (lab == i + 1)
            ys, xs = np.where(keep & sub)
            im = I.one(src, None, (x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1), nm)
            if nm == 'ingot':
                for o in INGOTS: out['i' + o] = I.quant(tint(im, ORE_COL[o]))
            elif nm == 'ore':
                for o in GEAR_ORES: out[o] = I.quant(tint(im, ORE_COL[o]))
            else: out[A_IDS[nm]] = im
    tmp = os.path.join(D, '_tmp_b'); I.auto(tmp, 's', [os.path.join(D, 'src', p + '.webp') for p in sorted(B_IDS)])
    for si, p in enumerate(sorted(B_IDS), 1):
        for k, key in enumerate(B_IDS[p], 1):
            out[key] = Image.open(os.path.join(tmp, 's%d_%02d.png' % (si, k))).copy()
    import shutil; shutil.rmtree(tmp)
    return out

def put(made):
    js = os.path.join(R, 'js', 'draw-spirits.js'); s = open(js, encoding='utf-8').read()
    for key, im in made.items():
        im = im.resize((96, 96), Image.NEAREST); b = io.BytesIO(); im.save(b, 'WEBP', lossless=True, exact=True); data = b.getvalue()
        name = 'assets/g/' + hashlib.sha1(data).hexdigest()[:10] + '.webp'; open(os.path.join(R, name), 'wb').write(data)
        m = re.search(r"""([{,]\s*)"?%s"?\s*:\s*['"](assets/g/[0-9a-f]+\.webp)['"]""" % re.escape(key), s)
        if m:
            old = m.group(2); s = s[:m.start()] + m.group(1) + "%s:'%s'" % (key, name) + s[m.end():]
            if old != name and os.path.exists(os.path.join(R, old)) and old not in s: os.remove(os.path.join(R, old))
        else: s = s.replace("const ICONS={", "const ICONS={%s:'%s'," % (key, name), 1)
    open(js, 'w', encoding='utf-8').write(s)

if __name__ == '__main__':
    made = build(); print(len(made), 'こ')
    if len(sys.argv) > 1:
        os.makedirs(sys.argv[1], exist_ok=True); I.sheet(sys.argv[1], sorted(made.items()))
    put(made)
