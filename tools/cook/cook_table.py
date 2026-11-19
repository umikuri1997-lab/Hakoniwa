"""料理の表（js/cook-data.js）を書く道具。
ここで書いた料理の名前・材料・作る所・属性・種類（アイコン）を、実数の表にして書き出す。
数字（おなか・パワー・時間・効果）は、ここで1回だけきめて、ファイルには実数で入る。
python3 tools/cook/cook_table.py
"""
import json, os, sys
T, C, O = 'cooktable', 'campfire', 'oven'
FV = dict(mugi=1, imo=1, tomato=1, berry=1, apple=1, egg=1, milk=1, fish=1, takenoko=1, kinoko=1, komugiko=2,
          unagi=3, ayu=2, koi=2, namazu=3, yumasu=2)
FUN = {'berry', 'apple', 'fish', 'ayu', 'koi', 'yumasu'}
EN = {'tomato', 'takenoko', 'kinoko', 'egg', 'milk'}
WK = {'mugi', 'imo', 'komugiko', 'unagi', 'namazu'}
COL = dict(mugi='#e8c56a', imo='#d9a65a', tomato='#9fd46c', berry='#8a7ae0', apple='#ee6e62', egg='#f6d860', milk='#f8f4ea',
           fish='#a9bccb', takenoko='#dcca8a', kinoko='#cf8a6e', komugiko='#f2e2bc', unagi='#9a6440', ayu='#b9caa8',
           koi='#f29a62', namazu='#9a9a86', yumasu='#f2ac7c')
# いまの17の料理（名前・効果はそのまま。DISH にない物は village.js の FOODS のまま）
OLD = [
 ('soup', ['imo', 'tomato'], [O], 'water', 107.1),
 ('bread', ['komugiko'], [O], 'earth', 84),
 ('yakizakana', ['fish'], [O], 'fire', 42),
 ('yakiimo', ['imo'], [O], 'fire', 35),
 ('marine', ['fish', 'tomato'], [T], 'wood', 42),
 ('kushiyaki', ['fish'], [C], 'fire', 35),
 ('foil', ['fish', 'imo'], [C], 'fire', 63),
 ('fishsoup', ['fish', 'imo'], [O], 'water', 84),
 ('kabayaki', ['unagi'], [O, C], 'fire', 63),
 ('berryjuice', ['berry'], [T], 'water', 42),
 ('applejuice', ['apple'], [T], 'water', 42),
 ('salad', ['tomato'], [T], 'wood', 63),
 ('dango', ['komugiko'], [T], 'earth', 42),
 ('tamasand', ['komugiko', 'egg'], [T], 'earth', 49),
 ('milkshake', ['milk', 'egg'], [T], 'water', 42),
 ('berrymilk', ['milk', 'berry'], [T], 'water', 42),
 ('pancake', ['komugiko', 'egg', 'milk'], [O, C], 'fire', 63),
]
F, W, E, Wd, Ea = 'fire', 'water', 'earth', 'wood', 'earth'
# (名前, 材料, 作る所, 属性, 種類)  種類：bowl cup skewer plate bread cake salad sand dango
NEW = [
 # 1しゅるい
 ('むぎのシリアル', 'mugi', [T], E, 'bowl'), ('やきむぎ', 'mugi', [C], F, 'plate'), ('むぎのおかゆ', 'mugi', [O], W, 'bowl'),
 ('ほくほくいも', 'imo', [C], F, 'plate'),
 ('やきキャベツ', 'tomato', [C], F, 'plate'), ('キャベツのにもの', 'tomato', [O], W, 'bowl'),
 ('ベリージャム', 'berry', [C, O], F, 'bowl'), ('やきりんご', 'apple', [C, O], F, 'plate'),
 ('めだまやき', 'egg', [C, O], F, 'plate'),
 ('つめたいミルク', 'milk', [T], W, 'cup'), ('ホットミルク', 'milk', [C, O], W, 'cup'),
 ('さかなのさしみ', 'fish', [T], Wd, 'plate'),
 ('やきたけのこ', 'takenoko', [C], F, 'plate'), ('たけのこのにもの', 'takenoko', [O], W, 'bowl'),
 ('きのこのくしやき', 'kinoko', [C], F, 'skewer'), ('きのこのスープ', 'kinoko', [O], W, 'bowl'),
 ('ねじりパン', 'komugiko', [C], E, 'bread'),
 # 2しゅるい
 ('いもむぎいため', 'mugi imo', [C], F, 'plate'), ('いもむぎのおかゆ', 'mugi imo', [O], W, 'bowl'),
 ('むぎのサラダ', 'mugi tomato', [T], Wd, 'salad'), ('キャベツのむぎスープ', 'mugi tomato', [C, O], W, 'bowl'),
 ('ベリーシリアル', 'mugi berry', [T], E, 'bowl'), ('ベリーのむぎやき', 'mugi berry', [C, O], E, 'bread'),
 ('りんごシリアル', 'mugi apple', [T], E, 'bowl'), ('りんごのクランブル', 'mugi apple', [C, O], E, 'cake'),
 ('むぎのたまごいため', 'mugi egg', [C, O], F, 'plate'),
 ('ミルクシリアル', 'mugi milk', [T], E, 'bowl'), ('ミルクがゆ', 'mugi milk', [C, O], W, 'bowl'),
 ('さかなのむぎまぶし', 'mugi fish', [C], F, 'plate'), ('さかなのむぎがゆ', 'mugi fish', [O], W, 'bowl'),
 ('たけのこむぎいため', 'mugi takenoko', [C, O], F, 'plate'),
 ('きのこむぎいため', 'mugi kinoko', [C], F, 'plate'), ('きのこのむぎがゆ', 'mugi kinoko', [O], W, 'bowl'),
 ('むぎだんご', 'mugi komugiko', [T], E, 'dango'), ('むぎパン', 'mugi komugiko', [C, O], E, 'bread'),
 ('やさいのくしやき', 'imo tomato', [C], F, 'skewer'),
 ('ベリーいも', 'imo berry', [C, O], F, 'plate'),
 ('いもりんごやき', 'imo apple', [C, O], F, 'plate'),
 ('ポテトオムレツ', 'imo egg', [C, O], F, 'plate'),
 ('いものポタージュ', 'imo milk', [C], W, 'bowl'), ('ポテトグラタン', 'imo milk', [O], F, 'plate'),
 ('いもとたけのこのにもの', 'imo takenoko', [C, O], W, 'bowl'),
 ('きのこいものホイルやき', 'imo kinoko', [C], F, 'plate'), ('きのこいもスープ', 'imo kinoko', [O], W, 'bowl'),
 ('いももち', 'imo komugiko', [C], E, 'cake'), ('いもパン', 'imo komugiko', [O], E, 'bread'),
 ('ベリーサラダ', 'tomato berry', [T], Wd, 'salad'), ('キャベツのベリーに', 'tomato berry', [C, O], W, 'bowl'),
 ('りんごサラダ', 'tomato apple', [T], Wd, 'salad'), ('キャベツのりんごに', 'tomato apple', [C, O], W, 'bowl'),
 ('キャベツのたまごいため', 'tomato egg', [C, O], F, 'plate'),
 ('キャベツのミルクスープ', 'tomato milk', [C, O], W, 'bowl'),
 ('さかなのキャベツむし', 'tomato fish', [C], F, 'plate'), ('さかなとキャベツのスープ', 'tomato fish', [O], W, 'bowl'),
 ('やさいいため', 'tomato takenoko', [C, O], F, 'plate'),
 ('きのことキャベツのいため', 'tomato kinoko', [C], F, 'plate'), ('きのこのやさいスープ', 'tomato kinoko', [O], W, 'bowl'),
 ('やさいサンド', 'tomato komugiko', [T], Wd, 'sand'), ('キャベツのおやき', 'tomato komugiko', [C, O], F, 'cake'),
 ('フルーツジュース', 'berry apple', [T], W, 'cup'), ('フルーツジャム', 'berry apple', [C, O], F, 'bowl'),
 ('ベリーのたまごやき', 'berry egg', [C, O], F, 'plate'),
 ('ホットベリーミルク', 'berry milk', [C, O], W, 'cup'),
 ('さかなのベリーソース', 'berry fish', [C, O], F, 'plate'),
 ('あまずっぱいたけのこ', 'berry takenoko', [C, O], F, 'plate'),
 ('きのこのベリーやき', 'berry kinoko', [C, O], F, 'skewer'),
 ('ベリーだんご', 'berry komugiko', [T], E, 'dango'), ('ベリーのタルト', 'berry komugiko', [C, O], E, 'cake'),
 ('りんごのスフレ', 'apple egg', [C, O], F, 'cake'),
 ('りんごミルク', 'apple milk', [T], W, 'cup'), ('りんごのミルクに', 'apple milk', [C, O], W, 'bowl'),
 ('さかなのりんごやき', 'apple fish', [C, O], F, 'plate'),
 ('たけのこのりんごに', 'apple takenoko', [C, O], W, 'bowl'),
 ('きのことりんごのいため', 'apple kinoko', [C, O], F, 'plate'),
 ('りんごだんご', 'apple komugiko', [T], E, 'dango'), ('アップルパイ', 'apple komugiko', [C, O], E, 'cake'),
 ('ミルクたまごやき', 'egg milk', [C], F, 'plate'), ('プリン', 'egg milk', [O], W, 'cake'),
 ('さかなのたまごやき', 'egg fish', [C, O], F, 'plate'),
 ('たけのこのたまごとじ', 'egg takenoko', [C, O], F, 'bowl'),
 ('きのこオムレツ', 'egg kinoko', [C, O], F, 'plate'),
 ('たまごパン', 'egg komugiko', [O], E, 'bread'), ('たき火クレープ', 'egg komugiko', [C], F, 'cake'),
 ('さかなのミルクに', 'milk fish', [C, O], W, 'bowl'),
 ('たけのこのミルクスープ', 'milk takenoko', [C, O], W, 'bowl'),
 ('きのこのミルクスープ', 'milk kinoko', [C, O], W, 'bowl'),
 ('ミルクだんご', 'milk komugiko', [T], E, 'dango'), ('ミルクパン', 'milk komugiko', [C, O], E, 'bread'),
 ('さかなとたけのこのくしやき', 'fish takenoko', [C], F, 'skewer'), ('たけのこのさかなに', 'fish takenoko', [O], W, 'bowl'),
 ('さかなときのこのくしやき', 'fish kinoko', [C], F, 'skewer'), ('さかなときのこのホイルやき', 'fish kinoko', [O], F, 'plate'),
 ('さかなのフライ', 'fish komugiko', [C, O], F, 'plate'),
 ('やまのくしやき', 'takenoko kinoko', [C], F, 'skewer'), ('やまのにもの', 'takenoko kinoko', [O], W, 'bowl'),
 ('たけのこのおやき', 'takenoko komugiko', [C, O], F, 'cake'),
 ('きのこのおやき', 'kinoko komugiko', [C], F, 'cake'), ('きのこパン', 'kinoko komugiko', [O], E, 'bread'),
 # とくべつな魚
 ('うまき', 'unagi egg', [C, O], F, 'plate'),
 ('ハヤセのしおやき', 'ayu', [C, O], F, 'skewer'),
 ('キンヒレのあまに', 'koi', [C, O], W, 'bowl'),
 ('ヒゲヌシのかばやき', 'namazu', [C, O], F, 'plate'),
 ('ゆうやけマスのくしやき', 'yumasu', [C, O], F, 'skewer'),
 ('ヒゲヌシのフライ', 'namazu komugiko', [C, O], F, 'plate'),
 # 3しゅるい
 ('やさいのシチュー', 'imo tomato milk', [C, O], W, 'bowl'),
 ('さかなのポトフ', 'imo tomato fish', [C, O], W, 'bowl'),
 ('ポテトキッシュ', 'imo egg milk', [O], F, 'cake'),
 ('おこのみやき', 'komugiko tomato egg', [C, O], F, 'cake'),
 ('やさいのたまごサンド', 'komugiko tomato egg', [T], Wd, 'sand'),
 ('ベリーケーキ', 'komugiko berry milk', [O], E, 'cake'),
 ('りんごケーキ', 'komugiko apple egg', [O], E, 'cake'),
 ('さかなのパイ', 'komugiko egg fish', [O], E, 'cake'),
 ('フルーツミルク', 'berry apple milk', [T], W, 'cup'),
 ('フルーツサラダ', 'berry apple tomato', [T], Wd, 'salad'),
 ('やまのやさいいため', 'tomato takenoko kinoko', [C], F, 'plate'),
 ('やまのやさいスープ', 'tomato takenoko kinoko', [O], W, 'bowl'),
 ('さかなのむしやき', 'fish tomato kinoko', [C, O], F, 'plate'),
 ('ベリープリン', 'egg milk berry', [O], W, 'cake'),
 ('りんごプリン', 'egg milk apple', [O], W, 'cake'),
 ('ベリーミルクシリアル', 'mugi milk berry', [T], E, 'bowl'),
 ('りんごミルクシリアル', 'mugi milk apple', [T], E, 'bowl'),
 ('きのこグラタン', 'imo kinoko milk', [O], F, 'plate'),
 ('やさいオムレツ', 'imo egg tomato', [C, O], F, 'plate'),
 ('きのこキッシュ', 'komugiko kinoko egg', [O], F, 'cake'),
 ('うなぎのまぜむぎ', 'unagi mugi egg', [C, O], F, 'bowl'),
]
# おいしくなさそうな料理：名前をかえ、効果はたのしさ－15だけ
BAD = {'さかなのベリーソース': 'むらさきのさかな', 'あまずっぱいたけのこ': 'すっぱいたけのこ', 'きのこのベリーやき': 'むらさききのこ',
       'さかなのりんごやき': 'あまいさかな', 'たけのこのりんごに': 'ぐにゃっとたけのこ', 'きのことりんごのいため': 'べちゃっときのこ',
       'キャベツのベリーに': 'むらさきキャベツに', 'キャベツのりんごに': 'あまったるいキャベツ', 'ベリーのたまごやき': 'むらさきたまごやき'}
BASE = ['mugi', 'imo', 'tomato', 'berry', 'apple', 'egg', 'milk', 'fish', 'takenoko', 'kinoko', 'komugiko']
PT = {1: (2, .9), 2: (3, 1.35), 3: (4, 1.8)}
# 季節の料理：あたたかい料理（火・かまどで作る、うつわ・カップの料理。ジャムなどはのぞく）は冬の寒さ、つめたい料理（調理台で作るカップの料理）は夏の暑さが、
#   時計の6時間（せいれいの時間 540。DAYLEN 1.5）とどかない（season.js の seaWarm・seaTired、r.warmT・r.coolT）
SEAT = 540
NOTWARM = {'ベリージャム', 'フルーツジャム', 'うなぎのまぜむぎ'}
def seasonal(nm, st, typ, ef, fx):
    if typ in ('bowl', 'cup') and st != [T] and nm not in NOTWARM:
        ef['warm'] = SEAT; fx = (fx + '・' if fx else '') + '6時間、冬の寒さがとどかない'
    elif typ == 'cup' and st == [T]:
        ef['cool'] = SEAT; fx = (fx + '・' if fx else '') + '6時間、夏の暑さがとどかない'
    return ef, fx

def eff(ins, st, typ):
    fun = sum(15 for k in ins if k in FUN) + (10 if typ in ('cake', 'cup', 'dango') else 0)
    en = sum(15 for k in ins if k in EN) + (10 if typ == 'bowl' else 0)
    wkn = sum(1 for k in ins if k in WK)
    if st == O:
        if fun >= en: fun += 10
        else: en += 10
    ef, fx = {}, []
    if en: ef['en'] = en; fx.append('つかれ－%d' % en)
    if fun: ef['fun'] = fun; fx.append('たのしさ+%d' % fun)
    if wkn:
        m = 4 if wkn == 1 else 6; h = 4 + 3 * len(ins) + (2 if st == O else 0)
        ef['wk'] = [m, h * 60]; fx.append('%d時間、はたらく速さ+%d' % (h, m))
    return ef, '・'.join(fx)

def main():
    out, seen, ids = [], {}, {}
    for (k, ins, st, el, tm) in OLD:
        for s in st:
            key = '+'.join(sorted(ins)) + '@' + s
            assert key not in seen, key; seen[key] = k
        out.append(dict(id=k, i=sorted(ins), st=st, el=el, time=tm))
    n = 0
    for (nm, ins, st, el, typ) in NEW:
        ins = sorted(ins.split()); n += 1; k = 'ck%d' % n
        for s in st:
            key = '+'.join(ins) + '@' + s
            assert key not in seen, (nm, key); seen[key] = k
        v = sum(FV[x] for x in ins)
        hard = len(ins) + (1 if O in st else 0)
        tm = {1: 35, 2: 49, 3: 63, 4: 77}[min(4, hard)]
        ef, fx = eff(ins, st[0], typ)
        ef, fx = seasonal(nm, st, typ, ef, fx)
        if nm in BAD: nm = BAD.pop(nm); ef, fx = {'fun': -15}, 'たのしさ－15'
        pt, pw = PT[min(3, max(1, (v + 1) // 2))]
        out.append(dict(id=k, i=ins, st=st, el=el, time=tm,
                        f=dict(name=nm, v=v, pt=pt, pw=pw, dish=1, e='ic:' + k, fx=fx, ef=ef, **({'bad': 1} if ef.get('fun', 0) < 0 else {})),
                        ic=[typ] + [COL[x] for x in ins]))
    assert not BAD, BAD
    # 材料1・2しゅるいは、どれも調理台かたき火で作れる
    miss = []
    for a in range(len(BASE)):
        for b in range(a, len(BASE)):
            ins = sorted({BASE[a], BASE[b]})
            if not any(('+'.join(ins) + '@' + s) in seen for s in (T, C)): miss.append(ins)
    if miss: print('たりない', miss); sys.exit(1)
    js = ['/* 料理の表（tools/cook/cook_table.py で書いた。数字は実数）。i：材料（しゅるいごとに1こ）・st：作れる家具・el：作る属性・time：時間（分）・f：料理（FOODS にくわえる）・ic：アイコンの種類と材料の色 */']
    js.append('const COOKD=[' + ',\n'.join(json.dumps(d, ensure_ascii=False, separators=(',', ':')) for d in out) + '];')
    p = os.path.join(os.path.dirname(__file__), '..', '..', 'js', 'cook-table.js')
    open(p, 'w').write('\n'.join(js) + '\n')
    print(len(out), 'の料理', len(seen), 'の組み合わせ')
main()
