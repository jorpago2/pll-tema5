/** Visual guide to the PLL blocks. The traces are illustrative and not the loop solver. */
export function initLoopVisual({onStep=()=>{}}={}) {
  const $=id=>document.getElementById(id), format=(x,d=0)=>x.toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let current={block:0,ref:100,n:24},visible=false,playing=!reduced.matches,frame=0,started=0;
  const mod=x=>((x%1)+1)%1;
  const percent=(x)=>Number(x).toFixed(2);
  function digital(row,fn,cycles,samples=1100) {
    let previous=fn(0),d=`M205 ${row-previous*23}`;
    for(let i=1;i<=samples;i++) {const x=205+455*i/samples, value=fn(cycles*i/samples);if(value!==previous){d+=` H${percent(x)} V${row-value*23}`;previous=value;}}
    return d+' H660';
  }
  function continuous(row,fn,samples=550) {let d='';for(let i=0;i<=samples;i++){const t=i/samples,x=205+455*t,y=row-fn(t)*23;d+=`${i?'L':'M'}${percent(x)} ${percent(y)} `;}return d;}
  function diagram(labels,paths,endLabel) {
    let out='<g class="lv-grid"><path d="M205 64H660 M205 134H660 M205 204H660 M205 24V222 M432.5 24V222 M660 24V222"/></g>';
    for(let i=0;i<labels.length;i++)out+=`<text class="lv-axis-label" x="12" y="${[68,138,208][i]}">${labels[i]}</text>`;
    out+=`<g class="lv-tick"><text x="205" y="241">Inicio</text><text x="660" y="241" text-anchor="end">${endLabel}</text></g>`;
    for(const [d,cls] of paths)out+=`<path d="${d}" class="${cls}"/>`;
    return out;
  }
  function updateStep(s) {
    const detector=s.block===0,filter=s.block===1,vco=s.block===2;
    let title,kicker,value,copy,insight,labels,paths,legend,desc,end='Tiempo de ejemplo →';
    if(detector) {
      kicker='COMPARACIÓN DE FLANCOS';title='El detector genera una corrección';value='Referencia adelantada';
      copy='En este ejemplo, el flanco de referencia llega antes que el de realimentación. Un detector PFD produce entonces un pulso UP, cuya duración depende de la separación entre ambos flancos.';
      insight='Si llega antes la realimentación, el PFD produce DOWN. La bomba de carga inyecta o extrae corriente del filtro según el pulso recibido.';
      const ref=t=>mod(t-.08)<.5?1:0, fb=t=>mod(t-.205)<.5?1:0, up=t=>mod(t-.08)<.125?1:0;
      labels=['Referencia','Realimentación','UP'];paths=[[digital(64,ref,2),'lv-wave-ref'],[digital(134,fb,2),'lv-wave-fb'],[digital(204,up,2),'lv-wave-control']];
      legend='<span>Referencia</span><span class="lv-orange">Realimentación</span><span class="lv-green">Pulso UP</span>';
      desc='Ejemplo conceptual con dos señales de igual periodo. Los flancos ascendentes de referencia llegan antes y se genera un pulso UP hasta la llegada del flanco de realimentación.';
    } else if(filter) {
      kicker='DE PULSOS A CONTROL';title='El filtro suaviza la corrección';value='Ejemplo simplificado';
      copy='La bomba de carga convierte los pulsos del detector en corriente. El filtro almacena y filtra esa carga, generando una tensión de control para el VCO.';
      insight='Una sucesión de pulsos UP aporta carga y eleva la tensión. Con pulsos DOWN, la bomba extrae carga. La respuesta exacta depende del filtro y de sus componentes.';
      const pulse=t=>mod(t-.1)<.20?1:0,level=[];let y=0;for(let i=0;i<=600;i++){let t=i/600*3;const u=pulse(t);y+=(u-y)*.018;level.push(y);}
      const filtered=t=>level[Math.min(600,Math.round(t*600))];
      labels=['Pulsos UP','Corriente de bomba','Tensión filtrada'];paths=[[digital(64,pulse,3),'lv-wave-ref'],[digital(134,pulse,3),'lv-wave-control'],[continuous(204,filtered),'lv-wave-orange']];
      legend='<span>Pulsos UP</span><span class="lv-green">Corriente positiva</span><span class="lv-orange">Tensión de ejemplo</span>';
      desc='Pulsos UP activan corriente positiva y un ejemplo de filtro suaviza esa señal. Es una ilustración simplificada, no una respuesta calculada del filtro de un PLL de tipo II.';
    } else if(vco) {
      kicker='TENSIÓN A FRECUENCIA';title='El VCO cambia su frecuencia';value='Ejemplo con KVCO > 0';
      copy='El VCO transforma la tensión de control en frecuencia. Compara dos señales dibujadas durante el mismo intervalo, una con tensión de control baja y otra con tensión más alta.';
      insight='Con KVCO positivo, una tensión mayor produce una frecuencia mayor. Estas dos trazas representan condiciones distintas, no dos señales simultáneas a la salida.';
      const lo=t=>Math.sin(2*Math.PI*2*t),hi=t=>Math.sin(2*Math.PI*4*t),control=t=>t<.5?0:.8;
      labels=['Tensión de control','VCO con tensión baja','VCO con tensión alta'];paths=[[digital(64,control,1),'lv-wave-control'],[continuous(134,lo),'lv-wave-ref'],[continuous(204,hi),'lv-wave-orange']];
      legend='<span class="lv-green">Dos niveles de control</span><span>Frecuencia menor</span><span class="lv-orange">Frecuencia mayor</span>';
      desc='Representación conceptual de dos niveles de tensión y las señales de un VCO en dos condiciones, con mayor frecuencia cuando aumenta la tensión.';
    } else {
      kicker='REALIMENTACIÓN';title=s.n===1?'La realimentación conserva la frecuencia':'El divisor devuelve una señal más lenta';value=`N = ${format(s.n)}`;
      copy=`El divisor entrega al detector una frecuencia fVCO/N. En enganche, con la referencia ajustada a ${format(s.ref)} MHz y N = ${format(s.n)}, la salida es ${format(s.ref*s.n)} MHz.`;
      insight=s.n===1?'Con N = 1, la realimentación conserva la frecuencia del VCO. La salida y la referencia tienen la misma frecuencia cuando el lazo está enganchado.':`Por cada ${format(s.n)} ciclos del VCO, la señal dividida completa un ciclo. El detector compara esta señal dividida con la referencia.`;
      const vcoWave=t=>mod(t*s.n)<.5?1:0, refWave=t=>mod(t)<.5?1:0;
      labels=['Salida del VCO','Salida dividida','Referencia'];paths=[[digital(64,vcoWave,1,Math.max(1200,s.n*60)),'lv-wave-orange'],[digital(134,refWave,1),'lv-wave-control'],[digital(204,refWave,1),'lv-wave-ref']];
      legend='<span class="lv-orange">Salida VCO</span><span class="lv-green">VCO / N</span><span>Referencia</span>';
      desc=`Durante un periodo de referencia se representan ${format(s.n)} ciclos del VCO y un ciclo dividido. Las frecuencias elegidas corresponden a un lazo enganchado.`;
      end='Un periodo de referencia →';
    }
    $('lv-kicker').textContent=kicker;$('lv-title').textContent=title;$('lv-value').textContent=value;$('lv-copy').textContent=copy;$('lv-insight').textContent=insight;$('lv-wave-content').innerHTML=diagram(labels,paths,end);$('lv-wave-desc').textContent=desc;$('lv-legend').innerHTML=legend;$('lv-count').textContent=`${s.block+1} de 4`;
    $('lv-prev').disabled=s.block===0;$('lv-next').disabled=s.block===3;
    document.querySelectorAll('[data-lv-step]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.lvStep)===s.block)));
    document.querySelectorAll('[data-lv-flow]').forEach(el=>el.classList.toggle('is-active',Number(el.dataset.lvFlow)===s.block));
  }
  function tick(now){frame=0;if(!visible||!playing||document.hidden){started=0;return;}if(!started)started=now;const x=205+455*((now-started)%5000)/5000;$('lv-scanner').setAttribute('d',`M${percent(x)} 24V222`);frame=requestAnimationFrame(tick);}
  function begin(){if(visible&&playing&&!frame&&!document.hidden)frame=requestAnimationFrame(tick);}
  function button(){document.querySelector('.diagram').classList.toggle('loop-motion-paused',!playing);$('loop-vis-play').textContent=playing?'Ⅱ Pausar':'▶ Reproducir';$('loop-vis-play').setAttribute('aria-label',playing?'Pausar recorrido visual':'Reproducir recorrido visual');}
  function choose(index){onStep(Math.max(0,Math.min(3,index)));}
  document.querySelectorAll('[data-lv-step]').forEach(b=>b.addEventListener('click',()=>choose(Number(b.dataset.lvStep))));$('lv-prev').addEventListener('click',()=>choose(current.block-1));$('lv-next').addEventListener('click',()=>choose(current.block+1));$('loop-vis-play').addEventListener('click',()=>{playing=!playing;started=0;button();begin();});document.addEventListener('visibilitychange',()=>{started=0;begin();});reduced.addEventListener('change',e=>{if(e.matches){playing=false;button();}});
  button();updateStep(current);
  function update(state){const next={block:Math.max(0,Math.min(3,Math.round(state.block))),ref:state.ref,n:state.n};if(next.block!==current.block||next.ref!==current.ref||next.n!==current.n){current=next;updateStep(current);}}
  return {update,sync:update,setVisible(value){visible=Boolean(value);started=0;begin();}};
}
