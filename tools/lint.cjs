// ESLint で、js/ のファイルをまとめて調べる。
// ふつうの script は、ぜんぶのファイルが1つの共通の場所（グローバル）を使うので、
// index.html の読みこみの一覧（U）の順に1つにつないで調べ、見つけた所を「ファイル:行」にもどして出す。
// 見つける物：同じ名前をもう一度作る（あとのファイルが黙って上書きする）・どこにもない名前を使う・オブジェクトの同じキー など。
// 使い方: npm ci のあと、node tools/lint.cjs
const fs=require('fs'),path=require('path');
const {Linter}=require('eslint');const globals=require('globals');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const m=html.match(/var U=\[([^\]]*)\],E=/);
if(!m){console.error('index.html に読みこみの一覧 U がありません');process.exit(2)}
const U=JSON.parse('['+m[1]+']').map(u=>u.split('?')[0]);
// index.html の中の script（src のない物）も、同じ共通の場所を使うので、先につなぐ
const parts=[];
for(const s of html.matchAll(/<script(?![^>]*\b(?:src=|type="importmap"))[^>]*>([\s\S]*?)<\/script>/g))parts.push({f:'index.html',t:s[1]});
for(const u of U)parts.push({f:u,t:fs.readFileSync(path.join(root,u),'utf8')});
// window.〇〇= で作る名前は、ほかのファイルからは、そのまま名前で使える
const winG={};for(const p of parts)for(const w of p.t.matchAll(/\bwindow\.([A-Za-z_$][\w$]*)\s*=(?!=)/g))winG[w[1]]='writable';
/* 3Dの部品（js/3d のモジュール）が window に置く物（window.R3D）も */for(const f of fs.readdirSync(path.join(root,'js','3d')).filter(f=>f.endsWith('.js')))for(const w of fs.readFileSync(path.join(root,'js','3d',f),'utf8').matchAll(/\bwindow\.([A-Za-z_$][\w$]*)\s*=(?!=)/g))winG[w[1]]='writable';
let src='',map=[];/* map[i] = [ファイル, そのファイルの中のはじめの行] */
for(const p of parts){const n=src.split('\n').length;map.push([p.f,n]);src+=p.t+'\n;\n'}
const linter=new Linter({configType:'flat'});
const msgs=linter.verify(src,[{
  languageOptions:{ecmaVersion:2022,sourceType:'script',globals:Object.assign({},globals.browser,winG)},
  rules:{'no-redeclare':['error',{builtinGlobals:false}],'no-undef':'error','no-dupe-keys':'error','no-dupe-args':'error','no-const-assign':'error','no-func-assign':'error','no-class-assign':'error','no-self-assign':'error','no-unsafe-negation':'error','no-dupe-else-if':'error'}
}]);
const where=line=>{let k=0;for(let i=0;i<map.length;i++)if(map[i][1]<=line)k=i;return [map[k][0],line-map[k][1]+1]};
const out=msgs.map(x=>{const [f,l]=where(x.line);return `${f}:${l}:${x.column}  ${x.ruleId||'error'}  ${x.message}`});
for(const o of out)console.log(o);
console.log(out.length?`\n${out.length} こ見つかった`:'見つかった物はありません');
process.exit(out.length?1:0);
