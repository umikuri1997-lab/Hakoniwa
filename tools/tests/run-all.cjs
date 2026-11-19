/* テストをぜんぶ動かす。サーバーも自分で立てる（GAME_URL があれば、それを使う）。
   使い方：node tools/tests/run-all.cjs [名前の一部...]   例：node tools/tests/run-all.cjs fog story
          node tools/tests/run-all.cjs --changed [くらべる先]   main（なければ くらべる先）からかえた所にかかわるテストだけ（changedTests）
   ブラウザ：CHROME_PATH（なければ /opt/pw-browsers/chromium、それもなければテストの中の決まり）。
   終わりに、通った数と、落ちたテストのさいごの数行を出す。落ちたら終了コード1。
   まとめて動かすと重くて落ちるテストは、1本ずつもう1回動かして、それで通れば「2回めで通った」と出す。 */
const serve=require('../sim/serve.cjs'),fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'../..');
const cp=require('child_process'),ALL=fs.readdirSync(__dirname).filter(f=>f.endsWith('.cjs')&&f!=='run-all.cjs').sort();
/* かえた所にかかわるテスト：くらべる先（origin/main）から、いまの作業（まだコミットしていない所も）までにかわった
   js/*.js の行の、関数・変数の名前（その行で作る関数と、行のはじめで作る変数の名前・その行をふくむ関数の名前）が出てくるテストと、
   かえたファイルと同じ名前のテスト（gear.js なら gear.cjs）。関数の中の変数（back・box・row など）は見ない（ふつうの言葉なので、関係のないテストが大量にえらばれた）。
   CHMANY 本より多くのテストに出てくる名前は、よく使う名前なので見ない。かえたテストそのものも入れる。 */
const CHMANY=20;
function changedTests(base){
  const git=a=>cp.execSync('git '+a,{cwd:root,encoding:'utf8',maxBuffer:1<<28});
  const src=Object.fromEntries(ALL.map(f=>[f,fs.readFileSync(path.join(__dirname,f),'utf8')])),why={};
  const add=(f,w)=>{(why[f]=why[f]||[]).push(w)};
  const files=git('diff --name-only '+base).split('\n').filter(Boolean).concat(git('ls-files --others --exclude-standard').split('\n').filter(Boolean));
  const names=new Set();
  for(const f of files){
    if(f.startsWith('tools/tests/')&&src[f.slice(12)])add(f.slice(12),'テストをかえた');
    if(!/^js\/[^/]+\.js$/.test(f)||!fs.existsSync(path.join(root,f)))continue;
    {const t=path.basename(f,'.js')+'.cjs';if(src[t])add(t,f)}/* かえたファイルと同じ名前のテスト */
    const txt=fs.readFileSync(path.join(root,f),'utf8').split('\n'),d=git('diff -U0 '+base+' -- '+f);
    const hunks=[...d.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)];
    if(!hunks.length)hunks.push([0,'1',String(txt.length)]);/* まだ入れていないファイルは、ぜんぶ */
    for(const m of hunks){const s=+m[1],n=m[2]===undefined?1:+m[2];
      for(let i=Math.max(0,s-1);i<s-1+Math.max(n,1)&&i<txt.length;i++)for(const k of txt[i].matchAll(/(?:\bfunction\s+|^(?:const|let|var)\s+)([A-Za-z_$][\w$]{2,})/g))names.add(k[1]);
      for(let i=s-2;i>=0;i--){const k=txt[i].match(/^(?:async\s+)?function\s+([\w$]+)|^(?:const|let|var)\s+([\w$]+)\s*=/);if(k){names.add(k[1]||k[2]);break}}}
  }
  for(const t of names){const re=new RegExp('\\b'+t.replace(/\$/g,'\\$')+'\\b'),h=ALL.filter(f=>re.test(src[f]));if(h.length<=CHMANY)h.forEach(f=>add(f,t))}
  return why;
}
const argv=process.argv.slice(2),chI=argv.indexOf('--changed');let tests;
if(chI>=0){
  const base=argv[chI+1]&&!argv[chI+1].startsWith('-')?argv[chI+1]:'origin/main',why=changedTests(base);tests=ALL.filter(f=>why[f]);
  console.log(base+' からかえた所にかかわるテスト：'+tests.length+'/'+ALL.length+' 本');
  for(const f of tests)console.log('  '+f+'（'+why[f].slice(0,4).join('・')+(why[f].length>4?' ほか':'')+'）');
  if(!tests.length){console.log('動かすテストはありません');process.exit(0)}
}else tests=ALL.filter(f=>!argv.length||argv.some(w=>f.includes(w)));
(async()=>{
  const env={...process.env};let server=null;
  if(!env.GAME_URL){server=await serve();env.GAME_URL='http://127.0.0.1:'+server.address().port}
  if(!env.CHROME_PATH&&fs.existsSync('/opt/pw-browsers/chromium'))env.CHROME_PATH='/opt/pw-browsers/chromium';
  /* 子プロセスは、待っているあいだもサーバーが動くように、止めずに待つ（spawnSync だとサーバーが返事できない） */
  const runOne=f=>new Promise(res=>{let out='';const c=spawn(process.execPath,[path.join(__dirname,f)],{env}),t=setTimeout(()=>c.kill('SIGKILL'),400000);c.stdout.on('data',d=>out+=d);c.stderr.on('data',d=>out+=d);c.on('close',code=>{clearTimeout(t);res({ok:code===0,out})})});
  const bad=[];let ok=0;
  for(const f of tests){let r=await runOne(f),again=false;if(!r.ok){const r2=await runOne(f);if(r2.ok){again=true;r=r2}}
    if(r.ok){ok++;console.log((again?'ok（2回めで通った） ':'ok ')+f)}else{bad.push([f,r.out]);console.log('FAIL '+f)}}
  console.log('\n'+ok+'/'+tests.length+' 本が通った');
  for(const [f,o] of bad)console.log('\n--- '+f+'\n'+o.split('\n').filter(l=>l.trim()&&!/^\s+at /.test(l)).slice(-8).map(l=>l.slice(0,300)).join('\n'));
  if(server)server.close();process.exit(bad.length?1:0);
})();
