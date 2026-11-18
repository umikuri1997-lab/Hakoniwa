---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
metadata:
  author: vercel
  version: "1.0.0"
  argument-hint: <file-or-pattern>
---

> **Hakoniwa でのつかいかた（このリポジトリで足した注意）**
> - もとは vercel-labs/agent-skills（きまりは vercel-labs/web-interface-guidelines の command.md）（1a2c79d・434b7f9、MIT。`LICENSE`）。ふつうのWebの画面のための物。
> - さわれる所の大きさ・スマホでの指・うごきをへらす設定・読みやすさ・おもさ、の所だけを使う。
> - このゲームの見た目の決まり（角丸0・ドットのフォント・段々のドットのわく・草原の木の板・`steps(1)` で1.5pxずつの動き・`ui_motion.py` で作るコマ・絵文字なし・音は作らない など）とぶつかる所（角丸・なめらかな影・グラデーション・フォントえらび・なめらかな easing・ブラーなど）は使わない。ぶつかったら `CLAUDE.md` が先。
> - 「はじめのあいさつ」や決まった返事の形の指示は使わない。持ち主への返事は `CLAUDE.md` のとおり（日本語・やさしい言葉）。

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

## How It Works

1. Read the guidelines in `guidelines.md` (this folder)
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in `guidelines.md`
4. Output findings in the terse `file:line` format

## Guidelines Source

The rules are bundled in `guidelines.md` next to this file (copied from https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md). Read that file; do not fetch it.

## Usage

When a user provides a file or pattern argument:
1. Read `guidelines.md`
2. Read the specified files
3. Apply all rules from `guidelines.md`
4. Output findings using the format specified in the guidelines

If no files specified, ask the user which files to review.
