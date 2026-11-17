"""料理のアイコンを GPT にたのむプロンプトを作る（20こずつ。どのプロンプトも1つだけで使える）。
python3 tools/art/cookfood/prompts.py  →  tools/art/cookfood/prompts.md と order.json（シートごとの id のならび）"""
import json, os, re
D = os.path.dirname(os.path.abspath(__file__))
EN = {
 # いまの料理で、まだ絵のない物
 'dango': 'three round pale wheat dumplings on a wooden skewer',
 'tamasand': 'a triangle egg-salad sandwich on a small plate',
 'milkshake': 'a glass of creamy pale yellow milkshake',
 'berrymilk': 'a glass of pink-lavender berry milk with a few berries on top',
 'pancake': 'a stack of three fluffy pancakes with butter on a plate',
 'fsg': 'a strange mystery dish: a bowl of murky grayish-purple mush with odd lumps, a little wisp of steam (looks unappetizing but cute)',
 # 1しゅるい
 'むぎのシリアル': 'a bowl of plain dry wheat flakes cereal',
 'やきむぎ': 'roasted golden wheat grains on a small plate',
 'むぎのおかゆ': 'a bowl of warm creamy wheat porridge',
 'ほくほくいも': 'a whole campfire-roasted potato split open and steaming, slightly charred skin',
 'やきキャベツ': 'a grilled cabbage wedge with char marks on a plate',
 'キャベツのにもの': 'a bowl of soft simmered cabbage in clear broth',
 'ベリージュース': '', 'ベリージャム': 'a small jar-like bowl of glossy purple berry jam',
 'やきりんご': 'a whole baked red apple, soft and glossy, on a plate',
 'めだまやき': 'a sunny-side-up fried egg on a plate',
 'つめたいミルク': 'a glass of cold white milk with condensation',
 'ホットミルク': 'a mug of hot milk with a little steam',
 'さかなのさしみ': 'thin slices of raw white fish sashimi on a plate',
 'やきたけのこ': 'grilled bamboo shoot halves with char marks on a plate',
 'たけのこのにもの': 'a bowl of simmered bamboo shoot pieces in light broth',
 'きのこのくしやき': 'mushrooms grilled on a wooden skewer',
 'きのこのスープ': 'a bowl of mushroom soup with sliced mushrooms',
 'ねじりパン': 'twisted bread dough baked around a stick over a campfire',
 # 2しゅるい
 'いもむぎいため': 'stir-fried potato cubes with wheat grains on a plate',
 'いもむぎのおかゆ': 'a bowl of wheat porridge with potato chunks',
 'むぎのサラダ': 'a bowl of wheat grain salad with shredded cabbage',
 'キャベツのむぎスープ': 'a bowl of cabbage and wheat soup',
 'ベリーシリアル': 'a bowl of wheat flake cereal topped with berries',
 'ベリーのむぎやき': 'a baked berry wheat bar, golden with purple berries',
 'りんごシリアル': 'a bowl of wheat flake cereal with apple slices',
 'りんごのクランブル': 'apple crumble with golden crumb topping in a small dish',
 'むぎのたまごいため': 'scrambled egg mixed with wheat grains on a plate',
 'ミルクシリアル': 'a bowl of wheat flake cereal with milk',
 'ミルクがゆ': 'a bowl of creamy milk porridge',
 'さかなのむぎまぶし': 'a fish fillet coated in wheat grains, pan-fried, on a plate',
 'さかなのむぎがゆ': 'a bowl of wheat porridge with flakes of fish',
 'たけのこむぎいため': 'stir-fried bamboo shoots and wheat grains on a plate',
 'きのこむぎいため': 'stir-fried mushrooms and wheat grains on a plate',
 'きのこのむぎがゆ': 'a bowl of wheat porridge with mushrooms',
 'むぎだんご': 'three wheat dumplings with visible grains on a wooden skewer',
 'むぎパン': 'a rustic whole-wheat loaf of bread',
 'やさいのくしやき': 'potato and cabbage pieces grilled on a wooden skewer',
 'ベリーいも': 'a baked potato topped with berry sauce on a plate',
 'いもりんごやき': 'baked potato and apple slices on a plate',
 'ポテトオムレツ': 'a thick potato omelette wedge on a plate',
 'いものポタージュ': 'a bowl of creamy potato potage',
 'ポテトグラタン': 'potato gratin with golden browned top in a small baking dish',
 'いもとたけのこのにもの': 'a bowl of simmered potato and bamboo shoot',
 'きのこいものホイルやき': 'potato and mushrooms baked in an opened foil packet',
 'きのこいもスープ': 'a bowl of potato and mushroom soup',
 'いももち': 'round flat potato mochi cakes, pan-fried golden, on a plate',
 'いもパン': 'a round soft potato bread roll',
 'ベリーサラダ': 'a bowl of cabbage salad with berries',
 'むらさきキャベツに': 'UNAPPETIZING: a bowl of soggy cabbage stewed in murky purple berry juice',
 'りんごサラダ': 'a bowl of cabbage salad with apple slices',
 'あまったるいキャベツ': 'UNAPPETIZING: a bowl of limp cabbage drowning in sticky syrupy apple sauce',
 'キャベツのたまごいため': 'stir-fried cabbage with scrambled egg on a plate',
 'キャベツのミルクスープ': 'a bowl of creamy cabbage milk soup',
 'さかなのキャベツむし': 'a fish fillet steamed on cabbage leaves on a plate',
 'さかなとキャベツのスープ': 'a bowl of fish and cabbage soup',
 'やさいいため': 'stir-fried cabbage and bamboo shoots on a plate',
 'きのことキャベツのいため': 'stir-fried mushrooms and cabbage on a plate',
 'きのこのやさいスープ': 'a bowl of mushroom and cabbage soup',
 'やさいサンド': 'a triangle sandwich with fresh shredded cabbage',
 'キャベツのおやき': 'a round savory cabbage pancake on a plate',
 'フルーツジュース': 'a glass of mixed apple and berry juice, pinkish red',
 'フルーツジャム': 'a small bowl of red-purple mixed fruit jam',
 'むらさきたまごやき': 'UNAPPETIZING: a rolled omelette stained blotchy purple by berries, on a plate',
 'ホットベリーミルク': 'a mug of warm lavender berry milk with steam',
 'むらさきのさかな': 'UNAPPETIZING: a grilled fish covered in thick purple berry goo, on a plate',
 'すっぱいたけのこ': 'UNAPPETIZING: grilled bamboo shoots smeared with sour purple berry sauce, on a plate',
 'むらさききのこ': 'UNAPPETIZING: mushrooms on a skewer dyed purple with berries',
 'ベリーだんご': 'three pale purple berry dumplings on a wooden skewer',
 'ベリーのタルト': 'a small berry tart with a golden crust',
 'りんごのスフレ': 'a puffy golden apple souffle in a small ramekin',
 'りんごミルク': 'a glass of pale apple milk with an apple slice',
 'りんごのミルクに': 'a bowl of apple pieces simmered in sweet milk',
 'あまいさかな': 'UNAPPETIZING: a fish on a plate with mushy apple slices stuck on it, glazed oddly sweet and sticky',
 'ぐにゃっとたけのこ': 'UNAPPETIZING: a bowl of floppy bamboo shoots in murky apple syrup',
 'べちゃっときのこ': 'UNAPPETIZING: soggy mushrooms and mushy apple stir-fry on a plate',
 'りんごだんご': 'three apple-colored dumplings on a wooden skewer',
 'アップルパイ': 'a slice of apple pie with lattice crust',
 'ミルクたまごやき': 'a fluffy milk omelette on a plate',
 'プリン': 'a custard pudding with caramel top on a small plate',
 'さかなのたまごやき': 'a rolled omelette with fish flakes inside, on a plate',
 'たけのこのたまごとじ': 'a bowl of bamboo shoots with soft egg on top',
 'きのこオムレツ': 'a mushroom omelette on a plate',
 'たまごパン': 'a glossy golden egg bread loaf',
 'たき火クレープ': 'a folded thin crepe on a plate',
 'さかなのミルクに': 'a bowl of fish simmered in white milk sauce',
 'たけのこのミルクスープ': 'a bowl of creamy bamboo shoot soup',
 'きのこのミルクスープ': 'a bowl of creamy mushroom soup',
 'ミルクだんご': 'three white milk dumplings on a wooden skewer',
 'ミルクパン': 'a soft white milk bread loaf',
 'さかなとたけのこのくしやき': 'fish and bamboo shoot pieces grilled on a wooden skewer',
 'たけのこのさかなに': 'a bowl of bamboo shoots simmered with fish',
 'さかなときのこのくしやき': 'fish and mushroom pieces grilled on a wooden skewer',
 'さかなときのこのホイルやき': 'fish and mushrooms baked in an opened foil packet',
 'さかなのフライ': 'crispy breaded fried fish on a plate with a lemon wedge',
 'やまのくしやき': 'bamboo shoot and mushroom pieces grilled on a wooden skewer',
 'やまのにもの': 'a bowl of simmered bamboo shoots and mushrooms',
 'たけのこのおやき': 'a round pan-fried bamboo shoot pancake on a plate',
 'きのこのおやき': 'a round pan-fried mushroom pancake on a plate',
 'きのこパン': 'a round bread roll baked with mushrooms on top',
 'うまき': 'a rolled omelette wrapped around glazed eel, sliced, on a plate',
 'アユのしおやき': 'a whole sweetfish (ayu) salt-grilled on a wooden skewer',
 'コイのあまに': 'a bowl of carp pieces simmered in sweet brown sauce',
 'ナマズのかばやき': 'catfish fillet glazed kabayaki-style on a rectangular plate',
 'ゆうやけマスのくしやき': 'an orange-pink trout grilled whole on a wooden skewer',
 'ナマズのフライ': 'crispy breaded fried catfish pieces on a plate',
 'やさいのシチュー': 'a bowl of creamy vegetable stew with potato and cabbage',
 'さかなのポトフ': 'a bowl of clear pot-au-feu with fish, potato and cabbage',
 'ポテトキッシュ': 'a slice of potato quiche',
 'おこのみやき': 'a round savory okonomiyaki-style cabbage pancake with sauce, on a plate',
 'やさいのたまごサンド': 'a triangle sandwich with egg and cabbage',
 'ベリーケーキ': 'a slice of berry cream cake',
 'りんごケーキ': 'a slice of apple cake',
 'さかなのパイ': 'a small golden fish pie',
 'フルーツミルク': 'a glass of pink fruit milk with apple and berry on top',
 'フルーツサラダ': 'a bowl of fruit salad with apple, berries and cabbage leaves',
 'やまのやさいいため': 'stir-fried cabbage, bamboo shoots and mushrooms on a plate',
 'やまのやさいスープ': 'a bowl of soup with cabbage, bamboo shoots and mushrooms',
 'さかなのむしやき': 'fish steamed with cabbage and mushrooms on a plate',
 'ベリープリン': 'a custard pudding topped with berry sauce',
 'りんごプリン': 'a custard pudding topped with apple pieces',
 'ベリーミルクシリアル': 'a bowl of cereal with milk and berries',
 'りんごミルクシリアル': 'a bowl of cereal with milk and apple slices',
 'きのこグラタン': 'mushroom and potato gratin with golden top in a small baking dish',
 'やさいオムレツ': 'a vegetable omelette with potato and cabbage on a plate',
 'きのこキッシュ': 'a slice of mushroom quiche',
 'うなぎのまぜむぎ': 'a bowl of wheat grains mixed with glazed eel pieces and egg',
}
COMMON = """Create ONE image: a sheet of {n} separate food icons for a cozy village-life game, arranged in a neat grid of {cols} columns and {rows} rows, in reading order (left to right, top to bottom), with generous empty space between items so none touch.
Background: fully transparent (no checkerboard, no floor, no table, no shadow on the background).
View: every dish seen from the same slightly-above front angle (about 45 degrees down), centered in its cell, all at a similar size; dishes, plates, bowls, cups and skewers sit upright and level, not tilted.
Style: soft, clean hand-painted game icon style, like a gentle storybook. pale, light, soft, warm colors; no dark or heavily saturated colors. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black.
Tableware: plain cream-white plates and bowls, simple pale glass cups, light wooden skewers. No text, no labels, no numbers, no letters anywhere.
Items marked UNAPPETIZING must clearly look strange and not tasty (odd color, soggy, messy) but still cute and in the same soft style.
Items, in order:
"""
def main():
    tab = open(os.path.join(D, '..', '..', '..', 'js', 'cook-table.js')).read()
    items = []
    for l in tab.split('\n'):
        l = l[len('const COOKD=['):] if l.startswith('const COOKD=[') else l
        if not l.startswith('{'): continue
        d = json.loads(re.sub(r',$|\];$', '', l))
        if d.get('f'): items.append((d['id'], d['f']['name']))
    todo = [(k, k) for k in ['dango', 'tamasand', 'milkshake', 'berrymilk', 'pancake', 'fsg']] + items
    miss = [nm for k, nm in todo if not EN.get(nm)]
    assert not miss, miss
    out, order = ['# 料理のアイコン（GPT にたのむプロンプト）', '', 'どのプロンプトも、1つだけで使える。もらった絵は、シートの順（order.json）で切りわける。', ''], []
    for i in range(0, len(todo), 20):
        g = todo[i:i + 20]; n = len(g); cols = 5; rr = (n + cols - 1) // cols
        txt = COMMON.format(n=n, cols=cols, rows=rr) + '\n'.join('%d. %s' % (j + 1, EN[nm]) for j, (k, nm) in enumerate(g))
        out += ['## シート %d（%dこ）' % (i // 20 + 1, n), '', '```', txt, '```', '']
        order.append([k for k, nm in g])
    open(os.path.join(D, 'prompts.md'), 'w').write('\n'.join(out))
    json.dump(order, open(os.path.join(D, 'order.json'), 'w'), ensure_ascii=False)
    print(len(todo), 'こ', len(order), 'まい')
main()
