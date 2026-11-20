#!/usr/bin/env python3
"""洞窟の地図（js/cave.js の CVFLOORS の map・lv・chest）を作る道具。
持ち主のたのみで、どの階も、まん中の底の見えない大穴（O）のまわりを、ふちにそっておりていく（STORY.md の「土の谷の大穴とバケモノ」）。
- 大穴は、だ円にでこぼこをつけた形。そのまわりに、はばのある道（ふち道）。ふち道は北が高く、南へおりていく（がけの正面は、高い所が北のときだけ見えるので）。
- しかけの部屋は、ハンコ（ROOMS の文字の絵）で置き、ふち道へ通路でつなぐ。
- 作ったら、つながりをたしかめる（入口から坂まで、門をあけずに行ける・どこからでも入口か坂へもどれる・門の先は、門をあけないと行けない）。
使いかた：python3 tools/cave/cave_maps.py [--write]   （--write で js/cave.js の CVFLOORS を書きかえる）"""
import math,json,re,sys,os
W,H=56,44
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..')
WALK=set('.SR!g^VHcizqI')          # 歩ける（q・z はくずれるまで）
GATE=set('hkDEFL12Wb')               # 門をあけると歩ける（W はまもりの光でくずれる）
def hsh(x,y,k=0):
    n=(x*73856093)^(y*19349663)^(k*83492791);n=(n^(n>>13))*1274126177&0xffffffff;return ((n^(n>>16))&0xffff)/65535
def noise(u,v,k):
    i,j=math.floor(u),math.floor(v);s,t=u-i,v-j;s=s*s*(3-2*s);t=t*t*(3-2*t)
    a,b,c,d=hsh(i,j,k),hsh(i+1,j,k),hsh(i,j+1,k),hsh(i+1,j+1,k);return a*(1-s)*(1-t)+b*s*(1-t)+c*(1-s)*t+d*s*t
def mirror(rows):return[r[::-1] for r in rows]
class Map:
    def __init__(s,seed):
        s.g=[['#']*W for _ in range(H)];s.lv=[[1]*W for _ in range(H)];s.seed=seed;s.chest={}
    def put(s,x,y,c):
        if 0<=x<W and 0<=y<H:s.g[y][x]=c
    def hole(s,cx,cy,rx,ry,ring):
        """大穴（O）と、まわりのふち道（.）。ring：ふち道のはば（だ円の倍で）"""
        for y in range(H):
            for x in range(W):
                a=math.atan2((y-cy)/ry,(x-cx)/rx);d=math.hypot((x-cx)/rx,(y-cy)/ry)
                e=1+.13*(noise(math.cos(a)*2+5,math.sin(a)*2+5,s.seed)-.5)*2   # 穴のふちのでこぼこ
                o=ring+.12*(noise(math.cos(a)*2.6+9,math.sin(a)*2.6+9,s.seed+3)-.5)*2
                if d<e:s.g[y][x]='O'
                elif d<e*o:s.g[y][x]='.'
    def carve(s,pts,w=1):
        """通路：点から点へ、まっすぐ（たて・よこ）。w：はばの半分"""
        for (x0,y0),(x1,y1) in zip(pts,pts[1:]):
            n=max(abs(x1-x0),abs(y1-y0))
            for i in range(n+1):
                x=round(x0+(x1-x0)*i/n) if n else x0;y=round(y0+(y1-y0)*i/n) if n else y0
                for dy in range(-w,w+1):
                    for dx in range(-w,w+1):
                        if 0<=x+dx<W and 0<=y+dy<H and s.g[y+dy][x+dx] in '#':s.g[y+dy][x+dx]='.'
    def blob(s,cx,cy,rx,ry):
        for y in range(H):
            for x in range(W):
                if math.hypot((x-cx)/rx,(y-cy)/ry)<1+.25*(noise(x*.4,y*.4,s.seed+7)-.5) and s.g[y][x]=='#':s.g[y][x]='.'
    def stamp(s,x0,y0,rows,lv=None,chest=None):
        """ハンコ：' ' はそのまま。chest：ハンコの中の T（左上から順）にわたす中身のならび"""
        n=0
        for dy,r in enumerate(rows):
            for dx,c in enumerate(r):
                if c==' ':continue
                x,y=x0+dx,y0+dy;s.put(x,y,c)
                if lv is not None:s.lv[y][x]=lv
                if c in 'TZ' and chest:s.chest['%d,%d'%(x,y)]=chest[n];n+=1
    def levels(s,f):
        for y in range(H):
            for x in range(W):s.lv[y][x]=f(x,y)
    def rows(s):return[''.join(r) for r in s.g],[''.join(str(v) for v in r) for r in s.lv]

# ---------- つながりのたしかめ（js/cave.js の cvWalk・cvStepOK と同じ決まり） ----------
def check(m,name):
    g,lv=m.g,m.lv;find=lambda c:[(x,y) for y in range(H) for x in range(W) if g[y][x]==c]
    S=find('S')[0];R=find('R')[0]
    def ok(x,y,gates):
        if not(0<=x<W and 0<=y<H):return False
        c=g[y][x];return c in WALK or (gates and c in GATE)
    def step(a,b):
        la,lb=lv[a[1]][a[0]],lv[b[1]][b[0]]
        return lb<=la or (lb==la+1 and g[a[1]][a[0]]=='^')
    def reach(src,gates):
        seen={src};q=[src]
        while q:
            p=q.pop()
            for dx,dy in((1,0),(-1,0),(0,1),(0,-1)):
                n=(p[0]+dx,p[1]+dy)
                if not(ok(*n,gates) and step(p,n)):continue
                while g[n[1]][n[0]]=='I':   # 氷の上は、ぶつかるまで、すべる（js の cvBfs と同じ）
                    n2=(n[0]+dx,n[1]+dy)
                    if not(ok(*n2,gates) and step(n,n2)):break
                    n=n2
                if n not in seen:seen.add(n);q.append(n)
        return seen
    r0=reach(S,False);r1=reach(S,True);bad=[]
    for p in r1:
        if g[p[1]][p[0]]=='I':continue
        if S not in reach(p,True) and R not in reach(p,True):bad.append(p)
    # 物のとなりに立てるか（宝箱・化石・しかけ）
    lone=[]
    for y in range(H):
        for x in range(W):
            if g[y][x] in 'ToxymtWbZFLDE':
                if not any((x+dx,y+dy) in r1 for dx,dy in((1,0),(-1,0),(0,1),(0,-1))):lone.append((g[y][x],x,y))
    print(name,'入口→坂（門なし）',R in r0,' 門の先も入れて',len(r1),'マス  もどれない',len(bad),bad[:5],' とどかない物',lone)
    return R in r0 and not bad and not lone

# ---------- 1階：ねっこの坑道 ----------
def floor0():
    m=Map(11);cx,cy=28,22
    m.hole(cx,cy,10.5,7,1.5)
    # 高さ：北が高く、南へおりる
    m.levels(lambda x,y:3 if y<=18 else 2 if y<=25 else 1)
    # 入口（北）：大穴のふちの上の小部屋。ひびの床の近道と、まわり道
    m.blob(28,5,4,2.6);m.carve([(28,7),(28,11)],0);m.carve([(25,7),(23,7),(23,12),(26,12)],0)
    m.stamp(27,4,['.S.'])
    m.stamp(28,8,['q','q'])     # ひびの床（まっすぐの近道）。まわり道は西の通路
    # 下へおりる坂（南）：落ちてくる岩の通路
    m.carve([(28,30),(28,36)],0);m.blob(28,38,4,2.4);m.stamp(28,32,['!','!','!']);m.stamp(27,38,['.R.'])
    # 土：岩をおす（西の上）。くぼみ h を、岩 b でうめると、宝箱と化石の所へ
    m.stamp(3,9,['###########',
                  '#####..####',
                  '##..h.....#',
                  '#.o.h#b....',
                  '#...h......',
                  '#T..h......',
                  '#...h.....#',
                  '##o.h....g#',
                  '###########'],lv=3,chest=[{'item':'doki'}])
    m.carve([(13,13),(17,13)],1)
    # 火：たいまつ3本で、石のとびら（東の上）
    m.stamp(40,8,['##############',
                  '##.......#####',
                  '##......t#####',
                  '#.t.......##.#',
                  '.....c....D.T#',
                  '..........##.#',
                  '##.......#####',
                  '##...t...#####',
                  '##############'],lv=3,chest=[{'item':'oldlantern'}])
    m.carve([(38,13),(41,13)],1)
    # 水：水門 x・y の片方だけ（西の下）。みぞ 1・2
    m.stamp(2,27,['######x#######',
                  '##..g#1.....#.',
                  '#.T...1.......',
                  '##...#1.....##',
                  '#######22222y#',
                  '#######.....##',
                  '########o.o###',
                  '##############'],lv=1,chest=[{'fukuro':1,'pt':20}])
    m.carve([(15,29),(19,29)],0)
    # 風と木：風車 m・葉の足場 k（東の下）。風車がまわると、風のとびら E
    m.stamp(40,27,mirror(['##############',
                   '#####kkkk#####',
                   '##o.kkkkk..g##',
                   '#...kkTkk....#',
                   '#m..kk.kk.....',
                   '##o....kk...##',
                   '#####kkkk#####',
                   '##############']),lv=1,chest=[{'mapPc':1,'pt':30}])
    m.carve([(36,31),(40,31)],0)
    # 風のとびら E の先：化石のくぼみ（坂の近く）
    m.stamp(31,37,['E.o','#o#'],lv=1)
    # うすい壁 W の先の、かくれた宝箱（西の下、ふち道の南）
    m.stamp(21,32,['#W#','o.T','###'],lv=1,chest=[{'fukuro':1,'pt':50}])
    # 地底の水・石じゅん・光るきのこ・コワイノ（ふち道の上）
    m.stamp(33,12,['~~~','~~~~'],lv=3)
    for (x,y,c) in[(20,14,'A'),(37,20,'A'),(18,26,'A'),(22,11,'g'),(39,24,'g'),(31,31,'g'),(19,21,'g'),(34,10,'c'),(17,18,'c'),(38,27,'i'),(24,32,'c'),(36,17,'c'),(16,24,'c')]:
        if m.g[y][x]=='.':m.put(x,y,c)
    # 坂：西のふち道の段のさかいに、のぼる坂
    for (x,y) in[(17,19),(18,26),(39,19),(38,26)]:m.put(x,y,'^')
    return m

# ---------- 2階：地底のみずうみ ----------
def floor1():
    m=Map(23);cx,cy=30,25
    m.hole(cx,cy,9.5,6,1.5)
    m.levels(lambda x,y:2 if y<=25 else 1)
    # 入口（北）：だんだんの広間。上の段（3）から下の段（2）へは、とびおりる。のぼるのは坂から
    T=['################################',
       '####...###########......########',
       '##.......#####....A.........####',
       '##...S...................g...###',
       '##.......###..^...............##',
       '####...####.........c.......o..#',
       '############.....A.......c....##',
       '#############.^..............###',
       '##############...i.....c....####',
       '##################......########']
    LV=['11111111111111111111111111111111',
        '11113331111111111133333311111111',
        '11333333311111333333333333331111',
        '11333333333333333333333333333111',
        '11333333311122222222222222222211',
        '11113331111222222222222222222221',
        '11111111111111222222222222222211',
        '11111111111111222222222222222111',
        '11111111111111222222222222221111',
        '11111111111111111122222211111111']
    m.stamp(10,0,T)
    for dy,r in enumerate(LV):
        for dx,c in enumerate(r):
            if T[dy][dx]!='#':m.lv[dy][10+dx]=max(2,int(c))   # 下の段は2
    m.carve([(30,9),(30,15)],1)
    # みずうみ（西）：島の宝箱。岩 b を西のくぼみ h へおすと、島へわたれる（岩は水の上へはおせない）
    m.stamp(1,15,['#######.....####',
                  '####....~~~~..##',
                  '##..~~~~~~~~~...',
                  '#~~~~~~~~~~~~~..',
                  '#~~~~T.hb.~~~~..',
                  '#~~~~~~~~.~~~~..',
                  '##~~~~~~~.~~~~..',
                  '###..~~~~.~~~..#',
                  '#####...........',
                  '########...#####'],lv=2,chest=[{'fukuro':1,'pt':40}])
    m.carve([(16,19),(20,19)],1);m.carve([(16,23),(19,23)],0)
    # 風：風車 m（北西）。風車がまわると、風のとびら E の先の宝箱。うすい壁 W
    m.stamp(1,6,['##########',
                  '##..o.####',
                  '#m.......W',
                  '##.....###',
                  '######.###',
                  '######E###',
                  '#####T.o##',
                  '##########'],lv=2,chest=[{'mapPc':1,'pt':40}])
    m.carve([(11,8),(13,8),(13,10),(29,10)],0)
    # 火：たいまつ3本で、石のとびら D の先の宝箱（東）
    m.stamp(42,13,['#############',
                   '###...#######',
                   '##t....######',
                   '#.....c...t##',
                   '.........####',
                   '#.......t####',
                   '##...########',
                   '####.########',
                   '####D########',
                   '###.T.#######',
                   '#############'],lv=2,chest=[{'fukuro':1,'pt':60}])
    m.carve([(38,17),(42,17)],0)
    # 水：水門 x・y の片方だけ（南西）。木：葉の足場 k の先の宝箱
    m.stamp(1,29,['##############',
                  '####kkk##x##..',
                  '##..kkk..1....',
                  '##T.kkk..1....',
                  '##..kkk..1#y.#',
                  '####kkk###2222',
                  '##########o..o',
                  '###########.o#',
                  '##############'],lv=1,chest=[{'mapPc':1,'pt':60}])
    m.carve([(15,31),(21,31)],0)
    # 下へおりる坂（南）：落ちてくる岩の通路
    m.carve([(30,32),(30,37)],0);m.blob(30,39,4,2.3);m.stamp(30,34,['!','!']);m.stamp(29,39,['.R.'])
    m.stamp(33,10,['~~','~~~'],lv=2)
    for (x,y,c) in[(25,15,'A'),(37,20,'A'),(21,28,'g'),(39,29,'g'),(24,33,'c'),(36,31,'i'),(21,20,'c'),(39,22,'c')]:
        if m.g[y][x]=='.':m.put(x,y,c)
    for (x,y) in[(19,26),(41,26)]:
        if m.g[y][x]=='.':m.put(x,y,'^')
    return m

# ---------- 3階：氷のほらあな ----------
def floor2():
    m=Map(37);cx,cy=34,28
    m.hole(cx,cy,8.5,6,1.45)
    m.levels(lambda x,y:2 if y<=18 else 1)
    # 入口（北西）
    m.blob(6,6,4,3);m.stamp(5,6,['.S.'])
    # すべる氷の広間（北）：石じゅん A にぶつかって止まる。上の氷づけの宝箱 Z は、すべって行く
    m.stamp(10,3,['#############IZ##############',
                  '###########IIIIII#############',
                  '#########IIIIIIIIIII####......',
                  '.....IIIIIAIIIIIIIIIIIA.......',
                  '#...IIIIIIIIIIIIIIAIIII.......',
                  '##..IIIIAIIIIIIIIIIIIII......#',
                  '###.IIIIIIIIIIIIIIIIIIII....##',
                  '####IIIIIIIIIIIIIIAIIIII...###',
                  '#####IIIIIIIIIIIIIIIIII....###',
                  '######IIIIIIIIIIIIIIII...#####',
                  '#######IIIIII....I.......#####',
                  '##########.....##........#####'],lv=2,chest=[{'fukuro':1,'pt':80}])
    m.carve([(10,6),(9,6)],0);m.carve([(33,13),(33,19)],1)
    # 氷のかべ F（西の下）：火のせいれいがとかすと、氷づけの宝箱 Z と宝箱 T の部屋へ
    m.stamp(2,21,['############',
                  '###.......##',
                  '##..Z...c..#',
                  '#.........!F',
                  '#..T.......F',
                  '##.....!..##',
                  '###......###',
                  '############'],lv=1,chest=[{'item':'oldlantern','pt':60},{'fukuro':1,'pt':50}])
    m.carve([(14,24),(23,24)],0)
    # 東の部屋：つらら ! の下をぬけて、宝箱
    m.stamp(46,18,['#########',
                   '##...####',
                   '.....T..#',
                   '..!...!.#',
                   '.....c..#',
                   '##....###',
                   '#########'],lv=1,chest=[{'mapPc':1,'pt':50}])
    m.carve([(39,21),(47,21)],0)
    # 下へおりる坂（南）
    m.carve([(34,36),(34,39)],0);m.blob(34,40,4,2);m.stamp(33,40,['.R.'])
    for (x,y,c) in[(24,22,'A'),(44,30,'A'),(26,34,'g'),(43,24,'g'),(40,35,'c'),(25,30,'i')]:
        if m.g[y][x]=='.':m.put(x,y,c)
    for (x,y) in[(25,19),(43,19)]:
        if m.g[y][x]=='.':m.put(x,y,'^')
    return m

# ---------- 4階：マグマのほらあな ----------
def floor3():
    m=Map(53);cx,cy=28,23
    m.hole(cx,cy,9.5,6.5,1.5)
    m.levels(lambda x,y:2 if y<=22 else 1)
    # 入口（北）
    m.carve([(28,6),(28,12)],1);m.blob(28,5,4,2.4);m.stamp(27,4,['.S.'])
    # 西のふち道：溶岩の川を、ゆらぐ岩の橋 z でわたる（3回通るとくずれる。東まわりでも行ける）
    for y in range(20,23):
        for x in range(8,21):
            if m.g[y][x]!='O':m.put(x,y,'~')
    m.stamp(17,20,['z','z','z'])
    # 東のふち道：あつい床 H（火のせいれいのほかは、おなかがはやくへる）
    for y in range(17,30):
        for x in range(38,46):
            if m.g[y][x]=='.' and hsh(x,y,5)<.8:m.put(x,y,'H')
    # 南東：冷やせる溶岩 L にかこまれた島の宝箱（水のせいれいが冷やす）
    m.stamp(41,32,['#############',
                   '###~~~~~~~###',
                   '##~~~~~~~~~##',
                   '.LLLLLLL.T.##',
                   '##~~~~~~..o##',
                   '###~~~~~~~###',
                   '#############'],lv=1,chest=[{'mapPc':1,'pt':90}])
    m.carve([(35,31),(35,35),(41,35)],0)
    # 北西：宝箱の部屋
    m.stamp(4,8,['##########',
                 '###....###',
                 '##..T..c.#',
                 '#.........',
                 '##.......#',
                 '####...###',
                 '##########'],lv=2,chest=[{'fukuro':1,'pt':60}])
    m.carve([(13,11),(13,13),(22,13),(22,14)],0)
    # 下へおりる坂（南）：ふきだす溶岩 V の通路
    m.carve([(28,31),(28,38)],0);m.blob(28,40,4,2);m.stamp(28,33,['V','V']);m.stamp(27,40,['.R.'])
    for (x,y,c) in[(33,10,'~'),(34,10,'~'),(33,11,'~'),(25,15,'A'),(36,16,'A'),(19,28,'A'),(24,31,'c'),(34,17,'c'),(17,16,'i')]:
        if m.g[y][x]=='.':m.put(x,y,c)
    for (x,y) in[(19,23),(37,23)]:
        if m.g[y][x]=='.':m.put(x,y,'^')
    return m

FLOORS={0:('roots',floor0),1:('lake',floor1),2:('ice',floor2),3:('magma',floor3)}
def jsstr(o):return json.dumps(o,ensure_ascii=False,separators=(',',':')).replace('"',"'")
def jsobj(o):
    s=json.dumps(o,ensure_ascii=False,separators=(',',':'))
    return re.sub(r'"([A-Za-z_]\w*)":',r'\1:',s).replace('"',"'")
def write():
    p=os.path.join(ROOT,'js','cave.js');src=open(p,encoding='utf8').read()
    a=src.index('const CVFLOORS=[');b=src.index('const CVPARTY')
    old=re.findall(r"\{map:\[(.*?)\],\s*lv:\[(.*?)\],\s*theme:'(\w+)',chest:(\{.*?\})\}(?=,\n\{map|\];)",src[a:b],re.S)
    out=[]
    for i,(mp,lvs,th,ch) in enumerate(old):
        if i in FLOORS:
            m=FLOORS[i][1]();g,l=m.rows();chest=m.chest;assert check(m,th)
        else:   # まだ作りなおしていない階：もとの地図を、まん中に置く
            rows=re.findall(r"'([^']*)'",mp);lrs=re.findall(r"'([^']*)'",lvs);ox,oy=(W-len(rows[0]))//2,(H-len(rows))//2
            g=['#'*W]*oy+['#'*ox+r+'#'*(W-ox-len(r)) for r in rows]+['#'*W]*(H-oy-len(rows))
            l=['1'*W]*oy+['1'*ox+r+'1'*(W-ox-len(r)) for r in lrs]+['1'*W]*(H-oy-len(rows))
            cj=json.loads(re.sub(r"([{,])(\w+):",r'\1"\2":',ch.replace("'",'"')))
            chest={'%d,%d'%(int(k.split(',')[0])+ox,int(k.split(',')[1])+oy):v for k,v in cj.items()}
        out.append('{map:[\n'+',\n'.join("'%s'"%r for r in g)+'],\n lv:['+','.join("'%s'"%r for r in l)+'],\n theme:\'%s\',chest:%s}'%(th,jsobj(chest)))
    src=src[:a]+'const CVFLOORS=[\n'+',\n'.join(out)+'];\n'+src[b:]
    open(p,'w',encoding='utf8').write(src);print('js/cave.js に書いた',len(out))
if __name__=='__main__':
    if '--write' in sys.argv:write()
    else:
        for i,(th,f) in FLOORS.items():
            if len(sys.argv)>1 and sys.argv[1]!=str(i):continue
            m=f();g,l=m.rows()
            for y,(a,b) in enumerate(zip(g,l)):print('%2d %s %s'%(y,a,b))
            check(m,th);print(json.dumps(m.chest,ensure_ascii=False))
