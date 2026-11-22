import subprocess,re,os,sys
P='/tmp/claude-0/-home-user-Hakoniwa/b8be0f08-99e8-5daa-844d-90cde151c2b6/scratchpad'
S=P+'/snd_src/'; O=P+'/sndpage/'; T=P+'/sndtools/tmp/'; os.makedirs(T,exist_ok=True)
def run(a): 
    r=subprocess.run(a,capture_output=True,text=True)
    if r.returncode: print(r.stderr[-1500:]); sys.exit(1)
    return r.stderr
def semi(n): return 2**(n/12)
def rb(n): return 'rubberband=pitch=%.5f:transients=crisp'%semi(n)  # pitch only
def ar(n): return 'asetrate=44100*%.5f,aresample=44100'%semi(n)    # pitch+speed (tape)
def mix(name, parts, total, fin=.005, fout=.15, lufs=-20, post=''):
    """parts: (file, ss, dur, delay_s, filt, gain_db)"""
    a=['ffmpeg','-v','error','-y']; fc=[]
    for i,(f,ss,du,dl,fl,g) in enumerate(parts):
        a+=['-ss',str(ss),'-t',str(du),'-i',S+f]
        ch='aresample=44100,aformat=channel_layouts=mono,highpass=f=20'+(','+fl if fl else '')
        ch+=',afade=t=in:d=0.004,afade=t=out:st=%f:d=%f'%(max(0,du*0.6),du*0.4) if du<9 else ''
        ch+=',volume=%fdB,adelay=%d'%(g,int(dl*1000))
        fc.append('[%d:a]%s[p%d]'%(i,ch,i))
    n=len(parts)
    fc.append(''.join('[p%d]'%i for i in range(n))+'amix=inputs=%d:normalize=0:duration=longest,apad,atrim=0:%f,afade=t=in:d=%f,afade=t=out:st=%f:d=%f%s[m]'%(n,total,fin,total-fout,fout,(','+post) if post else ''))
    w=T+name+'.wav'
    run(a+['-filter_complex',';'.join(fc),'-map','[m]','-ar','44100','-ac','1',w])
    # measure loudness (pad with silence so gating works on short sounds)
    e=run(['ffmpeg','-v','info','-i',w,'-af','apad=pad_dur=3,ebur128=peak=true','-f','null','-'])
    I=float(re.findall(r'I:\s+(-?[\d.]+) LUFS',e)[-1]); pk=float(re.findall(r'Peak:\s+(-?[\d.inf]+) dBFS',e)[-1])
    g=lufs-I; g=min(g,-1.5-pk)  # keep true peak under -1.5 dBFS
    run(['ffmpeg','-v','error','-y','-i',w,'-af','volume=%fdB'%g,'-c:a','libmp3lame','-q:a','2',O+name+'.mp3'])
    print(name,'I=%.1f pk=%.1f gain=%.1f final~%.1f LUFS'%(I,pk,g,I+g))
