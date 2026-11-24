export function initComparators() {
  const $=id=>document.getElementById(id), fmt=(n,d=3)=>n.toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
  let type='mix',phase=45;
  const definitions={
    mix:{name:'Multiplicador analógico', description:'Se multiplican dos señales senoidales. El filtro del lazo elimina la componente a la suma de frecuencias y conserva el valor medio, que depende del desfase.', formula:'v̄ = ½ sen(φ)', limits:'Aquí φ mide el desfase adicional respecto a la cuadratura. Alrededor de φ = 0 la respuesta es aproximadamente lineal y conserva el signo del error. El valor medio es periódico y no identifica por sí solo una diferencia sostenida de frecuencia.',unit:'Producto medio para entradas de amplitud unidad.'},
    xor:{name:'Detector digital XOR',description:'La salida está a nivel alto cuando las señales cuadradas tienen niveles opuestos. Al aumentar la separación entre sus flancos, aumenta la fracción del periodo en nivel alto.',formula:'D = |φ| / 180°',limits:'Para estas entradas ideales, +φ y −φ producen el mismo ciclo de trabajo. La XOR no determina el signo del error alrededor de 0°. Una realización de PLL puede polarizar el punto de trabajo en otra zona de la curva.',unit:'Fracción del periodo con salida a nivel alto.'},
    pfd:{name:'Detector de fase y frecuencia con bomba de carga',description:'El PFD compara los flancos ascendentes. Si la referencia se adelanta, genera un pulso UP. Si se adelanta la realimentación, genera DOWN. La bomba inyecta o extrae corriente durante ese pulso.',formula:'Ī / Icp = φ / 360°',limits:'La relación corresponde a un PFD ideal de tres estados y corrientes simétricas, con igual periodo. El signo se refiere a corriente hacia el filtro y supone que un aumento de tensión eleva la frecuencia del VCO.',unit:'Corriente media dividida por la corriente de bomba Icp.'}
  };
  const mean=(angle,which=type)=>which==='mix'?.5*Math.sin(angle*Math.PI/180):which==='xor'?Math.abs(angle)/180:angle/360;
  const s=(v)=>v.toFixed(2),mod=(v)=>((v%1)+1)%1;
  function signalPath(y,fn,scale=15){let d='';for(let i=0;i<=400;i++){let t=i/400,v=fn(t);d+=`${i?'L':'M'}${s(62+t*402)} ${s(y-v*scale)} `;}return d;}
  function drawWave() {
    const g=$('comp-wave'), ph=phase/360, square=t=>mod(t-.25)<.5?1:0;
    const ref=t=>square(t), feedback=t=>square(t-ph);
    let output,refs;
    if(type==='mix'){refs=[t=>Math.sin(2*Math.PI*(t+ph)),t=>Math.cos(2*Math.PI*t)];output=t=>refs[0](t)*refs[1](t);}
    else if(type==='xor'){refs=[ref,feedback];output=t=>ref(t)!==feedback(t)?1:0;}
    else {refs=[ref,feedback];output=t=>phase>0?(mod(t-.25)<ph?1:0):phase<0?(mod(t-.25-ph)<-ph?-1:0):0;}
    const line=(y,cl,fn,sc)=>`<path d="${signalPath(y,fn,sc)}" class="${cl}"/>`;
    let txt=`<g class="comp-grid"><path d="M62 50H464 M62 110H464 M62 180H464 M62 20V205 M263 20V205 M464 20V205"/></g><g class="comp-label"><text x="3" y="53">Referencia</text><text x="3" y="113">Realim.</text><text x="3" y="183">Salida</text><text x="62" y="224">0</text><text x="254" y="224">T / 2</text><text x="458" y="224">T</text></g>`;
    txt+=line(50,'comp-wave-ref',refs[0],type==='mix'?16:23)+line(110,'comp-wave-fb',refs[1],type==='mix'?16:23)+line(180,'comp-wave-output',output,type==='mix'?23:20);
    g.setAttribute('viewBox','0 0 480 230');g.innerHTML=txt;
    $('comp-wave-caption').textContent=type==='mix'?'La salida verde es el producto instantáneo. La componente de alta frecuencia se atenúa mediante el filtro.':type==='xor'?'La salida verde vale uno cuando las dos entradas son distintas.':'La salida verde representa la corriente de bomba normalizada. UP es positiva y DOWN negativa.';
  }
  function drawCurve(){
    const svg=$('comp-curve'),x=a=>48+(a+180)/360*405,y=v=>126-v*85;
    let d='';for(let i=0;i<=360;i++){const a=i-180;d+=`${i?'L':'M'}${s(x(a))} ${s(y(mean(a)))} `;}
    const py=y(mean(phase));
    svg.setAttribute('viewBox','0 0 480 230');
    svg.innerHTML=`<g class="comp-grid"><path d="M48 ${y(-1)}H453 M48 ${y(-.5)}H453 M48 ${y(0)}H453 M48 ${y(.5)}H453 M48 ${y(1)}H453 M48 34V212 M250.5 34V212 M453 34V212"/></g><g class="comp-label"><text x="18" y="${y(1)+4}">1</text><text x="18" y="${y(.5)+4}">0,5</text><text x="22" y="${y(0)+4}">0</text><text x="14" y="${y(-.5)+4}">−0,5</text><text x="12" y="${y(-1)+4}">−1</text><text x="38" y="226">−180°</text><text x="243" y="226">0°</text><text x="435" y="226">180°</text></g><path d="${d}" class="comp-line"/><circle cx="${s(x(phase))}" cy="${s(py)}" r="5" class="comp-dot"/>`;
  }
  function render(){const d=definitions[type];$('comp-name').textContent=d.name;$('comp-description').textContent=d.description;$('comp-formula').textContent=d.formula;$('comp-limits').textContent=d.limits;$('comp-unit').textContent=d.unit;$('comp-phase-convention').textContent=type==='mix'?'φ es el desfase de referencia respecto a la realimentación, medido desde la cuadratura.':'φ = fase de referencia − fase de realimentación';$('comp-phase-value').textContent=`${phase>0?'+':''}${phase}°`;$('comp-mean').textContent=fmt(mean(phase));$('comp-phase').style.setProperty('--fill',`${(phase+180)/360*100}%`);document.querySelectorAll('[data-comp-type]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.compType===type)));drawWave();drawCurve();}
  document.querySelectorAll('[data-comp-type]').forEach(b=>b.addEventListener('click',()=>{type=b.dataset.compType;render();}));
  $('comp-phase').addEventListener('input',e=>{phase=Number(e.target.value);render();});
  render();return {render};
}
