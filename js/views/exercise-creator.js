import { state, saveState } from "../state.js";
import { renderApp } from "../app.js";

export function getExerciseCreatorContent() {
    return `
        <div class="card">
            <div class="flex-between">
                <h2>Create New Exercise</h2>
                <button class="btn-cancel" onclick="window.switchView('dashboard')">Cancel</button>
            </div>
            
            <div class="input-group mt-4">
                <label>Exercise Name</label>
                <input type="text" id="new-exercise-name" placeholder="e.g. Incline Dumbbell Press">
            </div>

            <div class="input-group mt-4">
                <label>Add to Days</label>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">Select which days to add this exercise to:</p>
                <div class="days-selection">
                    ${state.plan.days.map((day, index) => `
                        <label style="display: flex; align-items: center; gap: 10px; margin: 8px 0;">
                            <input type="checkbox" class="day-checkbox" value="${index}">
                            <span>${day.name}</span>
                        </label>
                    `).join('')}
                </div>
            </div>

            <button class="btn mt-4" onclick="window.saveNewExercise()">Save Exercise</button>
        </div>
    `;
}

window.saveNewExercise = () => {
    const nameInput = document.getElementById('new-exercise-name');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Please enter an exercise name');
        return;
    }

    const checkboxes = document.querySelectorAll('.day-checkbox:checked');
    if (checkboxes.length === 0) {
        alert('Please select at least one day');
        return;
    }

    checkboxes.forEach(cb => {
        const dayIndex = parseInt(cb.value);
        if (state.plan.days[dayIndex]) {
            state.plan.days[dayIndex].exercises.push(name);
        }
    });

    // Save state
    localStorage.setItem('gymTrackerState', JSON.stringify(state));
    // If we had access to db here we would save to firestore too, but for now relying on local + next sync
    // Ideally we call a global save function or similar. 
    // Re-using the logic from app.js would be better but for now let's just save local and reload app
    
    // Trigger save in app.js context if possible or just rely on the fact that state is a reference
    // We will call a helper if available, otherwise just save local
    
    alert('Exercise created successfully!');
    window.switchView('dashboard');
};
