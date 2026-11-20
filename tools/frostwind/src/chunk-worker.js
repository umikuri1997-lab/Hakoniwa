import { makeWorldGen } from './worldgen.js';

let gen=null;

globalThis.onmessage=({data})=>{
  if(data.type==='init'){
    gen=makeWorldGen(data.seed,data.opt);
    globalThis.postMessage({type:'ready'});
    return;
  }
  if(data.type!=='bake'||!gen)return;
  try{
    const chunk=gen.bakeChunk(data.cx,data.cy,true);
    globalThis.postMessage({type:'chunk',key:data.key,chunk},[
      chunk.geom.buffer,chunk.water.buffer,chunk.colWater.buffer,
    ]);
  }catch(error){
    globalThis.postMessage({
      type:'error',key:data.key,
      error:String(error&&error.stack||error),
    });
  }
};
