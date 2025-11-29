import { describe, test, expect } from 'vitest';
import { calculateProgressiveOverload } from './algorithm';

describe('Progressive Overload Algorithm', () => {
  // Example 1: High Force / Strength
  test('Example 1: Should increment weight (High Force)', () => {
    const result = calculateProgressiveOverload({
      currentWeight: 80,
      repsPerformed: [10, 8, 7],
      targetReps: 8,
      increment: 2.5,
      previousFailures: 0
    });
    
    // P_top = (10 - 8)/8 = 0.25 (>= 0.10) -> Increment
    expect(result.nextWeight).toBe(82.5);
    expect(result.decision).toBe('incrementar');
  });

  // Example 2: Hypertrophy Maintenance
  test('Example 2: Should maintain weight (Hypertrophy Medium)', () => {
    const result = calculateProgressiveOverload({
      currentWeight: 50,
      repsPerformed: [12, 12, 11],
      targetReps: 12,
      increment: 2,
      previousFailures: 0
    });

    // P_top = (12 - 12)/12 = 0
    // P_vol = (35 - 36)/36 = -0.027...
    // Both in neutral range -> Maintain
    expect(result.nextWeight).toBe(50);
    expect(result.decision).toBe('mantener');
  });

  // Example 3: Stagnation / Deload
  test('Example 3: Should deload (Stagnation)', () => {
    const result = calculateProgressiveOverload({
      currentWeight: 80,
      repsPerformed: [7, 6, 6],
      targetReps: 8,
      increment: 2.5,
      previousFailures: 3 // >= 2
    });

    // P_top = (7 - 8)/8 = -0.125 (<= -0.10)
    // Failures >= 2 -> Deload
    expect(result.nextWeight).toBe(72); // 80 * 0.9
    expect(result.decision).toBe('deload');
  });

  // Edge case: Volume increase
  test('Should increment if volume is high even if top set is normal', () => {
     const result = calculateProgressiveOverload({
      currentWeight: 100,
      repsPerformed: [10, 10, 10, 10], // 40 reps
      targetReps: 10, // Target 10 reps, say 3 sets? 
      // Wait, the algorithm assumes variable sets? 
      // The prompt says "Target Reps" (T) and "Reps Array" (R).
      // P_vol = (Vol - (T * S)) / (T * S)
      // If I do 4 sets of 10, and target was 10.
      // S = 4. Target Vol = 40. Actual Vol = 40. P_vol = 0.
      
      // Let's try a case where I do more reps in later sets.
      // Target 10. Sets 3.
      // Reps: [10, 12, 12].
      // P_top = 0.
      // Vol = 34. Target Vol = 30.
      // P_vol = (34 - 30)/30 = 4/30 = 0.133 (>= 0.05) -> Increment
      increment: 2.5,
      previousFailures: 0
    });
    
    // However, in my test setup I need to be careful about what "Sets" means.
    // The algorithm calculates S = len(R).
    // So if I pass 3 values, S=3.
    
    const result2 = calculateProgressiveOverload({
        currentWeight: 100,
        repsPerformed: [10, 12, 12],
        targetReps: 10,
        increment: 5,
        previousFailures: 0
    });
    
    expect(result2.nextWeight).toBe(105);
    expect(result2.decision).toBe('incrementar');
  });
});
