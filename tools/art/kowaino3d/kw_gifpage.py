"""コワイノのモーションの GIF と、見本のページ（GIFのページ、CLAUDE.md）を作る。
  python3 kw_gifpage.py <kowaino_paint.py --sheets のフォルダ> <出力フォルダ>
出力：<出力>/index.html と <出力>/gif/<名前>_<動き>.gif（4倍。待機0.625秒・歩き0.167秒・攻撃とやられは見やすくゆっくり0.3秒）
"""
import sys, os, json, glob, html
from PIL import Image

NAMES = [('basic', 'コカゲ'), ('fast', 'ハヤカゲ'), ('thief', 'カゲドロボウ'), ('brute', 'カタカゲ'), ('breaker', 'カベクダキ'), ('trapper', 'ワナクイ'), ('ash', 'ハイカゲ'),
         ('rockc', 'イワカゲ'), ('armor', 'ヨロイカゲ'), ('shiny', 'ヒカリカゲ'), ('hana', 'ハナカゲ'), ('hoteri', 'ホテリカゲ'), ('ochiba', 'オチバカゲ'), ('yuki', 'ユキカゲ')]
DESC = {
    'basic': ('布の下の手をふりあげて、とびついてひっかく', 'びくっとして、よろけて、その場でくずれる'),
    'fast': ('体をひねってためて、くるっとひとまわりしながら、つめでひっかく', 'くるっとまわって、とばされ、その場でくずれる'),
    'thief': ('ふくろを頭の上へもちあげ、前の地面へたたきつける', 'ふくろをだいて、とびのき、くずれる'),
    'brute': ('両こぶしをふりあげて、たたきつける', '目をまわし、よろけて、くずれる'),
    'breaker': ('ハンマーをふりかぶって、平らな面を地面へたたきつける', 'ハンマーがすべり、よろけて、くずれる'),
    'trapper': ('口をあけて、とびついてかむ', 'ふるえて、とびあがり、べしゃっとつぶれる'),
    'ash': ('両手をふって、灰をまく', '灰をふきだして、くずれ、灰の山になる'),
    'rockc': ('岩のこぶしで、地面をたたく', 'ひざをつき、こぶしが地面に落ちて、くずれる'),
    'armor': ('体をひねって、うく盾をうしろへまわしてためて、ななめ前へふみこみながら、盾をよこからふりぬいてなぐる', 'かぶとが鳴って、よろけ、くずれる'),
    'shiny': ('体をひろげて、光る', 'ちかちかして、まわり、ちぢんでくずれる'),
    'hana': ('まわりの花びらをまわして、とばす', '花びらがちって、しおれて、くずれる'),
    'hoteri': ('のびあがって、つのをひろげ、火の粉をとばす', 'とびあがって、しぼみ、くずれる'),
    'ochiba': ('くるくるまわる', '落ち葉のように、ひらひら地面へくずれる'),
    'yuki': ('うでをふりあげて、つららをたたきつける', 'ふるえて、とけて、地面にひろがる'),
}
MOS = [('idle', '待機'), ('walk', '歩き'), ('atk', '攻撃'), ('hurt', 'やられ'), ('idleB', '待機・うしろななめ'), ('walkB', '歩き・うしろななめ'), ('atkB', '攻撃・うしろななめ'),
       ('steal', '盗む'), ('stealB', '盗む・うしろななめ')]
DUR = {'idle': 625, 'walk': 167, 'atk': 300, 'hurt': 300, 'steal': 400}
K = 4

def gif(png, info, out, ms):
    im = Image.open(png).convert('RGBA'); w, h, n = info['w'], info['h'], info['n']; fr = []
    for i in range(n):
        f = Image.new('RGBA', (w, h), (178, 206, 140, 255)); f.alpha_composite(im.crop((0, i*h, w, (i+1)*h))); fr.append(f.convert('RGB').resize((w*K, h*K), Image.NEAREST))
    fr[0].save(out, save_all=True, append_images=fr[1:], duration=ms, loop=0)

def main(src, out):
    os.makedirs(os.path.join(out, 'gif'), exist_ok=True); secs = []
    for nm, jp in NAMES:
        info = json.load(open(os.path.join(src, 'kg_%s.json' % nm))); figs = []
        for mo, lb in MOS:
            k = 'kg_%s:%s' % (nm, mo)
            if k not in info: continue
            gif(os.path.join(src, k.replace(':', '_')+'.png'), info[k], os.path.join(out, 'gif', '%s_%s.gif' % (nm, mo)), DUR[mo.rstrip('BRL')])
            figs.append('<figure><img src="gif/%s_%s.gif" alt="%s %s" loading="lazy"><figcaption>%s</figcaption></figure>' % (nm, mo, jp, lb, lb))
        a, d = DESC[nm]
        secs.append('<section class="foe" id="%s"><header><h2>%s</h2><dl><div><dt>攻撃</dt><dd>%s</dd></div><div><dt>やられ</dt><dd>%s</dd></div></dl></header><div class="row">%s</div></section>' % (nm, jp, html.escape(a), html.escape(d), ''.join(figs)))
    nav = ''.join('<a href="#%s">%s</a>' % (n, j) for n, j in NAMES)
    page = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'kw_gifpage.html')).read().replace('{{NAV}}', nav).replace('{{SECS}}', ''.join(secs))
    open(os.path.join(out, 'index.html'), 'w').write(page)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
