export interface AlgorithmInput {
  currentWeight: number;
  repsPerformed: number[]; // Array of reps for each set
  targetReps: number;
  increment: number;
  previousFailures: number; // Number of consecutive sessions with failure/deload condition
}

export interface AlgorithmOutput {
  nextWeight: number;
  decision: 'incrementar' | 'mantener' | 'deload';
}

export function calculateProgressiveOverload(input: AlgorithmInput): AlgorithmOutput {
  const { currentWeight, repsPerformed, targetReps, increment, previousFailures } = input;
  
  if (repsPerformed.length === 0) {
      return { nextWeight: currentWeight, decision: 'mantener' };
  }

  const sets = repsPerformed.length;
  const topRep = repsPerformed[0];
  const volume = repsPerformed.reduce((a, b) => a + b, 0);
  
  const pTop = (topRep - targetReps) / targetReps;
  const targetVolume = targetReps * sets;
  const pVol = (volume - targetVolume) / targetVolume;

  let nextWeight = currentWeight;
  let decision: 'incrementar' | 'mantener' | 'deload' = 'mantener';

  // Decision logic
  if (pTop >= 0.10 || pVol >= 0.05) {
    nextWeight = currentWeight + increment;
    decision = 'incrementar';
  } else if (pTop <= -0.10 && previousFailures >= 2) {
    nextWeight = currentWeight * 0.90;
    decision = 'deload';
  } else if (pVol <= -0.15 && previousFailures >= 2) {
    nextWeight = currentWeight * 0.90;
    decision = 'deload';
  } else {
    nextWeight = currentWeight;
    decision = 'mantener';
  }

  return { nextWeight, decision };
}
