# クォータービューの地面の絵をたのむプロンプト

地面・床・道・畑などの平らな物は、高さも見る角度もないので、お手本のキューブもキューブの文もつけない。
絵は、まうえから見た、つながる大きな面でたのむ。もらったら、こちらでくりかえしの間かくを見つけて1つぶんを切りとり、
ひし形（1マス 128×96、見おろし約49度）へ写して、色の平均（BOX）でちぢめる。
1マスのドット数は書かない。草地とあれ地のさかい・水と岸のふちは、こちらのオートタイル（デュアルグリッド）で作るので、
さかいの絵はたのまない。

## プロンプト（このまま1つで使う）

```
Create a set of 12 separate ground texture swatches for a cozy, pastoral pixel-art life-sim game.
Lay them out in a 4 x 3 grid on one image, with a plain flat light-gray gap between swatches.
Each swatch is one large, continuous, seamless surface seen from directly above (straight top-down, orthographic, no perspective, no horizon, no shadows from outside the swatch).
Each swatch must tile seamlessly: the left edge continues into the right edge and the top edge continues into the bottom edge.
No borders, no frames, no tile grid lines, no single isolated tile, no objects standing on the ground, no characters, no text.

Swatches, left to right, top to bottom:
1. Dry barren meadow earth: pale tan soil with faint small cracks and a few tiny pebbles, no grass.
2. Lush short meadow grass: soft fresh green, small leaf clumps of the same size spread evenly, no flowers.
3. Volcanic foothill ground: light warm gray-brown soil mixed with fine pale ash, a few tiny dark grains.
4. Calm clear water surface: light sky-blue water with soft gentle ripple shapes evenly spread, no foam, no shore.
5. Shallow ford riverbed seen through clear water: pale sand with small rounded light-gray pebbles.
6. Tilled farm soil: soft brown earth with straight, parallel, evenly spaced raised ridges (furrows) running in one direction, every ridge the same width and the same spacing, no plants, no sprouts, no grass.
7. Dirt footpath: packed light brown earth, slightly smoother in the middle, evenly worn, no grass.
8. Gravel path: small light gray and beige gravel stones of similar size, evenly spread.
9. Cobblestone pavement: rounded light gray stones of the same size laid in regular rows with even gaps.
10. Brick pavement: soft terracotta bricks of the same size in a regular running-bond pattern with even light mortar lines.
11. Wooden plank floor: light warm oak planks of the same width laid in parallel rows, evenly staggered joints.
12. Stone floor: large square light beige stone slabs of the same size in a regular grid with thin light joints.

Style: clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture.
Pale, light, soft colors that match a gentle pastel game; no dark or heavily saturated colors.
No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black.
Draw it large and detailed; do not make it tiny or low-resolution.
```

## もらったあと
- 1まいずつ切りわけ、くりかえしの間かく（自己相関）で1つぶんを切りとる。2×2 にならべて、つなぎ目が見えないかをたしかめる。つながらない絵は使わない。
- 畑は、畝の間かくが1マスになるように切る（1マスに畝が1本、畝のまん中がマスのまん中）。
- ひし形へ写すのは、ゲームと同じ向き（せかいの x が右下、y が左下）。写してから BOX でちぢめる。
