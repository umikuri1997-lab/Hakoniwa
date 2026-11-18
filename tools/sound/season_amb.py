#!/usr/bin/env python3
"""季節・時間の環境音（持ち主がくれた効果音ラボの録音、tools/sound/src/season/）を、くりかえして鳴らせる形にする。
  morning（朝 5時〜7時半・どの季節も）・spring（春の昼）・summer（夏の昼）・snight（夏の夜）。ほかの時は、いまの鳥の声（birds）・虫の声（night）。
  低いゴロゴロ（風・マイク）をけずり、大きさを、いまの環境音にそろえ（昼は鳥の声 −29 LUFS、夜は虫の声 −25.6 LUFS）、
  おわりの XF 秒を、はじめにかさねて（同じ大きさのまま入れかわる）、くりかえしのつなぎ目をなくす。
使いかた：python3 tools/sound/season_amb.py  → assets/g/<中身のsha1の先10字>.mp3 と SAMPLES の行"""
import os,hashlib,subprocess,json,numpy as np
SR=44100;XF=3.0;D=os.path.dirname(os.path.abspath(__file__));OUT=os.path.join(D,'..','..','assets','g')
# 名前: (もとの録音, はじめにけずる秒, そろえる大きさ LUFS)
SRC={'amb_morn':('morning.mp3',0,-29.0),'amb_spr':('spring_day.mp3',0,-29.0),'amb_sum':('summer_day.mp3',0,-29.0),'amb_snight':('summer_night.mp3',4.0,-25.6)}
def load(f,cut,lufs):
  af=f'atrim=start={cut},asetpts=PTS-STARTPTS,highpass=f=90,loudnorm=I={lufs}:TP=-2:LRA=20:linear=true'
  # loudnorm は2回とおすと正しくそろうので、はかってからもう1回
  m=subprocess.run(['ffmpeg','-v','info','-i',f,'-af',af.replace(f'loudnorm=I={lufs}:TP=-2:LRA=20:linear=true',f'loudnorm=I={lufs}:TP=-2:LRA=20:print_format=json'),'-f','null','-'],capture_output=True,text=True).stderr
  j=json.loads(m[m.rindex('{'):m.rindex('}')+1])
  af+=f":measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}"
  a=np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',f,'-af',af,'-ac','2','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout,np.float32).reshape(-1,2).copy()
  return a
out={}
for k,(f,cut,lufs) in SRC.items():
  a=load(os.path.join(D,'src','season',f),cut,lufs);n=int(XF*SR);L=len(a)
  t=np.linspace(0,np.pi/2,n)[:,None];y=a[:L-n].copy();y[:n]=a[:n]*np.sin(t)+a[L-n:]*np.cos(t)
  b=subprocess.run(['ffmpeg','-v','quiet','-f','f32le','-ar',str(SR),'-ac','2','-i','-','-codec:a','libmp3lame','-b:a','96k','-f','mp3','-'],input=y.astype(np.float32).tobytes(),capture_output=True,check=True).stdout
  nm=hashlib.sha1(b).hexdigest()[:10]+'.mp3';open(os.path.join(OUT,nm),'wb').write(b);out[k]=['assets/g/'+nm]
print('Object.assign(SAMPLES,'+json.dumps(out,separators=(',',':'))+');')
