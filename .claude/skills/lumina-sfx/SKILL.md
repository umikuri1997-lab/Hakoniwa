---
name: lumina-sfx
description: Hakoniwa で、効果音を lumina-sfx（オフラインの効果音スタジオ。2,853のレシピと本物の録音）でさがす・作る・かさねる・WAVに書き出すときに使う。「lumina で音を作って」「効果音の候補を作って」と言われたときや、効果音の候補をえらぶページを作る前に読む。
---

# lumina-sfx（Hakoniwa で使うとき）

> Hakoniwa での決まり（`CLAUDE.md` と `.claude/rules/sound.md` が先）：
> - lumina-sfx のレシピでなら、効果音を作ってよい（作った音・録音とのかさね・params・macros をかえるのも可。持ち主がきめた）。lumina を使わずに、オシレーターやノイズで音を組みたてるのは、いままでどおりしない。
> - 本体はリポジトリに入れない（約108MB・音のライブラリはまとめて配りなおさないライセンス）。はじめに `bash tools/sound/lumina/setup.sh` で `tools/sound/lumina/lib` にとってくる（版はスクリプトの `REV`）。使い方のくわしい所は `tools/sound/lumina/lib/SKILL.md` と `references/` を読む。
> - コマンドは `tools/sound/lumina/lib` で動かす。remix は `--id <新しい名前>` がいる：`node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/remix.mjs <レシピID> --id <名前> --format wav --dest <絶対パス>`。さがすのは `node scripts/search.mjs <ことば> --isolated`（ことばは英語。ぜんぶの語にあう物だけ出る。ないときは `--intent "<ことば>"`）。
> - ゲームの中で lumina のコード（`SfxPlayer` など）を動かさない。WAVに書き出して、いままでの音と同じく mp3 にして `assets/g` に入れ、`js/audio.js` の `SAMPLES` からよぶ。作りなおせるように、レシピID・`--id`・params・macros・seed を `tools/sound/` のスクリプトにのこす。
> - 候補はいくつか作り、聞きくらべのページで持ち主にえらんでもらう（`sound.md`）。大きさの決まり（キラリン系は -35 LUFS など）も同じ。
> - 書き出したときに返る `credits`（もとの録音）は `tools/sound/credits.json`・`CREDITS.txt` と設定の音のクレジット（`CREDIT_TXT`）に書く。lumina-sfx（音のライブラリは Lumina Open Game Audio License 1.0）を使ったことも書く。
