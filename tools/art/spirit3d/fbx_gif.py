"""持ち主のモデルで写した動きを、ゲームと同じ目のかさね方（js/draw-spirits.js の eyeq・横向きの目）で GIF にする（たしかめ用。ゲームのファイルは書かない）。
  python3 tools/art/spirit3d/fbx_gif.py <出す .gif> <動き> [--iso]
列：属性（土・水・火・風・木）、行：向き（正面（クォータービューは前ななめ）・横・うしろ）。"""
import io, math, os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import core
from core import ELS, chip
ISOEYEUV = [(-9, -40), (9, -40), (-15, -35), (15, -35)]

def eyes_on(fr, geo, e):
    """1コマの絵（geo のわく）に、目・ほっぺのチップをゲームと同じ場所・ちぢみ方でかさねる"""
    if e[2] == 2: return fr
    out = fr.copy()
    if len(e) > 4:
        for k in range(4):
            q = e[4+k*7:11+k*7]
            if len(q) < 7 or not q[6]: continue
            U = ISOEYEUV[k]; a, b, c, d = q[2:6]
            ox = q[0]-(a*U[0]+c*U[1]); oy = q[1]-(b*U[0]+d*U[1])   # チップの座標（足もと原点）→ 画面
            nm = 'sp:face#n' if k < 2 else 'sp:cheek'
            im, ax, ay = chip(nm); h, w = im.shape[:2]
            for yy in range(h):
                for xx in range(w):
                    if im[yy, xx, 3] == 0: continue
                    u, v = ax+xx+.5, ay+yy+.5
                    if (k % 2 == 0 and u >= 0) or (k % 2 == 1 and u < 0): continue   # 左の目は左半分・右の目は右半分（ゲームの clip）
                    X = a*u+c*v+ox; Y = b*u+d*v+oy
                    px, py = int(np.floor(X-geo[2])), int(np.floor(Y-geo[3]))
                    if 0 <= px < out.width and 0 <= py < out.height: out.putpixel((px, py), tuple(int(t) for t in im[yy, xx]))
    else:
        S = 'S' if e[2] == 1 else ''
        for nm in ('sp:cheek'+S, 'sp:face'+S+'#n'):
            try: im, ax, ay = chip(nm)
            except KeyError: continue
            t = Image.fromarray(im)
            if e[3]: t = t.transpose(Image.FLIP_LEFT_RIGHT); ax = -ax-im.shape[1]
            out.alpha_composite(t, (int(round(ax+e[0]-geo[2])), int(round(ay+e[1]-geo[3]))))
    return out

def main():
    dst, name = sys.argv[1], sys.argv[2]
    if '--iso' in sys.argv: core.ISOY = math.pi/4
    import fbx_build
    from motions import MOTIONS
    n = MOTIONS[name]['n']; cols = []
    for el in ELS:
        _, _, raw, geo, eye, _, xr, _ = fbx_build.job((name, el)); sh = Image.open(io.BytesIO(raw)).convert('RGBA'); cw, ch = geo[0], geo[1]
        if xr:   # 3Dの表情の層（ふつうの目 n とほっぺ）を、ゲームと同じにそのままかさねる
            xs = Image.open(io.BytesIO(xr[0])).convert('RGBA'); xw, xh, a0, b0 = xr[1]; NL = len(fbx_build.XL)
            def lay(fr, f, i):
                fr = fr.copy()
                for li in (NL-1, 0): fr.alpha_composite(xs.crop((i*xw, (f*NL+li)*xh, (i+1)*xw, (f*NL+li+1)*xh)), (a0-geo[2], b0-geo[3]))
                return fr
            cols.append([[lay(sh.crop((i*cw, f*ch, (i+1)*cw, (f+1)*ch)), f, i) for i in range(n)] for f in (0, 1, 2)])
        else: cols.append([[eyes_on(sh.crop((i*cw, f*ch, (i+1)*cw, (f+1)*ch)), geo, eye[f][i]) for i in range(n)] for f in (0, 1, 2)])
    W = max(c[0][0].width for c in cols); H = max(c[0][0].height for c in cols); Z = 3; frames = []
    for i in range(n):
        S = Image.new('RGBA', (W*len(ELS), H*3), (200, 220, 180, 255))
        for x, c in enumerate(cols):
            for f in range(3): t = c[f][i]; S.alpha_composite(t, (x*W+(W-t.width)//2, f*H+H-t.height))
        frames.append(S.resize((S.width*Z, S.height*Z), Image.NEAREST).convert('RGB').quantize(255))
    frames[0].save(dst, save_all=True, append_images=frames[1:], duration=110, loop=0)

if __name__ == '__main__':
    main()
