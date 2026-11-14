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
def walk(w, face):
    bob = -abs(C(w))+0.5; down = armdown(face, {0: 1.15, 2: 0.95, 1: PI/2}[face])
    sN, sF = sides(face, 0.8*S(w), 0.8*S(w+PI))
    return dict(z=bob, legz=bob*0.3, yaw=0.12*S(w), roll=0.07*S(w), legM=-0.5*S(w), legP=-0.5*S(w+PI), liftM=2.5*max(0, C(w)), liftP=2.5*max(0, C(w+PI)),
                sN=sN, sF=sF, bN=down, bF=down, hy=0.07*S(w), hr=0.03*S(w), hp=0.025*C(2*w), top=0.12*S(w-0.6), topz=1.2*S(w-0.6), tail=0.2*S(w+0.8), wing=0.12*S(w*10/9))
M('walk', 8, 9/(2*PI), walk)

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
def grab(w, face):
    """箱から材料をとる・しまう：前かがみで手をのばして、もどす"""
    u = (w/(2*PI)) % 1; k = S(PI*u)
    return dict(lean=0.1+0.3*k, z=-1.5*k, legz=-0.5*k, legM=0.2*k, legP=0.2*k, sN=0.6+0.7*k, sF=0.6+0.7*k, bN=-0.4, bF=-0.4, hp=0.1+0.15*k)
for nm in ('cgrab', 'store', 'smat', 'fetch'): M(nm, 8, 0.6, grab)
def eat(w, face):
    """両手で持って、口もとで食べる（食べ物の絵は、ゲームで手の所にかさねる）"""
    k = max(0, S(w)); return dict(sN=1.95, sF=1.95, bN=-1.05, bF=-1.05, hp=0.12*k, z=-0.3*k, top=0.08*S(w), tail=0.15*S(w))
M('eat', 6, 7/(2*PI), eat)
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
    u = (w/(2*PI)) % 1; v = math.sin(PI/2*u/0.6) if u < 0.6 else 1-(u-0.6)/0.4
    return breathe(dict(sN=0.7+1.2*v, bN=-0.35, tN=0.0, prop='hammer', sF=0.9, bF=-0.6, lean=0.18-0.1*v, hp=0.15), w, 0.5)
for nm in ('build', 'repair', 'craft'): M(nm, 8, 2.6/2, hammer)
def watering(w, face):
    """じょうろをかたむけて、水をやる（水のつぶは、ゲームでじょうろの先から）"""
    return breathe(dict(sN=1.0+0.08*S(w), bN=-0.2, tN=0.55+0.1*S(w), prop='can', sF=0.2, bF=0.0, lean=0.08, hp=0.15), w)
M('water', 8, 2/(2*PI), watering); M('tend', 8, 2/(2*PI), watering)
def drawwater(w, face):
    """水くみ：かがんでバケツをおろし、両手でひき上げる"""
    u = (w/(2*PI)) % 1; k = S(PI*min(1, u/0.5)) if u < 0.5 else 0; up = S(PI*(u-0.5)/0.5) if u >= 0.5 else 0
    return dict(lean=0.35*k+0.05, z=-3*k, legz=-1.5*k, legM=0.4*k, legP=0.4*k, sN=0.7+0.4*k+1.2*up, sF=0.7+0.4*k+1.2*up, bN=-0.55, bF=-0.55, prop='bucket', hp=0.2*k)
M('draw', 8, 1.5, drawwater)
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
    return breathe(dict(sN=2.4, bN=0.35*S(w), tN=0.0, prop='duster', sF=0.2, lean=-0.05, hp=-0.25, hy=0.1*S(w)), w)
M('sweep', 8, 7/(2*PI), sweep)
def fish(w, face):
    """つり：すわって、さおを前へ出し、ときどき小さくひく"""
    p = sit({}, 6.0, 1.3); p.update(sN=1.0+0.08*S(w), bN=-0.3, prop='rod', sF=0.9, bF=-0.7, lean=0.05, hp=0.05)
    return breathe(p, w, 0.5)
M('fish', 8, 1.4/(2*PI), fish)
def carry(w, face):
    """荷物を頭の上にのせて運ぶ"""
    p = walk(w, face); p.update(sN=2.9, sF=2.9, bN=0.35, bF=0.35, yaw=p['yaw']*0.5, roll=p['roll']*0.5, hy=0.0)
    return p
M('carry', 8, 9/(2*PI), carry)
