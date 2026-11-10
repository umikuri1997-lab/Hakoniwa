/* テストをぜんぶ動かす。サーバーも自分で立てる（GAME_URL があれば、それを使う）。
   使い方：node tools/tests/run-all.cjs [名前の一部...]   例：node tools/tests/run-all.cjs fog story
   ブラウザ：CHROME_PATH（なければ /opt/pw-browsers/chromium、それもなければテストの中の決まり）。
   終わりに、通った数と、落ちたテストのさいごの数行を出す。落ちたら終了コード1。
   まとめて動かすと重くて落ちるテストは、1本ずつもう1回動かして、それで通れば「2回めで通った」と出す。 */
const serve=require('../sim/serve.cjs'),fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'../..');
const want=process.argv.slice(2),tests=fs.readdirSync(__dirname).filter(f=>f.endsWith('.cjs')&&f!=='run-all.cjs'&&(!want.length||want.some(w=>f.includes(w)))).sort();
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
