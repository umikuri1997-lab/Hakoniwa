# 植物参考画像アトラス（V4）

**重要：9枚すべてAI生成の参考画像であり、実物写真・植物標本・正確な植物画ではない。** 形態の比較、目標とする自然な立体感、葉の重なり、細部の表現を検討するための補助資料。ラベルの分類・品種・形態は独立した資料で確認する。画像の植物が同一個体・別方向であるとはみなさない。

## 画像索引

### 花・草花

[A](../assets/plant-atlas/flowers-a.jpg) / [B](../assets/plant-atlas/flowers-b.jpg) / [C](../assets/plant-atlas/flowers-c.jpg)

| 和名（参考分類） | 画像内英名 | 造形時の着目点 |
|---|---|---|
| バラ | Rose | 花弁の巻き込み、複葉、枝先の花 |
| ユリ | Lily | 6枚の花被片、反り、雄しべ、茎葉 |
| アジサイ | Hydrangea | 分岐する花序、装飾花、対生葉 |
| ヒマワリ | Sunflower | 頭花の中心と舌状花、幅広い葉、花首 |
| デイジー類 | Daisy | 頭花の構造、草姿は種を特定して確認 |
| パンジー | Pansy | 重なる5花弁、花面の向き、葉縁 |
| チューリップ | Tulip | 6枚の花被片、杯形、幅広い葉 |
| ラベンダー | Lavender | 細葉、花穂の小花、株元の分岐 |
| アサガオ | Morning Glory | 漏斗状花冠、つる、葉の切れ込みは品種確認 |
| コスモス | Cosmos | 細裂葉、細い花柄、頭花 |
| アヤメ類 | Iris | 外花被片と内花被片、剣状葉、種による違い |
| タンポポ | Dandelion | 根生葉、頭花、花茎、綿毛の段階差 |

### 樹木・低木

[A](../assets/plant-atlas/trees-shrubs-a.jpg) / [B](../assets/plant-atlas/trees-shrubs-b.jpg) / [C](../assets/plant-atlas/trees-shrubs-c.jpg)

| 和名（参考分類） | 画像内英名 | 造形時の着目点 |
|---|---|---|
| オーク類 | Oak | 樹冠の空隙、幹の分岐、葉形は種を特定 |
| オリーブ | Olive | 細長い対生葉、灰緑色、幹の曲がり |
| スギ | Japanese Cedar | 主幹、枝の段差、らせん状の針状葉 |
| アカマツ | Japanese Red Pine | 束生する針葉、枝の先端の葉群。剪定樹形を野生型に流用しない |
| シダレヤナギ | Weeping Willow | 下垂枝、細長い葉、枝の束の隙間 |
| カバノキ類 | Birch | 幹の色と樹皮、細い枝。樹皮と葉形は種差確認 |
| イロハモミジ類 | Japanese Maple | 掌状葉、細枝、葉群の重なり |
| トウヒ類 | Spruce | 主幹と枝の階層、単生針葉 |
| ツゲ類 | Boxwood | 小型の対生葉、自然樹形と刈り込みの区別 |
| ローズマリー | Rosemary | 細い対生葉、木質化した基部、枝先 |
| ブルーベリー | Blueberry | 果柄、果実の萼痕、枝の着果位置 |
| ツバキ類 | Camellia | 厚い葉、花弁の重なり、品種差 |

### 農作物・その他

[A](../assets/plant-atlas/crops-other-a.jpg) / [B](../assets/plant-atlas/crops-other-b.jpg) / [C](../assets/plant-atlas/crops-other-c.jpg)

| 和名（参考分類） | 画像内英名 | 造形時の着目点 |
|---|---|---|
| コムギ | Wheat | 小穂の配列、芒の品種差、葉鞘と節 |
| ジャガイモ | Potato | 複葉、花序、地下の塊茎。地上へ露出させない |
| キャベツ | Cabbage | 外葉と結球、葉脈、巻き込み |
| トマト | Tomato | 複葉、分岐、花序と果房 |
| イチゴ | Strawberry | 三出複葉、花柄と果実、ランナー |
| トウモロコシ | Maize | 節と葉鞘、頂部の雄穂、側方の雌穂 |
| ニンジン | Carrot | 細裂葉、葉柄、地下の根 |
| シダ類 | Fern | 葉軸と羽片、株元、種により分裂様式が異なる |
| パンパスグラス | Pampas Grass | 葉束、弓状に反る葉、穂の密度 |
| ガマ類 | Cattail | 葉身、茎、穂の形と雌雄の位置 |
| アロエ類 | Aloe | 肉厚葉、ロゼット、葉縁の突起は種差確認 |
| スイレン類 | Water Lily | 水面の葉、葉の切れ込み、花と水面の位置 |

## Claudeでの必須利用手順

1. 対象植物が含まれるシートA・B・Cのうち、最低1枚を実際に画像として開く。必要に応じて複数を比較。ファイル名だけ確認して画像を見たとは記載しない。
2. 実物写真・植物誌を優先し、アトラスから得た観察事項と区別する。一般名の植物は必要な場合に種を特定。資料間で食い違う特徴は写真や植物誌を優先する。
3. 形態設計に樹形・草姿、葉形、葉序、花弁・花序、茎・枝、空隙、重なり、表面の反りを個別に反映。画像の視点や個体の比率をそのまま一般化しない。
4. 生成した実モデルを正面・側面・背面・上面・斜視からレンダリングし、実物資料とアトラスの質感目標を別々に比較。
5. 画像を見られない場合は明記し、確認したことにしない。実物写真が取得できない場合は検証範囲を明記する。
6. 背景・影・文字・地面は参考画像の演出であり、モデルに組み込まない。画像の根の露出や剪定形は依頼内容に合わせて修正。

## 実物資料への追加リンク

- [Wikimedia Commons: 植物画カテゴリー](https://commons.wikimedia.org/wiki/Category:Botanical_illustrations)
- [Wikimedia Commons: ローズマリーの歴史的植物画](https://commons.wikimedia.org/wiki/File:K%C3%B6hler_Rosmarin1.jpg)
- [Wikimedia Commons: コムギの歴史的植物画](https://commons.wikimedia.org/wiki/File:Triticum_aestivum_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-274.jpg)
- 既存の [visual-library.md](visual-library.md) の資料も併用。実物画像の再配布は行っていない。
