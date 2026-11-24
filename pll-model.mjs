/** Linear small-signal continuous-time type-II PLL, referred to phase at the divider output.
 * The phase detector and VCO are idealized, no saturation or cycle slips are modeled.
 * Frequency step is applied to the input reference. SI internally, returned units stated in names.
 */
const TAU = 2 * Math.PI;
const DEFAULTS = Object.freeze({naturalKHz:100,damping:0.707,detuningKHz:100,stepKHz:0,stepTimeUs:30,durationUs:100,divider:24,referenceMHz:100,samples:700});
function config(options) {
  const p={...DEFAULTS,...options};
  for(const key of Object.keys(DEFAULTS)) if(!Number.isFinite(p[key])) throw new RangeError(`${key} must be finite`);
  if(p.naturalKHz<=0||p.damping<=0||p.durationUs<=0||p.referenceMHz<=0||p.divider<1||p.stepTimeUs<0||p.samples<2||p.samples>10000||!Number.isInteger(p.samples)||!Number.isInteger(p.divider)) throw new RangeError('invalid PLL parameters');
  return p;
}
/**
 * Phase error e = θref − θout/N. x is the integral correction in rad/s.
 * e′ = 2πΔfref − x − 2ζωn e, x′ = ωn² e.
 * At t=0 the free-running divided VCO is detuningKHz above reference.
 * Frequency lock criterion is instantaneous, not a physical acquisition detector.
 */
export function simulatePLL(options={}) {
  const p=config(options),wn=TAU*p.naturalKHz*1e3,kp=2*p.damping*wn,ki=wn*wn;
  let e=0,x=TAU*p.detuningKHz*1e3,t=0;
  const maxH=Math.min(0.025/wn,0.06/(kp||wn));
  const stepT=p.stepTimeUs*1e-6;
  const referenceDelta=time=>time>=stepT?TAU*p.stepKHz*1e3:0;
  function deriv(a,b,ref) {return [ref-b-kp*a,ki*a];}
  function integrate(h,ref) {
    const k1=deriv(e,x,ref),k2=deriv(e+h*k1[0]/2,x+h*k1[1]/2,ref),k3=deriv(e+h*k2[0]/2,x+h*k2[1]/2,ref),k4=deriv(e+h*k3[0],x+h*k3[1],ref);
    e+=h*(k1[0]+2*k2[0]+2*k3[0]+k4[0])/6;
    x+=h*(k1[1]+2*k2[1]+2*k3[1]+k4[1])/6;
  }
  const out=[];
  for(let i=0;i<p.samples;i++) {
    const goal=p.durationUs*1e-6*i/(p.samples-1);
    while(t<goal) {
      let h=Math.min(maxH,goal-t);
      if(t<stepT&&t+h>stepT)h=stepT-t;
      if(h<=0)break;
      integrate(h,referenceDelta(t+h/2));t+=h;
      if(goal-t<1e-20)t=goal;
    }
    const deltaHz=referenceDelta(goal)/TAU, dividedHz=p.referenceMHz*1e6+(x+kp*e)/TAU;
    const refHz=p.referenceMHz*1e6+deltaHz, errorHz=refHz-dividedHz;
    out.push({tUs:goal*1e6,errorRad:e,outputMHz:dividedHz*p.divider/1e6,dividedMHz:dividedHz/1e6,referenceMHz:refHz/1e6,frequencyErrorHz:errorHz,locked:Math.abs(e)<0.05&&Math.abs(errorHz)<p.naturalKHz*1e3*.005});
  }
  return out;
}
/** Squared-magnitude transfers of independent input phase-noise components to output phase.
 * The reference transfer includes multiplication by N². Not an absolute noise spectrum.
 */
export function noiseTransfer({offsetHz,naturalKHz=100,damping=.707,divider=24}={}) {
  if(!Number.isFinite(offsetHz)||offsetHz<=0||!Number.isFinite(naturalKHz)||naturalKHz<=0||!Number.isFinite(damping)||damping<=0||!Number.isInteger(divider)||divider<1)throw new RangeError('invalid noise transfer parameters');
  const r=offsetHz/(naturalKHz*1e3), den=(1-r*r)**2+(2*damping*r)**2;
  const href=(1+(2*damping*r)**2)/den,hvco=r**4/den;
  return {referenceDb:10*Math.log10(divider**2*href),vcoDb:10*Math.log10(hvco),referencePower:divider**2*href,vcoPower:hvco};
}
