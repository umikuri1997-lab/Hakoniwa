# handoff（Claude と GPT のやりとり）

3Dの仕事を、Claude と GPT（Codex）のあいだで、リポジトリをとおしてわたすためのフォルダ。

- `to-gpt.md`：Claude が書く、GPT へのたのみ。Claude が `main` に入れる。
- `from-gpt.md`：GPT が書く、作った結果。GPT が自分のブランチに入れる（PRにする）。
- `files/`：GPT が見せたい絵（くらべた絵・大きな絵など）を入れる所。

持ち主がすること：
1. Codex に「handoff」と言う → GPT が `to-gpt.md` を読んで作り、`from-gpt.md` を書く。
2. Claude に「GPTのを見て」と言う → Claude が GPT のブランチを読み、たしかめて、つぎのたのみを `to-gpt.md` に書く。

終わったたのみは、`to-gpt.md` の「いまのたのみ」を「なし」にもどす。
