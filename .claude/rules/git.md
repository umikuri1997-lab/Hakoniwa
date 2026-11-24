---
paths:
  - "js/main.js"
  - "STATE.md"
---
# PR・git・変更のあとのたしかめ（もとは CLAUDE.md）

PRを作る前に読む（`APP_VER` を書きかえるので、毎回読まれる）。
- 変更のあとは、`npm run lint`（`npm ci` は環境のセットアップでしてある。`node_modules` がないときだけ `npm ci --ignore-scripts`）と、そのPRでかえた js を1つずつ `node --check` する（`for f in $(git diff --name-only --diff-filter=d origin/main -- '*.js' '*.cjs'); do node --check "$f" || echo "$f"; done`。`node --check js/*.js` は、はじめの1ファイルしか調べない）と、ブラウザでの起動確認（エラーが出ないこと）をする。
- 毎回、最新の `main` からブランチを切り、PRを作る。マージは聞かずに、できたらすぐする（持ち主がきめた）。マージ済みのブランチは使いまわさない。強制pushはしない。（作業の場所で同じ名前のブランチしか使えないときは、最新の `main` から作りなおし、リモートの前のブランチを `git merge -s ours` でとりこんで（中身は `main` のまま）から push する）
- `git clean` に、さがした結果（`$(... | grep __pycache__)` など）をわたさない。さがした物がないと、何もわたらず、まだ入れていないファイル（新しい絵のページなど）までぜんぶ消える（#1661 で、チップのページが消えて入れわすれた）。キャッシュは `find -name __pycache__ -prune -exec rm -rf {} +` でけす。ただし、コミットされている `__pycache__` もあるので、けしたあと `git status` で消えた物（`D`）があれば `git checkout --` でもどす。
- `js/main.js` の `APP_VER`（マップ画面に出すバージョン）を、PRのたびにそのPRの番号に書きかえる。PRをマージするときは、作ったときにかえってきた番号でマージする（`APP_VER` に入れた番号でマージしない。ほかの作業のPRが先にその番号をとっていると、ちがうPRをマージしてしまう。#2145 でおきた）。
- `main` をとりこんだあとは、ぶつかった所（`<<<<<<<`）がないかたしかめてからコミットする。`chips.js` がぶつかったら、手でまぜずに、`main` の `chips.js` とアトラスにもどして、このPRのチップを作る道具をもう1回動かす（#2044 でおきた）。`git commit -a` は、ぶつかった印ごとコミットしてしまう（流れ星のPRで `index.html` におきた）。
