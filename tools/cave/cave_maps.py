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
WALK=set('.SR!g^VHcizqIXJ')
SOLID=set('KYN')                  # 手がかりの物・ゆりかご・底のかげ（歩けない）          # 歩ける（q・z はくずれるまで）
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
    def fill(s,x0,y0,x1,y1,c,keep='O'):
        for y in range(y0,y1+1):
            for x in range(x0,x1+1):
                if 0<=x<W and 0<=y<H and s.g[y][x] not in keep:s.g[y][x]=c
    def across(s,x0,y0,x1,y1,c):
        """大穴（O）の上だけを c にする（橋・氷）"""
        for y in range(y0,y1+1):
            for x in range(x0,x1+1):
                if s.g[y][x]=='O':s.g[y][x]=c
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
                while g[n[1]][n[0]] in 'IJ':   # 氷の上は、ぶつかるまで、すべる（js の cvBfs と同じ）
                    n2=(n[0]+dx,n[1]+dy)
                    if not(ok(*n2,gates) and step(n,n2)):break
                    n=n2
                if n not in seen:seen.add(n);q.append(n)
        return seen
    r0=reach(S,False);r1=reach(S,True);bad=[]
    for p in r1:
        if g[p[1]][p[0]] in 'IJ':continue
        if S not in reach(p,True) and R not in reach(p,True):bad.append(p)
    # 物のとなりに立てるか（宝箱・化石・しかけ）
    lone=[]
    for y in range(H):
        for x in range(W):
            if g[y][x] in 'ToxymtWbZFLDEK':
                if not any((x+dx,y+dy) in r1 for dx,dy in((1,0),(-1,0),(0,1),(0,-1))):lone.append((g[y][x],x,y))
    opn=[(x,y) for y in range(H) for x in range(W) if g[y][x] in 'TZ' and any((x+dx,y+dy) in r0 for dx,dy in((1,0),(-1,0),(0,1),(0,-1)))]
    if opn:print(name,'門なしでとどく宝箱',opn)
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
    for (x,y) in[(25,11),(26,11),(36,14),(37,14)]:   # 手がかり：根にささった、さびたくいと管
        if m.g[y][x]=='.':m.put(x,y,'K')
    return m

# ---------- 2階：水晶のほらあな（いのちのくら）：水晶の橋で、大穴の上を北から南へわたる ----------
def floor_crystal():
    m=Map(31);cx,cy=28,23
    m.hole(cx,cy,10,7,1.5)
    m.fill(0,cy-1,cx-2,cy+1,'#');m.fill(cx+1,cy-1,W-1,cy+1,'#')      # ふち道を東と西で切る（北と南は、橋でだけつながる）
    m.levels(lambda x,y:2 if y<=cy-1 else 1)
    m.across(cx-1,0,cx,H-1,'X')                                     # 水晶の橋
    for y in range(H):
        for x in(cx-1,cx):
            if m.g[y][x]=='X':m.lv[y][x]=2
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
    for (x,y,c) in[(20,15,'A'),(36,18,'A'),(19,26,'c'),(37,27,'i'),(33,14,'c'),(22,31,'g'),(35,30,'g'),(21,13,'g'),(36,26,'A')]:
        if m.g[y][x]=='.':m.put(x,y,c)
    for (x,y) in[(cx-1,cy+8),(cx,cy+8)]:
        if m.g[y][x]=='.':m.put(x,y,'^')
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
    for (x,y,c) in[(25,15,'A'),(41,22,'A'),(21,28,'g'),(39,29,'g'),(24,33,'c'),(36,31,'i'),(20,23,'c'),(40,24,'c'),(24,17,'g'),(36,17,'g')]:
        if m.g[y][x]=='.':m.put(x,y,c)
    for (x,y) in[(19,26),(41,26)]:
        if m.g[y][x]=='.':m.put(x,y,'^')
    for (x,y) in[(25,18),(30,17),(33,18)]:   # 手がかり：光をすいこむ、黒いしみ（水の中）
        if m.g[y][x]=='~':m.put(x,y,'K')
    return m

# ---------- 3階：氷のほらあな ----------
def floor2():
    m=Map(37);cx,cy=34,28
    m.hole(cx,cy,8.5,6,1.45)
    m.levels(lambda x,y:2 if y<=18 else 1)
    # 大穴にはった氷：ふち道を東と西で切り、北のふちから南のふちへ、大穴の上の氷をすべってわたる
    m.fill(0,cy-1,cx-2,cy+1,'#');m.fill(cx+2,cy-1,W-1,cy+1,'#')
    m.across(cx-1,0,cx+1,H-1,'J')
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
    for x in range(28,33):   # 手がかり：氷の中のかげ（小さい物から大きい物へ。さいごはからっぽ）
        if m.g[35][x]=='.':m.put(x,35,'K')
    return m

# ---------- 5階：化石の大ひろま（神の骨組み）：ほねの橋で、大穴を西から東へわたる ----------
def floor_fossil():
    m=Map(43);cx,cy=28,22
    m.hole(cx,cy,10,7,1.5)
    m.fill(cx-1,0,cx+1,cy-1,'#');m.fill(cx-1,cy+2,cx+1,H-1,'#')     # ふち道を北と南で切る（西と東は、ほねの橋でだけつながる）
    m.levels(lambda x,y:2 if y<=cy+1 else 1)
    m.across(0,cy,W-1,cy+1,'X')                                     # ほねの橋
    # 入口（北西）
    m.blob(16,5,4,2.6);m.stamp(15,4,['.S.']);m.carve([(16,7),(16,12),(19,14)],1)
    # 土：岩をおす（西）。くぼみ h を岩 b でうめると、宝箱と化石の所へ
    m.stamp(1,9,['###########',
                  '#####..####',
                  '##..h.....#',
                  '#.o.h#b....',
                  '#...h......',
                  '#T..h......',
                  '#...h.....#',
                  '##o.h....g#',
                  '###########'],lv=2,chest=[{'item':'doki','pt':40}])
    m.carve([(11,13),(16,13)],1)
    # 水と木：水門 x・y の片方だけ（南西）。葉の足場 k の先の宝箱
    m.stamp(1,29,['##############',
                  '####kkk##x##..',
                  '##..kkk..1....',
                  '##T.kkk..1....',
                  '##..kkk..1#y.#',
                  '####kkk###2222',
                  '##########o..o',
                  '###########.o#',
                  '##############'],lv=1,chest=[{'mapPc':1,'pt':80}])
    m.carve([(14,31),(20,31)],0)
    # 神の骨組み（北東）：番号の彫られた、ならべかけのほね。はしの石の板に、組み立ての絵
    m.stamp(37,3,['##############',
                  '###........###',
                  '##.KKKKKKK...#',
                  '#............#',
                  '#..KKKKKK..o.#',
                  '##...........#',
                  '#####....#####'],lv=2)
    m.carve([(42,9),(40,13),(37,15)],1)
    # うすい壁の先の、かくれた宝箱（南東）
    m.stamp(41,28,['#######',
                   '##o.T.#',
                   '#.....#',
                   '###W###'],lv=1,chest=[{'fukuro':1,'pt':70}])
    m.carve([(44,32),(39,32),(39,29)],0)
    # 下へおりる坂（南東）：落ちてくる岩の通路
    m.carve([(36,31),(36,37)],0);m.blob(36,39,4,2.3);m.stamp(36,34,['!','!']);m.stamp(35,39,['.R.'])
    for (x,y,c) in[(20,16,'A'),(37,17,'A'),(19,27,'c'),(38,26,'i'),(33,15,'c'),(21,29,'g'),(35,28,'g'),(22,14,'g'),(17,20,'o'),(39,19,'o')]:
        if m.g[y][x]=='.':m.put(x,y,c)
    for (x,y) in[(17,cy+2),(39,cy+2)]:
        if m.g[y][x]=='.':m.put(x,y,'^')
    return m

# ---------- 4階：マグマのほらあな ----------
def floor3():
    m=Map(53);cx,cy=28,23
    m.hole(cx,cy,9.5,6.5,1.5)
    m.levels(lambda x,y:3 if y<=19 else 2 if y<=21 else 1)
    # 大穴のかべの細い山道：北のふちから、大穴のかべにほった道を、じぐざぐにおりて南のふちへ
    m.fill(cx+9,cy-4,W-1,cy,'#')                                    # 東のふち道を切る（西は溶岩の川）
    for (x,y) in [(cx,17)]+[(x,18) for x in range(cx-7,cx+1)]+[(cx-7,19)]+[(x,20) for x in range(cx-7,cx+8)]+[(cx+7,21)]+[(x,22) for x in range(cx-4,cx+8)]+[(cx-4,y) for y in range(23,32)]:
        if m.g[y][x]=='O':m.put(x,y,'.')
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
                 '##########'],lv=3,chest=[{'fukuro':1,'pt':60}])
    m.carve([(13,11),(13,13),(22,13),(22,14)],0)
    # 下へおりる坂（南）：ふきだす溶岩 V の通路
    m.carve([(28,31),(28,38)],0);m.blob(28,40,4,2);m.stamp(28,33,['V','V']);m.stamp(27,40,['.R.'])
    for (x,y,c) in[(33,10,'~'),(34,10,'~'),(33,11,'~'),(25,15,'A'),(36,16,'A'),(19,28,'A'),(24,31,'c'),(34,17,'c'),(17,16,'i')]:
        if m.g[y][x]=='.':m.put(x,y,c)
    for (x,y) in[(19,23),(37,23)]:
        if m.g[y][x]=='.':m.put(x,y,'^')
    for (x,y) in[(23,14),(24,14),(25,14)]:   # 手がかり：われた炉と、炉のかべの絵（はしの1つ）
        if m.g[y][x]=='.':m.put(x,y,'K')
    return m

# ---------- 7階：ゆりかごのへや（大穴の底の、人が作った施設。この階だけ、まっすぐなかべ・直角のへや） ----------
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

FLOORS={0:('roots',floor0),1:('crystal',floor_crystal),2:('lake',floor1),3:('ice',floor2),4:('fossil',floor_fossil),5:('magma',floor3),6:('cradle',floor_cradle)}
def jsstr(o):return json.dumps(o,ensure_ascii=False,separators=(',',':')).replace('"',"'")
def jsobj(o):
    s=json.dumps(o,ensure_ascii=False,separators=(',',':'))
    return re.sub(r'"([A-Za-z_]\w*)":',r'\1:',s).replace('"',"'")
def write():
    p=os.path.join(ROOT,'js','cave.js');src=open(p,encoding='utf8').read()
    a=src.index('const CVFLOORS=[');b=src.index('const CVPARTY')
    out=[]
    for i in sorted(FLOORS):
        th,f=FLOORS[i];m=f();g,l=m.rows();assert check(m,th)
        out.append('{map:[\n'+',\n'.join("'%s'"%r for r in g)+'],\n lv:['+','.join("'%s'"%r for r in l)+'],\n theme:\'%s\',chest:%s}'%(th,jsobj(m.chest)))
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
