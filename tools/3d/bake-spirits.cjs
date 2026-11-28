// せいれいの3Dの形を書き出す：tools/3d/bake-spirits.html をブラウザで開き、形を assets/3d/sp-<中身の番号>.bin と js/3d/spirit-data.js（場所と手足の骨）に書く。
// 使い方: node tools/3d/bake-spirits.cjs （せいれいのモデル tools/art/spirit3d/model/*.fbx をかえたら動かす）
const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto');const {chromium}=require('playwright');
const ROOT=path.join(__dirname,'..','..');
const srv=http.createServer((q,r)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return}r.writeHead(200,{'Content-Type':f.endsWith('.js')?'text/javascript':f.endsWith('.html')?'text/html':'application/octet-stream'});r.end(d)})}).listen(0,async()=>{
  const b=await chromium.launch(),p=await b.newPage();p.on('pageerror',e=>console.error(e));
  await p.goto('http://127.0.0.1:'+srv.address().port+'/tools/3d/bake-spirits.html');await p.waitForFunction(()=>window.__bake,null,{timeout:120000});
  const {meta,b64}=await p.evaluate(()=>window.__bake);await b.close();srv.close();
  const buf=Buffer.from(b64,'base64'),h=crypto.createHash('sha1').update(buf).digest('hex').slice(0,10),dir=path.join(ROOT,'assets','3d');fs.mkdirSync(dir,{recursive:true});
  for(const f of fs.readdirSync(dir))if(/^sp-[0-9a-f]+\.bin$/.test(f))fs.unlinkSync(path.join(dir,f));
  fs.writeFileSync(path.join(dir,'sp-'+h+'.bin'),buf);
  fs.writeFileSync(path.join(ROOT,'js','3d','spirit-data.js'),'/* せいれいの3Dの形の場所（tools/3d/bake-spirits.cjs が書く。手で直さない） */\nexport const SPFILE=\'assets/3d/sp-'+h+'.bin\';\nexport const SPDATA='+JSON.stringify(meta)+';\n');
  console.log('sp-'+h+'.bin',(buf.length/1e6).toFixed(2)+'MB');
});
