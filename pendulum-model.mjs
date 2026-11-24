/** Interactive phase-tracking toy. Frequencies are prescribed, not inferred from mechanical pendulum dynamics. */
const TAU=2*Math.PI;
export const GAME_DURATION=45;
export function referenceFrequency(t){if(!Number.isFinite(t)||t<0)throw new RangeError('time must be nonnegative');return 1+.12*Math.sin(TAU*t/26)+.035*Math.sin(TAU*t/11);}
export function phaseError(reference,user){if(!Number.isFinite(reference)||!Number.isFinite(user))throw new RangeError('phases must be finite');return Math.atan2(Math.sin(reference-user),Math.cos(reference-user));}
export function initialGame(){return {time:0,referencePhase:0,userPhase:-Math.PI/3,userFrequency:1,goodTime:0,done:false};}
export function stepGame(state,dt,userFrequency){
  if(!Number.isFinite(dt)||dt<0||!Number.isFinite(userFrequency)||userFrequency<.65||userFrequency>1.35)throw new RangeError('invalid game input');
  if(state.done||dt===0)return {...state};
  const elapsed=Math.min(dt,GAME_DURATION-state.time),fref=referenceFrequency(state.time+elapsed/2);
  const next={...state,time:state.time+elapsed,userFrequency,referencePhase:state.referencePhase+TAU*fref*elapsed,userPhase:state.userPhase+TAU*userFrequency*elapsed};
  const error=Math.abs(phaseError(next.referencePhase,next.userPhase)),fdiff=Math.abs(referenceFrequency(next.time)-userFrequency);
  next.goodTime=state.goodTime+(error<=Math.PI/6&&fdiff<=.04?elapsed:0);next.done=next.time>=GAME_DURATION;return next;
}
