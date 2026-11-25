"""せいれいの動きの一覧（spirit3d）。
1つの動き = M(名前, コマ数, 速さ, ポーズの関数)。
  速さ：数なら「ゲームの t の1秒に何回まわるか」（drawSpiritDot の t）。'ph' なら、ゲームがわたす o.ph（0〜1。遊具のゆれなど）でコマをえらぶ。
  ポーズの関数 f(w, face)：w は 0〜2π（1回の動きの中の場所）、face は向き（0 正面・1 横・2 うしろ）。ポーズの数は rig.py。
数は、ラジアン（うで・足・頭の角度）と、チップのドット（体の高さなど）。"""
import math
from core import NEARSIDE, ABD
S, C = math.sin, math.cos
PI = math.pi
MOTIONS = {}
def M(name, n, rate, f, dirs=(0, 1, 2)):
    MOTIONS[name] = {'n': n, 'rate': rate, 'f': f, 'dirs': dirs}

def armdown(face, th):
    """うでを、画面の中で水平から th の角度に下げるための lift（止まっているときからの差）"""
    return (PI/2-th)-ABD[face] if face != 1 else 0.0
def sides(face, aM, aP):
    """キャラの −x の手の値 aM と +x の手の値 aP → (手前の手の値, 奥の手の値)"""
    return (aP, aM) if NEARSIDE[face] > 0 else (aM, aP)
def sit(p, h=6.0, leg=1.35):
    """地面にすわる：体を下げて、足を前へ"""
    p.update(z=-h, legz=-h, legM=leg, legP=leg); return p
def breathe(p, w, k=1.0):
    p['z'] = p.get('z', 0)+0.4*k*S(w); p['top'] = p.get('top', 0)+0.08*S(w-0.6); p['tail'] = p.get('tail', 0)+0.15*S(w+0.8); p['wing'] = p.get('wing', 0)+0.1*S(w*2); return p

# ---- 歩く ----
# ふつうの歩き方（コンタクト → ダウン → パッシング → アップ）：足をついたすぐあとに体がいちばん下がり、足がすれちがうときにいちばん上がる（1まわりに2回）。
# ついている足は、地面の上をまっすぐうしろへ（すべらない）・うかせた足は、前へふりながら上げる。足の高さは体といっしょに動かさない。
# 足をつく所：−x の足（M）は w=3π/2、+x の足（P）は w=π/2（うで・ひねりは、前からの向きのまま）。
# WSTEP：足先の前後のはば（ドット。1まわりで 4×WSTEP 進む。ゲームの WALKPT はこの数から）・WLIFT：うかせる高さ・WBOB：体の上下（かた方）・WDOWN：足をついてから、いちばん下がるまで
WSTEP, WLIFT, WBOB, WDOWN, WHIP = 6.5, 2.5, 1.5, 0.3, 11.0
def foot(ph):
    """足をつく所からの場所 ph（0〜2π）→ (足のふり角, 上げる高さ)。前半はついて、まっすぐうしろへ・後半はうかせて前へ"""
    ph %= 2*PI
    if ph < PI: y, h = WSTEP*(1-2*ph/PI), 0.0
    else: y, h = -WSTEP*C(ph-PI), WLIFT*S(ph-PI)
    a = math.asin(y/WHIP); return a, h-WHIP*(1-C(a))   # 足をふると足先が上がる分だけ下げて、ついている足を地面からうかせない
WALKST = {   # 属性ごとの歩き方（持ち主がえらんだ案）。足の運び方（WSTEP）と速さは同じ。bob：上下・peak：上がる所のとがり・slow：上下を1歩でなく1まわりに1回（ゆったり）
    #   roll・yaw：体のゆれ・arm：うでのふり・down：うでの下げ方（画面の中で水平からの角度）・top：頭の上の物のゆれ・nod：頭のうなずき
    'base':  dict(bob=2.6, peak=0.6, slow=0, roll=0.05, yaw=0.03, arm=1.0, down=0.95, top=0.18, nod=0.05),
    'earth': dict(bob=1.2, peak=0.0, slow=0, roll=0.08, yaw=0.02, arm=0.6, down=1.1, top=0.10, nod=0.03),   # どっしり・のっしのっし
    'water': dict(bob=0.8, peak=0.0, slow=0, roll=0.02, yaw=0.02, arm=0.45, down=1.15, top=0.08, nod=0.02),  # すーっと なめらか
    'fire':  dict(bob=3.4, peak=1.0, slow=0, roll=0.04, yaw=0.03, arm=1.3, down=0.85, top=0.25, nod=0.06),   # ぴょんぴょん元気
    'wind':  dict(bob=2.2, peak=0.0, slow=1, roll=0.02, yaw=0.02, arm=0.6, down=0.95, top=0.15, nod=0.03),   # ふわふわ軽く
    'wood':  dict(bob=1.6, peak=0.2, slow=0, roll=0.06, yaw=0.03, arm=0.7, down=1.05, top=0.30, nod=0.04),   # のんびり・よたよた・頭の葉をゆらす
}
def walk_el(st):
    def f(w, face):
        # 体はついた足のほうへ少しゆれ、頭は体と反対にもどして前を向いたまま（持ち主：頭をふりすぎない・胸をそらせない）
        ph = 2*(w-PI/2-WDOWN)
        bob = -st['bob']*C(w-PI/2) if st['slow'] else -st['bob']*C(ph)+st['peak']*max(0.0, -C(ph))
        down = armdown(face, {0: st['down'], 2: st['down']-0.15, 1: PI/2}[face])
        sN, sF = sides(face, st['arm']*S(w), st['arm']*S(w+PI)); lM, hM = foot(w-3*PI/2); lP, hP = foot(w-PI/2)
        return dict(z=bob, legM=lM, legP=lP, liftM=hM, liftP=hP, yaw=st['yaw']*S(w), roll=st['roll']*S(w),
                    sN=sN, sF=sF, bN=down, bF=down, hy=-0.7*st['yaw']*S(w), hr=-0.9*st['roll']*S(w), hp=st['nod']*C(2*w), top=st['top']*S(w-0.6), tail=0.2*S(w+0.8), wing=0.12*S(w*10/9))
    return f
walk = walk_el(WALKST['base'])
WALKEL = {el: walk_el(WALKST[el]) for el in ('earth', 'water', 'fire', 'wind', 'wood')}   # 持ち主のモデルで写すとき（fbx_build）、属性ごとにこちらを使う
M('walk', 8, 9/(2*PI), walk)
# ---- 立つ（クォータービューの絵で、3Dの絵のない立ち姿のかわり。js の spMotion） ----
M('stand', 4, 0.5, lambda w, face: breathe({}, w))

# ---- 遊び家具 ----
def sandbox(w, face):
    """すわって、シャベルで砂をすくい、バケツへ入れる"""
    p = sit({}, 6.0); u = (w/(2*PI)) % 1
    if u < 0.45: k = u/0.45; sN, tN = 0.35+0.25*S(PI*k), -0.4*k                   # 砂にさしこんで、すくう
    elif u < 0.7: k = (u-0.45)/0.25; sN, tN = 0.6+0.9*k, -0.4+0.2*k               # もち上げる
    else: k = (u-0.7)/0.3; sN, tN = 1.5-1.15*k, -0.2+1.2*S(PI*k)                  # バケツへあける
    p.update(lean=0.22, hp=0.12, sN=sN, tN=tN, bN=-0.3, sF=0.55, bF=-0.45, prop='shovel', propF='bucket', hy=0.05*S(w))
    return breathe(p, w, 0.5)
M('play_sandbox', 10, 0.55, sandbox)

def swing(w, face):
    """ブランコ：すわって、つなをにぎり、ゆれに合わせて足をこぐ（ph はブランコのゆれ）"""
    d = S(w); p = sit({}, 5.0, 1.15+0.5*d)
    p.update(lean=-0.12*d, sN=2.55, sF=2.55, bN=-0.55, bF=-0.55, hp=-0.05*d, top=-0.15*d, tail=0.2*d, wing=0.1*d)
    return p
M('play_swing', 8, 'ph', swing)

def seesaw(w, face):
    """シーソー：すわって、前の持ち手をにぎり、はずむ"""
    d = S(w); p = sit({}, 5.0, 1.2)
    p.update(z=-5.0+1.2*max(0, d), lean=0.08+0.06*d, sN=1.2, sF=1.2, bN=-0.6, bF=-0.6, hp=-0.06*d, top=0.15*d, tail=0.2*d, wing=0.15*d)
    return p
M('play_seesaw', 8, 'ph', seesaw)

def slide(w, face):
    """すべり台：のぼる（〜.35）・上をわたる（〜.42）・すべる（〜.7）・下からもどる（ph はすべり台の進みぐあい）"""
    u = (w/(2*PI)) % 1
    if u < 0.35:
        k = u/0.35*6*2*PI; p = walk(k, face); a, b = 2.0+0.4*S(k), 2.0-0.4*S(k); p.update(sN=a, sF=b, bN=-0.4, bF=-0.4, lean=0.15); return p   # 階段：手をのばしてのぼる
    if u < 0.42: return walk((u-0.35)/0.07*2*PI, face)
    if u < 0.7:
        k = (u-0.42)/0.28; p = sit({}, 5.0, 1.45); p.update(sN=2.8, sF=2.8, bN=0.3, bF=0.3, lean=-0.18, hp=-0.15, top=-0.2, tail=-0.3, wing=0.2*S(k*12)); return p   # ばんざいして、すべる
    return walk((u-0.7)/0.3*5*2*PI, face)
M('play_slide', 24, 'ph', slide)

def fountain(w, face):
    """噴水：前かがみで、両手で水をすくって、はねあげる"""
    u = (w/(2*PI)) % 1; k = S(PI*u)
    p = dict(lean=0.18-0.25*k, sN=0.8+1.6*k, sF=0.8+1.6*k, bN=-0.35, bF=-0.35, hp=0.15-0.35*k, z=-1.0+2.0*max(0, k-0.6), legz=0.0, liftM=0, liftP=0)
    return breathe(p, w)
M('play_fountain', 8, 0.7, fountain)

def bathe(w, face):
    """水浴び：こしまで水に入って、すこしひざをまげ、前かがみで両手を水の中へ入れてすくい、上へばしゃっとはねあげて、もどす
    （水面は足もとから、ゲームの BATHEH。水につかる所は、ゲームが切ってかくす）"""
    u = (w/(2*PI)) % 1
    if u < 0.4: k = 0.5-0.5*C(PI*u/0.4); lean, sN, hp = 0.05+0.2*k, 0.9-0.6*k, 0.05+0.13*k         # かがんで、両手を水へ
    elif u < 0.58: k = (u-0.4)/0.18; k = k*k*(3-2*k); lean, sN, hp = 0.25-0.33*k, 0.3+1.4*k, 0.18-0.3*k   # ばしゃっ：前へいっきにはねあげる（手を頭より上にすると、ずきんにかくれる）
    else: k = 0.5-0.5*C(PI*(u-0.58)/0.42); lean, sN, hp = -0.08+0.13*k, 1.7-0.8*k, -0.12+0.17*k    # とんだ しずくを見て、もどす
    p = dict(z=-2.0, legz=-1.0, legM=0.35, legP=0.35, lean=lean, sN=sN, sF=sN, bN=-0.45, bF=-0.45, hp=hp,
             top=0.15*S(w), tail=0.2*S(w+0.8), wing=0.15*S(w*2))
    return p
M('bathe', 8, 0.8, bathe)

def campfire(w, face):
    """たき火：すわって、両手を火にかざし、ときどき手をこする"""
    p = sit({}, 6.0); r = 0.12*S(w*3)
    p.update(lean=0.12, sN=1.35+r, sF=1.35-r, bN=-0.55, bF=-0.55, hp=0.05, hr=0.06*S(w))
    return breathe(p, w)
M('play_campfire', 8, 0.35, campfire)

def flower(w, face):
    """花：しゃがんで、手をうしろに組み、においをかぐ"""
    p = dict(z=-3.0, legz=-1.5, legM=0.5, legP=0.5, lean=0.35+0.05*S(w), hp=0.15+0.1*S(w), sN=-0.55, sF=-0.55, bN=-0.25, bF=-0.25)
    return breathe(p, w)
M('play_flower', 8, 0.3, flower)

def joy(w, face):
    """ばんざいして、ぴょんぴょんはねる（ほかの遊び）"""
    j = max(0.0, S(w))*4.0
    return dict(z=j, legz=j, legM=0.25*S(w), legP=0.25*S(w), sN=2.6+0.2*S(w), sF=2.6+0.2*S(w), bN=0.25, bF=0.25, hp=-0.08, top=-0.15*S(w), tail=0.25*S(w), wing=0.2*S(w*2))
M('play', 8, 7/(2*PI), joy)

# ---- ひとりのしぐさ ----
def qstone(w, face):
    p = sit({}, 6.5, 1.1); u = (w/(2*PI)) % 1; k = S(PI*u)
    p.update(lean=0.3, hp=0.2, sN=0.6+0.5*k, bN=-0.2, sF=0.5, bF=-0.45, prop='pebble' if u < 0.6 else None, hy=0.1*S(w))
    return breathe(p, w, 0.5)
M('qstone', 8, 0.45, qstone)
def qsniff(w, face):
    return breathe(dict(lean=0.3+0.06*S(w), hp=0.2+0.08*S(w), sN=-0.5, sF=-0.5, bN=-0.25, bF=-0.25, z=-0.5), w)
M('qsniff', 8, 2.2/(2*PI), qsniff)
def qlookup(w, face):
    return breathe(dict(lean=-0.12, hp=-0.35+0.05*S(w), hy=0.15*S(w*0.5), sN=2.35, bN=0.5, tN=0.6, sF=0.0), w)
M('qlookup', 8, 0.25, qlookup)
def qpeek(w, face):
    p = dict(z=-4.0, legz=-2.0, legM=0.7, legP=0.7, lean=0.5+0.04*S(w), hp=0.3, sN=0.5, sF=0.5, bN=-0.5, bF=-0.5, hy=0.12*S(w))
    return breathe(p, w, 0.5)
M('qpeek', 8, 0.3, qpeek)
def qwarm(w, face):
    r = 0.15*S(w*2)
    return breathe(dict(lean=0.1, sN=1.4+r, sF=1.4-r, bN=-0.6, bF=-0.6, hp=0.05), w)
M('qwarm', 8, 2/(2*PI), qwarm)
def qbox(w, face):
    u = (w/(2*PI)) % 1; a = max(0, S(2*PI*u*2)) if u < 0.5 else 0; b = max(0, S(2*PI*(u-0.5)*2)) if u >= 0.5 else 0
    return dict(sN=0.9+0.7*a, sF=0.9+0.7*b, bN=-0.7, bF=-0.7, yaw=0.15*(b-a), lean=0.05, z=-0.5, legM=0.2, legP=-0.2, hp=0.05)
M('qbox', 8, 2.2, qbox)
def qrain(w, face):
    j = abs(S(w))*3.5
    return dict(z=j, legz=j, sN=2.7, sF=2.7, bN=0.3, bF=0.3, hp=-0.3, top=-0.2*S(w), tail=0.3*S(w), wing=0.2*S(w*2))
M('qrain', 8, 5/(2*PI)*0.5, qrain)
def qstretch(w, face):
    u = (w/(2*PI)) % 1; k = S(PI*min(1, u/0.7))
    return dict(z=1.5*k, legz=1.0*k, sN=1.0+1.9*k, sF=1.0+1.9*k, bN=0.15*k, bF=0.15*k, lean=-0.12*k, hp=-0.2*k, top=-0.1*k)
M('qstretch', 8, 0.2, qstretch)
def qspin(w, face):
    return dict(spin=w, sN=0.0, sF=0.0, bN=1.0+0.1*S(w*2), bF=1.0+0.1*S(w*2), z=0.8*abs(S(w*2)), top=-0.25, tail=0.35, wing=0.25*S(w*3))
M('qspin', 12, 10/(2*PI)/4, qspin)

# ---- 生き物・たのしみ ----
def point(w, face):
    return breathe(dict(sN=1.55, bN=0.1, sF=0.0, lean=-0.03, hp=-0.08, hy=0.05*S(w)), w)
M('point', 6, 0.3, point)
def crit_fly(w, face):
    """ちょうに、そっと手をのばす（ゆっくり上下に追う）"""
    a = S(w); return breathe(dict(sN=2.0+0.35*a, bN=0.15, sF=0.9, bF=-0.4, lean=-0.08, hp=-0.25-0.12*a, hy=0.15*S(w*0.5), z=0.6*max(0, a)), w)
M('crit_fly', 8, 0.25, crit_fly)
def crit_low(w, face):
    """小鳥・かえる：しゃがんで、ひざに手をおいて、のぞきこむ"""
    p = dict(z=-4.5, legz=-2.5, legM=0.75, legP=0.75, lean=0.4+0.05*S(w), hp=0.25+0.06*S(w*2), hr=0.12*S(w), sN=0.75, sF=0.75, bN=-0.6, bF=-0.6)
    return breathe(p, w, 0.4)
M('crit_bird', 8, 0.25, crit_low); M('crit_frog', 8, 0.25, crit_low)
def chase(w, face):
    """ちょうを追いかけて走る：はずんで、手を前の上へのばす"""
    p = walk(w, face); p.update(z=p['z']+1.5*abs(S(w)), legz=1.0*abs(S(w)), sN=2.3+0.3*S(w), sF=1.5+0.3*S(w+PI), bN=0.1, bF=0.0, lean=0.12, hp=-0.2)
    return p
M('chase', 8, 11/(2*PI), chase)
def sunset(w, face):
    """夕焼け：すわって、うしろに手をつき、体をそらして空を見る"""
    p = sit({}, 6.5, 1.4); p.update(sN=-0.75, sF=-0.75, bN=0.25, bF=0.25, lean=-0.22, hp=-0.25+0.04*S(w), hr=0.05*S(w*0.5))
    return breathe(p, w, 0.6)
M('sunset', 8, 0.15, sunset)
def admire(w, face):
    """新しい物：手を胸の前で組んで、つま先ではずむ"""
    j = 1.2*max(0, S(w*2)); return dict(z=j, legz=j*0.6, sN=1.7, sF=1.7, bN=-0.85, bF=-0.85, hr=0.12*S(w), hp=-0.1, top=0.15*S(w*2), tail=0.25*S(w*2), wing=0.15*S(w*2))
M('admire', 8, 0.5, admire)
def wave(w, face):
    return breathe(dict(sN=0.2, bN=2.4+0.4*S(w), tN=0.3*S(w), sF=0.0, hr=0.06*S(w)), w)
M('wave', 8, 9/(2*PI), wave)
def clap(w, face):
    a = abs(S(w)); return dict(sN=1.35, sF=1.35, bN=-0.95+0.45*a, bF=-0.95+0.45*a, z=0.8*a, legz=0.4*a, hp=-0.05, top=0.1*S(w), tail=0.2*S(w))
M('clap', 8, 8/(2*PI), clap)

# ---- 料理・ごはん ----
def cook(w, face):
    """おたまで、なべをかきまぜる（手前の手がまるく回る）"""
    return breathe(dict(sN=1.15+0.25*S(w), bN=-0.45+0.25*C(w), tN=0.3*C(w), prop='ladle', sF=1.0, bF=-0.75, lean=0.1, hp=0.12, yaw=0.05*S(w)), w)
M('cook', 8, 5/(2*PI), cook)
def cookcut(w, face):
    """包丁で、とんとんきざむ"""
    u = (w/(2*PI)) % 1; k = S(PI*u)
    return breathe(dict(sN=1.0+0.35*k, bN=-0.55, tN=-0.2, prop='knife', sF=0.95, bF=-0.85, lean=0.15, hp=0.2), w, 0.5)
M('cookcut', 6, 2.6, cookcut)
def cookprep(w, face):
    """材料をならべる：両手で材料を胸の前に持って見て、前へそっと置く（材料の絵は、ゲームが両手のあいだに）"""
    u = (w/(2*PI)) % 1; k = S(PI*min(1, u/0.6)) if u < 0.6 else 0
    return breathe(dict(sN=1.35-0.45*k, sF=1.35-0.45*k, bN=-0.9, bF=-0.9, lean=0.05+0.2*k, z=-0.8*k, legz=-0.3*k, hp=0.05+0.2*k, hr=0.08*S(PI*max(0, u-0.6)/0.4)), w, 0.5)
M('cookprep', 8, 0.55, cookprep)
def cookmix(w, face):
    """ボウルを奥の手で持ち、あわだて器でくるくるまぜる"""
    return breathe(dict(sN=1.55+0.12*S(w), bN=-1.0+0.12*C(w), prop='whisk', sF=1.1, bF=-1.05, propF='bowl', lean=0.1, hp=0.18, yaw=0.06*S(w), hr=0.05*S(w)), w)
M('cookmix', 8, 7/(2*PI), cookmix)
def cookstir(w, face):
    """台・かまど・たき火に置いたボウル・ピッチャー・こねばちを、あわだて器でくるくるまぜる（ボウルは持たない。奥の手は台にそえる）"""
    return breathe(dict(sN=1.4+0.12*S(w), bN=-1.0+0.12*C(w), prop='whisk', sF=0.95, bF=-0.85, lean=0.18, hp=0.22, yaw=0.06*S(w), hr=0.05*S(w)), w)
M('cookstir', 8, 7/(2*PI), cookstir)
def cookfry(w, face):
    """フライパンを前へ持ち、ゆすって、ひょいっと上へふって中身をかえす（中身の絵は、ゲームがフライパンの上に）"""
    u = (w/(2*PI)) % 1
    if u < 0.3: k = u/0.3; s = 1.0+0.05*S(2*PI*k*2); z = 0.0                        # ゆする
    elif u < 0.42: k = (u-0.3)/0.12; s = 1.0-0.12*S(PI/2*k); z = -0.6*k                 # ため
    elif u < 0.52: k = (u-0.42)/0.1; s = 0.88+0.42*k; z = -0.6+1.4*k                     # ひょいっ
    else: k = (u-0.52)/0.48; s = 1.3-0.3*min(1, k*2); z = 0.8*(1-min(1, k*2))           # もどして待つ
    return breathe(dict(sN=s, bN=-0.55, prop='pan', sF=0.9, bF=-0.8, lean=0.08, z=z, legz=z*0.3, hp=0.12-0.1*max(0, z), top=0.1*z), w, 0.4)
M('cookfry', 10, 0.75, cookfry)
def cookfan(w, face):
    """うちわで、火をぱたぱたあおぐ（少しかがむ）"""
    return breathe(dict(sN=0.95+0.12*S(w), bN=-0.35, tN=0.55*S(w), prop='fan', sF=0.6, bF=-0.5, lean=0.25, z=-1.5, legz=-0.6, legM=0.25, legP=0.25, hp=0.2, top=0.08*S(w)), w, 0.4)
M('cookfan', 8, 9/(2*PI), cookfan)
def cookgrill(w, face):
    """くしを火の上に出して、くるくるまわして焼く（しゃがむ）"""
    p = dict(z=-3.0, legz=-1.5, legM=0.55, legP=0.55, lean=0.2, sN=1.0, bN=-0.5, tN=0.6*S(w), prop='skewer', sF=1.05, bF=-0.75, hp=0.12+0.05*S(w), hr=0.06*S(w*0.5))
    return breathe(p, w, 0.4)
M('cookgrill', 8, 0.5, cookgrill)
def cookplate(w, face):
    """お皿を持って、料理をきれいにもりつける：お皿をのぞきこみ、奥の手でととのえる（料理の絵は、ゲームがお皿の上に）"""
    k = S(w*2)
    return breathe(dict(sN=1.2, bN=-0.6, prop='plate', sF=1.45+0.15*k, bF=-0.95, tF=0.2*k, lean=0.12, hp=0.25, hr=0.07*S(w)), w, 0.5)
M('cookplate', 8, 0.45, cookplate)
def raise_(w, face):
    """できた物をかかげる：両手を顔の横まで上げて、ぴょんとはねる（せいれいは手が短く、上げた手は頭巾にかくれるので、顔の横まで。物の絵は、ゲームが頭の上に）"""
    u = (w/(2*PI)) % 1; j = 3.5*S(PI*min(1, u/0.35)) if u < 0.35 else 0
    return dict(z=j, legz=j, legM=0.15*j/3.5, legP=0.15*j/3.5, sN=2.05, sF=2.05, bN=-0.45, bF=-0.45, hp=-0.15, top=-0.12*j/3.5, tail=0.3*S(w), wing=0.2*S(w*2))
M('raise', 8, 0.7, raise_)
def saw(w, face):
    """のこぎり：奥の手で材料をおさえ、手前の手で前後にひく"""
    return breathe(dict(sN=0.85+0.32*S(w), bN=-0.45, prop='saw', sF=0.75, bF=-0.75, lean=0.18+0.05*S(w), yaw=0.08*S(w), z=-0.8, legz=-0.3, legM=0.2, legP=-0.2, hp=0.18), w, 0.4)
M('saw', 8, 8/(2*PI), saw)
def polish(w, face):
    """しあげ：ぬので、くるくるみがく（奥の手でささえる）"""
    return breathe(dict(sN=0.95+0.14*S(w), bN=-0.55+0.2*C(w), prop='cloth', sF=0.8, bF=-0.7, lean=0.2, hp=0.2, yaw=0.05*C(w), hr=0.05*S(w)), w, 0.4)
M('polish', 8, 6/(2*PI), polish)
def loomweave(w, face):
    """はたおり：両手を胸の横木の上に出し、ひ（シャトル）を手前の手から奥の手へよこにわたして、両手で、おさを手前へ、とんっと引きよせる（ひは、はたおり機の絵の上）"""
    u = (w/(2*PI)) % 1
    if u < 0.55: k = S(PI*u/0.55); sN = 1.25+0.1*k; sF = 1.25-0.1*k; yaw = 0.14*S(2*PI*u/0.55); ln = 0.14; tN = 0.35*k; tF = -0.35*k   # ひを、よこへわたす
    elif u < 0.75: k = (u-0.55)/0.2; sN = sF = 1.25+0.2*k; yaw = 0.0; ln = 0.14+0.08*k; tN = tF = 0.0                                 # おさに手をかけて前へ
    else: k = (u-0.75)/0.25; b = S(PI*min(1, k*2.5)); sN = sF = 1.45-0.35*b; yaw = 0.0; ln = 0.22-0.12*b; tN = tF = 0.0                 # とんっと引きよせる
    return breathe(dict(sN=sN, sF=sF, bN=-0.7, bF=-0.7, tN=tN, tF=tF, lean=ln, yaw=yaw, hp=0.22, hr=0.04*S(w)), w, 0.4)
M('loomweave', 10, 0.6, loomweave)
def millgrind(w, face):
    """粉ひき：両手で石うすの取っ手をにぎり、からだごと前へおしだして、まるくまわす（取っ手は、粉ひき小屋の絵の上）"""
    return breathe(dict(sN=1.2+0.22*S(w), sF=1.2+0.22*S(w), bN=-0.55+0.18*C(w), bF=-0.55+0.18*C(w), lean=0.2+0.1*S(w), yaw=0.1*C(w), z=-0.6-0.4*S(w), legz=-0.3, legM=0.2, legP=-0.2, hp=0.15+0.06*S(w), hr=0.04*C(w)), w, 0.4)
M('millgrind', 8, 0.5, millgrind)
# 作業台（天板の高さ0.32＝せいれいの手の高さ）の上でする、もの作り。作業台のないときは、上の地面の動き（saw・polish・craftprep・craft）
def wbsaw(w, face):
    """のこぎり：天板の上で、奥の手で材料をおさえ、手前の手で前後にひく"""
    return breathe(dict(sN=1.5+0.12*S(w), bN=-0.45, tN=0.6, prop='saw', sF=1.55, bF=-0.7, lean=0.2+0.05*S(w), yaw=0.08*S(w), z=-0.4, legM=0.2, legP=-0.2, hp=0.22), w, 0.4)
M('wbsaw', 8, 8/(2*PI), wbsaw)
def wbpolish(w, face):
    """しあげ：天板の上で、ぬので、くるくるみがく（奥の手でささえる）"""
    return breathe(dict(sN=1.55+0.12*S(w), bN=-0.55+0.2*C(w), prop='cloth', sF=1.5, bF=-0.7, lean=0.2, hp=0.22, yaw=0.05*C(w), hr=0.05*S(w)), w, 0.4)
M('wbpolish', 8, 6/(2*PI), wbpolish)
def hamcurve(u, s0, s1, a0, a1):
    """トンカチ：u 0＝打つ（WBEAT の 0）・〜.15 はねかえる・〜.7 頭の上へふり上げる・〜1 速くふりおろす。
    s うで（前へふる）、a 柄の角度（水平の前から上へ）。手首 k＝s−a で、柄の角度をうでとべつに動かす（打つときは柄がほぼ水平で、頭の面が下）"""
    if u < .15: k = u/.15; s = s0+0.25*S(PI*k); a = a0+0.35*S(PI*k)
    elif u < .7: k = (u-.15)/.55; k = k*k*(3-2*k); s = s0+(s1-s0)*k; a = a0+(a1-a0)*k
    else: k = ((u-.7)/.3)**1.6; s = s1+(s0-s1)*k; a = a1+(a0-a1)*min(1, k*1.15)
    return s, a, s-a
def wbham(w, face):
    """トンカチ：頭の上へふり上げて、天板の上の材料へふりおろす"""
    s, a, k = hamcurve((w/(2*PI)) % 1, 2.0, 2.9, 0.0, 2.6); up = (s-2.0)/0.9   # 打つときは、うで2.0・柄は水平：トンカチの頭が天板の高さ（絵の約24ドット上。持ち主のたのみ「台の上に打つ感じ」）
    return breathe(dict(sN=s, bN=-0.4, tN=0.0, kN=k, prop='hammer', sF=1.5, bF=-0.7, lean=0.22-0.1*up, hp=0.2-0.1*up), w, 0.5)
M('wbham', 8, 2.6/2, wbham)
def wbprep(w, face):
    """材料をならべる：前かがみで、天板の高さへ手をのばして、もどす"""
    u = (w/(2*PI)) % 1; k = S(PI*u)
    return dict(lean=0.1+0.2*k, z=-0.8*k, legz=-0.3*k, legM=0.2*k, legP=0.2*k, sN=0.9+0.65*k, sF=0.9+0.65*k, bN=-0.4, bF=-0.4, hp=0.12+0.1*k)
M('wbprep', 8, 0.6, wbprep)
def grab(w, face):
    """箱から材料をとる・しまう：前かがみで手をのばして、もどす"""
    u = (w/(2*PI)) % 1; k = S(PI*u)
    return dict(lean=0.1+0.3*k, z=-1.5*k, legz=-0.5*k, legM=0.2*k, legP=0.2*k, sN=0.6+0.7*k, sF=0.6+0.7*k, bN=-0.4, bF=-0.4, hp=0.1+0.15*k)
for nm in ('cgrab', 'store', 'smat', 'fetch', 'craftprep'): M(nm, 8, 0.6, grab)
# 箱の高さごとの、とる・しまう（ゲームは、箱の高さで えらぶ：work-fx.js の BOXHI・BOXMID。地面の物は、上の grab）
def storeh(w, face):
    """上から入れる箱（ふちが目より上。せいれいは手が短く、背のびではとどかない）：かがんで、ぴょんととび、両手をふちの上へのばして中へ入れ、おりる"""
    u = (w/(2*PI)) % 1
    if u < 0.25: k = S(PI/2*u/0.25); j = -1.6*k; lz = -0.5*k; a = 1.0-0.3*k; ln = 0.1                       # かがむ
    elif u < 0.6: k = (u-0.25)/0.35; j = -1.6+(9.6*S(PI*k)+1.6*k); lz = j+0.6*S(PI*k); a = 0.7+2.0*S(PI/2*min(1, k*1.8)); ln = 0.1+0.12*S(PI*k)   # ぴょん：ふちの上へ手を入れる
    elif u < 0.8: k = (u-0.6)/0.2; j = -1.2*S(PI*k); lz = -0.4*S(PI*k); a = 2.7-1.7*k; ln = 0.12              # おりる
    else: j = 0.0; lz = 0.0; a = 1.0; ln = 0.1
    return dict(lean=ln, z=j, legz=lz, legM=0.2*max(0, -j)/1.6, legP=0.2*max(0, -j)/1.6, sN=a, sF=a, bN=-0.4, bF=-0.4, hp=0.12, top=-0.06*max(0, j)/8, tail=0.15*S(w))
M('storeh', 8, 0.6, storeh)
def storem(w, face):
    """前から入れる家具（たな・炉・小屋など）：胸の高さへ両手をのばして、中へ入れて、もどす"""
    u = (w/(2*PI)) % 1; k = S(PI*u)
    return dict(lean=0.08+0.15*k, z=-0.3*k, sN=1.0+0.6*k, sF=1.0+0.6*k, bN=-0.45, bF=-0.45, hp=0.1+0.08*k, tail=0.1*S(w))
M('storem', 8, 0.6, storem)
def eat(w, face):
    """両手で持って、口もとで食べる（食べ物の絵は、ゲームで手の所にかさねる）"""
    k = max(0, S(w)); return dict(sN=1.95, sF=1.95, bN=-1.05, bF=-1.05, hp=0.12*k, z=-0.3*k, top=0.08*S(w), tail=0.15*S(w))
M('eat', 6, 7/(2*PI), eat)
# 食べる物ごとの食べ方（ゲームは、食べている物で えらぶ。音は、かじる・のむ所 u=.3 で鳴らす：work-fx.js の WBEAT）
def bite(u, at=0.3):
    """かじる：at で口へよせて、ぱくっ。そのあと、もぐもぐ（小さく2回）"""
    k = math.exp(-((u-at)/0.07)**2); ch = 0.5*abs(S(2*PI*(u-at)*2.5)) if u > at+0.12 else 0
    return k, ch
def eat_drink(w, face):
    """のみもの：両手でコップを口へもちあげ、頭をそらして、ごくっ・ごくっ（のどが2回うごく）"""
    u = (w/(2*PI)) % 1; k = S(PI*min(1, u/0.7)) if u < 0.7 else 0; gk = 0.5*abs(S(2*PI*u*3))*k
    return dict(sN=1.7+0.5*k, sF=1.7+0.5*k, bN=-1.05+0.15*k, bF=-1.05+0.15*k, hp=0.1-0.5*k, lean=-0.12*k, z=0.3*k-0.3*gk, top=-0.1*k, tail=0.1*S(w))
M('eat_drink', 10, 0.45, eat_drink)
def eat_bread(w, face):
    """パン：両手で持って口へもちあげ、顔を前へ出して、がぶっ。そのあと、もぐもぐ（ほっぺごと、上下に大きく）"""
    u = (w/(2*PI)) % 1; k, ch = bite(u)
    return dict(sN=1.55+0.45*k, sF=1.55+0.45*k, bN=-1.05+0.1*k, bF=-1.05+0.1*k, hp=0.12+0.35*k+0.12*ch, lean=0.12*k, z=-0.8*ch, top=0.1*k+0.08*ch, tail=0.12*S(w))
M('eat_bread', 10, 0.55, eat_bread)
def eat_fruit(w, face):
    """くだもの：両手で持って口へ、かりっ。かじったら、もぐもぐ（持ち主のきめ：食べ物は、基本両手で持つ）"""
    u = (w/(2*PI)) % 1; k, ch = bite(u)
    return dict(sN=1.5+0.5*k, sF=1.5+0.5*k, bN=-1.05+0.1*k, bF=-1.05+0.1*k, hp=0.1+0.32*k+0.12*ch, hr=0.04*S(w), lean=0.08*k, z=-0.8*ch, top=0.08*k+0.08*ch, tail=0.12*S(w))
M('eat_fruit', 10, 0.6, eat_fruit)
def eat_meal(w, face):
    """料理：両手で器を持って口もとへよせ、ぱくっ。そのあと、もぐもぐ（持ち主のきめ：食べ物は、基本両手で持つ）"""
    u = (w/(2*PI)) % 1; k, ch = bite(u)
    up = S(PI*min(1, u/0.45)) if u < 0.45 else 0
    return dict(sN=1.4+0.4*up, sF=1.4+0.4*up, bN=-1.0+0.1*up, bF=-1.0+0.1*up, hp=0.15+0.3*k+0.12*ch, lean=0.06+0.08*k, z=-0.8*ch, top=0.08*ch, tail=0.12*S(w))
M('eat_meal', 10, 0.55, eat_meal)
def hold(w, face):
    return breathe(dict(sN=1.3, sF=1.3, bN=-0.9, bF=-0.9, hp=0.08), w)
M('hold', 6, 3/(2*PI), hold)
def pluck(w, face):
    """ベリーをつむ：片手を上げて、つまんで、ひっぱる"""
    u = (w/(2*PI)) % 1; k = S(PI*u)
    return breathe(dict(sN=2.1-0.5*k, bN=0.1, sF=0.7, bF=-0.5, lean=-0.05+0.08*k, hp=-0.25+0.15*k), w, 0.5)
M('pluck', 8, 9/(2*PI)/2, pluck)

# ---- 仕事 ----
def swingdown(prop):
    def f(w, face):
        """道具を頭の上へふり上げて、前へふりおろす"""
        u = (w/(2*PI)) % 1
        if u < 0.6: k = math.sin(PI/2*u/0.6); s = 0.3+2.6*k; ln = -0.12*k                     # ふり上げる
        elif u < 0.78: k = (u-0.6)/0.18; s = 2.9-2.6*k; ln = -0.12+0.4*k                      # ふりおろす
        else: k = (u-0.78)/0.22; s = 0.3; ln = 0.28-0.28*k                                    # とまる
        return dict(sN=s, sF=s, bN=-0.6, bF=-0.6, prop=prop, lean=ln, z=-0.8*max(0, ln)*3, legM=0.15, legP=-0.15, hp=0.1+ln*0.5)
    return f
M('chop', 10, 1.4, swingdown('axe')); M('mine', 10, 1.4, swingdown('pick')); M('till', 10, 1.4, swingdown('hoe'))
def hammer(w, face):
    """トンカチ：頭の上へふり上げて、足もとの物へふりおろす"""
    s, a, k = hamcurve((w/(2*PI)) % 1, 0.55, 2.3, -0.15, 2.5); up = (s-0.55)/1.75
    return breathe(dict(sN=s, bN=-0.35, tN=0.0, kN=k, prop='hammer', sF=0.9, bF=-0.6, lean=0.2-0.12*up, hp=0.15-0.08*up), w, 0.5)
for nm in ('build', 'repair', 'craft'): M(nm, 8, 2.6/2, hammer)
def watering(w, face):
    """じょうろを、となりの畑のマスの上へさし出して、かたむけて水をやる：手前のうでを前へほぼ水平にのばし、からだも前へかがむ（水のつぶは、ゲームでじょうろの先から）"""
    return breathe(dict(sN=1.55+0.08*S(w), bN=-0.2, tN=0.0, prop='can', sF=0.3, bF=-0.1, lean=0.24, legM=0.15, legP=-0.15, hp=0.2), w)
M('water', 8, 2/(2*PI), watering); M('tend', 8, 2/(2*PI), watering)
def drawwater(w, face):
    """水くみ（1回だけ）：かがんでバケツを水へおろし（〜.4）、水に入れて少しまつ（〜.5）、両手でひき上げ（〜.75）、胸の前でかかえてひと息（〜1）。
    ゲームは、くむ行動の進みぐあいでコマをえらぶ（'ph'）。音は、水に入る所（.4）と、水からぬける所（.55）"""
    u = (w/(2*PI)) % 1; e = lambda k: k*k*(3-2*k)
    if u < 0.4: k = e(u/0.4); dn = k; up = 0.0
    elif u < 0.5: dn = 1.0; up = 0.0
    elif u < 0.75: k = e((u-0.5)/0.25); dn = 1-k; up = k
    else: dn = 0.0; up = 1.0
    hold = up*(1-0.15*S(PI*max(0, u-0.75)/0.25))
    return dict(lean=0.4*dn+0.05, z=-3.2*dn, legz=-1.6*dn, legM=0.45*dn, legP=0.45*dn, sN=0.7+0.3*dn+0.65*hold, sF=0.7+0.3*dn+0.65*hold,
                bN=-0.55-0.35*hold, bF=-0.55-0.35*hold, prop='bucket', hp=0.22*dn-0.05*up, top=0.1*S(PI*u))
M('draw', 16, 'ph', drawwater)
def weed(w, face):
    """草むしり：しゃがんで両手でつかみ、うしろへひっぱる"""
    u = (w/(2*PI)) % 1; pull = u/0.6 if u < 0.6 else 1-(u-0.6)/0.4
    p = sit({}, 5.0, 0.9); p.update(lean=0.35-0.45*pull, sN=0.8-0.4*pull, sF=0.8-0.4*pull, bN=-0.5, bF=-0.5, hp=0.25-0.3*pull)
    return p
M('weed', 8, 1.1, weed)
def ground(w, face):
    """しゃがんで、両手で土をさわる（うえる・とる・ひろう）"""
    p = dict(z=-4.5, legz=-2.5, legM=0.75, legP=0.75, lean=0.45, hp=0.25, sN=0.55+0.35*S(w*2), sF=0.55-0.35*S(w*2), bN=-0.45, bF=-0.45)
    return breathe(p, w, 0.4)
for nm in ('plant', 'sow', 'harvest', 'gather', 'pickseed', 'pickdrop', 'forage'): M(nm, 8, 3/(2*PI), ground)
def sweep(w, face):
    return breathe(dict(sN=2.4, bN=0.35*S(w), tN=0.0, prop='duster', kN=1.2, sF=0.2, lean=-0.05, hp=-0.25, hy=0.1*S(w)), w)
M('sweep', 8, 7/(2*PI), sweep)
def fish(w, face):
    """つり：すわって、さおを前へ出し、ときどき小さくひく"""
    p = sit({}, 6.0, 1.3); p.update(sN=1.0+0.08*S(w), kN=0.7, bN=-0.3, prop='rod', sF=0.9, bF=-0.7, lean=0.05, hp=0.05)
    return breathe(p, w, 0.5)
M('fish', 8, 1.4/(2*PI), fish)
def fishpull(w, face):
    """つり：魚がかかって、さおを上へぐいぐい引く（からだをうしろへそらし、手を高く。小きざみにふるえる）"""
    p = sit({}, 6.0, 1.3); p.update(sN=1.9+0.25*S(w), kN=0.9+0.15*S(w), bN=-0.5, prop='rod', sF=1.7+0.25*S(w), bF=-0.9, lean=-0.12+0.04*S(w), hp=-0.08+0.04*S(w*2))
    return p
M('fishpull', 8, 7/(2*PI), fishpull)
def fishcast(w, face):
    """つり：投げる（1回だけ）。すわったまま、さおを頭の上・うしろへふりかぶり（〜.4）、前へふりおろし（〜.6）、つりのかまえにもどる（〜1）。
    ゲームは、投げる時間の進みぐあいでコマをえらぶ（'ph'）。うきが手からはなれるのは .55"""
    u = (w/(2*PI)) % 1; e = lambda k: k*k*(3-2*k); L = lambda a, b, k: a+(b-a)*k
    A = dict(sN=1.0, sF=0.9, kN=0.7, bN=-0.3, bF=-0.7, lean=0.05, hp=0.05)     # かまえ（fish と同じ）
    B = dict(sN=2.0, sF=1.85, kN=1.3, bN=-0.5, bF=-0.9, lean=-0.18, hp=-0.12)  # ふりかぶる（さおを頭の上に立てる）
    C = dict(sN=0.55, sF=0.5, kN=0.9, bN=-0.4, bF=-0.8, lean=0.16, hp=0.14)    # ふりおろした
    if u < 0.4: a, b, k = A, B, e(u/0.4)
    elif u < 0.6: a, b, k = B, C, (u-0.4)/0.2
    else: a, b, k = C, A, e((u-0.6)/0.4)
    p = sit({}, 6.0, 1.3); p.update({x: L(a[x], b[x], k) for x in A}); p['prop'] = 'rod'
    return p
M('fishcast', 12, 'ph', fishcast)
def carry(w, face):
    """荷物を頭の上にのせて運ぶ"""
    p = walk(w, face); p.update(sN=2.9, sF=2.9, bN=0.35, bF=0.35, yaw=p['yaw']*0.5, roll=p['roll']*0.5, hy=0.0)
    return p
M('carry', 8, 9/(2*PI), carry)

# ---- 会話の身ぶり（立ち絵・村の中の、話す子と聞く子） ----
def talk(w, face):
    """話す：手前の手を胸の前で小さく動かし、頭も少しゆれる"""
    return breathe(dict(sN=0.9+0.35*S(w), bN=-0.35+0.15*S(w*2), tN=0.2*S(w), sF=0.25, bF=-0.1, hp=0.03*S(w*2), hr=0.04*S(w)), w, 0.6)
M('talk', 8, 0.6, talk)
def talkjoy(w, face):
    """うれしく話す：両手を上げて、小さくはずむ"""
    j = 1.2*max(0.0, S(w*2))
    return dict(z=j, legz=j*0.6, sN=0.7, sF=0.7, bN=1.75+0.3*S(w*2), bF=1.75-0.3*S(w*2), hp=-0.1, hr=0.06*S(w), top=0.12*S(w*2), tail=0.25*S(w*2), wing=0.15*S(w*2))
M('talkjoy', 8, 0.9, talkjoy)
def talkshock(w, face):
    """おどろく：両手を顔の前に上げて、体をそらす"""
    return dict(sN=1.2, sF=1.2, bN=0.9, bF=0.9, lean=-0.13, hp=-0.12, hr=0.03*S(w*4), z=0.3*S(w*4), top=-0.1)
M('talkshock', 8, 1.0, talkshock)
def talkthink(w, face):
    """考える：手前の手をあごに、奥の手はおなかの前。首をかしげる"""
    return breathe(dict(sN=1.9, bN=-1.0, sF=0.65, bF=-0.65, hr=0.15+0.03*S(w), hp=-0.05, hy=0.08*S(w*0.5)), w, 0.5)
M('talkthink', 8, 0.25, talkthink)
def talksad(w, face):
    """しょんぼり：両手を下で組んで、うつむく"""
    return breathe(dict(sN=0.5, sF=0.5, bN=-0.7, bF=-0.7, hp=0.32, lean=0.07, z=-0.5, top=0.05), w, 0.5)
M('talksad', 8, 0.25, talksad)
def talktilt(w, face):
    """首をかしげる：ほおに指をあてる"""
    return breathe(dict(sN=1.85, bN=-0.85, sF=0.15, hr=0.28+0.03*S(w), hp=-0.04), w, 0.5)
M('talktilt', 8, 0.3, talktilt)
def talkmouth(w, face):
    """くすくす：手を口にあてて、かたをゆらす"""
    k = abs(S(w*3))
    return dict(sN=1.95, bN=-1.05, sF=0.65, bF=-0.65, z=0.5*k, legz=0.2*k, hp=0.1, hr=0.06*S(w*3), top=0.08*S(w*3))
M('talkmouth', 8, 0.5, talkmouth)
def talkchest(w, face):
    """胸に手をあてる：両手を胸に、少しうつむく"""
    return breathe(dict(sN=1.45, sF=1.45, bN=-1.0, bF=-1.0, hp=0.14, hr=0.05*S(w), lean=0.03), w, 0.7)
M('talkchest', 8, 0.3, talkchest)
def talkshy(w, face):
    """もじもじ：手を下で組んで、体を左右にひねる"""
    return dict(sN=0.65, sF=0.65, bN=-0.75, bF=-0.75, yaw=0.16*S(w), hp=0.18, hr=0.08*S(w), legM=0.15*S(w), legP=-0.15*S(w), z=0.3*abs(S(w)), top=0.08*S(w))
M('talkshy', 8, 0.45, talkshy)
def talkproud(w, face):
    """えっへん：手をこしにあてて、むねをはる"""
    return breathe(dict(sN=-0.15, sF=-0.15, bN=0.75, bF=0.75, tN=0.4, tF=0.4, lean=-0.1, hp=-0.16, z=0.4*max(0, S(w))), w, 0.5)
M('talkproud', 8, 0.4, talkproud)
def lnod(w, face):
    """聞いて、うなずく"""
    return breathe(dict(sN=0.3, sF=0.3, bN=-0.3, bF=-0.3, hp=0.2*max(0, S(w)), z=-0.3*max(0, S(w))), w, 0.4)
M('lnod', 8, 0.8, lnod)

# ---- わたす・うけとる ----
def offer2(w, face):
    """両手を前へさしだす"""
    return breathe(dict(sN=1.35, sF=1.35, bN=-0.55, bF=-0.55, lean=0.09, hp=0.06), w, 0.5)
M('offer2', 8, 0.3, offer2)
def receive(w, face):
    """両手でうけとって、むねの前でだく"""
    return breathe(dict(sN=1.55, sF=1.55, bN=-0.95, bF=-0.95, hp=0.1, lean=0.04, hr=0.06*S(w)), w, 0.6)
M('receive', 8, 0.4, receive)

# ---- 花かんむり ----
def weave(w, face):
    """すわって、ひざの上で花をあむ（花かんむりの絵は、ゲームで手のあいだに）"""
    p = sit({}, 6.0, 1.2)
    p.update(sN=0.95+0.15*S(w*2), sF=0.95-0.15*S(w*2), bN=-0.7, bF=-0.7, tN=0.35*S(w*2), tF=-0.35*S(w*2), hp=0.28, lean=0.08, hr=0.05*S(w))
    return breathe(p, w, 0.4)
M('weave', 8, 0.8, weave)
def crownup(w, face):
    """できた花かんむりを、両手で胸の前にもって「見て」と見せ、はずむ（頭巾が大きく、上げた手はかくれるので、胸の前）"""
    j = 0.9*max(0.0, S(w))
    return dict(sN=1.5, sF=1.5, bN=-0.6, bF=-0.6, hp=-0.12, lean=-0.04, z=j, legz=j*0.5, top=0.1*S(w), tail=0.2*S(w))
M('crownup', 8, 0.6, crownup)
def crownput(w, face):
    """前の子の頭に、両手でそっとのせる"""
    return breathe(dict(sN=1.95+0.06*S(w), sF=1.95+0.06*S(w), bN=-0.45, bF=-0.45, lean=0.12, hp=0.12), w, 0.4)
M('crownput', 8, 0.4, crownput)
def crownbow(w, face):
    """頭をさげて、のせてもらう"""
    return breathe(dict(sN=0.55, sF=0.55, bN=-0.7, bF=-0.7, hp=0.4, lean=0.16, z=-0.6), w, 0.4)
M('crownbow', 8, 0.3, crownbow)
def dance(w, face):
    """おどる：左右にステップして、両手をふる"""
    j = 1.4*abs(S(w))
    return dict(x=1.5*S(w), z=j, legz=j*0.7, roll=0.12*S(w), sN=2.0+0.45*S(w), sF=2.0-0.45*S(w), bN=0.6, bF=0.6, liftM=2.0*max(0, S(w)), liftP=2.0*max(0, -S(w)),
                hr=0.1*S(w), top=0.2*S(w), tail=0.3*S(w), wing=0.25*S(w*2))
M('dance', 8, 0.8, dance)

# ---- 2人でふれあう ----
def pinky(w, face):
    """となりの子と、小指をつなぐ：手前の手を前の下へのばし、てれて体をゆらす"""
    return breathe(dict(sN=0.75, bN=-0.15, tN=0.3, sF=0.3, bF=-0.3, hp=0.14, hr=0.07*S(w), yaw=0.08*S(w), z=0.3*abs(S(w))), w, 0.5)
M('pinky', 8, 0.35, pinky)
def squeeze(w, face):
    """つないだ手を、ぎゅっぎゅっと2回にぎる"""
    k = max(0.0, S(w*2))
    return breathe(dict(sN=0.75+0.2*k, bN=-0.15, tN=0.3, sF=0.3, bF=-0.3, hp=0.06-0.06*k, z=0.5*k, legz=0.2*k), w, 0.4)
M('squeeze', 8, 0.5, squeeze)
def yubikiri(w, face):
    """ゆびきり：小指をからめた手を、上下にゆらす"""
    return breathe(dict(sN=1.15+0.3*S(w*2), bN=-0.25, tN=0.4, sF=0.4, bF=-0.4, hp=0.04, z=0.4*abs(S(w*2))), w, 0.4)
M('yubikiri', 8, 0.5, yubikiri)
def leanon(w, face):
    """となりにすわって、かたにもたれる（正面から。左右は絵の反転で）"""
    p = sit({}, 6.0, 1.3); p.update(roll=0.26, hr=0.22, hp=0.08, sN=0.6, sF=0.6, bN=-0.6, bF=-0.6)
    return breathe(p, w, 0.5)
M('leanon', 8, 0.2, leanon)
def sitfront(w, face):
    """となりにすわる（もたれてもらう子）：ひざに手をおいて、少し体をよせる"""
    p = sit({}, 6.0, 1.3); p.update(roll=-0.06, hr=-0.05, sN=0.6, sF=0.6, bN=-0.6, bF=-0.6)
    return breathe(p, w, 0.5)
M('sitfront', 8, 0.2, sitfront)
def liedown(w, face):
    """草の上に、ねころぶ：体ぜんたいをうしろへたおして、あおむけに。手を左右へひろげる"""
    p = dict(lean=-0.9, z=-7.0, legz=-7.0, y=-1.0, hp=-0.7, sN=-0.6, sF=-0.6, bN=1.3, bF=1.3, legM=1.2+0.06*S(w), legP=1.2-0.06*S(w))
    return breathe(p, w, 0.6)
M('liedown', 8, 0.2, liedown)
def yawn(w, face):
    """あくび：うでを外へのばして、頭をうしろへ"""
    u = (w/(2*PI)) % 1; k = S(PI*min(1, u/0.75))
    return dict(sN=0.4+0.4*k, sF=0.4+0.4*k, bN=0.3+1.1*k, bF=0.3+1.1*k, hp=-0.28*k, lean=-0.08*k, z=0.6*k, legz=0.3*k)
M('yawn', 8, 0.5, yawn)
def headpat(w, face):
    """なでる：手前の手を前の上へのばして、ゆっくりなでる"""
    return breathe(dict(sN=1.9+0.12*S(w*2), bN=-0.2+0.15*S(w*2), sF=0.3, bF=-0.3, lean=0.08, hp=-0.12), w, 0.4)
M('headpat', 8, 0.5, headpat)

# ---- なでられる・なでる ----
def petted(w, face):
    """なでられる：正面で、両手を胸の前に。頭を少しさげて、なでる手に合わせて、ゆらゆら（目はゲームが、にっこり）"""
    return dict(sN=1.45, sF=1.45, bN=-1.0, bF=-1.0, hp=0.14+0.03*S(w*2), hr=0.1*S(w), roll=0.06*S(w), yaw=0.04*S(w), z=0.3*abs(S(w)), legz=0.1*abs(S(w)),
                top=0.15*S(w), tail=0.25*S(w), wing=0.15*S(w*2))
M('petted', 8, 0.8, petted)
def anipat(w, face):
    """生き物をなでる：しゃがんで、手前の手を前の下へのばし、ゆっくりなでる"""
    p = dict(z=-4.0, legz=-2.2, legM=0.7, legP=0.7, lean=0.35, hp=0.2+0.03*S(w), sN=1.0+0.12*S(w), bN=-0.25+0.12*S(w), sF=0.55, bF=-0.55, hr=0.06*S(w))
    return breathe(p, w, 0.4)
M('anipat', 8, 0.7, anipat)
# ---- 床で寝る ----
def sleepcurl(w, face):
    """床・地面で寝る：ひざをまげて、手を胸によせ、頭をまるめる（ゲームは絵をよこにたおして、横になって寝る形に）"""
    return breathe(dict(legM=1.15, legP=1.0, legz=-1.0, sN=1.3, sF=1.15, bN=-1.05, bF=-0.95, hp=0.28, lean=0.12, z=0.0), w, 0.7)
M('sleepcurl', 8, 0.25, sleepcurl)

# ---- プレゼント（gift-furn.js の GFMOT）：つつみをあけて、中身によってちがう動き。物の絵はゲームが手にかさねる（WHAND） ----
def gf_open(w, face):
    """つつみを両手で胸の前にかかえ、ひもを引いて、がさごそ"""
    r = 0.18*S(w*2)
    return breathe(dict(sN=1.35+r, sF=1.35-r, bN=-0.85, bF=-0.85, lean=0.08, hp=0.18, hy=0.06*S(w)), w, 0.5)
M('gf_open', 8, 0.9, gf_open)
def gf_unfold(w, face):
    """つつみをひらく（1回だけ。ゲームは、ひらく時間の進みぐあいでコマをえらぶ 'ph'）：むねの前でかかえた両手を、左右へひろげて、つつみ紙をひらく。少しのけぞって、中をのぞく"""
    u = (w/(2*PI)) % 1; k = S(PI/2*min(1, u/0.7))
    return dict(sN=1.35-0.6*k, sF=1.35-0.6*k, bN=-0.85+1.9*k, bF=-0.85+1.9*k, lean=0.08-0.12*k, hp=0.18+0.06*k, z=0.4*k, top=0.1*k)
M('gf_unfold', 8, 'ph', gf_unfold)
def gf_lift(w, face):
    """光にかざす：手前の手を高く上げて、見上げる。少しずつ角度をかえる"""
    return breathe(dict(sN=2.3+0.08*S(w), bN=0.2, tN=0.2*S(w), sF=0.2, bF=-0.3, lean=-0.1, hp=-0.32, hy=0.12*S(w)), w, 0.5)
M('gf_lift', 8, 0.3, gf_lift)
def gf_ear(w, face):
    """耳にあてる：手前の手を顔の横へ。首をかしげて、きく"""
    return breathe(dict(sN=2.0, bN=-1.25, sF=0.3, bF=-0.3, hr=0.16+0.03*S(w), hp=0.05, lean=0.02), w, 0.4)
M('gf_ear', 8, 0.3, gf_ear)
def gf_wave(w, face):
    """ふわっとふる：手前の手を上げ、左右にゆらす。体もいっしょにゆれる"""
    return breathe(dict(sN=1.9+0.35*S(w), bN=0.0, tN=0.4*S(w), sF=0.4, bF=-0.3, yaw=0.1*S(w), roll=0.06*S(w), hp=-0.1, top=0.15*S(w), wing=0.15*S(w*2)), w, 0.6)
M('gf_wave', 8, 0.7, gf_wave)
def gf_sniff(w, face):
    """においをかぐ：両手で顔の前へ。くんくん"""
    k = max(0, S(w*2))
    return breathe(dict(sN=1.7, sF=1.7, bN=-1.15, bF=-1.15, hp=0.16+0.06*k, lean=0.08+0.03*k, z=-0.3*k), w, 0.4)
M('gf_sniff', 8, 0.5, gf_sniff)
def gf_hug(w, face):
    """だきしめる：両手でむねにだいて、左右にゆれる"""
    return breathe(dict(sN=1.5, sF=1.5, bN=-1.1, bF=-1.1, hp=0.14, hr=0.12*S(w), roll=0.08*S(w), lean=0.05, top=0.12*S(w)), w, 0.6)
M('gf_hug', 8, 0.55, gf_hug)
def gf_spin(w, face):
    """地面でまわす：しゃがんで、手前の手で、ひょいっとまわす"""
    u = (w/(2*PI)) % 1; k = S(PI*min(1, u/0.3)) if u < 0.3 else 0
    p = dict(z=-4.0, legz=-2.0, legM=0.7, legP=0.7, lean=0.35, hp=0.32, sN=0.4+0.6*k, bN=-0.3, tN=0.8*k, sF=0.3, bF=-0.4, hy=0.1*S(w))
    return breathe(p, w, 0.4)
M('gf_spin', 8, 0.5, gf_spin)
def gf_read(w, face):
    """読む：両手で胸の前に持って、目を下へ。ときどき、うなずく"""
    return breathe(dict(sN=1.25, sF=1.25, bN=-0.8, bF=-0.8, hp=0.26+0.05*max(0, S(w)), hy=0.08*S(w*0.5), lean=0.06), w, 0.4)
M('gf_read', 8, 0.25, gf_read)
def gf_peek(w, face):
    """のぞきこむ：手前の手で目のまえへ。少し前へのりだす"""
    return breathe(dict(sN=1.95, bN=-1.35, sF=0.5, bF=-0.6, lean=0.1+0.03*S(w), hp=0.02, hy=0.06*S(w)), w, 0.4)
M('gf_peek', 8, 0.3, gf_peek)
def gf_shake(w, face):
    """ふって音をきく：手前の手を耳のよこで、しゃかしゃか。首をかしげる"""
    return breathe(dict(sN=2.15+0.12*S(w*4), bN=-1.0, sF=0.3, bF=-0.3, hr=0.14, hp=0.04, z=0.3*abs(S(w*4))), w, 0.4)
M('gf_shake', 8, 0.5, gf_shake)
def hammock(w, face):
    """はねぶとんのハンモック：あおむけに、もたれて、ゆらゆら（手は頭のうしろ）"""
    p = dict(lean=-0.7, z=-5.0, legz=-5.0, hp=-0.45, sN=2.4, sF=2.4, bN=-1.2, bF=-1.2, legM=1.25, legP=1.25, roll=0.05*S(w), hr=0.05*S(w))
    return breathe(p, w, 0.4)
M('play_g_hammock', 8, 0.3, hammock)
# ---- おくれてついてくる（Frostwind の PIXEL-ART.md「Animation」の考え方。MIT）----
# 体が大きく上下する動き（FOLLOW）は、頭巾の先（topz）としっぽ（tail）が、体よりおくれて動き、とまる所で行きすぎてもどる。
# 頭巾の先・しっぽを、体の高さ z にばねでつながった物として、動きの1まわりをくりかえし計算し、おちついた形の、体とのずれ d を使う。
# FOLW：ばねの速さ（動きの1まわりに何回ゆれるか）・FOLZ：ゆれのとまりやすさ・FOLTOP：頭巾の先の上下（火・水。d の何倍のドット）・FOLTILT：頭巾の先のかたむき（土・木・風。ラジアン）・FOLTAIL：しっぽ（ラジアン）・FOLMAX：ずれの上（ドット）
FOLLOW = ('walk', 'carry', 'play_slide', 'play', 'qrain', 'chase', 'raise', 'storeh', 'draw')
FOLW, FOLZ, FOLTOP, FOLTILT, FOLTAIL, FOLMAX = 1.6, 0.3, 0.9, 0.06, 0.07, 3.0
def _follow(name):
    m = MOTIONS[name]; f0 = m['f']; N = 256; cache = {}
    def lag(face):
        if face in cache: return cache[face]
        zs = [f0(2*PI*i/N, face).get('z', 0.0) for i in range(N)]; w0 = 2*PI*FOLW; dt = 1.0/N; y = zs[0]; v = 0.0; d = [0.0]*N
        for it in range(6):
            for i in range(N):
                a = w0*w0*(zs[i]-y)-2*FOLZ*w0*v; v += a*dt; y += v*dt
                if it == 5: d[i] = max(-FOLMAX, min(FOLMAX, y-zs[i]))
        cache[face] = d; return d
    def f(w, face):
        p = f0(w, face); d = lag(face); i = int(round((w % (2*PI))/(2*PI)*N)) % N
        p['topz'] = p.get('topz', 0.0)+FOLTOP*d[i]; p['top'] = p.get('top', 0.0)+FOLTILT*d[i]; p['tail'] = p.get('tail', 0.0)-FOLTAIL*d[i]; return p
    m['f'] = f
for _n in FOLLOW: _follow(_n)

# ---- 首を先に向ける（Frostwind の attention.js の考え方。MIT）----
# 歩いていて向きがかわるとき、ゲームが HTURNMS のあいだ、前の向きの体のまま、首だけ新しい向きへ向けた絵を出す（draw-spirits.js の spHeadTurn）。
# _hp<k>・_hn<k>（k は 1〜HTSTEP）は hy を ±HTURN×k/HTSTEP。正面では + が画面の右・うしろでは + が画面の左・横では + が手前（こちら）を向く。
# ゲームは画面の1コマごとに1だんずつ出して、首が同じ速さで、なめらかに向く。
HTURN = 0.13
HTSTEP = 6
for _b in ('walk', 'carry'):
    for _i in range(1, HTSTEP+1):
        for _s, _k in ((1, '_hp'), (-1, '_hn')):
            _m = MOTIONS[_b]
            def _f(w, face, f0=_m['f'], s=_s*HTURN*_i/HTSTEP):
                p = f0(w, face); p['hy'] = p.get('hy', 0.0)+s; return p
            M(_b+_k+str(_i), _m['n'], _m['rate'], _f)

# ---- 家具の高さに合わせた作業の動き（持ち主のモデルで写すとき。fbx_motion が IK で うでを まげる） ----
# ikN・ikF：手前の手・奥の手の、手のまん中を置く所（キャラの座標・ドット。足もとが原点・前が +y）。高さは家具の作業面（tools/art/furn3d/items の設計図の高さ × 1マスの高さ51.2ドット）。
# 手前の手はキャラの x が NEARSIDE（正面は +x、横・うしろは −x）。sx(face, a)：手前の手がわに a ドット。
HCOOK, HWB, HLOOM, HMILL = 16.4, 16.4, 20.5, 14.0   # 調理台（天板0.32）・作業台（0.32）・はたおり機（胸の横木0.40）・粉ひき（取っ手、石うす0.21の上）
def sx(face, a): return a*(1 if face == 0 else -1)
def ikcook(w, face):
    """おたまで、かまどのなべをかきまぜる（なべは口の床の上。少し前にかがむ）"""
    return dict(ikN=(sx(face, 4)+2.5*C(w), 12+2.0*S(w), HCOOK+2), ikF=(sx(face, -6), 11, HCOOK+0.5), prop='ladle', kN=1.9, lean=0.06, hp=0.12, yaw=0.04*S(w), top=0.06*S(w))
M('cook', 8, 5/(2*PI), ikcook)
HFIRE = 23.0   # たき火の上のなべのふち（なべの底0.33・高さ0.12、cooktop.py）
def ikcookhi(w, face):
    """たき火の上のなべを、おたまでかきまぜる（なべが高いので、手を高く・おたまは ななめに入れる。奥の手はひざに）"""
    return dict(ikN=(sx(face, 4)+2.5*C(w), 12+2.0*S(w), HFIRE+4), ikF=(sx(face, -6), 9, 14), prop='ladle', kN=1.9, lean=0.0, hp=0.0, yaw=0.04*S(w), top=0.06*S(w))
M('cookhi', 8, 5/(2*PI), ikcookhi)
def ikcookcut(w, face):
    u = (w/(2*PI)) % 1; k = S(PI*u)
    return dict(ikN=(sx(face, 3), 12, HCOOK+1+3.5*k), ikF=(sx(face, -5), 12, HCOOK+0.5), prop='knife', kN=1.25, lean=0.06, hp=0.12)
M('cookcut', 6, 2.6, ikcookcut)
def ikcookprep(w, face):
    u = (w/(2*PI)) % 1; k = S(PI*min(1, u/0.6)) if u < 0.6 else 0
    return dict(ikN=(sx(face, 4), 8+5*k, 15+(HCOOK+1-15)*k), ikF=(sx(face, -4), 8+5*k, 15+(HCOOK+1-15)*k), lean=0.04+0.06*k, hp=0.08+0.08*k)
M('cookprep', 8, 0.55, ikcookprep)
def ikcookmix(w, face):
    return dict(ikN=(sx(face, 2)+1.5*C(w), 11+1.5*S(w), HCOOK+5), ikF=(sx(face, -3), 11, HCOOK+2), prop='whisk', propF='bowl', lean=0.06, hp=0.12, yaw=0.04*S(w))
M('cookmix', 8, 7/(2*PI), ikcookmix)
def ikcookstir(w, face):
    return dict(ikN=(sx(face, 3)+1.5*C(w), 12+1.5*S(w), HCOOK+3), ikF=(sx(face, -6), 11, HCOOK+0.5), prop='whisk', lean=0.06, hp=0.12, yaw=0.04*S(w))
M('cookstir', 8, 7/(2*PI), ikcookstir)
def ikcookplate(w, face):
    k = S(w*2)
    return dict(ikN=(sx(face, 4), 11, HCOOK+1.5), ikF=(sx(face, -2)+1.5*k, 12, HCOOK+3), prop='plate', lean=0.06, hp=0.12)
M('cookplate', 8, 0.45, ikcookplate)
def ikwbsaw(w, face):
    return dict(ikN=(sx(face, 4), 12+3*S(w), HWB+2), ikF=(sx(face, -6), 12, HWB+0.5), prop='saw', lean=0.06, yaw=0.05*S(w), hp=0.12)
M('wbsaw', 8, 8/(2*PI), ikwbsaw)
def ikwbpolish(w, face):
    return dict(ikN=(sx(face, 3)+2.5*C(w), 12+2*S(w), HWB+1), ikF=(sx(face, -6), 11, HWB+0.5), prop='cloth', lean=0.06, hp=0.12, yaw=0.04*C(w))
M('wbpolish', 8, 6/(2*PI), ikwbpolish)
def ikwbprep(w, face):
    u = (w/(2*PI)) % 1; k = S(PI*u)
    return dict(ikN=(sx(face, 4), 8+5*k, 15+(HWB+1-15)*k), ikF=(sx(face, -4), 8+5*k, 15+(HWB+1-15)*k), lean=0.04+0.06*k, hp=0.08+0.08*k)
M('wbprep', 8, 0.6, ikwbprep)
def ikloomweave(w, face):
    u = (w/(2*PI)) % 1
    if u < 0.55: k = S(PI*u/0.55); xa = -4+8*(u/0.55); nN = (sx(face, xa), 12, HLOOM+1); nF = (sx(face, -6), 12, HLOOM+0.5)   # ひを よこへわたす
    elif u < 0.75: k = (u-0.55)/0.2; nN = (sx(face, 4), 12+2*k, HLOOM+1); nF = (sx(face, -4), 12+2*k, HLOOM+1)            # おさに手をかけて前へ
    else: k = S(PI*min(1, (u-0.75)/0.25*2.5)); nN = (sx(face, 4), 14-4*k, HLOOM+1); nF = (sx(face, -4), 14-4*k, HLOOM+1)  # とんっと引きよせる
    return dict(ikN=nN, ikF=nF, lean=0.05, hp=0.1, hr=0.03*S(w))
M('loomweave', 10, 0.6, ikloomweave)
def ikmillgrind(w, face):
    c, s = C(w), S(w)
    return dict(ikN=(sx(face, 2)+3*c, 12+3*s, HMILL), ikF=(sx(face, -2)+3*c, 12+3*s, HMILL), lean=0.1+0.06*s, yaw=0.06*c, z=-0.6-0.4*s, legz=-0.3, hp=0.12)
M('millgrind', 8, 0.5, ikmillgrind)
