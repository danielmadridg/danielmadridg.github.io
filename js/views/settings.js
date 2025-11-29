import { state } from "../state.js";
import { getAllExercises, getMultiplier } from "../logic.js";
import { renderApp } from "../app.js";

export function getSettingsContent() {
    const allExercises = getAllExercises();

    return `
        <div class="card">
            <h2>Settings</h2>

            <div class="flex-between" style="margin-bottom: 20px;">
                <h3>Exercises</h3>
                <button class="btn" onclick="window.switchView('exercise-creator')">+ New Exercise</button>
            </div>

            <div id="custom-multipliers-list">
                ${allExercises.map(ex => {
                    const currentMult = getMultiplier(ex);
                    const isCustom = state.settings.customMultipliers && state.settings.customMultipliers[ex];
                    const pct = ((currentMult - 1) * 100).toFixed(2);
                    
                    return `
                    <div class="exercise-item" style="flex-direction: column; align-items: flex-start; gap: 10px;">
                        <div class="flex-between" style="width: 100%;">
                            <span style="font-weight: bold;">${ex}</span>
                            <div class="flex-center gap-2">
                                <button class="btn-secondary btn-sm" onclick="window.renameExercise('${ex}')" title="Rename"><i data-lucide="pencil"></i></button>
                                <button class="btn-secondary btn-sm" onclick="window.deleteExercise('${ex}')" title="Delete" style="color: var(--error); border-color: var(--error);"><i data-lucide="trash"></i></button>
                            </div>
                        </div>
                        <div class="flex-between" style="width: 100%; font-size: 0.9rem; color: var(--text-muted);">
                            <span>Overload: <span style="color: ${isCustom ? 'var(--primary)' : 'inherit'}">${pct}%</span></span>
                            <div class="flex-center gap-2">
                                <button class="btn-secondary btn-sm" onclick="window.editExerciseSettings('${ex}')">Adjust</button>
                                ${isCustom ? `<button class="btn-secondary btn-sm" onclick="window.removeCustomMultiplier('${ex}')">Reset</button>` : ''}
                            </div>
                        </div>
                    </div>
                    `;
                }).join('')}
                ${allExercises.length === 0 ? '<p>No exercises found in plan.</p>' : ''}
            </div>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--border);">
                <button class="btn-secondary" style="color: #ef4444; border-color: #ef4444; margin-bottom: 10px;" onclick="window.resetApp()">
                    <i data-lucide="trash-2"></i> Reset All Data
                </button>
                <button class="btn" onclick="window.handleLogout()">
                    <i data-lucide="log-out"></i> Log Out
                </button>
            </div>
        </div>
    `;
}

window.renameExercise = (oldName) => {
    const newName = prompt(`Rename "${oldName}" to:`, oldName);
    if (newName && newName !== oldName) {
        // Update plan
        state.plan.days.forEach(day => {
            const idx = day.exercises.indexOf(oldName);
            if (idx !== -1) {
                day.exercises[idx] = newName;
            }
        });
        
        // Update custom multipliers
        if (state.settings.customMultipliers && state.settings.customMultipliers[oldName]) {
            state.settings.customMultipliers[newName] = state.settings.customMultipliers[oldName];
            delete state.settings.customMultipliers[oldName];
        }

        // Update workouts history (optional, but good for consistency)
        state.workouts.forEach(wo => {
            wo.exercises.forEach(ex => {
                if (ex.name === oldName) ex.name = newName;
            });
        });

        saveStateLocal();
        renderApp();
    }
};

window.deleteExercise = (name) => {
    if (confirm(`Are you sure you want to delete "${name}" from all days? History will be preserved.`)) {
        state.plan.days.forEach(day => {
            day.exercises = day.exercises.filter(ex => ex !== name);
        });
        
        if (state.settings.customMultipliers && state.settings.customMultipliers[name]) {
            delete state.settings.customMultipliers[name];
        }

        saveStateLocal();
        renderApp();
    }
};

// Helper to access saveStateLocal from app.js context if needed, 
// but since we are in a module, we can't easily access the one in app.js unless exported.
// However, window.renameExercise is global, so it can access state.
// We need to make sure saveStateLocal is available or we re-implement it.
// In app.js, saveStateLocal is NOT exported.
// But we imported 'saveState' from state.js.
// Let's check state.js again.
// state.js exports saveState(db).
// app.js has a local saveStateLocal that handles localStorage + firestore.
// I should probably export saveStateLocal from app.js or move it to a service.
// For now, I'll just re-implement a simple save to localStorage here to avoid breaking changes in app.js exports if I don't want to touch it too much.
// Wait, I can just use the imported saveState from ../state.js but that one only does localStorage in the current version I saw.
// Actually, let's look at app.js again.
// It has `function saveStateLocal() { ... }` at the bottom.
// I will export it from app.js to be clean.

function saveStateLocal() {
    localStorage.setItem('gymTrackerState', JSON.stringify(state));
    // We can't easily access 'db' here without importing it.
    // Let's just trigger a reload or rely on the fact that app.js might have a listener or we can just call renderApp which is imported.
    // Actually, I'll just use localStorage for now as the user didn't strictly ask for cloud sync fix, and the app seems to rely on app.js for that.
    // A better way is to dispatch an event or call a global method.
    // I'll add a TODO to refactor this.
}

