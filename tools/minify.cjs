// 公開のとき（.github/workflows/pages.yml）に動く。index.html の読みこみの一覧（U）の .js から、注記（コメント）と空白をとる（terser）。
// 名前はかえない・式も組みかえない（compress・mangle は切り）。ファイルは1つにまとめない（かわったファイルだけ読みなおすしくみ jsver.cjs・sw.js をのこす）。
// リポジトリのコードは、そのまま。tools/jsver.cjs・tools/sizes.cjs より先に動かす（番号と大きさは、ちぢめたあとの中身で作る）。
// 使い方: node tools/minify.cjs <index.html のある所（公開用にうつしたフォルダ）>
const fs=require('fs'),path=require('path');
const {minify}=require('terser');
const root=process.argv[2];
if(!root){console.error('公開用にうつしたフォルダをわたしてください（リポジトリのコードは、ちぢめない）');process.exit(1)}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const m=html.match(/var U=\[([^\]]*)\],E=/);
if(!m){console.error('index.html に読みこみの一覧 U がありません');process.exit(1)}
const U=JSON.parse('['+m[1]+']').map(u=>u.split('?')[0]);
(async()=>{let a=0,b=0;
  for(const u of U){const f=path.join(root,u),src=fs.readFileSync(f,'utf8');
    const r=await minify(src,{compress:false,mangle:false,ecma:2022,format:{comments:false}});
    if(typeof r.code!=='string')throw new Error(u+' をちぢめられませんでした');
    fs.writeFileSync(f,r.code);a+=Buffer.byteLength(src);b+=Buffer.byteLength(r.code)}
  console.log(U.length+' このファイル：'+(a/1e6).toFixed(2)+'MB → '+(b/1e6).toFixed(2)+'MB');
})().catch(e=>{console.error(e);process.exit(1)});
