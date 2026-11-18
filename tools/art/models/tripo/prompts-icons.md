# アイコンの絵（GPT）→ トリポのプロンプト（コードで描いたアイコンを3Dにする）

いまコードで描いているアイコン（どんぐり・たまごなど・そうび・まだ絵のない料理）を、3Dから写したアイコンにするための、絵のプロンプト。
1まいずつ GPT で絵を作り、その1まいをトリポで1つのモデルにして、`tripo_split.py` で切りわける。切りわけたら、左上から順に、表のファイル名にする。
どのプロンプトも、それだけで使えるように、共通のこと（見え方・色・輪郭・ノイズなし・背景）をそれぞれに書いてある。
絵はトリポで3Dにするための元なので、ゲームの見おろしの角度ではなく、すこしななめ前から見た形・白い背景にしてある（お手本のキューブはつけない）。
延べ棒・鉱石は形を1つずつだけかき、色はゲームでかえる（持ち主がきめた）。

---

## 1まいめ：食べ物・素材・宝・手紙など（16こ）

ファイル名：`icon_donguri`・`icon_egg`・`icon_milk`・`icon_wool`・`icon_komugiko`・`icon_dango`・`icon_tamasand`・`icon_milkshake`・`icon_berrymilk`・`icon_pancake`・`icon_mappc`・`icon_tmap`・`icon_fukuro`・`icon_letter`・`icon_ingot`・`icon_ore`（.glb）

```
A sheet of sixteen separate item objects for a cozy farming game, arranged in a neat grid of 4 columns and 4 rows in one image, with wide empty space between them so that no two objects touch or overlap. Draw all sixteen at about the same size so every shape is clear.
Row 1:
1. One acorn: a smooth rounded light-brown nut with a slightly pointed bottom tip and a lighter grey-brown scaly cap with a short stem.
2. One egg: a smooth oval cream-white egg.
3. A small short round glass milk bottle filled with white milk, with a paper cap tied with string.
4. A soft round ball of white cotton fluff, made of a few puffy rounded lumps.
Row 2:
5. A small cloth sack of flour, tied at the top with string, the open top showing white flour.
6. Three round pale wheat dumplings on one short straight wooden skewer, the skewer horizontal.
7. An egg sandwich cut in a triangle, soft white bread with a thick yellow egg filling.
8. A tall glass of pale cream milkshake with a dome of whipped cream and a straw.
9. A tall glass of pale lavender berry milk with two round blueberries on top.
10. A stack of three thick round pancakes with a small square of butter on top, on a round white plate.
Row 3:
11. A single torn piece of old paper map, lying flat, pale parchment with a few simple drawn path lines, torn uneven edges.
12. A whole treasure map lying flat, pale parchment with slightly curled corners, a simple drawn island and a red X mark.
13. A small mysterious drawstring bag, soft lavender cloth tied with a gold cord, with a small pale star patch on the front.
14. A paper envelope lying flat, pale cream, with a small round green leaf-shaped seal on the flap.
Row 4:
15. One metal ingot: a simple trapezoid bar with flat faces and softly rounded edges, in plain light neutral gray (the color will be changed later).
16. One raw ore lump: a rough rounded rock with a few flat facets and two or three small chunky crystal points sticking out, all in plain light neutral gray (the color will be changed later).
Each object: whole, three-quarter front view seen from slightly above (about 20 degrees down), upright and level, perfectly vertical, not tilted, resting on the same invisible flat floor at the same ground level; flat objects lie flat on that floor. Stylized, slightly chunky, clean simple smooth shapes, meant to be turned into one 3D model and then separated. Pale, light, soft colors; no dark or heavily saturated colors, no black. Clean flat colors with soft shading only; no noise, no grain, no speckles, no dithering, no gritty texture, no fine lines, scratches or engraved detail. No thick or dark outlines; if an outline is used, it is a thin line only slightly darker than the color next to it, never black or near-black. Plain pure white background, no shadows, no ground, no table, no props, no steam, no glow effects, no text, no labels, no numbers.
```

---

## 2まいめ：武器 その1（18こ）

ファイル名：`gear_gw01`〜`gear_gw18`（.glb）

```
A sheet of eighteen separate weapon items for a cozy farming game set in a gentle volcano village, arranged in a neat grid of 6 columns and 3 rows in one image, with wide empty space between them so that no two objects touch or overlap. They are cute, toy-like, rounded game items, not realistic or scary. Draw all eighteen at about the same size so every shape is clear. Long items lie flat on the floor, pointing to the right.
Row 1:
1. A straight bamboo staff with clear segment rings.
2. A bamboo spear: a bamboo pole with a slanted sharpened tip.
3. A padded glove with a rounded copper plate over the knuckles.
4. A hammer with a short wooden handle and a big round copper head.
5. A spear with a bamboo shaft and a leaf-shaped iron tip.
6. An axe with a wooden handle and a rounded iron blade.
Row 2:
7. An open folding fan with copper ribs and warm orange paper with a few small spark shapes.
8. A short wooden torch topped with a pale yellow sulfur lump and a small solid stylized flame shape.
9. A short sword with a lavender-gray glassy obsidian blade and an iron guard.
10. A pair of short obsidian daggers lying side by side.
11. A wooden staff topped with a round warm orange-red lava stone with pale cracks.
12. A big curved ivory fang with a leather-wrapped grip.
Row 3:
13. Two short bamboo sticks joined by a short cord.
14. A thin silver rapier with a round hand guard.
15. A silver staff with a round ring on top.
16. A hammer with a wooden handle and a big soft gold head.
17. A sword with a pale rose-pink faceted crystal blade.
18. An iron chain with a round iron weight at one end, lying in a loose curve.
Each object: whole, three-quarter front view seen from slightly above (about 20 degrees down), level, not tilted, resting on the same invisible flat floor at the same ground level. Stylized, slightly chunky, clean simple smooth shapes, meant to be turned into one 3D model and then separated. Pale, light, soft colors; no dark or heavily saturated colors, no black. Clean flat colors with soft shading only; no noise, no grain, no speckles, no dithering, no gritty texture, no fine lines, scratches or engraved detail. No thick or dark outlines; if an outline is used, it is a thin line only slightly darker than the color next to it, never black or near-black. Plain pure white background, no shadows, no ground, no table, no props, no glow effects, no text, no labels, no numbers.
```

---

## 3まいめ：武器 その2（18こ）

ファイル名：`gear_gw19`〜`gear_gw36`（.glb）

```
A sheet of eighteen separate weapon items for a cozy farming game set in a gentle volcano village, arranged in a neat grid of 6 columns and 3 rows in one image, with wide empty space between them so that no two objects touch or overlap. They are cute, toy-like, rounded game items, not realistic or scary. Draw all eighteen at about the same size so every shape is clear. Long items lie flat on the floor, pointing to the right.
Row 1:
1. A thin segmented bamboo whip with a wrapped handle, in a loose curve.
2. A bamboo bow with its string.
3. A small knife with a copper blade and a wooden handle.
4. A V-shaped copper boomerang.
5. A small round copper shield with a short rounded spike in the center.
6. A big iron greatsword with a wide blade.
Row 2:
7. A glove with three curved iron claws.
8. A wooden club with iron bands and round iron studs.
9. A small round clay pot filled with pale yellow sulfur, with a cork lid and a short rope fuse.
10. A spear with a wooden shaft and a lavender-gray glassy obsidian tip.
11. A sickle with a wooden handle and a lavender-gray obsidian blade.
12. A pair of silver short swords lying side by side.
Row 3:
13. A silver bow with its string.
14. A spear with a wooden shaft and a soft gold tip.
15. A padded glove with a rounded soft gold plate over the knuckles.
16. A wooden staff topped with a cluster of pale rose-pink crystals.
17. An axe with a warm orange iron head whose edge is shaped like flames.
18. A sword with a pale gold-white blade fading to soft sunrise orange, and a small sun emblem on the guard.
Each object: whole, three-quarter front view seen from slightly above (about 20 degrees down), level, not tilted, resting on the same invisible flat floor at the same ground level. Stylized, slightly chunky, clean simple smooth shapes, meant to be turned into one 3D model and then separated. Pale, light, soft colors; no dark or heavily saturated colors, no black. Clean flat colors with soft shading only; no noise, no grain, no speckles, no dithering, no gritty texture, no fine lines, scratches or engraved detail. No thick or dark outlines; if an outline is used, it is a thin line only slightly darker than the color next to it, never black or near-black. Plain pure white background, no shadows, no ground, no table, no props, no glow effects, no text, no labels, no numbers.
```

---

## 4まいめ：矢 その1（13こ）

ファイル名：`gear_gar01`〜`gear_gar13`（.glb）

```
A sheet of thirteen separate arrow items for a cozy farming game set in a gentle volcano village, arranged in a neat grid of 1 column and 13 rows in one image (one arrow per row), with wide empty space between them so that no two objects touch or overlap. They are cute, toy-like, rounded game items. Every arrow lies flat on the floor, pointing to the right, with a light wooden shaft and soft white feathers unless said otherwise. Draw them at about the same length.
1. Two bamboo arrows tied together side by side with a cord.
2. An arrow with a copper arrowhead.
3. An arrow with an iron arrowhead.
4. A thick heavy arrow with a big iron arrowhead.
5. An arrow with a bundle of pale yellow sulfur wrapped behind the arrowhead.
6. An arrow with a small folded rope net tied at the tip.
7. An arrow with a lavender-gray glassy obsidian arrowhead.
8. An arrow with a warm orange-red lava stone arrowhead.
9. An arrow with a silver arrowhead.
10. An arrow with a soft gold arrowhead.
11. A long slim arrow with a needle-pointed iron arrowhead.
12. An arrow with a pale rose-pink crystal arrowhead.
13. Three plain arrows bundled together with a cord.
Each object: whole, three-quarter front view seen from slightly above (about 20 degrees down), level, not tilted, resting on the same invisible flat floor at the same ground level. Stylized, slightly chunky, clean simple smooth shapes, meant to be turned into one 3D model and then separated. Pale, light, soft colors; no dark or heavily saturated colors, no black. Clean flat colors with soft shading only; no noise, no grain, no speckles, no dithering, no gritty texture, no fine lines, scratches or engraved detail. No thick or dark outlines; if an outline is used, it is a thin line only slightly darker than the color next to it, never black or near-black. Plain pure white background, no shadows, no ground, no table, no props, no fire, no glow effects, no motion trails, no text, no labels, no numbers.
```

---

## 5まいめ：矢 その2（13こ）

ファイル名：`gear_gar14`〜`gear_gar26`（.glb）

```
A sheet of thirteen separate arrow items for a cozy farming game set in a gentle volcano village, arranged in a neat grid of 1 column and 13 rows in one image (one arrow per row), with wide empty space between them so that no two objects touch or overlap. They are cute, toy-like, rounded game items. Every arrow lies flat on the floor, pointing to the right, with a light wooden shaft and soft white feathers unless said otherwise. Draw them at about the same length unless said otherwise.
1. A short light bamboo arrow with small swept-back feathers.
2. An extra long bamboo arrow.
3. Two copper-tipped arrows tied together side by side with a cord.
4. An arrow with a wide wedge-shaped copper arrowhead.
5. Three iron-tipped arrows bundled together with a cord.
6. A long arrow with a spiral-grooved, drill-like iron arrowhead.
7. A big thick arrow with a large bundle of pale yellow sulfur wrapped behind the arrowhead.
8. A short light arrow with a small lavender-gray obsidian arrowhead.
9. A long arrow with a long narrow lavender-gray obsidian spike arrowhead.
10. A silver arrow with a small star-shaped silver arrowhead.
11. Two gold-tipped arrows tied together side by side with a cord.
12. An arrow whose head splits into three small pale rose-pink crystal points.
13. An arrow with a star-shaped pale gold arrowhead and a short pale blue ribbon tied behind the feathers.
Each object: whole, three-quarter front view seen from slightly above (about 20 degrees down), level, not tilted, resting on the same invisible flat floor at the same ground level. Stylized, slightly chunky, clean simple smooth shapes, meant to be turned into one 3D model and then separated. Pale, light, soft colors; no dark or heavily saturated colors, no black. Clean flat colors with soft shading only; no noise, no grain, no speckles, no dithering, no gritty texture, no fine lines, scratches or engraved detail. No thick or dark outlines; if an outline is used, it is a thin line only slightly darker than the color next to it, never black or near-black. Plain pure white background, no shadows, no ground, no table, no props, no fire, no glow effects, no motion trails, no text, no labels, no numbers.
```

---

## 6まいめ：防具 その1（13こ）

ファイル名：`gear_ga01`〜`gear_ga13`（.glb）

```
A sheet of thirteen separate armor items for a cozy farming game set in a gentle volcano village, arranged in a neat grid of 5 columns and 3 rows in one image (the last row has three), with wide empty space between them so that no two objects touch or overlap. They are cute, toy-like, rounded game items sized for a small round character, not realistic. Draw all thirteen at about the same size so every shape is clear. Nobody is wearing them; body armor and capes stand upright on their own as if on an invisible stand.
Row 1:
1. A chest armor made of light bamboo slats laced together with cord.
2. A short cape woven from pale green grass.
3. A rounded copper breastplate.
4. A rounded copper armor with a few short rounded spikes.
5. A round iron shield, standing upright.
Row 2:
6. A round iron helmet.
7. A plate armor of lavender-gray glassy obsidian plates.
8. A short Japanese haori coat in pale cream with a soft green leaf pattern.
9. A light flowing shawl in soft orange fading to pale yellow, draped in a loose curve.
10. A silver mail shirt with a simple pattern of large round rings.
Row 3:
11. A soft gold helmet with a small crest on top.
12. A pale rose-pink faceted crystal shield, standing upright.
13. A wide conical bamboo hat.
Each object: whole, three-quarter front view seen from slightly above (about 20 degrees down), upright and level, perfectly vertical, not tilted, resting on the same invisible flat floor at the same ground level. Stylized, slightly chunky, clean simple smooth shapes, meant to be turned into one 3D model and then separated. Pale, light, soft colors; no dark or heavily saturated colors, no black. Clean flat colors with soft shading only; no noise, no grain, no speckles, no dithering, no gritty texture, no fine lines, scratches or engraved detail. No thick or dark outlines; if an outline is used, it is a thin line only slightly darker than the color next to it, never black or near-black. Plain pure white background, no shadows, no ground, no table, no stands, no mannequins, no props, no glow effects, no text, no labels, no numbers.
```

---

## 7まいめ：防具 その2（13こ）

ファイル名：`gear_ga14`〜`gear_ga26`（.glb）

```
A sheet of thirteen separate armor items for a cozy farming game set in a gentle volcano village, arranged in a neat grid of 5 columns and 3 rows in one image (the last row has three), with wide empty space between them so that no two objects touch or overlap. They are cute, toy-like, rounded game items sized for a small round character, not realistic. Draw all thirteen at about the same size so every shape is clear. Nobody is wearing them; body armor and capes stand upright on their own as if on an invisible stand.
Row 1:
1. A rounded shoulder guard made of light bamboo slats.
2. A round shield woven from bamboo strips like a basket, standing upright.
3. A soft hood made of pale green grass.
4. A copper bracer (forearm guard).
5. A round copper helmet.
Row 2:
6. A rounded iron breastplate.
7. A rounded iron armor with a few short rounded spikes.
8. A pale yellow cape with a small pale yellow crystal clasp.
9. A round lavender-gray obsidian helmet.
10. A tall rectangular lavender-gray obsidian shield, standing upright.
Row 3:
11. A silver-gray cape with a silver clasp.
12. A rounded soft gold plate armor.
13. A rounded armor made of warm orange-red rock plates with a small pale volcano-shaped emblem on the chest.
Each object: whole, three-quarter front view seen from slightly above (about 20 degrees down), upright and level, perfectly vertical, not tilted, resting on the same invisible flat floor at the same ground level. Stylized, slightly chunky, clean simple smooth shapes, meant to be turned into one 3D model and then separated. Pale, light, soft colors; no dark or heavily saturated colors, no black. Clean flat colors with soft shading only; no noise, no grain, no speckles, no dithering, no gritty texture, no fine lines, scratches or engraved detail. No thick or dark outlines; if an outline is used, it is a thin line only slightly darker than the color next to it, never black or near-black. Plain pure white background, no shadows, no ground, no table, no stands, no mannequins, no props, no glow effects, no text, no labels, no numbers.
```

---

## 8まいめ：おまもり（14こ）と専用品 その1（2こ）（16こ）

ファイル名：`gear_gc01`〜`gear_gc14`・`gear_gt01`・`gear_gt02`（.glb）

```
A sheet of sixteen separate small accessory and tool items for a cozy farming game set in a gentle volcano village, arranged in a neat grid of 4 columns and 4 rows in one image, with wide empty space between them so that no two objects touch or overlap. They are cute, toy-like, rounded game items. Draw all sixteen at about the same size so every shape is clear. Charms on cords lie flat on the floor with the cord in a small loop.
Row 1:
1. A round copper bell with a short red cord.
2. A small round iron charm disc on a cord.
3. A silver pendant with an oval pale blue stone on a chain.
4. A soft gold brooch shaped like a flower.
Row 2:
5. A pale rose-pink crystal shard on a cord.
6. A small cloth charm bag with a pale yellow sulfur crystal tied on.
7. A large round cream bell with a soft green leaf pattern and a tassel.
8. A bamboo flute.
Row 3:
9. A simple copper ring, standing upright.
10. A short loop of iron chain with a small charm tag.
11. A lavender-gray obsidian teardrop on a cord.
12. A silver hairpin with a small silver flower.
Row 4:
13. A round soft gold medal on a short ribbon.
14. A large soft pale cream feather with a pale green tip.
15. A small sickle with a bamboo handle and a curved iron blade.
16. A silver watering can.
Each object: whole, three-quarter front view seen from slightly above (about 20 degrees down), upright and level, perfectly vertical, not tilted, resting on the same invisible flat floor at the same ground level; flat objects lie flat on that floor. Stylized, slightly chunky, clean simple smooth shapes, meant to be turned into one 3D model and then separated. Pale, light, soft colors; no dark or heavily saturated colors, no black. Clean flat colors with soft shading only; no noise, no grain, no speckles, no dithering, no gritty texture, no fine lines, scratches or engraved detail. No thick or dark outlines; if an outline is used, it is a thin line only slightly darker than the color next to it, never black or near-black. Plain pure white background, no shadows, no ground, no table, no props, no glow effects, no text, no labels, no numbers.
```

---

## 9まいめ：専用品 その2（15こ）

ファイル名：`gear_gt03`・`gear_gt04`・`gear_gt16`・`gear_gt17`・`gear_gt05`〜`gear_gt15`（.glb）

```
A sheet of fifteen separate tool items for a cozy farming game set in a gentle volcano village, arranged in a neat grid of 5 columns and 3 rows in one image, with wide empty space between them so that no two objects touch or overlap. They are cute, toy-like, rounded game items. Draw all fifteen at about the same size so every shape is clear. Long tools lie flat on the floor, pointing to the right.
Row 1:
1. Pruning shears with pale green handles and a small leaf ornament.
2. A pickaxe with a wooden handle and a copper head.
3. A pickaxe with a wooden handle and an iron head.
4. A pickaxe with a wooden handle and a silver head.
5. A hammer with a wooden handle and an iron head.
Row 2:
6. A shovel with a wooden handle and a warm earthy-brown blade with a small leaf ornament.
7. A round iron cooking pot with two handles.
8. A flint stone and a copper fire striker lying side by side.
9. A short wooden torch topped with a small solid stylized flame shaped like a heart.
10. A copper bucket with a handle.
Row 3:
11. A silver ladle.
12. A small pale aqua glass bottle shaped like a water drop, with a cork.
13. A woven bamboo basket with a handle.
14. A silver feather ornament.
15. A soft pale green scarf with a swirl pattern, folded loosely.
Each object: whole, three-quarter front view seen from slightly above (about 20 degrees down), upright and level, perfectly vertical, not tilted, resting on the same invisible flat floor at the same ground level. Stylized, slightly chunky, clean simple smooth shapes, meant to be turned into one 3D model and then separated. Pale, light, soft colors; no dark or heavily saturated colors, no black. Clean flat colors with soft shading only; no noise, no grain, no speckles, no dithering, no gritty texture, no fine lines, scratches or engraved detail. No thick or dark outlines; if an outline is used, it is a thin line only slightly darker than the color next to it, never black or near-black. Plain pure white background, no shadows, no ground, no table, no props, no glow effects, no text, no labels, no numbers.
```

---

## 10〜16まいめ：まだ絵のない料理（125こ）

ファイル名：`dish_ck1`〜`dish_ck125`（.glb、左上から順に番号どおり）。料理の材料は、こむぎ（つぶ）・いも（むらさきの皮のさつまいも）・キャベツ（ゲームの `tomato`）・ベリー（ブルーベリー）・りんご・たまご・ミルク・さかな・たけのこ・きのこ・こむぎこ（パン・生地）。

### 10まいめ（ck1〜ck18）

```
A sheet of eighteen separate cooked dishes for a cozy farming game, arranged in a neat grid of 6 columns and 3 rows in one image, with wide empty space between them so that no two objects touch or overlap. Draw all eighteen at about the same size so every shape is clear. Plates and bowls are plain white, cups are plain glass or white, skewers are straight wooden sticks lying horizontal.
Row 1:
1. A white bowl of dry wheat-grain cereal flakes.
2. Toasted wheat ears on a white plate.
3. A white bowl of creamy wheat porridge.
4. A roasted sweet potato split open, purple skin and soft yellow inside, on a white plate.
5. A grilled cabbage wedge with light grill marks on a white plate.
6. A white bowl of simmered cabbage in clear light broth.
Row 2:
7. A small white bowl of blueberry jam.
8. A whole baked apple on a white plate.
9. A sunny-side-up fried egg on a white plate.
10. A glass of cold white milk.
11. A white mug of warm milk.
12. Thin pink raw fish slices fanned out on a white plate.
Row 3:
13. A grilled bamboo shoot cut in half on a white plate.
14. A white bowl of simmered bamboo shoot slices.
15. Three mushrooms on one straight wooden skewer.
16. A white bowl of mushroom soup.
17. A twisted bread roll.
18. Stir-fried sweet potato chunks and wheat grains on a white plate.
Each object: whole, three-quarter front view seen from slightly above (about 20 degrees down), upright and level, not tilted, resting on the same invisible flat floor at the same ground level. Stylized, slightly chunky, clean simple smooth shapes, meant to be turned into one 3D model and then separated. Pale, light, soft colors; no dark or heavily saturated colors, no black. Clean flat colors with soft shading only; no noise, no grain texture, no speckles, no dithering, no gritty texture, no fine lines. No thick or dark outlines; if an outline is used, it is a thin line only slightly darker than the color next to it, never black or near-black. Plain pure white background, no shadows, no ground, no table, no cutlery, no props, no steam, no glow effects, no text, no labels, no numbers.
```

### 11まいめ（ck19〜ck36）

```
A sheet of eighteen separate cooked dishes for a cozy farming game, arranged in a neat grid of 6 columns and 3 rows in one image, with wide empty space between them so that no two objects touch or overlap. Draw all eighteen at about the same size so every shape is clear. Plates and bowls are plain white, cups are plain glass or white, skewers are straight wooden sticks lying horizontal.
Row 1:
1. A white bowl of wheat porridge with sweet potato chunks.
2. A white bowl of wheat-grain salad with shredded green cabbage.
3. A white bowl of cabbage and wheat soup.
4. A white bowl of cereal flakes topped with blueberries.
5. A round baked wheat cake dotted with blueberries.
6. A white bowl of cereal flakes topped with apple slices.
Row 2:
7. A small apple crumble in a round baking dish.
8. Scrambled egg with wheat grains on a white plate.
9. A white bowl of cereal flakes in milk.
10. A white bowl of milk porridge.
11. A fried fish coated in wheat grains on a white plate.
12. A white bowl of wheat porridge with fish pieces.
Row 3:
13. Stir-fried bamboo shoot slices and wheat grains on a white plate.
14. Stir-fried mushrooms and wheat grains on a white plate.
15. A white bowl of wheat porridge with mushrooms.
16. Three round pale wheat dumplings on a white plate.
17. A round loaf of wheat bread.
18. Sweet potato and cabbage chunks on one straight wooden skewer.
Each object: whole, three-quarter front view seen from slightly above (about 20 degrees down), upright and level, not tilted, resting on the same invisible flat floor at the same ground level. Stylized, slightly chunky, clean simple smooth shapes, meant to be turned into one 3D model and then separated. Pale, light, soft colors; no dark or heavily saturated colors, no black. Clean flat colors with soft shading only; no noise, no grain texture, no speckles, no dithering, no gritty texture, no fine lines. No thick or dark outlines; if an outline is used, it is a thin line only slightly darker than the color next to it, never black or near-black. Plain pure white background, no shadows, no ground, no table, no cutlery, no props, no steam, no glow effects, no text, no labels, no numbers.
```

### 12まいめ（ck37〜ck54）

```
A sheet of eighteen separate cooked dishes for a cozy farming game, arranged in a neat grid of 6 columns and 3 rows in one image, with wide empty space between them so that no two objects touch or overlap. Draw all eighteen at about the same size so every shape is clear. Plates and bowls are plain white, cups are plain glass or white, skewers are straight wooden sticks lying horizontal.
Row 1:
1. Roasted sweet potato slices topped with blueberry sauce on a white plate.
2. Baked sweet potato and apple slices on a white plate.
3. A round potato omelet on a white plate.
4. A white bowl of creamy pale sweet potato soup.
5. A small sweet potato gratin in a round baking dish, golden top.
6. A white bowl of simmered sweet potato and bamboo shoot.
Row 2:
7. An opened silver foil parcel with mushrooms and sweet potato on a white plate.
8. A white bowl of sweet potato and mushroom soup.
9. Three round flat sweet potato rice-cake patties on a white plate.
10. A round sweet potato bread loaf with a purple swirl.
11. A white bowl of green cabbage salad with blueberries.
12. A white bowl of cabbage simmered to a soft purple color.
Row 3:
13. A white bowl of cabbage salad with apple slices.
14. A white bowl of overly sweet, soft glazed cabbage.
15. Stir-fried cabbage and scrambled egg on a white plate.
16. A white bowl of cabbage in creamy milk soup.
17. A steamed fish on a cabbage leaf on a white plate.
18. A white bowl of fish and cabbage soup.
Each object: whole, three-quarter front view seen from slightly above (about 20 degrees down), upright and level, not tilted, resting on the same invisible flat floor at the same ground level. Stylized, slightly chunky, clean simple smooth shapes, meant to be turned into one 3D model and then separated. Pale, light, soft colors; no dark or heavily saturated colors, no black. Clean flat colors with soft shading only; no noise, no grain texture, no speckles, no dithering, no gritty texture, no fine lines. No thick or dark outlines; if an outline is used, it is a thin line only slightly darker than the color next to it, never black or near-black. Plain pure white background, no shadows, no ground, no table, no cutlery, no props, no steam, no glow effects, no text, no labels, no numbers.
```

### 13まいめ（ck55〜ck72）

```
A sheet of eighteen separate cooked dishes for a cozy farming game, arranged in a neat grid of 6 columns and 3 rows in one image, with wide empty space between them so that no two objects touch or overlap. Draw all eighteen at about the same size so every shape is clear. Plates and bowls are plain white, cups are plain glass or white, skewers are straight wooden sticks lying horizontal.
Row 1:
1. Stir-fried bamboo shoot and cabbage on a white plate.
2. Stir-fried mushrooms and cabbage on a white plate.
3. A white bowl of mushroom and vegetable soup.
4. A vegetable sandwich with green cabbage leaves between soft bread.
5. A round pan-fried cabbage dumpling bun.
6. A glass of light purple-pink mixed fruit juice.
Row 2:
7. A small white bowl of mixed apple and blueberry jam.
8. A rolled purple-tinted omelet on a white plate.
9. A white mug of warm lavender blueberry milk.
10. A fish glazed with purple blueberry sauce on a white plate.
11. Sour bamboo shoot slices with blueberry sauce on a white plate.
12. Three purple-glazed mushrooms on one straight wooden skewer.
Row 3:
13. Three round pale purple blueberry dumplings on a white plate.
14. A round blueberry tart.
15. A puffy golden apple souffle in a small white ramekin.
16. A glass of pale cream apple milk.
17. A white bowl of apple pieces simmered in milk.
18. A fish glazed with sweet apple sauce on a white plate.
Each object: whole, three-quarter front view seen from slightly above (about 20 degrees down), upright and level, not tilted, resting on the same invisible flat floor at the same ground level. Stylized, slightly chunky, clean simple smooth shapes, meant to be turned into one 3D model and then separated. Pale, light, soft colors; no dark or heavily saturated colors, no black. Clean flat colors with soft shading only; no noise, no grain texture, no speckles, no dithering, no gritty texture, no fine lines. No thick or dark outlines; if an outline is used, it is a thin line only slightly darker than the color next to it, never black or near-black. Plain pure white background, no shadows, no ground, no table, no cutlery, no props, no steam, no glow effects, no text, no labels, no numbers.
```

### 14まいめ（ck73〜ck90）

```
A sheet of eighteen separate cooked dishes for a cozy farming game, arranged in a neat grid of 6 columns and 3 rows in one image, with wide empty space between them so that no two objects touch or overlap. Draw all eighteen at about the same size so every shape is clear. Plates and bowls are plain white, cups are plain glass or white, skewers are straight wooden sticks lying horizontal.
Row 1:
1. A white bowl of soft, mushy, limp bamboo shoot pieces with apple.
2. Soggy, flattened mushrooms with apple pieces on a white plate.
3. Three round pale apple dumplings on a white plate.
4. A round apple pie with a lattice top.
5. A rolled milk omelet on a white plate.
6. A pudding on a small white plate, with light caramel on top.
Row 2:
7. A rolled omelet with fish on a white plate.
8. A white bowl of bamboo shoot slices with soft egg on top.
9. A folded mushroom omelet on a white plate.
10. A round soft yellow egg bread loaf.
11. A folded crepe on a white plate.
12. A white bowl of fish simmered in milk.
Row 3:
13. A white bowl of creamy bamboo shoot milk soup.
14. A white bowl of creamy mushroom milk soup.
15. Three round white milk dumplings on a white plate.
16. A round soft white milk bread loaf.
17. Fish and bamboo shoot pieces on one straight wooden skewer.
18. A white bowl of bamboo shoot simmered with fish.
Each object: whole, three-quarter front view seen from slightly above (about 20 degrees down), upright and level, not tilted, resting on the same invisible flat floor at the same ground level. Stylized, slightly chunky, clean simple smooth shapes, meant to be turned into one 3D model and then separated. Pale, light, soft colors; no dark or heavily saturated colors, no black. Clean flat colors with soft shading only; no noise, no grain texture, no speckles, no dithering, no gritty texture, no fine lines. No thick or dark outlines; if an outline is used, it is a thin line only slightly darker than the color next to it, never black or near-black. Plain pure white background, no shadows, no ground, no table, no cutlery, no props, no steam, no glow effects, no text, no labels, no numbers.
```

### 15まいめ（ck91〜ck108）

```
A sheet of eighteen separate cooked dishes for a cozy farming game, arranged in a neat grid of 6 columns and 3 rows in one image, with wide empty space between them so that no two objects touch or overlap. Draw all eighteen at about the same size so every shape is clear. Plates and bowls are plain white, cups are plain glass or white, skewers are straight wooden sticks lying horizontal.
Row 1:
1. Fish and mushroom pieces on one straight wooden skewer.
2. An opened silver foil parcel with fish and mushrooms on a white plate.
3. Two golden fried fish fillets on a white plate.
4. Mushrooms and bamboo shoot pieces on one straight wooden skewer.
5. A white bowl of simmered mushrooms and bamboo shoots.
6. A round pan-fried bamboo shoot dumpling bun.
Row 2:
7. A round pan-fried mushroom dumpling bun.
8. A round mushroom bread loaf with a mushroom-cap top.
9. A rolled egg omelet wrapped around glazed eel, sliced, on a white plate.
10. A salt-grilled sweetfish on one straight wooden skewer.
11. A carp simmered in sweet amber glaze on a white plate.
12. A glazed catfish fillet with grill marks on a white plate.
Row 3:
13. A peach-orange sunset trout on one straight wooden skewer.
14. Two golden fried catfish fillets on a white plate.
15. A white bowl of vegetable stew with sweet potato, cabbage and milk.
16. A white bowl of fish pot-au-feu with sweet potato and cabbage.
17. A round sweet potato quiche.
18. A round savory cabbage pancake with sauce lines on a white plate.
Each object: whole, three-quarter front view seen from slightly above (about 20 degrees down), upright and level, not tilted, resting on the same invisible flat floor at the same ground level. Stylized, slightly chunky, clean simple smooth shapes, meant to be turned into one 3D model and then separated. Pale, light, soft colors; no dark or heavily saturated colors, no black. Clean flat colors with soft shading only; no noise, no grain texture, no speckles, no dithering, no gritty texture, no fine lines. No thick or dark outlines; if an outline is used, it is a thin line only slightly darker than the color next to it, never black or near-black. Plain pure white background, no shadows, no ground, no table, no cutlery, no props, no steam, no glow effects, no text, no labels, no numbers.
```

### 16まいめ（ck109〜ck125）

```
A sheet of seventeen separate cooked dishes for a cozy farming game, arranged in a neat grid of 6 columns and 3 rows in one image (the last row has five), with wide empty space between them so that no two objects touch or overlap. Draw all seventeen at about the same size so every shape is clear. Plates and bowls are plain white, cups are plain glass or white.
Row 1:
1. A sandwich with egg filling and green cabbage leaves between soft bread.
2. A round blueberry cake with cream.
3. A round apple cake.
4. A round fish pie with a golden crust.
5. A glass of pale pink mixed fruit milk.
6. A white bowl of mixed fruit salad with apple, blueberries and cabbage.
Row 2:
7. Stir-fried mushrooms, bamboo shoots and cabbage on a white plate.
8. A white bowl of mushroom, bamboo shoot and cabbage soup.
9. A steamed fish with mushrooms and cabbage on a white plate.
10. A pale lavender blueberry pudding on a small white plate.
11. A pale cream apple pudding on a small white plate, with an apple slice on top.
12. A white bowl of cereal flakes in milk topped with blueberries.
Row 3:
13. A white bowl of cereal flakes in milk topped with apple slices.
14. A small mushroom gratin in a round baking dish, golden top.
15. A folded vegetable omelet with sweet potato and cabbage on a white plate.
16. A round mushroom quiche.
17. A white bowl of wheat grains mixed with glazed eel pieces and scrambled egg.
Each object: whole, three-quarter front view seen from slightly above (about 20 degrees down), upright and level, not tilted, resting on the same invisible flat floor at the same ground level. Stylized, slightly chunky, clean simple smooth shapes, meant to be turned into one 3D model and then separated. Pale, light, soft colors; no dark or heavily saturated colors, no black. Clean flat colors with soft shading only; no noise, no grain texture, no speckles, no dithering, no gritty texture, no fine lines. No thick or dark outlines; if an outline is used, it is a thin line only slightly darker than the color next to it, never black or near-black. Plain pure white background, no shadows, no ground, no table, no cutlery, no props, no steam, no glow effects, no text, no labels, no numbers.
```

---

## 17まいめ：草（マップの雑草7こ・草のアイコン5こ）（12こ）

ファイル名：マップの雑草 `weed_shina`（しなやかな草 `weed0g`）・`weed_kasa`（かさかさ草 `weed0k`）・`weed_kuru`（くるくる草 `weed1g`）・`weed_chiri`（ちりちり草 `weed1k`）・`weed_funba0`〜`weed_funba2`（ふんばり草 `weedc#0〜2`）、草のアイコン `grass_shina`・`grass_kasa`・`grass_kuru`・`grass_chiri`・`grass_funba`（.glb）。
いまの絵（もらった絵）と同じ形・色にしてある。草のアイコンは、むしった草の束（根つき）。

```
A sheet of twelve separate wild grass plants for a cozy farming game, arranged in two rows in one image (seven in the top row, five in the bottom row), with wide empty space between them so that no two objects touch or overlap. Draw all twelve at about the same size so every shape is clear.
Row 1 (seven) are growing plants, each growing from one spot with its base flat on the ground:
1. A tuft of supple grass: long fresh light-green blades arching outward, with three soft rounded pale yellow-green seed heads on tall stems.
2. A tuft of dry rustling grass: thin dry pale tan-orange blades arching outward, with soft drooping pale tan seed plumes.
3. A clump of curly fern: fresh light-green fern fronds with small leaflets, a few fronds curled at the tips into round spirals.
4. A clump of dry crinkly fern: warm light orange-tan fern fronds with wavy crinkled leaflets, the tips curling over.
5. A low wide tuft of goosegrass: many long light-green blades spreading low and wide, no flower spikes.
6. A small low tuft of goosegrass: short light-green blades spreading low.
7. A tuft of goosegrass with flowers: light-green blades and two upright stems, each ending in a few short pale yellow-green finger-like spikes spreading out like a small hand.
Row 2 (five) are pulled-up bunches, each a small bundle of the same plant pulled out of the ground with a little clump of pale tan roots at the bottom, lying flat on the floor with the roots to the left:
8. A bunch of supple grass: long light-green blades with soft rounded pale yellow-green seed heads.
9. A bunch of dry rustling grass: pale tan-orange blades with drooping pale tan seed plumes.
10. A bunch of curly fern: light-green fern fronds with round curled tips.
11. A bunch of dry crinkly fern: light orange-tan crinkled fern fronds with curled tips.
12. A bunch of goosegrass: light-green blades with a few short pale yellow-green finger-like spikes.
Each object: whole, three-quarter front view seen from slightly above (about 20 degrees down), level, not tilted; growing plants stand upright, perfectly vertical, resting on the same invisible flat floor at the same ground level. Stylized, slightly chunky, clean simple smooth shapes with thick soft blades, meant to be turned into one 3D model and then separated. Pale, light, soft colors; no dark or heavily saturated colors, no black. Clean flat colors with soft shading only; no noise, no grain, no speckles, no dithering, no gritty texture, no fine vein lines. No thick or dark outlines; if an outline is used, it is a thin line only slightly darker than the color next to it, never black or near-black. Plain pure white background, no shadows, no ground, no soil, no pots, no props, no text, no labels, no numbers.
```
