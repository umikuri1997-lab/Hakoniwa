/* ---------- 2人でおでかけ（トモコレのように） ----------
   なかよし OUTMIN いじょうの2人が、昼（OUTH0〜OUTH1時）に2人ともひまなとき、たまに（OUTP）村のすてきな所（花・水べ・スポット）へ出かける。
   村で1日1組まで（S.outD）。OUTDUR すごしたら、なかよし+OUTBOND・2人ともたのしさ+OUTFUN。出かけているあいだにタップすると、2人の会話（outingTalk）。
   夜・コワイノ・あいてがいなくなったら、とちゅうでやめる（ごほうびなし）。 */
const OUTMIN=60,OUTP=.1,OUTH0=9,OUTH1=17,OUTDUR=60,OUTBOND=3,OUTFUN=10,OUTFAR=30;
const OUTPK={flower:'花のそば',water:'水べ',spot:'すてきな所'};
function outFree(q){if(!q||q.hidden||q.coffin||q.grief||q.hunger<250||q.energy<30)return false;const a=q.act;if(!a)return true;if(!IDLE_ACTS.includes(a.type))return false;return !((a.type==='fish'||a.type==='play')&&a.stage==='do')}
function outKind(k){/* そのマスのとなりにある、すてきな物 */let f='';for(const d of [1,-1,W,-W]){const q=k+d;if(q<0||q>=W*H||Math.abs(q%W-k%W)>1)continue;if(FLOWERS.has(S.obj[q])&&!isBud(q))return 'flower';if(waterJ(q))f=f||'water';if(typeof SPOTJ!=='undefined'&&SPOTJ.has(q))f=f||'spot'}return f}
function outSpot(G,G2){/* 2人がならんで立てる所：stand と、そのとなり（左右） */const free0=j=>walk(j)&&!S.obj[j]&&!(TAKEN&&TAKEN.has(j))&&!(S.fog&&typeof fogAt==='function'&&fogAt(j)),C=[];
  for(let j=0;j<W*H;j++){const d=G.dist[j];if(d<1||d>OUTFAR||!free0(j))continue;const pk=outKind(j);if(!pk)continue;for(const s of [1,-1]){const j2=j+s;if(Math.abs(j2%W-j%W)!==1||!free0(j2)||G2.dist[j2]<0||G2.dist[j2]>OUTFAR)continue;C.push([j,j2,pk]);break}}
  return C.length?pick(C):null}
function goOuting(r,G){if(IS_STORY_REPLAY||(typeof MEMRUN!=='undefined'&&MEMRUN)||S.outD===callDay()||Math.random()>=OUTP)return false;const h=hour();if(h<OUTH0||h>=OUTH1||S.rain)return false;
  const M=S.res.filter(q=>q!==r&&bondOf(r,q)>=OUTMIN&&!(typeof qrPair==='function'&&qrPair(r,q))&&outFree(q));if(!M.length)return false;const q=pick(M),G2=bfs(q.x|0,q.y|0),P=outSpot(G,G2);if(!P)return false;
  const[j,j2,pk]=P;S.outD=callDay();endAct(q);startAct(r,G,'outing',j,{mate:q.id,pk,lead:1,dur:OUTDUR});startAct(q,G2,'outing',j2,{mate:r.id,pk,dur:OUTDUR});
  if(!r.act||r.act.type!=='outing'||!q.act||q.act.type!=='outing'){for(const x of[r,q])if(x.act&&x.act.type==='outing')endAct(x);S.outD=null;return false}
  logEv(r.name+'と'+q.name+'が、'+OUTPK[pk]+'へ出かけた');return true}
const outMate=(r,a)=>{const q=S.res.find(x=>x.id===a.mate);return q&&q.act&&q.act.type==='outing'&&q.act.mate===r.id?q:null};
ACT.outing={start(r,a){r.bubble='🎵'},
  tick(r,a,dt){if(a.fin)return;const q=outMate(r,a);if(!q){a.gone=1;return}if(q.act.stage==='do'){r.face=q.x>=r.x?1:-1;a.bt=(a.bt||0)+dt;if(a.bt>5){a.bt=0;r.bubble=pick(['🎵','😊','💕','💬'])}if(!a.mur&&typeof chatMurmur==='function'&&a.lead)chatMurmur(r,q)}else a.t=Math.min(a.t,1)},/* あいてが着くまでは、時間をすすめない */
  done:(r,a)=>a.fin||a.gone||a.t>=a.dur||isNight()||enemyLive(),
  end(r,a){r.bubble='';if(a.gone||!a.fin&&a.t<a.dur)return;r.fun=Math.min(100,r.fun+OUTFUN);if(a.fin)return;/* さきにおわった子が、なかよしをふやし、あいても、おわりにする */
    const q=outMate(r,a);if(q)q.act.fin=1;const m=q||S.res.find(x=>x.id===a.mate);if(m){bondAdd(r,m,OUTBOND,'outing');memo('heart',r.name+'と'+m.name+'が、'+OUTPK[a.pk]+'ですごした')}}};
ACT_LBL.outing='なかよしと出かけている';
/* タップすると、2人の会話（その場所の話。ぜんぶ出しおわるまで同じ物は出さない） */
const OUTTALK={
 flower:[[[0,'この花、いいにおいだね。'],[1,'#joy|うん。ずっと、ここにいたいくらい。'],[0,'また、いっしょに来ようね。']],
  [[0,'ねえ、この花の色、なにかににてない？'],[1,'#tilt|うーん……夕やけの空かな？'],[0,'#joy|それだ！']],
  [[1,'花って、毎日すこしずつかわるんだね。'],[0,'うん。きのうより、ひらいてる。'],[1,'#joy|見にきて、よかった。']]],
 water:[[[0,'水の音、きもちいいね。'],[1,'うん。きらきらしてる。'],[0,'#joy|ずっと見てても、あきないね。']],
  [[1,'#point|あ、いま、さかながはねたよ！'],[0,'#surprise|ほんと？ 見のがしちゃった。'],[1,'#joy|じゃあ、もうすこし、ここにいよう。']],
  [[0,'水にうつった空、きれいだね。'],[1,'うん。空がふたつあるみたい。'],[0,'#joy|となりにいると、なんだかおちつくな。']]],
 spot:[[[0,'ここ、すてきな場所だね。'],[1,'#joy|うん。みんなで作った村だもん。'],[0,'また、いっしょに来ようね。']],
  [[1,'ねえ、ここでなにしてあそぶ？'],[0,'#tilt|うーん……ならんですわってるだけでも、たのしいよ。'],[1,'#joy|うん、そうだね。']],
  [[0,'この村、どんどんにぎやかになるね。'],[1,'うん。きみがいてくれて、うれしいよ。'],[0,'#shy|えへへ……ぼくも。']]]};
function outingTalk(r){const a=r.act,q=a&&outMate(r,a);if(!q)return false;const A=a.lead?r:q,B=a.lead?q:r,L=OUTTALK[a.pk]||OUTTALK.spot,C=L[L.indexOf(pickFresh('out:'+a.pk,L))];
  dialog(C.map(([s,t],i)=>{const sp=s?B:A;return[sp.name,chatTone(t,sp,i)]}));return true}
