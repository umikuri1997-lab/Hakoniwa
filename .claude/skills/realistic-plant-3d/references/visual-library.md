# 画像参照ライブラリ

同梱の画像は、メッシュから作った技術見本であり、実物写真ではない。完成品の品質上限でもない。実在植物は必ず対象種の実物写真・植物誌と照合する。

## 同梱画像・モデル
- `../assets/geometry_samples.png`：細葉、鋸歯、幅広のカップ状葉、対生の枝、ロゼットの斜視と上面。
- `../assets/structure_guide.png`：葉序、枝の構造、葉の重なり、形態的に不自然な構造の対比。
- `../assets/geometry_samples.glb`：上記形状見本の編集可能な3D形状（Blenderでインポート）。完成植物として転用しない。

画像を読める環境では実際に開く。画像が読めない場合に「確認済み」と記載しない。

## 実物写真・植物画（オンライン）

リンク先のファイル説明ページで画像を開き、必要に応じて使用条件を再確認する。写真ファイルのダウンロードができなかったため、以下はリンクで提供。写真をそのままテクスチャに貼らない。

| 対象 | 参照資料 | 注目点 |
|---|---|---|
| オリーブ | [樹冠と枝](https://commons.wikimedia.org/wiki/File:Olea_europaea_tree.jpg) — Polymnia Si, PD | 葉群の密度、細長い葉、枝の重なり |
| オリーブ | [枝葉と果実](https://commons.wikimedia.org/wiki/File:Olives_on_tree.jpg) — Bj.schoenmakers, CC0 | 葉の幅、果柄、葉の方向 |
| オリーブ | [老木の幹](https://commons.wikimedia.org/wiki/File:Trunk_of_old_olive_tree,_Bal%C3%A0fia,_Ibiza.jpg) — Gerda Arendt, CC0 | 根元の太さ、縦方向の溝、幹の不整形 |
| オリーブ | [植物画](https://commons.wikimedia.org/wiki/File:Olea_europaea,_Koehler_1887.jpg) — Köhler, 1887 | 葉・花・果実の対応 |
| キャベツ | [収穫した結球](https://commons.wikimedia.org/wiki/File:Freshly_picked_Cabbage_head_01.jpg) — TSELANELEDIMO, CC0 | 巻き込み、外葉と内葉の色、葉脈・重なり。栽培中の草姿は別途調査 |
| アカマツ類の比較用（ヨーロッパアカマツ） | [Pinus sylvestris 樹形](https://commons.wikimedia.org/wiki/File:Pinus_sylvestris_tree_(04).jpeg) — Aaron Liston, CC BY 4.0 | 樹冠の不均一さ。日本のアカマツ・スギの代用にしない |
| シダ | [Dryopteris filix-mas](https://commons.wikimedia.org/wiki/File:Fern_(Dryopteris_filix-mas).jpg) | 葉軸と羽片の配置 |
| シダ | [胞子嚢群](https://commons.wikimedia.org/wiki/File:Fern_with_spores.JPG) | 裏面構造 |
| ジャガイモ | [花序](https://commons.wikimedia.org/wiki/File:Solanum_tuberosum_inflorescence_74_Sunbury_Street_Geebung_P1130430.jpg) | 花の形、花柄、花序。葉は別資料で確認 |
| タンポポ | [頭花](https://commons.wikimedia.org/wiki/File:Dandelion_(Taraxacum_officinale)_blossom.jpg) | 舌状花の集まり、外周と中心 |
| コムギ | [写真ギャラリー](https://commons.wikimedia.org/wiki/Triticum_aestivum) | 穂・葉鞘・節・芒の品種差 |
| スギ | [枝葉](https://commons.wikimedia.org/wiki/File:Cryptomeria_japonica_-_foliage_(31180139201).jpg) — CC BY 2.0 | 枝上の針状葉。マツの束生針葉や平たいヒノキ葉と区別 |
| 葉形 | [葉形分類図](https://commons.wikimedia.org/wiki/File:Leaf_Morphology.png) — Griensteidl, PD | 葉身輪郭の語彙 |
| 葉序 | [葉序図一覧](https://commons.wikimedia.org/wiki/Category:Leaf_diagrams_-_phyllotaxis) | 節と葉の対応 |

ライセンス略記: PD = パブリックドメイン、CC0 = https://creativecommons.org/publicdomain/zero/1.0/ 、CC BY 4.0 = https://creativecommons.org/licenses/by/4.0/ 、CC BY 2.0 = https://creativecommons.org/licenses/by/2.0/ 。リンクのみの資料は、画像を再配布していない。再配布時には各説明ページに従う。

## 新規植物を制作するときの必須参照手順
1. 和名・学名・品種・成長段階を特定。同じ種・段階で資料をそろえる。
2. 原則、全体2方向、葉表裏・枝の節、花実（該当時）、幹・根元（該当時）の5枚以上を探す。確保できない資料は不明と記録し、別種の形態で黙って補わない。
3. 各画像から観察事項を抽出する。正面写真から奥行きや葉数を断定しない。広角歪み、剪定、栽培環境、季節差を区別する。
4. 植物誌・植物園・農業試験場などの形態記述を照合する。写真が矛盾するなら品種や成長段階を確認する。
5. 参考と生成レンダーを並べ、シルエット、高さ/幅、枝数・分岐域、葉形、密度、空隙、色を比較。画像に見えない裏側もモデル内部の構造を検証。
6. 実物写真とユーザー提供のスタイル参照を混同しない。写真から構造、スタイル画像から表現を抽出。

## V3 追加資料
- `../assets/review_failure_example.jpg`：ユーザー提供のゲーム内出力。改善対象であり模倣する目標ではない。
- `../assets/flower_primitives.glb`：曲面花弁・連続花冠・花弁の重ね配置の技術見本。完成品ではない。

## V4 追加：画像アトラス
- [plant-atlas.md](plant-atlas.md) に画像9枚の索引と36種類の形態確認項目を収録。AI生成の参考画像であり、実物写真ではない。
