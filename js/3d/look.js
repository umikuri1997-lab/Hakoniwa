/* 3Dの見え方の数字（試作 proto3d/main.js の見え方 B と同じ。持ち主がえらんだ）。
   単位はマス。せかいの x（東）→ 3Dの x、せかいの y（南）→ 3Dの z、高さ → 3Dの y。 */
export const HSTEP=1.2;               // 段差1つの高さ（マス。試作と同じ）
export const PITCH=35*Math.PI/180;    // 見おろす角度
export const YAW=Math.PI/4;           // カメラの向き（マスの x が右下・z が左下）
export const FOV=28;                  // 画角（度）
export const ISOPT=64/Math.SQRT2;     // ゲームの点（クォータービューの絵の1点）が、マスのいくつぶんか：1マス＝この点の数
export const BORDER=16;               // マップのまわりに足す地面（マス）
export const MAXPR=2;                 // 画面の細かさ（スマホの点の何倍まで）
// 光とかげ
export const SKY='#d7ecf0',SKYTOP='#2f86d6',GROUND='#7f9a5a',FOG=[14,46];
export const HEMI=.8,SUN=2.3,SUNCOL='#ffd9a6',HEMISKY='#a8cdf5';
export const SUNDIR=[-.55,1,.35];
export const TOON=[.36,.62,1,1];
export const RIM={k:.22,pow:3,col:[1,.96,.86]};
export const AO=.13;
export const HULL={w:.8};
export const PX={lv:4,vUp:.28,vDn:.85,hue:.28,sat:.15,gain:1.0,edge:.035,shadow:.45,hl:.95,hlk:.32};
export const CEL={cut:.5,soft:.12,shade:-.24,light:.04,hl:2,hlk:.001};
export const MIST={h:1.2,k:.03,col:'#e8f2ea'};
export const CLOUDSH={scale:.05,speed:[.035,.02],k:.3};
export const BLOB={k:.42};
export const PATHDIP=.12;
export const GBUMP={amp:.09,scale:.55,f:1.3,k:.12,t:.001};
export const CRACK={scale:1.5,w:.07,k:.3};
export const WATER={shallow:'#8ed3c4',deep:'#236f86',caus:.16,cloud:.35,alpha:[.5,.94]};
export const RIPPLE={cell:1.7,period:5.5,r:.62,k:.22};
export const GLINT={n:16,k:1.3};
export const BUMP={mat:.012,leaf:.008,ground:.05,soil:.03,light:.35,e:.004};
// しあげ
export const DOF={near:.5,far:.8,amt:.4};
export const SSAO={r:.6,k:1.7,bias:.012,max:1.6};
export const BLOOM={th:.95,k:.12,col:[1,.86,.62]};
export const RAYS={k:.08,col:[1,.9,.66]};
export const GRADE={warm:[1.0,1.0,1.0],sat:1.0,vig:.15,exp:.9};
// 地面の色（sRGB）。ステージごと（WD の番号：0 草原・1 火山・2 風・3 土・4 水・5 闇）。草原は試作と同じ
const KUSAC={grassA:'#74ad52',grassB:'#5c9848',grassC:'#8dbd5e',dry:'#c4a97c',path:'#d9b98a',pathB:'#c7a173',cliff:'#b98d63',water:'#5cc3e6',foam:'#eafaff'};
export const STAGECOL={   // WD のばんごう（0草原 1火山 2土 3水 4風 5闇）
  0:KUSAC,
  1:{...KUSAC,dry:'#8a7468',path:'#b49a82',pathB:'#9c826c',cliff:'#7a6258'},   // 火山：灰のまじった土・黒っぽい岩
  2:{...KUSAC,dry:'#c49a6a',path:'#d6b184',pathB:'#bf966a',cliff:'#a8754a'},   // 土：赤みのある岩の谷
  3:KUSAC,   // 水
  4:{...KUSAC,grassA:'#86bd6a',grassB:'#6ea85a',grassC:'#a2cf7c',dry:'#d8c9a6',cliff:'#c9b493'},   // 風：明るい草・白っぽい岩
  5:{...KUSAC,grassA:'#5f8f58',grassB:'#4b7a4a',grassC:'#73a066',dry:'#8f8578',cliff:'#6f6460'},   // 闇：くらい草とあれ地
};
export const COLS=KUSAC;
// せいれい
export const OBJSCALE=1.5;   // 地形に対する、せいれいの大きさ（試作と同じ）
export const SPH=.8;
export const CREAM='#fdf8ef';
export const SPCOL={earth:{hood:'#8f6a50',cheek:'#f1b8a8',eye:'#5e3d2a'},water:{hood:'#78c3fb',cheek:'#f4b8b8',eye:'#1d4f7c'},fire:{hood:'#f07a4f',cheek:'#f2ac9f',eye:'#8f3a22'},
  wind:{hood:'#a6cc8a',cheek:'#f0c0b0',eye:'#456a2a'},wood:{hood:'#6fae4c',cheek:'#f0c0b0',eye:'#3f5e26'}};
export const SPROUT='#5e8f43',HEADACC='#e8cdb0';
export const ELS=['earth','water','fire','wind','wood'];
export const SPSW=[1,-1,-.7,.7];   // 左もも・右もも・左うで・右うで のふりの向きと大きさ
export const MATIDX={wood:1,stone:2,metal:3,cloth:4,bark:5,leaf:6,soil:7};
export const GTEX={grass:{span:3,lum:.248},dirt:{span:2.5,lum:.316},cliff:{span:2.4,lum:.121}};
export const CLOTHSPAN=.72;
