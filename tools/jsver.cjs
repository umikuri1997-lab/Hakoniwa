// 公開のとき（.github/workflows/pages.yml）に動く。index.html の読みこみの一覧（U）の ?v= を、ファイルごとの中身の番号（sha1 の先8けた）に書きかえる。
// かわっていないファイルは番号がかわらないので、スマホは保存（キャッシュ）を使い、読みなおさない。
// 使い方: node tools/jsver.cjs [index.html のある所（はじめはこのリポジトリ）]
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=process.argv[2]||path.join(__dirname,'..');
const f=path.join(root,'index.html');
const h=(...ps)=>{const c=crypto.createHash('sha1');for(const p of ps)c.update(fs.readFileSync(path.join(root,p)));return c.digest('hex').slice(0,8)};
let s=fs.readFileSync(f,'utf8'),n=0;
s=s.replace(/"([\w\/.-]+\.js)\?v=[^"]*"/g,(m,p)=>{n++;return '"'+p+'?v='+h(p)+'"'});
fs.writeFileSync(f,s);
console.log('?v= を '+n+' こ書きなおしました');
