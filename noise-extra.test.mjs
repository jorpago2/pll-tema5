import test from 'node:test';
import assert from 'node:assert/strict';
import {pllNoiseContributions} from './noise-extra.mjs';
const common={naturalKHz:100,damping:.7,divider:24,refDb:-145,vcoAt1MHzDb:-110};
test('uncorrelated output spectra are summed as linear powers',()=>{
  for(const offsetHz of [1000,1e4,1e5,1e6,1e7]){const v=pllNoiseContributions({...common,offsetHz});const sum=10*Math.log10(10**(v.refOutDb/10)+10**(v.vcoOutDb/10));assert.ok(Math.abs(v.totalDb-sum)<1e-10);assert.ok(v.totalDb>=Math.max(v.refOutDb,v.vcoOutDb));}
});
test('doubling reference noise doubles its contribution before the output sum',()=>{
  const a=pllNoiseContributions({...common,offsetHz:1e4});const b=pllNoiseContributions({...common,offsetHz:1e4,refDb:common.refDb+10*Math.log10(2)});assert.ok(Math.abs(b.refOutDb-a.refOutDb-10*Math.log10(2))<1e-10);assert.equal(b.vcoOutDb,a.vcoOutDb);
});
test('VCO source falls 20 dB per decade and N affects reference propagation',()=>{
  const a=pllNoiseContributions({...common,offsetHz:1e5});const b=pllNoiseContributions({...common,offsetHz:1e6});assert.ok(Math.abs(a.vcoSourceDb-b.vcoSourceDb-20)<1e-10);const c=pllNoiseContributions({...common,offsetHz:1e5,divider:12});assert.ok(Math.abs(a.refOutDb-c.refOutDb-20*Math.log10(2))<1e-10);assert.equal(a.vcoOutDb,c.vcoOutDb);
});
test('log-domain addition remains finite for extreme noise level separation',()=>{
  const v=pllNoiseContributions({...common,offsetHz:1e5,refDb:-4000,vcoAt1MHzDb:4000});assert.ok(Number.isFinite(v.totalDb));assert.ok(Math.abs(v.totalDb-v.vcoOutDb)<1e-8);
});

test('equal output contributions add 3.0103 dB',()=>{
  const first=pllNoiseContributions({...common,offsetHz:1e5});
  const v=pllNoiseContributions({...common,offsetHz:1e5,vcoAt1MHzDb:common.vcoAt1MHzDb+first.refOutDb-first.vcoOutDb});
  assert.ok(Math.abs(v.refOutDb-v.vcoOutDb)<1e-10);
  assert.ok(Math.abs(v.totalDb-v.refOutDb-10*Math.log10(2))<1e-10);
});
