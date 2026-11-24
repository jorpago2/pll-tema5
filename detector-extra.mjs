/** Ideal PFD with zero reset delay and prescribed input frequencies.
 * Times are measured in reference periods. A positive phase means the reference leads at t=0.
 */
export function pfdEvents({phaseDeg=60,frequencyPercent=0,duration=4}={}){
  if(!Number.isFinite(phaseDeg)||!Number.isFinite(frequencyPercent)||!Number.isFinite(duration)||frequencyPercent<=-100||duration<=0||duration>100)throw new RangeError('Invalid PFD inputs');
  const feedbackFrequency=1+frequencyPercent/100, period=1/feedbackFrequency, delay=(phaseDeg/360)*period, warmup=20, start=Math.min(-1,delay-period)-1e-9;
  const arrivals=[];
  for(let k=Math.floor(-warmup)-1;k<=Math.ceil(duration)+1;k++)arrivals.push({t:k,ref:true});
  for(let k=Math.floor((-warmup-delay)/period)-1;k<=Math.ceil((duration-delay)/period)+1;k++)arrivals.push({t:delay+k*period,ref:false});
  arrivals.sort((a,b)=>a.t-b.t);
  let up=0,down=0,i=0,initial=null;const changes=[];
  while(i<arrivals.length){const t=arrivals[i].t;if(t<start){i++;continue;}let sawRef=false,sawFeedback=false;while(i<arrivals.length&&Math.abs(arrivals[i].t-t)<1e-10){if(arrivals[i].ref)sawRef=true;else sawFeedback=true;i++;}
    if(t>=0&&initial===null)initial={t:0,up,down};
    if(sawRef)up=1;if(sawFeedback)down=1;if(up&&down){up=0;down=0;}
    if(t>=0&&t<=duration){const next={t,up,down};if(t<1e-10)initial={t:0,up,down};else changes.push(next);}
    if(t>duration)break;
  }
  return {phaseDeg,frequencyPercent,duration,feedbackFrequency,period,delay,states:[initial||{t:0,up,down},...changes]};
}

export function initDetectorExtra(){
  const $=id=>document.getElementById(id),fmt=(v,n=1)=>v.toLocaleString('es-ES',{maximumFractionDigits:n,minimumFractionDigits:n});
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');let phase=60,freq=0,visible=false,playing=!reduce.matches,frame=0,start=0;
  const x=t=>178+590*t/4, fs=v=>Number(v).toFixed(2);
  function squarePath(row,period,delay){let transitions=[];for(let k=-10;k<12;k++){for(const [off,level] of [[0,1],[.5,0]]){let t=delay+(k+off)*period;if(t>0&&t<4)transitions.push([t,level]);}}transitions.sort((a,b)=>a[0]-b[0]);let u=(((1e-8-delay)/period)%1+1)%1,level=u<.5?1:0;let d=`M${x(0)} ${row-level*20}`;for(const[t,next]of transitions)d+=` H${fs(x(t))} V${row-next*20}`;return d+` H${x(4)}`;}
  function pfdPath(states,row,key,scale=20){let d=`M${x(0)} ${row-states[0][key]*scale}`;for(const event of states.slice(1))d+=` H${fs(x(event.t))} V${row-event[key]*scale}`;return d+` H${x(4)}`;}
  function render(){const data=pfdEvents({phaseDeg:phase,frequencyPercent:freq});$('pfd-extra-phase').value=String(phase);$('pfd-extra-frequency').value=String(freq);for(const [id,v,lo,hi] of [['pfd-extra-phase',phase,-150,150],['pfd-extra-frequency',freq,-5,5]])$(id).style.setProperty('--fill',`${100*(v-lo)/(hi-lo)}%`);
    $('pfd-extra-phase-out').textContent=`${phase>0?'+':''}${fmt(phase,0)}°`;$('pfd-extra-frequency-out').textContent=`${freq>0?'+':''}${fmt(freq)} %`;
    $('pfd-extra-summary').textContent=freq===0?(phase>0?'Los flancos de referencia se adelantan y generan pulsos UP repetidos.':phase<0?'Los flancos de realimentación se adelantan y generan pulsos DOWN repetidos.':'Los flancos coinciden y el modelo ideal no produce pulsos de duración finita.'):'Como las frecuencias se mantienen diferentes, el desfase cambia de un ciclo al siguiente y también cambia la anchura de los pulsos. Estos controles no representan una corrección en lazo cerrado.';
    const labels=[['Referencia',52],['Realimentación',108],['UP',164],['DOWN',220],['Corriente / Icp',277]];
    let html='<g class="pfd-extra-grid"><path d="M178 52H768 M178 108H768 M178 164H768 M178 220H768 M178 277H768 M178 20V287 M325.5 20V287 M473 20V287 M620.5 20V287 M768 20V287"/></g><g class="pfd-extra-label">';for(const [name,y]of labels)html+=`<text x="8" y="${y+3}">${name}</text>`;html+='</g><g class="pfd-extra-tick">';for(let i=0;i<=4;i++)html+=`<text x="${x(i)}" y="306" text-anchor="middle">${i} Tref</text>`;html+='</g>';
    const current=data.states.map(v=>({...v,current:v.up-v.down}));
    for(const [d,cls]of [[squarePath(52,1,0),'pfd-extra-ref'],[squarePath(108,data.period,data.delay),'pfd-extra-fb'],[pfdPath(data.states,164,'up'),'pfd-extra-up'],[pfdPath(data.states,220,'down'),'pfd-extra-down'],[pfdPath(current,277,'current',14),'pfd-extra-current']])html+=`<path class="pfd-extra-path ${cls}" d="${d}"/>`;
    $('pfd-extra-wave').innerHTML=html;$('pfd-extra-svg-desc').textContent=`La referencia y la realimentación se comparan por sus flancos. El desfase inicial es ${phase} grados y la diferencia relativa de frecuencia es ${freq} por ciento. UP acciona corriente positiva y DOWN corriente negativa.`;
  }
  function tick(now){frame=0;if(!visible||!playing||document.hidden){start=0;return;}if(!start)start=now;const pos=178+590*((now-start)%6000)/6000;$('pfd-extra-cursor').setAttribute('d',`M${fs(pos)} 20V283`);frame=requestAnimationFrame(tick);}
  function begin(){if(visible&&playing&&!frame&&!document.hidden)frame=requestAnimationFrame(tick);}
  function button(){$('pfd-extra-play').textContent=playing?'Ⅱ Pausar':'▶ Reproducir';}
  for(const[id,key] of [['pfd-extra-phase','phase'],['pfd-extra-frequency','freq']])$(id).addEventListener('input',e=>{if(key==='phase')phase=Number(e.target.value);else freq=Number(e.target.value);render();});
  document.querySelectorAll('[data-pfd-extra]').forEach(b=>b.addEventListener('click',()=>{const choice=b.dataset.pfdExtra;phase=choice==='down'?-60:60;freq=choice==='freq'?3:0;render();}));
  $('pfd-extra-play').addEventListener('click',()=>{playing=!playing;start=0;button();begin();});document.addEventListener('visibilitychange',()=>{start=0;begin();});reduce.addEventListener('change',e=>{if(e.matches){playing=false;button();}});
  render();button();return {getState(){return {phase,freq};},setState(state={}){const p=Number(state.phase),f=Number(state.freq);phase=Number.isFinite(p)?Math.max(-150,Math.min(150,Math.round(p/5)*5)):60;freq=Number.isFinite(f)?Math.max(-5,Math.min(5,Math.round(f*2)/2)):0;render();},setVisible(v){visible=Boolean(v);start=0;begin();}};
}
