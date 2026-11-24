/** Four views of one conceptual phase-frequency detector, filter, VCO and divider. */
export function initLoopVisual({onStep=()=>{}}={}) {
  const $=id=>document.getElementById(id), format=(x,d=0)=>x.toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let current={block:0,ref:100,n:24},scenario='ref',visible=false,playing=!reduced.matches,frame=0,started=0,data=[];
  const mod=x=>((x%1)+1)%1, value=x=>Number(x).toFixed(2);
  // The three signals use the SAME arrays and horizontal time axis in each view.
  // Idealized edge-triggered PFD and a pure integrating control. Dimensionless
  // model is explanatory only and is independent of the PLL's linear solver.
  function build(s) {
    const total=8000, phaseOffset=scenario==='ref'?.14:scenario==='fb'?-.14:0;
    let reference=-.45, divided=reference-phaseOffset, control=0, up=false, down=false;
    const rows=[];
    for(let i=0;i<=total;i++) {
      const t=i/total, out=s.n*divided;
      rows.push({t,ref:mod(reference)<.5?1:0,fb:mod(divided)<.5?1:0,
        pulse:up?1:down?-1:0,current:up?1:down?-1:0,control,
        out:mod(out)<.5?1:0, deviation:control});
      if(i===total)break;
      const nextReference=reference+3/total, nextDivided=divided+(3+1.8*control)/total;
      const refEdge=Math.floor(nextReference)>Math.floor(reference), fbEdge=Math.floor(nextDivided)>Math.floor(divided);
      if(refEdge)up=true;
      if(fbEdge)down=true;
      if(up&&down){up=false;down=false;}
      control+=(up?1:down?-1:0)*.95/total;
      reference=nextReference;divided=nextDivided;
    }
    return rows;
  }
  function digital(row,key,scale=18) {
    let previous=data[0][key],d=`M205 ${value(row-previous*scale)}`;
    for(let i=1;i<data.length;i++){const v=data[i][key];if(v!==previous){d+=` H${value(205+455*data[i].t)} V${value(row-v*scale)}`;previous=v;}}
    return d+' H660';
  }
  function continuous(row,key,scale) {
    let d='';for(let i=0;i<data.length;i+=8){const p=data[i];d+=`${i?'L':'M'}${value(205+455*p.t)} ${value(row-p[key]*scale)} `;}
    const p=data.at(-1);return d+`L660 ${value(row-p[key]*scale)}`;
  }
  function diagram(labels,paths) {
    let out='<g class="lv-grid"><path d="M205 64H660 M205 134H660 M205 204H660 M205 24V222 M432.5 24V222 M660 24V222"/></g>';
    for(let i=0;i<labels.length;i++)out+=`<text class="lv-axis-label" x="12" y="${[68,138,208][i]}">${labels[i]}</text>`;
    out+='<g class="lv-tick"><text x="205" y="241">Inicio</text><text x="660" y="241" text-anchor="end">Mismo intervalo de ejemplo →</text></g>';
    for(const [d,cls] of paths)out+=`<path d="${d}" class="${cls}"/>`;
    return out;
  }
  function updateStep(s) {
    const positive=scenario==='ref',negative=scenario==='fb',rest=!positive&&!negative;
    const direction=positive?'UP':negative?'DOWN':'Sin pulso';
    const v=positive?'aumenta':negative?'disminuye':'permanece constante';
    const change=positive?'más alta':negative?'más baja':'sin cambio';
    const offset=positive?'La referencia se adelanta':'La realimentación se adelanta';
    let title,kicker,copy,insight,labels,paths,legend,desc;
    if(s.block===0) {
      kicker='COMPARACIÓN DE FLANCOS';title='El PFD genera la señal de corrección';
      copy=rest?'Los flancos de referencia y realimentación coinciden en este ejemplo. El PFD ideal no genera corrección.':`${offset}. La primera corrección es ${direction}, desde el primer flanco hasta que llega el segundo.`;
      insight=rest?'Al coincidir los flancos, el estado de tres salidas del detector permanece en reposo.':'Esta salida pasa a la bomba de carga. El adelanto de un flanco expresa una diferencia de fase en ese instante y no implica por sí solo una diferencia mantenida de frecuencia.';
      labels=['Referencia','Realimentación','UP / DOWN'];paths=[[digital(64,'ref'),'lv-wave-ref'],[digital(134,'fb'),'lv-wave-fb'],[digital(204,'pulse'),'lv-wave-control']];
      legend='<span>Referencia</span><span class="lv-orange">Realimentación</span><span class="lv-green">UP positivo · DOWN negativo</span>';
      desc='Comparación de flancos de la referencia y la señal dividida y señal firmada del PFD, con UP positivo y DOWN negativo.';
    } else if(s.block===1) {
      kicker='DE PULSOS A CONTROL';title='La bomba y el filtro reciben esa corrección';
      copy=rest?'Como no hay pulsos, la bomba de carga ideal no entrega corriente y la tensión de control se mantiene.':`Los pulsos ${direction} de este intervalo activan una corriente ${positive?'positiva':'negativa'}. El filtro la integra y su tensión ${v}.`;
      insight='La primera curva es exactamente la salida UP / DOWN del detector. En este ejemplo se representa un filtro integrador ideal, sin ondulación ni fugas adicionales.';
      labels=['UP / DOWN','Corriente de bomba','Tensión del filtro'];paths=[[digital(64,'pulse'),'lv-wave-ref'],[digital(134,'current'),'lv-wave-control'],[continuous(204,'control',125),'lv-wave-orange']];
      legend='<span>Salida del PFD</span><span class="lv-green">Corriente normalizada</span><span class="lv-orange">Control normalizado</span>';
      desc='Los pulsos firmados anteriores producen una corriente normalizada igual y la tensión de control ideal integra esa corriente.';
    } else if(s.block===2) {
      kicker='TENSIÓN A FRECUENCIA';title='El VCO responde a la tensión del filtro';
      copy=rest?'Con la tensión de control constante, el VCO conserva su frecuencia en este ejemplo.':`La misma tensión del filtro entra al VCO. Como KVCO es positivo y la tensión ${v}, la frecuencia del VCO tiende a ser ${change}.`;
      insight='La primera curva es la tensión de la etapa anterior. La señal de salida es la misma que entra al divisor en la siguiente etapa.';
      labels=['Tensión del filtro','Cambio de frecuencia','Salida del VCO'];paths=[[continuous(64,'control',125),'lv-wave-control'],[continuous(134,'deviation',125),'lv-wave-ref'],[digital(204,'out'),'lv-wave-orange']];
      legend='<span class="lv-green">Control del filtro</span><span>Cambio de frecuencia normalizado</span><span class="lv-orange">Salida VCO</span>';
      desc='La tensión integrada se convierte en un cambio de frecuencia y en la señal VCO que se muestra también en el divisor.';
    } else {
      kicker='REALIMENTACIÓN';title=s.n===1?'La realimentación conserva la frecuencia':'El divisor devuelve la señal al PFD';
      copy=`El divisor recibe la salida anterior y entrega fVCO/N. Con N = ${format(s.n)} y referencia de ${format(s.ref)} MHz, la frecuencia objetivo de la salida es ${format(s.ref*s.n)} MHz.`;
      insight=rest?'Con flancos coincidentes, las frecuencias de la señal dividida y la referencia coinciden.':`La señal dividida vuelve al PFD. En este intervalo, la corrección ${direction} modifica el avance de su fase respecto a la referencia. Otros ajustes podrían producir sobrepaso y pulsos de signo opuesto. No se presupone que el lazo ya esté enganchado.`;
      labels=['Salida del VCO','Salida dividida','Referencia'];paths=[[digital(64,'out'),'lv-wave-orange'],[digital(134,'fb'),'lv-wave-control'],[digital(204,'ref'),'lv-wave-ref']];
      legend='<span class="lv-orange">Salida VCO</span><span class="lv-green">VCO / N</span><span>Referencia</span>';
      desc=`Salida del VCO, esa misma salida dividida entre ${format(s.n)} y referencia. La salida dividida se vuelve a comparar en el PFD.`;
    }
    $('lv-kicker').textContent=kicker;$('lv-title').textContent=title;$('lv-value').textContent=direction;$('lv-copy').textContent=copy;$('lv-insight').textContent=insight;$('lv-wave-content').innerHTML=diagram(labels,paths);$('lv-wave-desc').textContent=desc;$('lv-legend').innerHTML=legend;$('lv-count').textContent=`${s.block+1} de 4`;
    $('lv-prev').disabled=s.block===0;$('lv-next').disabled=s.block===3;
    document.querySelectorAll('[data-lv-step]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.lvStep)===s.block)));
    document.querySelectorAll('[data-lv-flow]').forEach(el=>el.classList.toggle('is-active',Number(el.dataset.lvFlow)===s.block));
    document.querySelectorAll('[data-lv-scenario]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lvScenario===scenario)));
  }
  function tick(now){frame=0;if(!visible||!playing||document.hidden){started=0;return;}if(!started)started=now;const x=205+455*((now-started)%5000)/5000;$('lv-scanner').setAttribute('d',`M${value(x)} 24V222`);frame=requestAnimationFrame(tick);}
  function begin(){if(visible&&playing&&!frame&&!document.hidden)frame=requestAnimationFrame(tick);}
  function button(){document.querySelector('.diagram').classList.toggle('loop-motion-paused',!playing);$('loop-vis-play').textContent=playing?'Ⅱ Pausar':'▶ Reproducir';$('loop-vis-play').setAttribute('aria-label',playing?'Pausar recorrido visual':'Reproducir recorrido visual');}
  function choose(index){onStep(Math.max(0,Math.min(3,index)));}
  document.querySelectorAll('[data-lv-step]').forEach(b=>b.addEventListener('click',()=>choose(Number(b.dataset.lvStep))));
  document.querySelectorAll('[data-lv-scenario]').forEach(b=>b.addEventListener('click',()=>{scenario=b.dataset.lvScenario;data=build(current);updateStep(current);}));
  $('lv-prev').addEventListener('click',()=>choose(current.block-1));$('lv-next').addEventListener('click',()=>choose(current.block+1));$('loop-vis-play').addEventListener('click',()=>{playing=!playing;started=0;button();begin();});document.addEventListener('visibilitychange',()=>{started=0;begin();});reduced.addEventListener('change',e=>{if(e.matches){playing=false;button();}});
  button();data=build(current);updateStep(current);
  function update(state){const next={block:Math.max(0,Math.min(3,Math.round(state.block))),ref:state.ref,n:state.n};if(next.block!==current.block||next.ref!==current.ref||next.n!==current.n){const rebuild=next.n!==current.n;current=next;if(rebuild)data=build(current);updateStep(current);}}
  return {update,sync:update,getScenario(){return scenario;},setScenario(v){scenario=['ref','fb','same'].includes(v)?v:'ref';data=build(current);updateStep(current);},setVisible(value){visible=Boolean(value);started=0;begin();}};
}
