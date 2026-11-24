import {simulatePLL} from './pll-model.mjs?v=20261124-2';

/** A slowed visual guide to one small-signal simulation, with actual phase error and frequency readouts. */
export function initAnimation({onFrame = () => {}} = {}) {
  const $ = id => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fmt = (v,n) => (Math.abs(v)<0.5*10**-n?0:v).toLocaleString('es-ES',{minimumFractionDigits:n,maximumFractionDigits:n});
  const durationMs = 16000, displayGain = 5;
  let data = [], progress = 0, visible = false, playing = !reduce.matches, frameId = 0, last = 0, cachedKey = '';
  let lastLabel = -1;
  function marker(id, angle, length) {
    const x=180+length*Math.cos(angle), y=112-length*Math.sin(angle);
    $(id).setAttribute('d',`M180 112 L${x.toFixed(2)} ${y.toFixed(2)} M${x.toFixed(2)} ${y.toFixed(2)} l${(-9*Math.cos(angle-.45)).toFixed(2)} ${(9*Math.sin(angle-.45)).toFixed(2)} M${x.toFixed(2)} ${y.toFixed(2)} l${(-9*Math.cos(angle+.45)).toFixed(2)} ${(9*Math.sin(angle+.45)).toFixed(2)}`);
  }
  function draw() {
    if(!data.length)return;
    const i=Math.max(0,Math.min(data.length-1,Math.round(progress*(data.length-1)))),point=data[i];
    // The reference rotation is intentionally schematic. Relative phase is the model error.
    const a=Math.PI/2+progress*Math.PI*8;
    marker('anim-fb-arrow',a-point.errorRad*displayGain,74); marker('anim-ref-arrow',a,78);
    $('anim-seek').value=String(point.tUs);$('anim-seek').style.setProperty('--fill',`${point.tUs}%`);
    $('anim-time').textContent=`${fmt(point.tUs,1)} µs`; $('anim-time-output').textContent=`${fmt(point.tUs,1)} µs`;
    $('anim-error').textContent=`${fmt(point.errorRad,4)} rad`; $('anim-frequency').textContent=`${fmt(point.outputMHz,3)} MHz`;
    $('anim-detector-frequency').textContent=`${fmt(point.frequencyErrorHz,1)} Hz`;
    if(i!==lastLabel){onFrame({timeUs:point.tUs, point, progress});lastLabel=i;}
  }
  function setButton(){$('anim-play').textContent=playing?'Ⅱ Pausar':'▶ Reproducir';$('anim-play').setAttribute('aria-label',playing?'Pausar animación':'Reproducir animación');}
  function tick(now) {
    frameId=0;if(!visible||!playing||document.hidden){last=0;return;}
    if(last)progress=Math.min(1,progress+(now-last)/durationMs);last=now;draw();
    if(progress>=1){playing=false;last=0;setButton();return;} frameId=requestAnimationFrame(tick);
  }
  function start() {if(visible&&playing&&!document.hidden&&!frameId){last=0;frameId=requestAnimationFrame(tick);}}
  function update(state) {
    const {ref,n,natural,damping,detuning,step}=state;
    const key=[ref,n,natural,damping,detuning,step].join('/'); if(key===cachedKey)return;
    cachedKey=key;data=simulatePLL({referenceMHz:ref,divider:n,naturalKHz:natural,damping,detuningKHz:detuning/n,stepKHz:step,stepTimeUs:30,durationUs:100,samples:700});
    progress=0;lastLabel=-1;last=0;draw();start();
  }
  $('anim-play').addEventListener('click',()=>{if(!playing&&progress>=1)progress=0;playing=!playing;last=0;setButton();draw();start();});
  $('anim-reset').addEventListener('click',()=>{progress=0;last=0;lastLabel=-1;draw();if(!reduce.matches)playing=true;setButton();start();});
  $('anim-seek').addEventListener('input',event=>{progress=Number(event.target.value)/100;playing=false;last=0;setButton();draw();});
  document.addEventListener('visibilitychange',()=>{last=0;start();});
  reduce.addEventListener('change',event=>{if(event.matches){playing=false;setButton();}});
  setButton();
  return {update,setVisible(value){visible=Boolean(value);last=0;if(visible){draw();start();}}};
}
