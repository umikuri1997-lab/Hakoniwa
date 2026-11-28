// 3Dで使う絵（地面・布）を、試作 proto3d/tex から assets/3d に、中身の番号つきの名前でうつし、js/3d/files.js に場所を書く。
// 使い方: node tools/3d/copy-tex.cjs
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'proto3d','tex'),DST=path.join(ROOT,'assets','3d');
const L={grass:'g_grass.jpg',dirt:'g_dirt.jpg',cliff:'g_cliff.jpg',cloth:'m_cloth.jpg'},out={};
fs.mkdirSync(DST,{recursive:true});
for(const [k,f] of Object.entries(L)){const b=fs.readFileSync(path.join(SRC,f)),h=crypto.createHash('sha1').update(b).digest('hex').slice(0,10),n=k+'-'+h+path.extname(f);
  for(const g of fs.readdirSync(DST))if(g.startsWith(k+'-')&&g!==n)fs.unlinkSync(path.join(DST,g));fs.writeFileSync(path.join(DST,n),b);out[k]='assets/3d/'+n}
fs.writeFileSync(path.join(ROOT,'js','3d','files.js'),'/* 3Dの絵の場所（tools/3d/copy-tex.cjs が書く。手で直さない）。絵は Poly Haven の CC0（leafy_grass・dirt_floor・cliff_side） */\nexport const TEX='+JSON.stringify(out)+';\n');
console.log(out);
