#!/usr/bin/env bash
# lumina-sfx（https://github.com/LuminaBench/lumina-sfx）を tools/sound/lumina/lib にとってくる。
# 本体は大きく（約108MB）、音のライブラリは「まとめて配りなおさない」ライセンスなので、リポジトリには入れない（lib は .gitignore）。
# 版は下の REV にきめておく（かえるときは、ここを書きかえる）。Node 22.12 より新しい物で動く。
set -euo pipefail
REV=6857ab0cf3a7ba92c51291639f416d26b1d3519f
D="$(cd "$(dirname "$0")" && pwd)/lib"
if [ -d "$D/.git" ] && [ "$(git -C "$D" rev-parse HEAD)" = "$REV" ]; then echo "lumina-sfx: $D（もう入っている）"; exit 0; fi
rm -rf "$D"; mkdir -p "$D"
git -C "$D" init -q
git -C "$D" remote add origin https://github.com/LuminaBench/lumina-sfx
git -C "$D" fetch -q --depth 1 origin "$REV"
git -C "$D" checkout -q FETCH_HEAD
echo "lumina-sfx: $D"
