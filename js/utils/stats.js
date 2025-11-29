import { state } from "../state.js";

export function calculatePersonalRecords() {
    const prs = {};

    state.workouts.forEach(workout => {
        workout.exercises.forEach(ex => {
            const maxWeight = Math.max(...ex.sets.map(s => s.weight));
            const maxVolume = ex.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);

            if (!prs[ex.name] || maxWeight > prs[ex.name].weight) {
                prs[ex.name] = {
                    weight: maxWeight,
                    volume: maxVolume,
                    date: workout.date,
                    workout: workout
                };
            }
        });
    });

    return prs;
}

export function calculateTotalVolume(exercises) {
    return exercises.reduce((sum, ex) => {
        return sum + ex.sets.reduce((setSum, set) => setSum + (set.weight * set.reps), 0);
    }, 0);
}

export function getWorkoutStreak() {
    if (state.workouts.length === 0) return 0;

    const sortedDates = state.workouts
        .map(w => new Date(w.date).toDateString())
        .sort((a, b) => new Date(b) - new Date(a));

    let streak = 1;
    let currentDate = new Date(sortedDates[0]);

    for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i]);
        const dayDiff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));

        if (dayDiff <= 7) {
            streak++;
            currentDate = prevDate;
        } else {
            break;
        }
    }

    return streak;
}
