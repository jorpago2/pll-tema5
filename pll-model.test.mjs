import test from 'node:test';
import assert from 'node:assert/strict';
import {simulatePLL,noiseTransfer} from './pll-model.mjs';
const near=(a,b,tol)=>assert.ok(Math.abs(a-b)<tol,`${a} vs ${b}`);

test('equilibrium maintains reference and divided output frequencies',()=>{
 const points=simulatePLL({detuningKHz:0,stepKHz:0});
 for(const p of points){near(p.errorRad,0,1e-14);near(p.dividedMHz,100,1e-12);near(p.outputMHz,2400,1e-10);}
});
test('negative feedback damps initial frequency error',()=>{
 const p=simulatePLL({detuningKHz:100,durationUs:100});
 near(p[0].frequencyErrorHz,-100000,1e-5);
 assert.ok(Math.abs(p.at(-1).frequencyErrorHz)<.1);
 assert.ok(Math.abs(p.at(-1).errorRad)<1e-6);
});
test('reference step is tracked with multiplication by N',()=>{
 const p=simulatePLL({detuningKHz:0,stepKHz:40,stepTimeUs:20,durationUs:120});
 near(p.at(-1).referenceMHz,100.04,1e-10);
 near(p.at(-1).dividedMHz,100.04,1e-7);
 near(p.at(-1).outputMHz,2400.96,1e-5);
});
test('step at t=0 and changes in sample count are consistent',()=>{
 const a=simulatePLL({stepTimeUs:0,stepKHz:50,durationUs:75,samples:151});
 const b=simulatePLL({stepTimeUs:0,stepKHz:50,durationUs:75,samples:301});
 near(a.at(-1).errorRad,b.at(-1).errorRad,1e-9);
 near(a.at(-1).referenceMHz,100.05,1e-10);
});
test('phase noise transfer has reference low-pass and VCO high-pass limits',()=>{
 const low=noiseTransfer({offsetHz:1,divider:24}),high=noiseTransfer({offsetHz:1e10,divider:24});
 near(low.referenceDb,20*Math.log10(24),1e-6);assert.ok(low.vcoDb<-150);
 near(high.vcoDb,0,1e-6);assert.ok(high.referenceDb<-40);
});
test('noise transfer equals closed-loop rational functions at the natural frequency',()=>{
 const damping=.8,divider=10,p=noiseTransfer({offsetHz:100e3,naturalKHz:100,damping,divider});
 near(p.vcoPower,1/(4*damping*damping),1e-12);
 near(p.referencePower,divider**2*(1+4*damping*damping)/(4*damping*damping),1e-10);
});
test('invalid parameters are rejected',()=>{
 assert.throws(()=>simulatePLL({divider:0}),RangeError);
 assert.throws(()=>simulatePLL({naturalKHz:0}),RangeError);
 assert.throws(()=>noiseTransfer({offsetHz:0}),RangeError);
});
