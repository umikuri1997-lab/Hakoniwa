/* 画面の説明の文の決まり（.claude/rules/text.md「精霊の特技」）：説明に、ほかの物・ほかのせいれい・ふつうの物とのくらべを書かない。レア度を書かない。
   js/ の文字列（コメントはのぞく）を、くらべ・レア度の言葉でさがす。セリフ・日記・手紙・お話のファイル（SKIP）はのぞく（セリフの中のくらべは、そのままでよい）。
   くらべでない文（「ふつうの「コワイノ」」＝オオカゲでない物、セリフ など）は OK に、ファイルと文の一部で入れる。ブラウザはつかわない */
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const ROOT=path.join(__dirname,'../..'),JS=path.join(ROOT,'js');
const BAD=[/レア/,/ふつうの/,/ほかの(子|せいれい|物|家具)/,/ふだんより/,/[0-9]+%→/,/→[0-9.]+倍/,/くらべ/,/より(速|強|多|長|早|大き|高|少な|弱)/];
const SKIP=/^(diary|letter|talk|ev-text|chat|gift-talk|dialog|story|mizube-story|wind-story|kagari|yami|quests|world|bond|spirit-life|level|night)/;/* セリフ・日記・手紙・お話 */
const OK=[/* [ファイル, 文の一部]：くらべでない・セリフの文 */
 ['build.js','これより高くは、つめません'],['build.js','それより多く置くと'],['build.js','ほかのせいれいは、消えると自然にかえり'],
 ['build.js','ふつうの「コワイノ」が'],['build.js','3マス以内のはたらく速さ+5%'],['ui.js','ふつうの日'],['nick.js','ほかのせいれいと同じ名前です'],
 ['cave.js','手のひらより大きな'],['happen.js','ふつうの大きさにもどった'],['houses.js','ふつうのせいれいは'],
 ['event-open.js','くらべ'],['free.js','くらべっこ'],['mizube.js','くらべ']];
const hit=[];
for(const f of fs.readdirSync(JS).filter(f=>f.endsWith('.js')&&!SKIP.test(f))){
  const s=fs.readFileSync(path.join(JS,f),'utf8').replace(/\/\*[\s\S]*?\*\//g,m=>m.replace(/[^\n]/g,' '));/* コメントは同じ長さの空白に（行の番号をかえない） */
  const re=/(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g;let m;
  while((m=re.exec(s))){const t=m[2];if(!/[ぁ-んァ-ン一-龥]/.test(t)||!BAD.some(p=>p.test(t)))continue;
    if(OK.some(([of,part])=>of===f&&t.includes(part)))continue;
    hit.push(`${f}:${s.slice(0,m.index).split('\n').length}  ${t.slice(0,100)}`)}}
if(hit.length)console.log(hit.join('\n'));
assert.equal(hit.length,0,'説明に、くらべ・レア度の言葉がある（くらべでなければ、このテストの OK に足す）');
console.log('Text rules: no comparisons or rarity words in descriptions');
