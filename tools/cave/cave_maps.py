#!/usr/bin/env python3
"""洞窟の地図（js/cave.js の CVFLOORS の map・lv・chest）を作る道具。
階は10（STORY.md の「土の谷の大穴とバケモノ」）。1〜3階は自然の洞窟で、大穴はない。4階から下は、まん中の底の見えない大穴（O）のまわりを、ふちにそっておりていく（持ち主のたのみ）。
- 大穴は、だ円にでこぼこをつけた形。そのまわりに、はばのある道（ふち道）。ふち道は北が高く、南へおりていく（がけの正面は、高い所が北のときだけ見えるので）。
- しかけの部屋は、ハンコ（ROOMS の文字の絵）で置き、ふち道へ通路でつなぐ。
- 作ったら、つながりをたしかめる（入口から坂まで、門をあけずに行ける・どこからでも入口か坂へもどれる・門の先は、門をあけないと行けない）。
使いかた：python3 tools/cave/cave_maps.py [--write]   （--write で js/cave.js の CVFLOORS を書きかえる）"""
import math,json,re,sys,os
W,H=56,44
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..')
WALK=set('.SR!g^cizqX,;v')        # P まきあげの足場は check の lift で。, 家の板のゆか・; かれた畑・v うらの窓（家のうしろの路地の高さ）・z ゆかの穴（家の中）
SOLID=set('KYN')                  # 手がかりの物・ゆりかご・底のかげ（歩けない）          # 歩ける（q・z はくずれるまで）
GATE=set('hkDEF12Wb')               # 門をあけると歩ける（W はまもりの光でくずれる）
HDOOR='d'                           # 家の戸：家の中（, のマス）からだけあく。あいたら行き来できる
def hsh(x,y,k=0):
    n=(x*73856093)^(y*19349663)^(k*83492791);n=(n^(n>>13))*1274126177&0xffffffff;return ((n^(n>>16))&0xffff)/65535
def noise(u,v,k):
    i,j=math.floor(u),math.floor(v);s,t=u-i,v-j;s=s*s*(3-2*s);t=t*t*(3-2*t)
    a,b,c,d=hsh(i,j,k),hsh(i+1,j,k),hsh(i,j+1,k),hsh(i+1,j+1,k);return a*(1-s)*(1-t)+b*s*(1-t)+c*(1-s)*t+d*s*t
def mirror(rows):return[r[::-1] for r in rows]
class Map:
    def __init__(s,seed):
        s.g=[['#']*W for _ in range(H)];s.lv=[[1]*W for _ in range(H)];s.seed=seed;s.chest={};s.houses=[]
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
    def house(s,x0,y0,rows,lv):
        """家のハンコ（H 壁・, 板のゆか・v 窓・z ゆかの穴・d 戸・f こわれた家具）。家の中（, のならびのかこみ）を s.houses に書く"""
        s.stamp(x0,y0,rows,lv=lv)
        P=[(x0+dx,y0+dy) for dy,r in enumerate(rows) for dx,c in enumerate(r) if c==',']
        s.houses.append([min(p[0] for p in P),min(p[1] for p in P),max(p[0] for p in P),max(p[1] for p in P)])
    def inhouse(s,x,y):return any(a<=x<=c and b<=y<=d for a,b,c,d in s.houses)
    def levels(s,f):
        for y in range(H):
            for x in range(W):s.lv[y][x]=f(x,y)
    def fill(s,x0,y0,x1,y1,c,keep='O'):
        for y in range(y0,y1+1):
            for x in range(x0,x1+1):
                if 0<=x<W and 0<=y<H and s.g[y][x] not in keep:s.g[y][x]=c
    def plug(s):
        """大穴（O）を岩でうめる（1〜3階は自然の洞窟で、大穴はない）"""
        for y in range(H):
            for x in range(W):
                if s.g[y][x]=='O':s.g[y][x]='#'
    def across(s,x0,y0,x1,y1,c):
        """大穴（O）の上だけを c にする（橋・氷）"""
        for y in range(y0,y1+1):
            for x in range(x0,x1+1):
                if s.g[y][x]=='O':s.g[y][x]=c
    def rows(s):return[''.join(r) for r in s.g],[''.join(str(v) for v in r) for r in s.lv]

# ---------- つながりのたしかめ（js/cave.js の cvWalk・cvStepOK と同じ決まり） ----------
def check(m,name,lift=True,house=True):
    """lift：まきあげの足場（P）に乗れるか。足場は、上の段と下の段のどちらかにいて、止まっている段のほうへだけ出入りできる（さく）"""
    g,lv=m.g,m.lv;find=lambda c:[(x,y) for y in range(H) for x in range(W) if g[y][x]==c]
    S=find('S')[0];R=find('R')[0];PC=set(find('P'))
    PL=sorted({lv[y][x] for (px,py) in PC for x,y in((px+1,py),(px-1,py),(px,py+1),(px,py-1)) if 0<=x<W and 0<=y<H and (x,y) not in PC and g[y][x] in WALK})
    def ok(x,y,gates):
        if not(0<=x<W and 0<=y<H):return False
        c=g[y][x]
        if not house and (c in 'vzd' or m.inhouse(x,y)):return False   # 家の中を通らない
        return c in WALK or c==HDOOR or (gates and c in GATE) or (lift and c=='P')
    def hv(p):return p[2] if p[:2] in PC else lv[p[1]][p[0]]
    def step(a,b,gates=True):
        if not gates and g[b[1]][b[0]]==HDOOR and not m.inhouse(a[0],a[1]):return False   # 家の戸は、家の中からだけあく
        if (a[:2] in PC)!=(b[:2] in PC):return hv(a)==hv(b)          # 足場のさく
        la,lb=hv(a),hv(b)
        return lb<=la or (lb==la+1 and g[a[1]][a[0]]=='^')
    def reach(src,gates):
        src=(src[0],src[1],lv[src[1]][src[0]]);seen={src};q=[src]
        while q:
            p=q.pop();nx=[]
            for dx,dy in((1,0),(-1,0),(0,1),(0,-1)):
                x,y=p[0]+dx,p[1]+dy
                if not ok(x,y,gates):continue
                if (x,y) in PC:nx+=[(x,y,h) for h in PL]
                else:nx.append((x,y,lv[y][x]))
            if p[:2] in PC:nx+=[(p[0],p[1],h) for h in PL]          # 足場をうごかす
            for n in nx:
                if not step(p,n,gates):continue
                if n not in seen:seen.add(n);q.append(n)
        return {p[:2] for p in seen}
    r0=reach(S,False);r1=reach(S,True);bad=[]
    for p in r1:
        if S not in reach(p,True) and R not in reach(p,True):bad.append(p)
    # 物のとなりに立てるか（宝箱・化石・しかけ）
    lone=[]
    for y in range(H):
        for x in range(W):
            if g[y][x] in 'ToxymtWbZFDEKwd':
                if not any((x+dx,y+dy) in r1 for dx,dy in((1,0),(-1,0),(0,1),(0,-1))):lone.append((g[y][x],x,y))
    opn=[(x,y) for y in range(H) for x in range(W) if g[y][x] in 'TZ' and any((x+dx,y+dy) in r0 for dx,dy in((1,0),(-1,0),(0,1),(0,-1)))]
    if opn:print(name,'門なしでとどく宝箱',opn)
    print(name,'入口→坂（門なし）',R in r0,' 門の先も入れて',len(r1),'マス  もどれない',len(bad),bad[:5],' とどかない物',lone)
    return R in r0 and not bad and not lone

# ---------- 1階：ねっこの洞窟：根のある空洞が3つ、北から南へ段々に ----------
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
    # 大穴はない（自然の洞窟）：うめたあとに、根のある空洞が3つ、北から南へ段々にならぶ。東のふち道はふさぎ、西のふち道だけ、まわり道にのこす
    m.plug();m.fill(36,16,45,27,'#')
    m.blob(29,16,7,2.2);m.blob(30,22,8,2.8);m.blob(28,28,8,2)
    m.carve([(33,17),(36,18),(36,21)],0)      # 上の空洞 → まん中（根のすきまを、とびおりる）
    m.carve([(25,24),(25,25),(22,25),(22,27)],0)      # まん中 → 下の空洞
    # 地底の水・石じゅん・光るきのこ・コワイノ（空洞と、ふち道の上）
    m.stamp(33,12,['~~~','~~~~'],lv=3)
    for (x,y,c) in[(20,14,'A'),(37,20,'A'),(18,26,'A'),(22,11,'g'),(39,24,'g'),(31,31,'g'),(19,21,'g'),(34,10,'c'),(17,18,'c'),(38,27,'i'),(24,32,'c'),(36,17,'c'),(16,24,'c')]:
        if m.g[y][x]=='.':m.put(x,y,c)
    # 坂：西のふち道と、空洞をつなぐ道の、段のさかいに、のぼる坂
    for (x,y) in[(17,19),(18,26),(36,19),(22,26)]:m.put(x,y,'^')
    for (x,y) in[(25,11),(26,11),(36,14),(37,14)]:   # 手がかり：根にささった、さびたくいと管
        if m.g[y][x]=='.':m.put(x,y,'K')
    return m

# ---------- 3階：水晶のほらあな（いのちのくら）：水晶の柱の林の、まよい道を北から南へ ----------
def floor_crystal():
    m=Map(31);cx,cy=28,23
    m.hole(cx,cy,10,7,1.5)
    m.fill(0,cy-1,cx-2,cy+1,'#');m.fill(cx+1,cy-1,W-1,cy+1,'#')      # ふち道を東と西で切る（北と南は、橋でだけつながる）
    m.levels(lambda x,y:2 if y<=cy-1 else 1)
    # 入口（北）：ひびの床の近道と、まわり道
    m.blob(cx,5,4,2.6);m.stamp(cx-1,4,['.S.']);m.carve([(cx,7),(cx,12)],0);m.carve([(cx,7),(cx-4,7),(cx-4,12),(cx,12)],0)
    m.stamp(cx,8,['q','q'])
    # いのちのくら（北西）：からの水晶の台がならぶ。光る水晶は、はしの1つだけ
    m.stamp(8,3,['############',
                 '##........##',
                 '#.KKKKKKK..#',
                 '#..........#',
                 '#.KKKKKKK..#',
                 '##..........',
                 '############'])
    m.carve([(20,8),(cx-4,8)],0)
    # 風：風車 m（西）。うすい壁 W をくずして入り、風のとびら E の先の宝箱
    m.stamp(1,12,['##########',
                  '##..o.####',
                  '#m.......W',
                  '##.....###',
                  '######.###',
                  '######E###',
                  '#####T.o##',
                  '##########'],lv=2,chest=[{'mapPc':1,'pt':40}])
    m.carve([(11,14),(14,14),(14,17),(19,17)],0)
    # 火：たいまつ3本で、石のとびら D の先の宝箱（東）
    m.stamp(42,7,['#############',
                  '###...#######',
                  '##t....######',
                  '#.....c...t##',
                  '.........####',
                  '#.......t####',
                  '##...########',
                  '####.########',
                  '####D########',
                  '###.T.#######',
                  '#############'],lv=2,chest=[{'item':'oldlantern','pt':40}])
    m.carve([(38,15),(38,11),(42,11)],0)
    # 南：うすい壁の先のかくれた宝箱と、すいつくされた灰色の水晶
    m.stamp(12,28,['########',
                   '##..KK.#',
                   '#T...o.W',
                   '##.....#',
                   '########'],lv=1,chest=[{'fukuro':1,'pt':50}])
    m.carve([(20,30),(22,30)],0)
    # 下へおりる坂（南）：落ちてくる水晶の通路
    m.carve([(cx,32),(cx,37)],0);m.blob(cx,39,4,2.3);m.stamp(cx,34,['!','!']);m.stamp(cx-1,39,['.R.'])
    # 大穴はない（自然の洞窟）：うめたあとを、大きな水晶の空洞にする。光る水晶の柱（歩けない岩）の林の中の、まよい道をおりる
    m.plug();m.blob(cx,cy,10.5,7.5)
    for y in range(cy-6,cy+8):
        for x in range(cx-10,cx+11):
            if m.g[y][x]!='.':continue
            gx,gy=(x-cx+12)%3,(y-cy+12)%3
            if (gx==0 or gy==0) and hsh(x,y,31)<.5 or gx==0 and gy==0:m.g[y][x]='#'   # 柱：3マスごとの格子に、ところどころ
    m.carve([(14,17),(21,17)],0)                       # 西の風車のへやへの道
    for (x,y) in[(cx-4,cy),(cx+5,cy)]:m.put(x,y,'^')   # 段のさかい（北が2・南が1）の、のぼる坂
    for (x,y,c) in[(20,15,'A'),(36,18,'A'),(19,26,'c'),(37,27,'i'),(33,14,'c'),(22,31,'g'),(35,30,'g'),(21,13,'g'),(36,26,'A')]:
        if m.g[y][x]=='.':m.put(x,y,c)
    return m

# ---------- 2階：地底のみずうみ（地下水脈）：みずうみから南へながれる小川の岸を、わたりながらおりる ----------
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
    # 大穴へおちる滝：北のふち道は、みずうみの水が大穴へながれおちる所。島づたいに、西と東のふち道へ
    N=['~~~~~~................~~~~~~~'[:0]+'~~~~~~.........'+'.......',
       '~~~.....~~~~~.........',
       '~~~..~~~~~~~~~~~...~~~',
       '....~~~~~~~~~~~~~~....',
       '..~~~~~~~~~~~~~~~~~...',
       '..~~~~~~~~~~~~~~~~~...',
       '..~~~~~~~~~~~~~~~~~...',
       '..~~~~~~~~~~~~~~~~~...',
       '..~~~~~~~~~~~~~~~~~...']
    N[0]='~~~~~~.........~~~~~~~'[:22]
    for dy,r in enumerate(N):
        for dx,c in enumerate(r):
            x,y=20+dx,16+dy
            if m.g[y][x]!='O':m.put(x,y,c)
    # 大穴はない（自然の洞窟）：うめたあとに、みずうみから南へ地底の小川がながれる。ふち道は東西とも、とちゅうでふさぎ、
    # 小川の岸を、とびいし（川の中の浅い所）で、右・左とわたりながら、おりていく（西の岸は22〜23、東の岸は25〜26でふさがる）
    m.plug();m.fill(16,22,21,23,'#');m.fill(12,24,21,28,'#');m.fill(39,22,41,22,'#');m.fill(39,23,46,28,'#')
    C={19:29,20:29,21:30,22:30,23:31,24:31,25:30,26:30,27:29,28:29,29:29}
    for y in range(19,31):
        for x in range(22,39):
            c=C.get(y,29);ch='.'
            if abs(x-c)<=1:ch='#' if y==30 else '~'          # 小川（30で岩のすきまへ、しみこむ）
            elif y in(22,23) and x<c-1:ch='#'                 # 西の岸がふさがる
            elif y in(25,26) and x>c+1:ch='#'                 # 東の岸がふさがる
            if y in(21,24) and abs(x-c)<=1:ch='.'             # とびいし
            m.g[y][x]=ch
    for (x,y) in[(22,19),(38,19),(22,30),(38,30),(23,30)]:m.put(x,y,'#')   # かどを、まるく
    for (x,y,c) in[(25,15,'A'),(41,22,'A'),(21,28,'g'),(39,29,'g'),(24,33,'c'),(36,31,'i'),(20,23,'c'),(40,24,'c'),(24,17,'g'),(36,17,'g')]:
        if m.g[y][x]=='.':m.put(x,y,c)
    for (x,y) in[(24,26)]:      # 西の岸の段に、のぼる坂
        if m.g[y][x]=='.':m.put(x,y,'^')
    for (x,y) in[(25,18),(30,17),(33,18)]:   # 手がかり：光をすいこむ、黒いしみ（水の中）
        if m.g[y][x]=='~':m.put(x,y,'K')
    return m

# ---------- 4階：古い採掘場：人がほった大穴のふちを、まきあげの足場でおりる（ふち道は東も西も切れている） ----------
def floor_mine():
    m=Map(41);cx,cy=28,23
    m.hole(cx,cy,11,7.5,1.45)
    m.levels(lambda x,y:5 if y<=10 else 4 if y<=cy-1 else 1)
    m.fill(0,cy,W-1,cy+1,'#')       # ふち道を、東も西も切る（北と南は、まきあげの足場でだけつながる）
    # 入口（北）：ひびの床の近道と、まわり道。入口の台（5）から、ふち道（4）へは、とびおりる。もどるのは坂から
    m.blob(cx,5,4,2.6);m.stamp(cx-1,4,['.S.']);m.carve([(cx,7),(cx,12)],0);m.carve([(cx,7),(cx+4,7),(cx+4,12),(cx,12)],0)
    m.stamp(cx,8,['q','q'])
    for (x,y) in[(cx,11),(cx+4,11)]:m.put(x,y,'^')
    # まきあげの足場（西）：P 足場（2×2）・w まきあげ機（上の段と下の段に1つずつ）
    m.carve([(11,22),(16,22)],0);m.carve([(11,25),(16,25)],0)
    m.stamp(12,23,['wPP','wPP'])
    m.lv[23][12]=4;m.lv[24][12]=1
    for y in(23,24):
        for x in(13,14):m.lv[y][x]=4
    # 手がかり：つるはしかけ（北のふち道のうしろ）。ならんだつるはしの、はしの1つだけ、かけたまま
    m.carve([(19,12),(23,12)],0);m.stamp(18,11,['#KKKKK#'])
    # 土：岩をおす（北西の上）。くぼみ h を、岩 b でうめると、宝箱の所へ
    m.stamp(1,10,['###########',
                  '####...####',
                  '#T.h..b...#',
                  '#..h.......',
                  '####...o..#',
                  '###########'],lv=4,chest=[{'fukuro':1,'pt':60}])
    m.carve([(11,13),(15,13),(15,16)],0)
    # 火：たいまつ3本で、石のとびら（北東の上）
    m.stamp(41,9,['##############',
                  '###.....t#####',
                  '#t.........###',
                  '.......c...D.#',
                  '###.....t###T#',
                  '##############'],lv=4,chest=[{'item':'oldlantern','pt':60}])
    m.carve([(38,15),(41,15),(41,12)],0)
    # 水：水門 x・y の片方だけ（南西の下）。みぞ 1・2
    m.stamp(1,28,['######x#######',
                  '##..g#1.....#.',
                  '#.T...1.......',
                  '##...#1.....##',
                  '#######22222y#',
                  '#######.....##',
                  '########o.o###',
                  '##############'],lv=1,chest=[{'mapPc':1,'pt':70}])
    m.carve([(15,30),(17,30)],0)
    # うすい壁 W の先の、かくれた宝箱（南東の下）。かけたつるはしがあれば、たたいてくずせる
    m.stamp(43,27,['######',
                   '.W..o#',
                   '###T##',
                   '######'],lv=1,chest=[{'fukuro':1,'pt':80}])
    m.carve([(40,28),(43,28)],0)
    # 下へおりる坂（南）：落ちてくる岩の通路
    m.carve([(cx,33),(cx,37)],0);m.blob(cx,39,4,2.3);m.stamp(cx,35,['!','!']);m.stamp(cx-1,39,['.R.'])
    for (x,y,c) in[(18,15,'c'),(37,17,'c'),(15,20,'g'),(40,21,'A'),(17,27,'c'),(38,27,'c'),(24,32,'g'),(33,31,'c'),(44,11,'g'),(16,18,'A'),(36,30,'g')]:
        if m.g[y][x]=='.':m.put(x,y,c)
    return m
# ---------- 5階：地下の廃村（にげてきた人がすてた家と畑） ----------
# ふち道は、家でふさがれていて、家の中を通らないと坂へ行けない（家は3けん、北から段々に南へ）。
#   H 家の日干しれんがの壁（歩けない）・, 板のゆか・v うらの窓（家のうしろの路地の高さ。家の中へとびおりて入る。もどれない）
#   z ゆかの穴（ねずみがほった横穴が出てくる。同じ高さで行き来できる）・d 戸（家の中からだけ、かんぬきをはずしてあく。あいたら、あいたまま）
#   f こわれた家具（歩けない）・; かれた畑
def floor_haison():
    m=Map(51);cx,cy=28,23
    m.hole(cx,cy,11,7.5,1.45)
    m.levels(lambda x,y:5 if y<=16 or (x>cx and y<=20) else 4 if (x<cx and y<=30) else 3 if y<=34 else 2)
    m.fill(cx+1,21,W-1,22,'#')       # 東のふち道を切る（北の東は、ゆきどまり。南の東は、南のふち道から）
    # 入口（北）：ひびの床の近道と、まわり道
    m.blob(cx,5,4,2.6);m.stamp(cx-1,4,['.S.']);m.carve([(cx,7),(cx,12)],0);m.carve([(cx,7),(cx-4,7),(cx-4,12),(cx,12)],0)
    m.stamp(cx,8,['q','q'])
    # 家1（北西）：うらの窓から、とびおりて入る。中に、食卓といす（手がかり）
    m.house(9,17,['HHHHHHHvHHHH',
                  'H,,,,,,,,,,,',
                  'H,f,KKKKK,,,',
                  'H,,,,,,,,,,,',
                  'H,,,,,,,,,,,',
                  'H,,,,,,,,f,,',
                  'HHHHHHdHHHHH'],lv=4)
    m.lv[17][16]=5
    # 家2（南西）：ねずみの横穴から、ゆかの穴へ。中の、うすい壁の先に、かくれた宝箱
    m.carve([(12,25),(7,25),(7,28),(10,28)],0)
    m.house(10,27,['HHHHHHHHHHHHH',
                   '.z,,,,,,,,,,H',
                   'H,,,,,,,,,,,H',
                   'H,,f,,,,,,,,H',
                   'HHHHHHHHHdHHH'],lv=4)
    m.stamp(10,31,[' HW','#o.T#'],lv=4,chest=[{'fukuro':1,'pt':80}])
    # 家3（南）：南のふち道からうらの窓へ。戸の先が、下へおりる坂
    m.house(22,35,['HHHHHHvHHHH',
                   'H,,,,,,,,,H',
                   'H,f,,,,,,,H',
                   'H,,,,,,,f,H',
                   'HHHHdHHHHHH'],lv=2)
    m.lv[35][28]=3
    m.blob(26,41,4,1.6);m.stamp(25,41,['.R.'],lv=2)
    for y in range(40,44):
        for x in range(W):m.lv[y][x]=2
    # かれた畑（家のまわり）
    for (x0,y0,x1,y1) in[(12,24,16,26),(19,13,24,14),(27,32,33,33),(39,24,42,27)]:
        for y in range(y0,y1+1):
            for x in range(x0,x1+1):
                if m.g[y][x]=='.' and (x+y)%5:m.g[y][x]=';'
    # 土：岩をおす（北西の上）。くぼみ h を、岩 b でうめると、宝箱の所へ
    m.stamp(2,10,['###########',
                  '####...####',
                  '#T.h..b...#',
                  '#..h.......',
                  '####...o..#',
                  '###########'],lv=5,chest=[{'fukuro':1,'pt':70}])
    m.carve([(12,13),(17,13),(17,15)],0)
    # 風：風車 m（北東の上）。風のとびら E の先の宝箱
    m.stamp(43,11,['############',
                   '####.o..####',
                   '.........m.#',
                   '###.....####',
                   '###.########',
                   '###E########',
                   '##..T.######',
                   '############'],lv=5,chest=[{'item':'oldlantern','pt':70}])
    m.carve([(39,15),(44,15),(44,13)],0)
    # 木：葉の足場 k（東の下）。われ目を、葉でわたった先の宝箱
    m.stamp(44,24,['############',
                   '#####kkk####',
                   '.....kkk.T.#',
                   '#..g.kkk..o#',
                   '#####kkk####',
                   '############'],lv=3,chest=[{'mapPc':1,'pt':80}])
    m.carve([(42,26),(44,26)],0)
    for (x,y,c) in[(33,14,'c'),(17,21,'c'),(13,26,'c'),(18,29,'c'),(31,32,'c'),(41,28,'c'),(29,37,'c'),(24,13,'g'),(40,17,'A'),(36,31,'g')]:
        if m.g[y][x] in '.;,':m.put(x,y,c)
    return m
# ---------- 8階：ゆりかごのへや（人が作った施設。まっすぐなかべ・直角のへや。大穴・ガラスの入れ物は R5 で足す） ----------
def floor_cradle():
    m=Map(61)
    R=lambda x0,y0,x1,y1,c='.':m.fill(x0,y0,x1,y1,c,keep='')
    m.levels(lambda x,y:2 if y<=16 or (y<=28 and (x<=21 or x>=34)) else 1)
    R(23,2,32,6);m.put(27,3,'S')                       # 入口のへや
    R(27,7,28,13)                                     # まっすぐなろうか
    R(6,14,49,16)                                     # 長いろうか（東と西）
    # 西：ゆりかごのへや。ゆりかごが、ならんでいる
    R(5,18,20,27);R(10,17,11,17)
    for y in(19,21,23,25):
        for x in range(7,20,3):m.put(x,y,'Y')
    R(1,21,3,23);m.put(4,22,'W');m.put(2,22,'T');m.put(1,21,'o')      # うすい壁の先の、かくれた宝箱
    # 東：水にしずんだへや。岩 b をくぼみ h へおすと、島の宝箱へ
    R(34,18,52,27);R(44,17,45,17)
    R(36,19,50,25,'~')
    for x,c in zip(range(40,45),'T.hb.'):m.put(x,22,c)
    R(44,23,44,25)
    # まん中：根と土にくるまれた、大きなかげ
    R(23,17,32,36);m.put(27,17,'^');m.put(28,17,'^')
    R(25,24,30,28,'N')
    for (x,y) in[(23,19),(24,19),(32,21),(31,30),(24,32),(24,34),(32,35)]:m.put(x,y,'A')
    # 西の下：たいまつ3本で、石のとびら D の先の宝箱
    R(5,30,20,37);R(21,33,22,33)
    m.put(7,31,'t');m.put(18,31,'t');m.put(12,36,'t')
    R(1,32,3,34);m.put(4,33,'D');m.put(2,33,'T')
    # 東の下：われ目を、葉の足場でわたった先の宝箱
    R(35,30,52,37);R(33,33,34,33)
    R(44,30,46,37,'#');R(44,33,46,33,'k');R(48,32,50,34);m.put(49,33,'T');R(47,33,47,33)
    # 下へおりる坂（いちばん底。この先は岩でふさがっている）
    R(26,37,29,40);m.put(27,39,'R')
    m.chest={'2,22':{'fukuro':1,'pt':80},'41,22':{'item':'oldlantern','pt':80},'2,33':{'fukuro':1,'pt':90},'49,33':{'mapPc':1,'pt':90}}
    m.put(40,22,'.');m.put(41,22,'T');m.put(42,22,'h');m.put(43,22,'b');m.put(44,22,'.')
    for (x,y,c) in[(12,15,'c'),(40,15,'c'),(9,24,'i'),(40,28,'.'),(26,21,'c'),(30,32,'i'),(38,35,'c'),(14,33,'c'),(6,20,'g'),(51,26,'g'),(24,31,'g'),(31,19,'g')]:
        if m.g[y][x]=='.':m.put(x,y,c)
    return m

FLOORS={0:('roots',floor0),1:('lake',floor1),2:('crystal',floor_crystal),3:('mine',floor_mine),4:('haison',floor_haison),7:('cradle',floor_cradle)}
NFLOORS=10   # 階の数。地図のまだない階（6・7・9・10階。R4・R5 で作る）は null
def jsstr(o):return json.dumps(o,ensure_ascii=False,separators=(',',':')).replace('"',"'")
def jsobj(o):
    s=json.dumps(o,ensure_ascii=False,separators=(',',':'))
    return re.sub(r'"([A-Za-z_]\w*)":',r'\1:',s).replace('"',"'")
def write():
    p=os.path.join(ROOT,'js','cave.js');src=open(p,encoding='utf8').read()
    a=src.index('const CVFLOORS=[');b=src.index('const CVPARTY')
    out=[]
    for i in range(NFLOORS):
        if i not in FLOORS:out.append('null');continue
        th,f=FLOORS[i];m=f();g,l=m.rows();assert check(m,th)
        if any('P' in r for r in g):assert not check(m,th+'（足場なし）',lift=False),'足場を通らなくても坂へ行ける'
        if m.houses:assert not check(m,th+'（家を通らない）',house=False),'家の中を通らなくても坂へ行ける'
        out.append('{map:[\n'+',\n'.join("'%s'"%r for r in g)+'],\n lv:['+','.join("'%s'"%r for r in l)+'],\n theme:\'%s\',chest:%s%s}'%(th,jsobj(m.chest),',house:'+jsobj(m.houses) if m.houses else ''))
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
