import { state } from "../state.js";
import { calculatePersonalRecords } from "../utils/stats.js";

export function getHistoryContent() {
    const sortedWorkouts = [...state.workouts].sort((a, b) => new Date(b.date) - new Date(a.date));
    const prs = calculatePersonalRecords();

    if (sortedWorkouts.length === 0) {
        return `
            <div class="card text-center">
                <i data-lucide="history" style="width: 48px; height: 48px; color: var(--text-muted); margin: 20px auto;"></i>
                <h2>No Workout History</h2>
                <p>Complete your first workout to see your history here.</p>
            </div>
        `;
    }

    return `
        <div class="card">
            <h2>Workout History</h2>
            <p>Your complete training log</p>

            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0;">
                <div class="stat-card">
                    <div class="stat-value">${sortedWorkouts.length}</div>
                    <div class="stat-label">Total Workouts</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${Object.keys(prs).length}</div>
                    <div class="stat-label">Personal Records</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${state.plan?.days.length || 0}</div>
                    <div class="stat-label">Training Days</div>
                </div>
            </div>
        </div>

        ${sortedWorkouts.map((workout, idx) => {
            const dayName = state.plan.days[workout.dayIndex]?.name || 'Unknown';
            const date = new Date(workout.date);
            const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
            const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
            const totalVolume = workout.exercises.reduce((sum, ex) => {
                return sum + ex.sets.reduce((setSum, set) => setSum + (set.weight * set.reps), 0);
            }, 0);

            return `
                <div class="card workout-history-item">
                    <div class="flex-between" style="margin-bottom: 15px;">
                        <div>
                            <h3 style="margin: 0;">${dayName}</h3>
                            <p style="margin: 5px 0 0 0; font-size: 0.85rem;">${dateStr} at ${timeStr}</p>
                        </div>
                        <button class="btn-secondary btn-sm" onclick="window.toggleWorkoutDetails(${idx})">
                            <i data-lucide="chevron-down" id="chevron-${idx}"></i>
                        </button>
                    </div>

                    <div style="display: flex; gap: 20px; font-size: 0.85rem; color: var(--text-muted);">
                        <span><i data-lucide="dumbbell" style="width: 14px; height: 14px;"></i> ${workout.exercises.length} exercises</span>
                        <span><i data-lucide="hash" style="width: 14px; height: 14px;"></i> ${totalSets} sets</span>
                        <span><i data-lucide="weight" style="width: 14px; height: 14px;"></i> ${totalVolume.toFixed(0)} kg volume</span>
                    </div>

                    <div id="workout-details-${idx}" class="workout-details" style="display: none; margin-top: 20px;">
                        ${workout.exercises.map(ex => {
                            const isPR = prs[ex.name]?.workout === workout;
                            return `
                                <div class="exercise-detail-card">
                                    <div class="flex-between">
                                        <h4 style="margin: 0 0 10px 0;">${ex.name}</h4>
                                        ${isPR ? '<span class="pr-badge">PR</span>' : ''}
                                    </div>
                                    <table class="workout-table">
                                        <thead>
                                            <tr>
                                                <th>Set</th>
                                                <th>Weight</th>
                                                <th>Reps</th>
                                                <th>Volume</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${ex.sets.map((set, setIdx) => `
                                                <tr>
                                                    <td>${setIdx + 1}</td>
                                                    <td>${set.weight} kg</td>
                                                    <td>${set.reps}</td>
                                                    <td>${(set.weight * set.reps).toFixed(1)} kg</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('')}
    `;
}

window.toggleWorkoutDetails = (idx) => {
    const details = document.getElementById(`workout-details-${idx}`);
    const chevron = document.getElementById(`chevron-${idx}`);

    if (details.style.display === 'none') {
        details.style.display = 'block';
        chevron.style.transform = 'rotate(180deg)';
    } else {
        details.style.display = 'none';
        chevron.style.transform = 'rotate(0deg)';
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};
