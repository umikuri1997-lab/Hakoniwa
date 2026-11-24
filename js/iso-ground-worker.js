'use strict';
/* マップの読みこみ中に、地面の区画のドットごとの計算（iso-ground-px.js の igPixels）を、べつのスレッドでする（iso-ground.js の igJob がよぶ）。
   init：ステージのあいだかわらない物（タイルの形・テクスチャ・マップのしるし・色）。そのあとは、区画ごとの物だけがとどく */
importScripts('iso-ground-px.js'+self.location.search);
let IGW0=null;
onmessage=e=>{const d=e.data;if(d.init){IGW0=d.init;return}const R=igPixels(Object.assign({},IGW0,d.P));postMessage({id:d.id,R},[R.O.buffer,R.K.buffer])};
