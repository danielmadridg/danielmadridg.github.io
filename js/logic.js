import { state } from "../state.js";

export function getMultiplier(exerciseName) {
    if (state.settings.customMultipliers && state.settings.customMultipliers[exerciseName]) {
        return state.settings.customMultipliers[exerciseName];
    }
    return state.settings.multiplier;
}

export function getRecommendation(exerciseName) {
    const multiplier = getMultiplier(exerciseName);
    
    // Find last occurrence of this exercise
    for (let i = state.workouts.length - 1; i >= 0; i--) {
        const wo = state.workouts[i];
        const record = wo.exercises.find(e => e.name === exerciseName);
        if (record) {
            let bestWeight = 0;
            if (record.sets) {
                bestWeight = Math.max(...record.sets.map(s => s.weight));
            } else {
                bestWeight = record.weight;
            }
            return `${(bestWeight * multiplier).toFixed(1)}kg`;
        }
    }
    return "Start Base";
}

export function getAllExercises() {
    if (!state.plan) return [];
    const exercises = new Set();
    state.plan.days.forEach(day => {
        day.exercises.forEach(ex => exercises.add(ex));
    });
    return Array.from(exercises);
}
