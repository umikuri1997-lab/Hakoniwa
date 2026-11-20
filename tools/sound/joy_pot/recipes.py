import sys; sys.path.insert(0,'/tmp/claude-0/-home-user-Hakoniwa/b8be0f08-99e8-5daa-844d-90cde151c2b6/scratchpad/sndtools')
from build import *
K='k_impact-sounds/x/Audio/'; X="o_xylo/x/child's_xylophone-2.wav"
mix('joy1',[('o_kalimba/kalimba.wav',0,.9,0,rb(12)+',lowpass=f=7000',0),
            ('o_kalimba/kalimba.wav',.12,.75,.24,rb(17)+',lowpass=f=7000',-2)],1.0,fout=.3,post='aecho=0.8:0.5:45|90:0.25|0.12')
mix('joy2',[('o_creature/x/cute_09.ogg',.03,.6,0,rb(3)+',lowpass=f=7500',0)],.62,fout=.12)
mix('joy3',[(X,1.00,.21,0,rb(-8)+',lowpass=f=6000',0),(X,1.22,.21,.09,rb(-8)+',lowpass=f=6000',0),
            (X,1.44,.62,.18,rb(-7)+',lowpass=f=6000',1)],.8,fout=.3)
mix('joy4',[('o_bellding/bell_ding2.wav',.05,.9,0,rb(12),0),('o_bellding/bell_ding2.wav',.05,.85,.06,rb(19),-3),
            ('o_bellding/bell_ding2.wav',.05,.8,.12,rb(24),-6),('o_bellding/bell_ding2.wav',.05,.75,.18,rb(28),-9)],1.0,fout=.35,
            post='highpass=f=700,lowpass=f=9000,aecho=0.8:0.6:70|130:0.3|0.18')
mix('joy5',[(K+'impactSoft_medium_001.ogg',0,.18,0,ar(17),0),(K+'impactSoft_medium_003.ogg',0,.14,.11,ar(22),-4),
            (K+'impactGlass_light_002.ogg',0,.21,.2,ar(12)+',highpass=f=1500',-12)],.55,fout=.15,post='acompressor=threshold=0.05:ratio=4:attack=0.5:release=60:makeup=2')
NC='o_boilloop/cooking_without_cover_01_0.ogg'; CV='o_boilloop/cooking_with_cover_01.ogg'
mix('pot1',[(NC,0,1.6,0,'lowpass=f=5000',0)],1.6,fin=.12,fout=.3,post='acompressor=threshold=0.05:ratio=4:attack=0.5:release=60:makeup=2')
mix('pot2',[('o_household/forkonplate01.wav',16.2,1.3,0,rb(-4)+',lowpass=f=4000',0)],1.3,fin=.08,fout=.3)
mix('pot3',[(K+'impactTin_medium_000.ogg',0,.16,0,'lowpass=f=5000',0),(K+'impactTin_medium_002.ogg',0,.13,.075,'lowpass=f=5000',-4),
            (K+'impactTin_medium_003.ogg',0,.2,.31,'lowpass=f=5000',-2),(K+'impactTin_medium_001.ogg',0,.17,.385,'lowpass=f=5000',-5),
            (K+'impactTin_medium_004.ogg',0,.2,.63,'lowpass=f=5000',-6),(CV,.5,1.0,0,'lowpass=f=5000',-16)],1.0,fout=.2,post='acompressor=threshold=0.05:ratio=4:attack=0.5:release=60:makeup=2')
mix('pot4',[(CV,.5,1.8,0,'lowpass=f=5000',0),('o_cutlery/fork_on_dish_01.ogg',0,.25,.4,rb(-5)+',lowpass=f=4500',-5),
            ('o_cutlery/fork_on_dish_01.ogg',0,.25,1.1,rb(-6)+',lowpass=f=4500',-8)],1.8,fin=.12,fout=.35)
