import { state } from "../state.js";
import { getAllExercises, getMultiplier } from "../logic.js";

export function getSettingsContent() {
    const allExercises = getAllExercises();

    return `
        <div class="card">
            <h2>Settings</h2>

            <h3>Exercise Multipliers</h3>
            <p style="font-size: 0.8rem;">Set specific overload targets for each exercise.</p>
            <div id="custom-multipliers-list">
                ${allExercises.map(ex => {
                    const currentMult = getMultiplier(ex);
                    const isCustom = state.settings.customMultipliers && state.settings.customMultipliers[ex];
                    const pct = ((currentMult - 1) * 100).toFixed(2);
                    
                    return `
                    <div class="exercise-item">
                        <span>${ex}</span>
                        <div class="flex-center gap-2">
                            <span style="color: ${isCustom ? 'var(--primary)' : 'var(--text-muted)'}">${pct}%</span>
                            <button class="btn-secondary btn-sm" onclick="window.editExerciseSettings('${ex}')">Edit</button>
                            ${isCustom ? `<button class="btn-secondary btn-sm" onclick="window.removeCustomMultiplier('${ex}')">Reset</button>` : ''}
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
