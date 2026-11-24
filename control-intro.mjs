/** UI for the normalized linear type-II second-order PLL equivalent. */
export function initControlIntro({onChange=()=>{}}={}) {
  const $=id=>document.getElementById(id),fmt=(v,d=3)=>v.toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
  let current={natural:100,damping:.7}, step=0;
  const stages=[
    {kicker:'ACCIÓN PROPORCIONAL',title:'P responde al error presente',copy:'La acción proporcional produce una corrección que sigue el error de fase en cada instante. Si se invierte el signo del error, también lo hace esta contribución.',formula:'u<sub>P</sub>(t) = K<sub>p</sub> e(t)',insight:'En el dibujo, un error positivo se aplica durante un intervalo y la contribución P aparece y desaparece con él.',input:'Error de fase e',output:'Acción P'},
    {kicker:'ACCIÓN INTEGRAL',title:'I acumula el error con el tiempo',copy:'La acción integral depende del área acumulada del error de fase. Mientras el error sea positivo, su contribución aumenta. Cuando el error vuelve a cero, conserva el valor acumulado en este ejemplo ideal.',formula:'u<sub>I</sub>(t) = K<sub>i</sub> ∫ e(t) dt',insight:'La acumulación permite que, en el modelo tipo II estable, el lazo mantenga la corrección de frecuencia con error de fase estacionario nulo ante un salto de frecuencia dentro de la zona lineal.',input:'Error de fase e',output:'Acción I'},
    {kicker:'LA PLANTA DEL LAZO',title:'El VCO integra frecuencia para producir fase',copy:'Una variación de frecuencia angular cambia la pendiente de la fase. Por ello, al integrar la desviación de frecuencia se obtiene la variación de fase de la salida dividida que vuelve al detector.',formula:'Δφ<sub>div</sub>(s) = Δω<sub>div</sub>(s) / s',insight:'La planta 1/s está expresada para φdiv = φout/N, con las ganancias del VCO y el divisor incorporadas en la normalización.',input:'Δω dividida',output:'Δφ dividida'}
  ];
  function illustration() {
    const labels=stages[step], ox=90, width=225;
    const mapX=t=>ox+t*width;
    const input=t=>t>=.25&&t<.75?1:0;
    const integral=t=>t<.25?0:t<.75?(t-.25)*1.5:.75;
    const output=t=>step===0?input(t):integral(t);
    function path(fn,row){let d='';for(let i=0;i<=240;i++){const t=i/240,x=mapX(t),y=row-35*fn(t);d+=`${i?'L':'M'}${x.toFixed(1)} ${y.toFixed(1)} `;}return d;}
    $('ci-figure-content').innerHTML=`<path d="M90 68H315 M90 151H315 M90 20V163 M146 20V163 M259 20V163 M315 20V163" class="ci-chart-grid"/><text x="4" y="52" class="ci-chart-label">${labels.input}</text><text x="4" y="135" class="ci-chart-label">${labels.output}</text><path d="${path(input,68)}" class="ci-chart-input"/><path d="${path(output,151)}" class="ci-chart-output"/><text x="90" y="184" class="ci-chart-label">Tiempo de ejemplo →</text>`;
    $('ci-figure-desc').textContent=`Se compara una señal de entrada en forma de pulso con ${labels.output.toLowerCase()}. Las unidades y el tiempo son ilustrativos.`;
  }
  function showStep() {
    const p=stages[step];$('ci-kicker').textContent=p.kicker;$('ci-title').textContent=p.title;$('ci-copy').textContent=p.copy;$('ci-formula').innerHTML=p.formula;$('ci-insight').textContent=p.insight;
    document.querySelectorAll('[data-ci-step]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.ciStep)===step)));
    document.querySelectorAll('[data-ci-block]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.ciBlock)===step)));illustration();
  }
  function slider(id,value,text){const el=$(id);el.value=String(value);el.style.setProperty('--fill',`${100*(value-Number(el.min))/(Number(el.max)-Number(el.min))}%`);$(`${id}-out`).textContent=text;}
  function update(s) {
    current={natural:s.natural,damping:s.damping};slider('ci-natural',current.natural,`${fmt(current.natural,0)} kHz`);slider('ci-damping',current.damping,fmt(current.damping,2));
    const omega=2*Math.PI*current.natural*1e3,kp=2*current.damping*omega*1e-6,ki=omega**2*1e-12;
    $('ci-kp').textContent=`${fmt(kp)} µs⁻¹`;$('ci-ki').textContent=`${fmt(ki)} µs⁻²`;
  }
  document.querySelectorAll('[data-ci-step]').forEach(b=>b.addEventListener('click',()=>{step=Number(b.dataset.ciStep);showStep();}));
  document.querySelectorAll('[data-ci-block]').forEach(b=>{const go=()=>{step=Number(b.dataset.ciBlock);showStep();};b.addEventListener('click',go);b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});});
  for(const [id,key] of [['ci-natural','natural'],['ci-damping','damping']])$(id).addEventListener('input',e=>onChange(key,Number(e.target.value)));
  showStep();update(current);return{update,setVisible(visible){$('panel-control')?.classList.toggle('ci-paused',!visible);}};
}
