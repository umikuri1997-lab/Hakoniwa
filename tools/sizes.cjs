// index.html の読みこみの一覧（U）の、ファイルの大きさの表（E）を、いまのファイルの大きさで書きなおす。
// 公開のとき（.github/workflows/pages.yml）に動く。手で E を書かない。
// 使い方: node tools/sizes.cjs [index.html のある所（はじめはこのリポジトリ）]
const fs=require('fs'),path=require('path');
const root=process.argv[2]||path.join(__dirname,'..');
const f=path.join(root,'index.html');
const s=fs.readFileSync(f,'utf8');
const re=/var U=\[([^\]]*)\],E=\[[^\]]*\]/;
const m=s.match(re);
if(!m){console.error('index.html に U・E の一覧がありません');process.exit(1)}
const U=JSON.parse('['+m[1]+']');
const E=U.map(u=>fs.statSync(path.join(root,u.split('?')[0])).size);
fs.writeFileSync(f,s.replace(re,'var U=['+m[1]+'],E=['+E.join(',')+']'));
console.log('E を '+E.length+' こ書きなおしました');
