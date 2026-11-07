/* ふきだしの絵：11×11のドット絵（まわりのふち1ドットは、自動で足す）。13×13ドット、1ドット1.5。絵文字の字は、キーとしてだけ使い、絵文字のフォントでは描かない */
const BUBPAL={y:'#ffe680',Y:'#f2bb3c',o:'#ffb866',O:'#f08f3c',r:'#f58a80',R:'#e0584c',h:'#f27c92',p:'#ffb6cc',b:'#a6dcf5',B:'#6cb4e0',g:'#b4e08e',G:'#78b858',n:'#d2a574',N:'#a67c52',t:'#ffd6a0',T:'#eeb078',c:'#fff3da',w:'#ffffff',a:'#e4dccf',A:'#a89e92',d:'#6b5a4a',v:'#d6ecf7',l:'#c8b0f0',L:'#8f78c8'};
const BUBART={
spark:[".....y.....","....yyy....","....yyy....","..yyyyyyy..","yyyyywyyyyy","..yyyyyyy..","....yyy....","....yyy....",".....y.....","...........","..........."],
box:["...........","..nnnnnnn..",".nnnnnnnnn.",".NNNNcNNNN.",".nnnnccnnn.",".nnnnccnnn.",".nnnnnnnnn.",".nnnnnnnnn.",".nNnnnnnNn.",".nnnnnnnnn.","..........."],
laugh:["...yyyyy...","..yyyyyyy..",".yyyyyyyyy.","yyydyyydyyy","yyydyyydyyy","ypyyyyyyypy","yyydddddyyy",".yyydrdyyy.","..yyyrdyy..","...yyyyy...","..........."],
smile:["...yyyyy...","..yyyyyyy..",".yyyyyyyyy.","yyydyyydyyy","yyydyyydyyy","ypyyyyyyypy","yyydyyydyyy",".yyyydyyyy.","..yyyyyyy..","...yyyyy...","..........."],
hurt:["...yyyyy...","..yyyyyyy..",".yyyyyyyyy.","yyyyyyyyyyy","yydddyydddy","yyyyyyyyyyy","ypyyyyyyypy","yyydddddyyy",".yyyyyyyyy.","..yyyyyyy..","...yyyyy..."],
scared:["...vvvvv...","..vvvvvvv..",".vdvvvvvdv.","vvwwvvvwwvv","vvwdvvvwdvv","vvwwvvvwwvv","vvvvvvvvvvv",".vvvdddvvv.",".vvvdddvvv.","..vvvvvvv..","...vvvvv..."],
fire:[".....r.....","....rr.....","....rro....","...rrooor..","...rooyor..","..rrooyyor.","..rooyyyor.","..rooyyyoo.","..rrooyyor.","...rrooorr.","....rrrr..."],
sweat:["...b.......","...b.......","..bbb......",".bbbbb..b..",".bwbbb.bbb.",".bbbbb.bwb.","..bbb..bbb.","........b..","...........","...........","..........."],
drop:[".....b.....",".....b.....","....bbb....","....bbb....","...bbbbb...","..bbbbbbb..","..bwbbbbb..","..bwbbbbB..","..bbbbbBB..","...bbbBB...","....BBB...."],
coffee:["...........",".vvvvvvvv..",".dddddddd..",".vvvvvvvvaa",".vvvvvvvv.a",".vvvvvvvvaa","..vvvvvvv..","...vvvvv...",".aaaaaaaaa.","...........","..........."],
basket:["...........","...NNNNN...","..N.....N..","..N.....N..","nnnnnnnnnnn","nNnNnNnNnNn","nnNnNnNnNnn","nNnNnNnNnNn",".nnnnnnnnn.","..nnnnnnn..","..........."],
hammer:["...........",".aaaaaaaaa.",".awwaaaaAA.",".aaaaaaaAA.",".AAAAAAAAA.","....nN.....","....nN.....","....nN.....","....nN.....","....nN.....","....nN....."],
heart:["..hh...hh..",".hhhh.hhhh.",".hwhhhhhhh.",".hhhhhhhhh.",".hhhhhhhhh.","..hhhhhhh..","...hhhhh...","....hhh....",".....h.....","...........","..........."],
gheart:["..gg...gg..",".gggg.gggg.",".gwggggggg.",".ggggggggg.",".ggggggggG.","..gggggGG..","...gggGG...","....gGG....",".....G.....","...........","..........."],
clap:["..y..y..y..","..y..y..y..","...........",".ttt...ttt.",".tttt.tttt.",".tttt.tttt.",".ttttttttt.",".ttttttttt.","..ttttttt..","...ttttt...","..........."],
wave:["..t.t.t....","..t.t.t.t..","..tttttttt.","..tttttttt.",".ttttttttt.",".ttttttttt.",".ttttttttT.","..tttttttT.","...tttttT..","....tttT...","..........."],
note:[".....BBB...",".....BBBB..",".....B..BB.",".....B...B.",".....B.....",".....B.....","..BBBB.....",".BBBBB.....",".BBBBB.....","..BBB......","..........."],
notes:["...BBBBBBB.","...BBBBBBB.","...B.....B.","...B.....B.","...B.....B.",".BBB...BBB.","BBBB..BBBB.","BBBB..BBBB.",".BB....BB..","...........","..........."],
sprout:["...........","..ggg.ggg..",".ggggGgggg.",".gggg.Gggg.","..ggg.Ggg..",".....G.....",".....G.....",".....G.....","..nnnnnnn..",".nnnnnnnnn.","..........."],
pick:["..aaaaaaa..",".aaaaaaaaa.","aaa.nN.aaaA","aA..nN..AA.","....nN.....","....nN.....","....nN.....","....nN.....","....nN.....","....nN.....","....nN....."],
spring:["...A...A...","....A...A..","...A...A...","....A...A..","...A...A...","...........",".AAAAAAAAA.","AbbbbbbbbbA","AbBbbBbbBbA",".AAAAAAAAA.","..........."],
dizzy:["..yyyyyyy..",".y.......y.","y..yyyyy..y","y.y.....y.y","y.y..y..y.y","y.y..yyyy.y","y.y.......y","y..yyyyyyy.",".y.........","..yyyyyyy..","..........."],
zzz:["...........",".......BBB.","........B..",".......BBB.","...........","...........",".BBBBB.....","....B......","...B.......","..B........",".BBBBB....."],
fish:["...........","...bbbb....","..bBBBBB.b.",".bBBBBBBBBb","bBdBBBBBBBB",".bbbbbbbbBb","..bbbbbbb.b","...bbbb....","...........","...........","..........."],
lantern:[".....N.....","...NNNNN...","..rrrrrrr..",".rrRrRrRrr.","rrrRrRrRrrr","rrrRrRrRrrr","rrrRrRrRrrr",".rrRrRrRrr.","..rrrrrrr..","...NNNNN...",".....y....."],
firework:[".....h.....",".....h.....","..y..h..y..","...y.h.y...","....yhy....","bb.bbwbb.bb","....yhy....","...y.h.y...","..y..h..y..",".....h.....",".....h....."],
gift:["...hh.hh...","..hhhhhhh..","....hhh....","bbbbbhbbbbb","bbbbbhbbbbb",".bbbbhbbbb.",".bbbbhbbbb.",".hhhhhhhhh.",".bbbbhbbbb.",".bbbbhbbbb.","..........."],
pan:["...........","..AAAAAA...",".AAAAAAAA..","AAwwwwwwAA.","AAwwyywwAAN","AAwyyyywAAN","AAwwyywwAA.","AAwwwwwwAA.",".AAAAAAAA..","..AAAAAA...","..........."],
chestnut:[".....N.....","....NnN....","...NNnnN...","..NNNnnnN..",".NNNNNnnnN.",".NNNNNNNNN.",".NNNNNNNNN.",".NNNccccNN.","..NNccccN..","...NNNNN...","..........."],
house:[".....h.....","....hhh....","...hhhhh...","..hhhhhhh..",".hhhhhhhhh.","hhhhhhhhhhh",".ccccccccc.",".cbbcccbbc.",".cbbNNNbbc.",".cccNNNccc.",".cccNNNccc."],
rice:["...........","....www....","...wwwww...","..wwwwwwa..",".wwwwwwwaa.",".wwwwwwwaa.","wwwwwwwwwaa","wwwdddddwaa","wwwdddddwaa",".wwdddddwa.","..........."],
mush:["...........","...rrrrr...",".rrwwrrrrr.","rrwwwrrwwrr","rrrwrrrwwrr","RRRRRRRRRRR","....ccc....","....ccc....","....ccc....","...ccccc...","..........."],
leaf:[".......ggg.",".....ggggg.","....gggggG.","...ggggGgg.","..gggGgggg.","..ggGggg...",".gGgggg....",".Ggggg.....","NN.........","N..........","..........."],
flower:["...pp.pp...","..pppppp...","...pppyyp..","..ppyyyypp.","...ppyyp...","..pppppp...","...pp.pp...",".....G.....",".....G.....","..g..G..g..","...ggGgg..."],
target:["...RRRRR...","..RwwwwwR..",".RwRRRRRwR.","RwRwwwwwRwR","RwRwRRRwRwR","RwRwRyRwRwR","RwRwRRRwRwR","RwRwwwwwRwR",".RwRRRRRwR.","..RwwwwwR..","...RRRRR..."],
dango:[".....N.....","....ppp....","...ppppp...","....ppp....","....www....","...wwwww...","....www....","....ggg....","...ggggg...","....ggg....",".....N....."],
fork:["..A.A.A..A.","..A.A.A..A.","..AAAAA..A.","...AAA...A.","....A....A.","....A....A.","....A....A.","....A....A.","....A....A.","....A....A.","..........."],
anger:["..R.....R..","..RR...RR..","...RR.RR...","....RRR....",".....R.....","....RRR....","...RR.RR...","..RR...RR..","..R.....R..","...........","..........."],
bang:["....RRR....","....RRR....","....RRR....","....RRR....","....RRR....","....RRR....","...........","....RRR....","....RRR....","...........","..........."],
q:["...BBBBB...","..BBBBBBB..","..BB...BBB.",".......BBB.","......BBB..",".....BBB...",".....BB....","...........",".....BB....",".....BB....","..........."],
dots:["...........","...........","...........","...........","...........","..dd.dd.dd.","..dd.dd.dd.","...........","...........","...........","..........."],
unk:["...BBBBB...","..BBBBBBB..","..BB...BBB.",".......BBB.","......BBB..",".....BBB...",".....BB....","...........",".....BB....",".....BB....","..........."]
};
const BUBI={'🪓':'axe','✨':'spark','🌟':'spark','⭐':'spark','📦':'box','😆':'laugh','😄':'laugh','😋':'laugh','😊':'smile','😌':'smile','😣':'hurt','😩':'hurt','😨':'scared','😱':'scared','🔥':'fire','💦':'sweat','💧':'drop','😭':'drop','😢':'drop','☕':'coffee','🧺':'basket','🔨':'hammer','💕':'heart','💗':'heart','💖':'heart','💚':'gheart','👏':'clap','👋':'wave','🎵':'note','♪':'note','🎶':'notes','🌱':'sprout','⛏':'pick','♨':'spring','😵':'dizzyface','💫':'dizzy','💤':'zzz','😴':'zzz','🐟':'fish','🏮':'lantern','🎆':'firework','🎇':'firework','🎁':'gift','🍳':'pan','🏠':'house','🏡':'house','🍙':'rice','🍄':'mush','🌿':'leaf','🌼':'flower','🎯':'target','🍡':'dango','🍴':'fork','💢':'anger','😠':'anger','😤':'anger','❗':'bang','‼':'bang','！':'bang','❓':'q','💭':'dots','💬':'dots'};
const BUBSPR={"spark":[0,0],"box":[1,0],"fire":[2,0],"sweat":[3,0],"coffee":[4,0],"basket":[5,0],"hammer":[0,1],"drop":[1,1],"heart":[2,1],"clap":[3,1],"wave":[4,1],"note":[5,1],"sprout":[0,2],"pick":[1,2],"spring":[2,2],"axe":[3,2],"dizzy":[4,2],"zzz":[5,2],"gheart":[0,3],"fish":[1,3],"lantern":[2,3],"firework":[3,3],"gift":[4,3],"pan":[5,3],"chestnut":[0,4],"notes":[1,4],"house":[2,4],"rice":[3,4],"dots":[4,4],"q":[5,4],"unk":[5,4],"laugh":[0,5],"smile":[1,5],"hurt":[2,5],"scared":[3,5],"dizzyface":[4,5]};/* 32×32のドット絵（6列×6行の1まい。6行めは顔）。読みこむまでは、下の11×11の絵 */
const BUBFACE={};/* 顔の絵文字を、そのまま顔の絵で出すもの（例：{"😊":true}）。ないものは NOFACE のかわりの絵 */
const BUBS={img:null,ok:false};try{BUBS.img=new Image();BUBS.img.onload=()=>{BUBS.ok=true};BUBS.img.src='assets/g/2d6a725d36.webp'}catch(e){}
const bubKey=t=>String(t).replace(/️/g,'');
const BUBRUN={};
function bubRuns(id){/* 色ごとの横の連なり（ふち付き、13×13）。fillRect だけで描く */
  if(BUBRUN[id])return BUBRUN[id];const A=BUBART[id]||BUBART.unk,N=13,g=[];
  for(let y=0;y<N;y++){g.push(new Array(N).fill(null))}
  for(let y=0;y<11;y++)for(let x=0;x<11;x++){const ch=(A[y]||'')[x];if(ch&&ch!=='.'&&BUBPAL[ch])g[y+1][x+1]=BUBPAL[ch]}
  const dk=h=>{const n=parseInt(h.slice(1),16);return'#'+[n>>16,n>>8&255,n&255].map(v=>Math.round(v*.72).toString(16).padStart(2,'0')).join('')};
  const ol=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(g[y][x])continue;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const c=(g[y+dy]||[])[x+dx];if(c){ol.push([x,y,dk(c)]);break}}}
  for(const[x,y,c]of ol)g[y][x]=c;
  const runs=[];for(let y=0;y<N;y++){let x=0;while(x<N){const c=g[y][x];if(!c){x++;continue}let e=x+1;while(e<N&&g[y][e]===c)e++;runs.push([x,y,e-x,c]);x=e}}
  return BUBRUN[id]=runs}
function bubIcon(c,key,cx,cy,k,B){/* (cx,cy) を中心に描く。1ドット k（ふつう1.5）。96×96の絵を、なめらかにちぢめて描く。B（pxBub がかえす、ふきだしの中のまん中と大きさ。画面のピクセル）があれば、ふきだしの中のまん中に入れる。大きくするときはぼかさず、ちぢめるときはなめらかに */
  k=k||1.5;const id=BUBI[bubKey(key)]||'unk',x0=cx-6.5*k,y0=cy-6.5*k,sp=BUBSPR[id];
  if(sp&&BUBS.ok){
    const T=c.getTransform(),n=B?B.s:Math.round(T.a*30*k/1.5),X=B?B.x:T.a*cx+T.e,Y=B?B.y:T.d*cy+T.f;c.save();c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(BUBS.img,sp[0]*96,sp[1]*96,96,96,Math.round(X-n/2),Math.round(Y-n/2),n,n);c.restore();return}
  for(const[x,y,n,col]of bubRuns(id)){c.fillStyle=col;c.fillRect(x0+x*k,y0+y*k,n*k,k)}}
