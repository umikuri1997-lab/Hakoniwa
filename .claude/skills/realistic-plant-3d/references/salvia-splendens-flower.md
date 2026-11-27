# サルビア（Salvia splendens）花穂専用追加データ

## 適用範囲
和名だけではサルビア属全体を指す場合がある。本資料は花壇で一般的な赤花の Salvia splendens を暫定対象とする。別種・品種はその資料を優先。花のみの場合、花穂1本（花冠・萼・蕾・花序軸）を出力し、葉、株元からの栄養茎、根、鉢、地面を付けない。単花のみと明示されたら花序軸と他の花も省く。

## 実物資料を開いて確認
- NC State Extension: https://plants.ces.ncsu.edu/plants/salvia-splendens/ — 赤い萼・細長い唇形花冠、2〜6花の輪状のまとまり。
- Flora of China: https://efloras.org/florataxon.aspx?flora_id=3&taxon_id=200020263 — 赤い鐘形の萼、二唇形、花冠長約4〜4.2cmと上唇・下唇の形。資料・品種によって寸法は異なる。
- Royal Botanic Garden Sydney PlantNET: https://plantnet.rbgsyd.nsw.gov.au/cgi-bin/NSWfl.pl?lvl=sp&name=Salvia~splendens&page=nswfl — 萼の脈と花色。
- World Flora Online: https://www.worldfloraonline.org/taxon/wfo-0000302359 — 花序と萼・花冠の特徴。
- 実物接写（外部画像）: https://www.plantasyhongos.es/herbarium/htm/Salvia_splendens.htm ／ https://www.plantasyhongos.es/herbarium/s/Salvia_splendens_15b.jpg
- 実物接写（外部画像）: https://economiayviveros.com.ar/abril2019/plantas_ornamentales_y_flores_de_corte-cultivos_viveros-paisajismo-jardineria-arte_floral-1.html
外部写真はダウンロードできなかったためリンクのみ。GLBプレビューは自作試作であり実物写真ではない。

## 造形仕様
1. 花序軸に沿って節を複数配置し、各節に短い花柄と2〜6花のまとまりを作る。花が無秩序な球体や螺旋状に均一に並ぶ形を避ける。
2. 萼は赤い鐘状で、縦方向の脈、先端の上下唇と歯を持つ。開花後に花冠が落ちても赤い萼が残る場合がある。緑の葉のように置換しない。
3. 花冠は萼から突き出す細長い赤い筒。上唇・下唇の非放射対称形を作り、開口部を暗い内部と形状で表現。通常の五弁花・朝顔型の大きな漏斗・円錐・球にしない。
4. 上部は小さな蕾、中央は開花、下部は開花と花冠のない萼を混在させる設計例。開花状態は参考品種の画像に合わせる。
5. 軸の先細り、節ごとの微妙な向きとサイズ差を付ける。ランダムに大きく乱さない。
6. 赤色の濃淡、萼の脈、薄い縁を表現。テクスチャは花冠と萼で分け、毛を大量のジオメトリで表現しない。

## ゲーム用予算（暫定、花穂1本全体）
通常1800三角形以内、遠景800以内。メッシュ2〜3個を目安。ユーザー指定が優先。葉なしの花序専用であり、株全体の予算とは別。各花をコピーして数を増やす際は全体の実三角形数を確認。

## 同梱実装
`scripts/salvia_spike.py` は花序軸、萼、筒状花冠、蕾、UV、手続き生成テクスチャをまとめた試作。numpy/trimesh/Pillow を使用。通常1488三角形、遠景568三角形、材質2、画像6枚埋め込み。花弁と萼の唇形、萼歯、花柄、開花状態は簡略化されているため、実物と比較して必要に応じて改善。ノーマルマップは中立で、実写の凹凸ではない。

実行: `python scripts/salvia_spike.py --lod 1` または `--lod 2`。既存V9の `scripts/audit_glb.py` で検査し、GLBを再読込、複数角度・ゲーム表示距離で評価。試作のデータ検査は合格。植物学的な完全一致やBlender・ゲーム内の見た目は保証しない。

`assets/salvia/preview.jpg` は実GLBの比較レンダー。試作では花の間隔が広く、花冠・萼の輪郭に角張りが残り、レンダー色が暗く出ている。完成目標ではない。対象品種に合わせて節間、唇形の輪郭、照明・マテリアルを改善すること。
