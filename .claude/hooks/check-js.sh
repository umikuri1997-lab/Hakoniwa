#!/bin/bash
# Edit・Write のあと、書きかえた .js / .cjs だけ node --check する。
f=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write((j.tool_input&&j.tool_input.file_path)||"")}catch(e){}})')
case "$f" in
  *.js|*.cjs) ;;
  *) exit 0 ;;
esac
[ -f "$f" ] || exit 0
if ! out=$(node --check "$f" 2>&1); then
  echo "node --check でエラー: $f" >&2
  echo "$out" >&2
  exit 2
fi
exit 0
