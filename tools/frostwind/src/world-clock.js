import { clamp } from './math.js';

const WORLD_CLOCK_VERSION=1;
const MINUTES_PER_DAY=1440;
const DAYS_PER_YEAR=365;
const DEFAULT_WORLD_DATE=Object.freeze({
  year:0,dayOfYear:172,minuteOfDay:720,
});

function declinationForDay(dayOfYear){
  const n=clamp(Math.floor(dayOfYear),1,DAYS_PER_YEAR);
  return 23.45*Math.sin((360*(284+n)/365)*Math.PI/180);
}

function absoluteMinute({year=0,dayOfYear=172,minuteOfDay=720}={}){
  const day=clamp(Math.floor(dayOfYear),1,DAYS_PER_YEAR);
  const minute=clamp(Number(minuteOfDay),0,MINUTES_PER_DAY);
  return (Math.floor(year)*DAYS_PER_YEAR+(day-1))*MINUTES_PER_DAY+minute;
}

class WorldClock{
  constructor(state=DEFAULT_WORLD_DATE){
    this.version=WORLD_CLOCK_VERSION;
    this.minute=state.minute===undefined?absoluteMinute(state):Number(state.minute);
    this.rate=state.rate===undefined?1:Number(state.rate); // world minutes / real second
  }
  get year(){return Math.floor(this.minute/(DAYS_PER_YEAR*MINUTES_PER_DAY));}
  get dayOfYear(){
    const d=Math.floor(this.minute/MINUTES_PER_DAY);
    return ((d%DAYS_PER_YEAR)+DAYS_PER_YEAR)%DAYS_PER_YEAR+1;
  }
  get minuteOfDay(){
    return ((this.minute%MINUTES_PER_DAY)+MINUTES_PER_DAY)%MINUTES_PER_DAY;
  }
  get dayIndex(){return Math.floor(this.minute/MINUTES_PER_DAY);}
  get declination(){return declinationForDay(this.dayOfYear);}
  get timeBand(){
    const m=this.minuteOfDay;
    if(m<300)return 'night';
    if(m<480)return 'dawn';
    if(m<1020)return 'day';
    if(m<1200)return 'dusk';
    return 'night';
  }
  setMinute(minute){
    if(!Number.isFinite(minute))throw new Error('world clock minute must be finite');
    this.minute=minute;
    return this;
  }
  advanceWorldMinutes(minutes){return this.setMinute(this.minute+Number(minutes));}
  advanceRealSeconds(seconds){return this.advanceWorldMinutes(Number(seconds)*this.rate);}
  snapshot(){return {version:this.version,minute:this.minute,rate:this.rate};}
  static fromSnapshot(value){
    if(!value||value.version!==WORLD_CLOCK_VERSION)
      throw new Error(`unsupported world clock version '${value?.version}'`);
    return new WorldClock(value);
  }
}

export {
  DAYS_PER_YEAR, DEFAULT_WORLD_DATE, MINUTES_PER_DAY, WORLD_CLOCK_VERSION,
  WorldClock, absoluteMinute, declinationForDay,
};
