export interface AlgorithmInput {
  currentWeight: number;
  repsPerformed: number[]; // Array of reps for each set
  targetReps: number;
  wTop?: number; // Weight factor for first set (default 0.6)
  wRest?: number; // Weight factor for rest of sets (default 0.4)
  maxIncreasePct?: number; // Max % increase per session (default 0.08)
  maxDecreasePct?: number; // Max % decrease per session (default 0.10)
  roundTo?: number; // Round final weight to this increment (default 0.5)
}

export interface AlgorithmOutput {
  nextWeight: number;
  decision: 'incrementar' | 'mantener' | 'deload';
}

/**
 * Adaptive progressive overload algorithm based on relative performance
 *
 * This algorithm calculates the recommended weight for the next session based on:
 * - Priority on the first set (TopRep) - indicates fresh strength
 * - Consistency of remaining sets - indicates work capacity
 * - Safety limits to avoid excessive jumps
 * - Practical rounding for gym plates
 *
 * The algorithm:
 * 1. Prioritizes the first set
 * 2. Considers consistency of remaining sets
 * 3. Limits max increase to 8% per session
 * 4. Adjusts downward if there's fatigue or low performance
 * 5. Rounds weight to practical increments (0.5 kg)
 */
export function calculateProgressiveOverload(input: AlgorithmInput): AlgorithmOutput {
  const {
    currentWeight: W,
    repsPerformed: R,
    targetReps: T,
    wTop = 0.6,
    wRest = 0.4,
    maxIncreasePct = 0.08,
    maxDecreasePct = 0.10,
    roundTo = 0.5
  } = input;

  // If no sets performed, maintain weight
  if (R.length === 0) {
    return { nextWeight: W, decision: 'mantener' };
  }

  // Step 1: Calculate performance of first set
  const TopRep = R[0];
  const P_top = (TopRep - T) / T;

  // Step 2: Calculate average performance of remaining sets
  let P_rest = 0;
  const RestReps = R.slice(1);
  if (RestReps.length > 0) {
    const avgRest = RestReps.reduce((a, b) => a + b, 0) / RestReps.length;
    P_rest = (avgRest - T) / T;
  }

  // Step 3: Combine performances with weighting
  const PF = wTop * P_top + wRest * P_rest;
  // Soften the increment to avoid excessive jumps
  const PF_ajustado = PF * 0.5;

  // Step 4: Estimate 1RM from first set using Epley formula
  const one_rm_top = W * (1 + TopRep / 30.0);

  // Step 5: Adjust 1RM with Performance Factor
  const new_one_rm = one_rm_top * (1 + PF_ajustado);

  // Step 6: Calculate weight needed to perform T reps
  const W_raw = new_one_rm / (1 + T / 30.0);

  // Step 7: Apply safety limits
  const W_max = W * (1 + maxIncreasePct);
  const W_min = W * (1 - maxDecreasePct);
  let W_new = Math.min(Math.max(W_raw, W_min), W_max);

  // Step 8: Round to practical increments
  W_new = Math.round(W_new / roundTo) * roundTo;

  // Step 9: Determine decision
  let decision: 'incrementar' | 'mantener' | 'deload';
  if (W_new > W) {
    decision = 'incrementar';
  } else if (W_new < W) {
    decision = 'deload';
  } else {
    decision = 'mantener';
  }

  return { nextWeight: W_new, decision };
}
