import { state, loadState, saveState } from "./state.js";
import { initFirebase, handleGoogleLogin, handleLogout, db } from "./services/firebase.js";
import { doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDashboardContent } from "./views/dashboard.js";
import { getProgressContent, renderProgressChart } from "./views/progress.js";
import { getSettingsContent } from "./views/settings.js";
import { getMultiplier } from "./logic.js";

// --- Global Exports for HTML access ---
window.handleGoogleLogin = handleGoogleLogin;
window.handleLogout = handleLogout;
window.renderProgressChart = renderProgressChart;

const app = document.getElementById('app');
let unsubscribe = null;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Load saved state first
        loadState();
        // Pass callbacks to avoid circular dependency
        initFirebase(onAuthSuccess, onAuthFailure);
        init();
    } catch (e) {
        console.error("Initialization failed:", e);
        app.innerHTML = `<div class="card"><h1>Error</h1><p>${e.message}</p></div>`;
    }
});

function init() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function onAuthSuccess(user) {
    state.uid = user.uid;
    state.user = user.displayName || user.email;
    loadFromFirestore();
}

function onAuthFailure() {
    state.user = null;
    state.uid = null;
    renderLogin();
}

export function loadFromFirestore() {
    if (!state.uid || !db) return;
    
    if (unsubscribe) {
        unsubscribe();
    }

    const docRef = doc(db, 'users', state.uid);
    
    unsubscribe = onSnapshot(docRef, 
        (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                Object.assign(state, data);
                if (data.settings) {
                    state.settings = { ...state.settings, ...data.settings };
                }
                
                const activeWorkout = document.getElementById('active-workout');
                if (!activeWorkout) {
                    if (!state.plan) {
                        renderSetup();
                    } else {
                        renderApp();
                    }
                }
            } else {
                renderSetup();
            }
        },
        (error) => {
            console.error("Error loading data:", error);
            if (!state.plan) {
                app.innerHTML = `
                    <div class="card">
                        <h2 style="color: var(--error)">Connection Issue</h2>
                        <p>${error.message}</p>
                        <p style="font-size: 0.8rem; margin-top: 10px;">Check your internet connection. The app will retry automatically.</p>
                    </div>
                `;
            }
        }
    );
}

// --- Navigation ---
function renderNavigation() {
    return `
        <nav class="nav-bar">
            <div class="nav-item ${state.currentView === 'dashboard' ? 'active' : ''}" onclick="window.switchView('dashboard')">
                <i data-lucide="layout-dashboard"></i>
                <span>Home</span>
            </div>
            <div class="nav-item ${state.currentView === 'progress' ? 'active' : ''}" onclick="window.switchView('progress')">
                <i data-lucide="line-chart"></i>
                <span>Progress</span>
            </div>
            <div class="nav-item ${state.currentView === 'settings' ? 'active' : ''}" onclick="window.switchView('settings')">
                <i data-lucide="settings"></i>
                <span>Settings</span>
            </div>
        </nav>
    `;
}

window.switchView = (view) => {
    state.currentView = view;
    renderApp();
};

export function renderApp() {
    if (!state.user) {
        renderLogin();
        return;
    }
    if (!state.plan) {
        renderSetup();
        return;
    }

    let content = '';
    switch(state.currentView) {
        case 'dashboard':
            content = getDashboardContent();
            break;
        case 'progress':
            content = getProgressContent();
            break;
        case 'settings':
            content = getSettingsContent();
            break;
        default:
            content = getDashboardContent();
    }

    app.innerHTML = content + renderNavigation();
    lucide.createIcons();
}

export function renderLogin() {
    app.innerHTML = `
        <div class="card text-center">
            <div class="logo-container">
                <img src="prodegilogo.png" alt="Prodegi Logo" style="width: 100%; height: 100%; object-fit: contain;">
            </div>
            <h1>Prodegi</h1>
            <p>Track your progress. Crush your goals.</p>
            
            <div style="margin: 40px 0;">
                <button class="btn btn-secondary" onclick="handleGoogleLogin()">
                    <i data-lucide="log-in" style="margin-right: 8px;"></i> Login with Google
                </button>
            </div>
        </div>
    `;
    lucide.createIcons();
}

// --- Setup Flow ---
function renderSetup() {
    app.innerHTML = `
        <div class="card">
            <h2>Setup Your Plan</h2>
            <div class="input-group">
                <label>Training Frequency</label>
                <select id="frequency">
                    <option value="3">3 Days</option>
                    <option value="4">4 Days</option>
                    <option value="5">5 Days</option>
                    <option value="6">6 Days</option>
                </select>
            </div>
            <div class="input-group">
                <label>Default Overload Multiplier</label>
                <select id="multiplier">
                    <option value="1.025">2.5% (Conservative)</option>
                    <option value="1.05">5% (Aggressive)</option>
                </select>
            </div>
            <button class="btn" onclick="window.handleSetupStep1()">Next: Name Days</button>
        </div>
    `;
}

window.handleSetupStep1 = () => {
    const freq = document.getElementById('frequency').value;
    const mult = document.getElementById('multiplier').value;
    
    state.settings.multiplier = parseFloat(mult);
    state.settings.customMultipliers = {};
    
    state.plan = {
        days: Array.from({length: parseInt(freq)}, (_, i) => ({
            name: `Day ${i + 1}`,
            exercises: []
        }))
    };
    renderDayNaming();
};

function renderDayNaming() {
    app.innerHTML = `
        <div class="card">
            <h2>Name Your Days</h2>
            <p>Give each training day a name (e.g., "Push", "Legs").</p>
            <div id="day-inputs">
                ${state.plan.days.map((day, i) => `
                    <div class="input-group">
                        <label>Day ${i + 1}</label>
                        <input type="text" id="day-name-${i}" value="${day.name}">
                    </div>
                `).join('')}
            </div>
            <button class="btn" onclick="window.handleDayNaming()">Next: Choose Exercises</button>
        </div>
    `;
}

window.handleDayNaming = () => {
    state.plan.days.forEach((_, i) => {
        const name = document.getElementById(`day-name-${i}`).value;
        if (name) state.plan.days[i].name = name;
    });
    saveStateLocal();
    renderExerciseSelection(0);
};

function renderExerciseSelection(dayIndex) {
    if (dayIndex >= state.plan.days.length) {
        saveStateLocal();
        renderApp();
        return;
    }

    const day = state.plan.days[dayIndex];
    
    app.innerHTML = `
        <div class="card">
            <h2>Setup: ${day.name}</h2>
            <p>Add exercises for this day.</p>
            
            <div id="exercise-list">
                ${day.exercises.map(ex => `<div class="exercise-item">${ex}</div>`).join('')}
            </div>

            <div class="input-group mt-4">
                <input type="text" id="new-exercise" placeholder="e.g. Bench Press">
                <button class="btn btn-secondary mt-2" onclick="window.addExercise(${dayIndex})">Add Exercise</button>
            </div>

            <button class="btn mt-4" onclick="window.renderExerciseSelection(${dayIndex + 1})">
                ${dayIndex === state.plan.days.length - 1 ? 'Finish Setup' : 'Next Day'}
            </button>
        </div>
    `;
}
window.renderExerciseSelection = renderExerciseSelection;

window.addExercise = (dayIndex) => {
    const input = document.getElementById('new-exercise');
    if (!input.value) return;
    
    state.plan.days[dayIndex].exercises.push(input.value);
    input.value = '';
    saveStateLocal();
    renderExerciseSelection(dayIndex);
};

// --- Actions ---

window.changeMonth = (offset) => {
    const newDate = new Date(state.calendarDate);
    newDate.setMonth(newDate.getMonth() + offset);
    state.calendarDate = newDate;
    renderApp();
};

window.updateGlobalMultiplier = (val) => {
    state.settings.multiplier = parseFloat(val);
    saveStateLocal();
};

window.removeCustomMultiplier = (ex) => {
    delete state.settings.customMultipliers[ex];
    saveStateLocal();
    renderApp();
};

window.editExerciseSettings = (exerciseName) => {
    const currentMult = getMultiplier(exerciseName);
    const currentPct = ((currentMult - 1) * 100).toFixed(2);
    
    const newPct = prompt(`Enter overload percentage for ${exerciseName} (e.g., 2.5 for 2.5%). Current: ${currentPct}%`);
    
    if (newPct !== null) {
        const pct = parseFloat(newPct);
        if (!isNaN(pct) && pct >= 0) {
            if (!state.settings.customMultipliers) state.settings.customMultipliers = {};
            state.settings.customMultipliers[exerciseName] = 1 + (pct / 100);
            saveStateLocal();
            renderApp();
        } else {
            alert("Invalid number");
        }
    }
};

window.startWorkout = (dayIndex) => {
    const day = state.plan.days[dayIndex];
    
    app.innerHTML = `
        <div class="card">
            <div class="flex-between">
                <h2>${day.name}</h2>
                <button class="btn-cancel" onclick="renderApp()">Cancel</button>
            </div>
            
            <div id="active-workout">
                ${day.exercises.map((ex, exIdx) => `
                    <div class="card exercise-card" data-exercise="${ex}">
                        <h3>${ex}</h3>
                        <div class="sets-container" id="sets-${exIdx}">
                            <div class="set-row flex-between gap-2">
                                <span class="set-num">1</span>
                                <input type="number" placeholder="kg" class="weight-input">
                                <input type="number" placeholder="reps" class="reps-input">
                            </div>
                        </div>
                        <button class="btn-secondary btn-sm mt-2" onclick="window.addSet(${exIdx})">+ Add Set</button>
                    </div>
                `).join('')}
            </div>
            <button class="btn" onclick="window.finishWorkout(${dayIndex})">Complete Workout</button>
        </div>
    `;
    lucide.createIcons();
};

window.addSet = (exIdx) => {
    const container = document.getElementById(`sets-${exIdx}`);
    const setNum = container.children.length + 1;
    const div = document.createElement('div');
    div.className = 'set-row flex-between gap-2';
    div.innerHTML = `
        <span class="set-num">${setNum}</span>
        <input type="number" placeholder="kg" class="weight-input">
        <input type="number" placeholder="reps" class="reps-input">
    `;
    container.appendChild(div);
};

window.finishWorkout = (dayIndex) => {
    const day = state.plan.days[dayIndex];
    const sessionData = {
        date: new Date().toISOString(),
        dayIndex: dayIndex,
        exercises: []
    };

    const exerciseCards = document.querySelectorAll('.exercise-card');
    exerciseCards.forEach(card => {
        const name = card.dataset.exercise;
        const sets = [];
        card.querySelectorAll('.set-row').forEach(row => {
            const weight = parseFloat(row.querySelector('.weight-input').value) || 0;
            const reps = parseFloat(row.querySelector('.reps-input').value) || 0;
            if (weight > 0 && reps > 0) {
                sets.push({ weight, reps });
            }
        });
        
        if (sets.length > 0) {
            sessionData.exercises.push({ name, sets });
        }
    });

    state.workouts.push(sessionData);
    saveStateLocal();
    
    app.innerHTML = `
        <div class="card text-center" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px;">
            <i data-lucide="trophy" style="width: 64px; height: 64px; color: var(--success); margin-bottom: 20px;"></i>
            <h2 style="color: var(--success)">Workout Complete!</h2>
            <p>Great job! Data saved.</p>
            <button class="btn" onclick="renderApp()">Back to Home</button>
        </div>
    `;
    lucide.createIcons();
};

window.resetApp = () => {
    if(confirm('Reset all data?')) {
        localStorage.removeItem('gymTrackerState');
        location.reload();
    }
}

function saveStateLocal() {
    localStorage.setItem('gymTrackerState', JSON.stringify(state));
    if (state.uid && db) {
        setDoc(doc(db, 'users', state.uid), state, { merge: true });
    }
}
