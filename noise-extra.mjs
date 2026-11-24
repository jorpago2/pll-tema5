import { noiseTransfer } from './pll-model.mjs?v=20261124-3';

/** Educational uncorrelated SSB spectra propagated through the linear phase model. */
export function pllNoiseContributions({offsetHz, naturalKHz, damping, divider, refDb, vcoAt1MHzDb}) {
  if(!Number.isFinite(refDb)||!Number.isFinite(vcoAt1MHzDb)) throw new RangeError('noise levels must be finite');
  const transfer=noiseTransfer({offsetHz,naturalKHz,damping,divider});
  const refOutDb=refDb+transfer.referenceDb;
  const vcoSourceDb=vcoAt1MHzDb-20*Math.log10(offsetHz/1e6);
  const vcoOutDb=vcoSourceDb+transfer.vcoDb;
  const high=Math.max(refOutDb,vcoOutDb), low=Math.min(refOutDb,vcoOutDb);
  const totalDb=high+10*Math.log10(1+10**((low-high)/10));
  return {refOutDb,vcoOutDb,totalDb,vcoSourceDb,refGainDb:transfer.referenceDb,vcoGainDb:transfer.vcoDb};
}

export function initNoiseExtra(initialState, saved={}){
  const $=id=>document.getElementById(id);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const f=(n,d=1)=>(Math.abs(n)<.5*10**-d?0:n).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
  const frequency=hz=>hz>=1e6?`${f(hz/1e6,hz>=1e7?0:2)} MHz`:hz>=1e3?`${f(hz/1e3,hz>=1e5?0:1)} kHz`:`${f(hz,0)} Hz`;
  let state=initialState,ref=-145,vco=-110,offset=5,playing=!reduced.matches,visible=false,frame=0,last=0,plotKey='',points=[],geometry=null;
  const options=hz=>({offsetHz:hz,naturalKHz:state.natural,damping:state.damping,divider:state.n,refDb:ref,vcoAt1MHzDb:vco});
  function slider(id,value,text){const input=$(id);input.value=String(value);input.style.setProperty('--fill',`${100*(value-Number(input.min))/(Number(input.max)-Number(input.min))}%`);$(`${id}-value`).textContent=text;}
  function drawPlot(){
    points=Array.from({length:401},(_,i)=>{const x=3+i*4/400;return{x,...pllNoiseContributions(options(10**x))};});
    const values=points.flatMap(p=>[p.refOutDb,p.vcoOutDb,p.totalDb]),ymin=Math.floor(Math.min(...values)/20)*20-5,ymax=Math.ceil(Math.max(...values)/20)*20+5;
    const left=57,right=742,top=25,bottom=272,x=v=>left+(v-3)/4*(right-left),y=v=>bottom-(v-ymin)/(ymax-ymin)*(bottom-top);
    geometry={left,right,top,bottom,x,y};let svg=`<text x="${left}" y="12" class="nx-chart-label">Ruido de fase de banda lateral única · dBc/Hz</text>`;
    for(let v=Math.ceil(ymin/20)*20;v<=ymax;v+=20)svg+=`<path d="M${left} ${y(v)}H${right}" class="nx-grid"/><text x="${left-8}" y="${y(v)+4}" text-anchor="end" class="nx-chart-label">${v}</text>`;
    for(let v=3;v<=7;v++)svg+=`<path d="M${x(v)} ${top}V${bottom}" class="nx-grid"/><text x="${x(v)}" y="${bottom+19}" text-anchor="middle" class="nx-chart-label">${['1k','10k','100k','1M','10M'][v-3]}</text>`;
    const curve=(name,cls)=>`<path d="${points.map((p,i)=>`${i?'L':'M'}${x(p.x).toFixed(2)} ${y(p[name]).toFixed(2)}`).join(' ')}" class="nx-line ${cls}"/>`;
    svg+=curve('refOutDb','nx-line-ref')+curve('vcoOutDb','nx-line-vco')+curve('totalDb','nx-line-total');
    svg+=`<text x="${right}" y="315" text-anchor="end" class="nx-chart-label">Separación Δf · Hz, escala logarítmica →</text>`;
    $('nx-chart-content').innerHTML=svg;
  }
  function drawMarker(){
    if(!geometry)return;const {x,y,top,bottom}=geometry,p=pllNoiseContributions(options(10**offset)),xx=x(offset);
    $('nx-marker').innerHTML=`<path d="M${xx.toFixed(2)} ${top}V${bottom}" class="nx-marker-line"/><circle class="nx-dot" fill="#6853cf" cx="${xx.toFixed(2)}" cy="${y(p.refOutDb).toFixed(2)}" r="4"/><circle class="nx-dot" fill="#c57b43" cx="${xx.toFixed(2)}" cy="${y(p.vcoOutDb).toFixed(2)}" r="4"/><circle class="nx-dot" fill="#3c8071" cx="${xx.toFixed(2)}" cy="${y(p.totalDb).toFixed(2)}" r="5"/>`;
    const db=v=>`${f(v)} dBc/Hz`;
    $('nx-ref-result').textContent=db(p.refOutDb);$('nx-vco-result').textContent=db(p.vcoOutDb);$('nx-total-result').textContent=db(p.totalDb);
    $('nx-offset-out').textContent=frequency(10**offset);const input=$('nx-offset');input.value=String(offset);input.style.setProperty('--fill',`${(offset-3)*25}%`);
    const difference=Math.abs(p.refOutDb-p.vcoOutDb);$('nx-interpretation').textContent=difference<3?'En este punto las dos contribuciones son comparables y ambas influyen en la suma.':p.refOutDb>p.vcoOutDb?'En este punto la contribución de la referencia es mayor y determina principalmente el ruido total.':'En este punto la contribución del VCO es mayor y determina principalmente el ruido total.';
    $('nx-desc').textContent=`Ejemplo de suma de dos contribuciones no correlacionadas. A ${frequency(10**offset)}, la referencia aporta ${db(p.refOutDb)}, el VCO ${db(p.vcoOutDb)} y el total es ${db(p.totalDb)}.`;
  }
  function render(){slider('nx-ref',ref,`${f(ref,0)} dBc/Hz`);slider('nx-vco',vco,`${f(vco,0)} dBc/Hz`);$('nx-ref-out').textContent=`N = ${state.n}`;$('nx-vco-out').textContent=`fn = ${f(state.natural,0)} kHz`;const key=[state.n,state.natural,state.damping,ref,vco].join('/');if(key!==plotKey){drawPlot();plotKey=key;}drawMarker();}
  function setButton(){$('nx-play').textContent=playing?'Ⅱ Pausar':'▶ Reproducir';$('nx-play').setAttribute('aria-label',playing?'Pausar el recorrido de frecuencia':'Reproducir el recorrido de frecuencia');}
  function tick(now){frame=0;if(!visible||!playing||document.hidden){last=0;return;}if(last)offset=3+((offset-3+(now-last)*4/18000)%4);last=now;drawMarker();frame=requestAnimationFrame(tick);}
  function start(){if(visible&&playing&&!frame&&!document.hidden){last=0;frame=requestAnimationFrame(tick);}}
  $('nx-ref').addEventListener('input',e=>{ref=Number(e.target.value);render();});$('nx-vco').addEventListener('input',e=>{vco=Number(e.target.value);render();});
  $('nx-offset').addEventListener('input',e=>{offset=Number(e.target.value);playing=false;last=0;setButton();drawMarker();});
  $('nx-play').addEventListener('click',()=>{playing=!playing;last=0;setButton();start();});document.addEventListener('visibilitychange',()=>{last=0;start();});
  function applySaved(v={}){
    if(Number.isFinite(v.ref))ref=Math.max(-170,Math.min(-115,v.ref));
    if(Number.isFinite(v.vco))vco=Math.max(-140,Math.min(-80,v.vco));
    if(Number.isFinite(v.offset)){offset=Math.max(3,Math.min(7,v.offset));playing=false;last=0;}
  }
  reduced.addEventListener('change',e=>{if(e.matches){playing=false;setButton();}});applySaved(saved);setButton();render();
  return{update(next){state=next;render();},setVisible(v){visible=Boolean(v);last=0;start();},getState(){return{ref,vco,offset};},setState(v){applySaved(v);setButton();render();start();}};
}
