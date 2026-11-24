import {simulatePLL} from './pll-model.mjs?v=20261124-3';

/** A slowed visual guide to one small-signal simulation, with actual phase error and frequency readouts. */
export function initAnimation({onFrame = () => {}} = {}) {
  const $ = id => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fmt = (v,n) => (Math.abs(v)<0.5*10**-n?0:v).toLocaleString('es-ES',{minimumFractionDigits:n,maximumFractionDigits:n});
  const durationMs = 16000;
  let displayGain = 1, requestedGain = 50, speed = 0.5;
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
    const visualError=point.errorRad*displayGain;
    marker('anim-fb-arrow',a-visualError,74); marker('anim-ref-arrow',a,78);
    const sx=180+50*Math.cos(a),sy=112-50*Math.sin(a),ex=180+50*Math.cos(a-visualError),ey=112-50*Math.sin(a-visualError);
    $('anim-error-sector').setAttribute('d',`M180 112 L${sx.toFixed(2)} ${sy.toFixed(2)} A50 50 0 0 ${visualError>=0?1:0} ${ex.toFixed(2)} ${ey.toFixed(2)} Z`);
    $('anim-seek').value=String(progress*100);$('anim-seek').style.setProperty('--fill',`${progress*100}%`);
    $('anim-time').textContent=`${fmt(point.tUs,1)} µs`; $('anim-time-output').textContent=`${fmt(point.tUs,1)} µs`;
    $('anim-error').textContent=`${fmt(point.errorRad,4)} rad`; $('anim-frequency').textContent=`${fmt(point.outputMHz,3)} MHz`;
    $('anim-detector-frequency').textContent=`${fmt(point.frequencyErrorHz,1)} Hz`;
    if(i!==lastLabel){onFrame({timeUs:point.tUs, point, progress});lastLabel=i;}
  }
  function setButton(){$('anim-play').textContent=playing?'Ⅱ Pausar':'▶ Reproducir';$('anim-play').setAttribute('aria-label',playing?'Pausar animación':'Reproducir animación');}
  function tick(now) {
    frameId=0;if(!visible||!playing||document.hidden){last=0;return;}
    if(last)progress=Math.min(1,progress+(now-last)*speed/durationMs);last=now;draw();
    if(progress>=1){playing=false;last=0;setButton();return;} frameId=requestAnimationFrame(tick);
  }
  function start() {if(visible&&playing&&!document.hidden&&!frameId){last=0;frameId=requestAnimationFrame(tick);}}
  function update(state) {
    const {ref,n,natural,damping,detuning,step}=state;
    const key=[ref,n,natural,damping,detuning,step].join('/'); if(key===cachedKey)return;
    cachedKey=key;data=simulatePLL({referenceMHz:ref,divider:n,naturalKHz:natural,damping,detuningKHz:detuning/n,stepKHz:step,stepTimeUs:30,durationUs:100,samples:700});
    progress=0;lastLabel=-1;last=0;updateScale();draw();start();
  }
  function updateScale() {
    const maxError=Math.max(0,...data.map(p=>Math.abs(p.errorRad)));
    displayGain=maxError>0?Math.min(requestedGain,1.45/maxError):requestedGain;
    const label=`×${fmt(displayGain,1)}`;
    $('anim-scale-value').textContent=label;
    $('anim-scale-notice').textContent=displayGain<requestedGain-.01?`La escala se limita a ${label} para mantener el ángulo visual por debajo de 83°.`:'La ampliación afecta solo a la figura. Los valores numéricos y las gráficas son los del modelo.';
    $('anim-svg-scale').textContent=`Error angular ampliado ${label}`;
    $('anim-svg-desc').textContent=`Las flechas giran a velocidad ilustrativa y su diferencia angular es el error de fase calculado ampliado ${label}.`;
  }
  $('anim-scale').addEventListener('input',e=>{requestedGain=Number(e.target.value);lastLabel=-1;updateScale();draw();});
  $('anim-speed').addEventListener('change',e=>{speed=Number(e.target.value);last=0;});
  $('anim-play').addEventListener('click',()=>{if(!playing&&progress>=1)progress=0;playing=!playing;last=0;setButton();draw();start();});
  $('anim-reset').addEventListener('click',()=>{progress=0;last=0;lastLabel=-1;draw();if(!reduce.matches)playing=true;setButton();start();});
  $('anim-seek').addEventListener('input',event=>{progress=Number(event.target.value)/100;playing=false;last=0;setButton();draw();});
  document.addEventListener('visibilitychange',()=>{last=0;start();});
  reduce.addEventListener('change',event=>{if(event.matches){playing=false;setButton();}});
  setButton();
  return {update,setVisible(value){visible=Boolean(value);last=0;if(visible){draw();start();}}};
}
