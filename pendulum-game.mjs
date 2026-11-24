import {initialGame,stepGame,phaseError,referenceFrequency,GAME_DURATION} from './pendulum-model.mjs?v=pendulum1';

export function initPendulumGame(){
  const $=id=>document.getElementById(id),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const format=(v,d=2)=>(Math.abs(v)<.5*10**-d?0:v).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
  let state=initialGame(),visible=false,playing=false,frame=0,last=0,feedbackKey='';
  const slider=$('pg-frequency');
  function bob(prefix,center,phase){const a=.65*Math.sin(phase),x=center+170*Math.sin(a),y=45+170*Math.cos(a);$(`pg-${prefix}-rod`).setAttribute('x2',x.toFixed(2));$(`pg-${prefix}-rod`).setAttribute('y2',y.toFixed(2));$(`pg-${prefix}-bob`).setAttribute('cx',x.toFixed(2));$(`pg-${prefix}-bob`).setAttribute('cy',y.toFixed(2));}
  function instruction(deg,difference){
    if(Math.abs(deg)>=175)return 'La diferencia está cerca de 180°. Puedes corregirla por cualquiera de los dos sentidos.';
    if(deg>30)return 'La referencia está adelantada. Aumenta tu frecuencia durante un rato para alcanzarla.';
    if(deg< -30)return 'Tu péndulo está adelantado. Reduce tu frecuencia durante un rato para que la referencia lo alcance.';
    if(Math.abs(difference)>.04)return difference>0?'Las fases están cerca. Aumenta tu frecuencia para que no se vuelvan a separar.':'Las fases están cerca. Reduce tu frecuencia para que no se vuelvan a separar.';
    return 'Fase y frecuencia están cerca. Mantén la atención porque la referencia seguirá cambiando.';
  }
  function button(){const el=$('pg-play');el.textContent=state.done?'Partida terminada':playing?'Ⅱ Pausar':state.time===0?'▶ Empezar':'▶ Continuar';el.disabled=state.done;$('pg-mini-play').textContent=el.textContent;$('pg-mini-play').disabled=state.done;}
  function render(){const error=phaseError(state.referencePhase,state.userPhase)*180/Math.PI,ref=referenceFrequency(state.time),difference=ref-state.userFrequency;
    bob('ref',260,state.referencePhase);bob('user',500,state.userPhase);
    $('pg-ref-frequency').textContent=`${format(ref,3)} Hz`;$('pg-user-frequency').textContent=`${format(state.userFrequency,3)} Hz`;$('pg-frequency-out').textContent=`${format(state.userFrequency,3)} Hz`;
    $('pg-error').textContent=`${error>0?'+':''}${format(error,1)}°`;$('pg-phase-marker').style.left=`${(error+180)/360*100}%`;
    $('pg-remaining').textContent=`${format(Math.max(0,GAME_DURATION-state.time),1)} s`;$('pg-time-fill').style.width=`${state.time/GAME_DURATION*100}%`;
    const percent=state.time>0?100*state.goodTime/state.time:0;$('pg-score').textContent=`Tiempo en zona · ${format(percent,0)} %`;
    const message=instruction(error,difference);if(message!==feedbackKey){$('pg-feedback').textContent=message;feedbackKey=message;}
    const done=$('pg-end');done.hidden=!state.done;if(state.done)done.textContent=`Partida terminada. Has mantenido ambas condiciones durante ${format(percent,0)} % del tiempo. Prueba otra vez y observa cómo debes cambiar de frecuencia para corregir el desfase.`;
    slider.style.setProperty('--fill',`${(state.userFrequency-.65)/.7*100}%`);$('pg-mini-frequency').value=String(state.userFrequency);$('pg-mini-frequency').style.setProperty('--fill',`${(state.userFrequency-.65)/.7*100}%`);$('pg-mini-out').textContent=`${format(state.userFrequency,3)} Hz`;button();
  }
  function tick(now){frame=0;if(!visible||!playing||document.hidden||state.done){last=0;return;}if(last){const dt=Math.min((now-last)/1000,.08);state=stepGame(state,dt,Number(slider.value));}last=now;render();if(state.done){playing=false;button();return;}frame=requestAnimationFrame(tick);}
  function begin(){if(visible&&playing&&!document.hidden&&!frame&&!state.done){last=0;frame=requestAnimationFrame(tick);}}
  function togglePlay(){if(state.done)return;playing=!playing;last=0;button();begin();}$('pg-play').addEventListener('click',togglePlay);$('pg-mini-play').addEventListener('click',togglePlay);
  $('pg-reset').addEventListener('click',()=>{playing=false;last=0;state=initialGame();slider.value='1';feedbackKey='';render();});
  for(const input of [slider,$('pg-mini-frequency')])input.addEventListener('input',e=>{state={...state,userFrequency:Number(e.target.value)};slider.value=String(state.userFrequency);render();});
  document.addEventListener('visibilitychange',()=>{last=0;begin();});
  reduced.addEventListener('change',e=>{if(e.matches){playing=false;last=0;button();}});
  render();return {setVisible(value){visible=Boolean(value);last=0;begin();}};
}
