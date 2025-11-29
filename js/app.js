import { state, loadState, saveState } from "./state.js";
import { initFirebase, handleGoogleLogin, handleEmailLogin, handleEmailSignup, handleLogout, db } from "./services/firebase.js";
import { doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDashboardContent } from "./views/dashboard.js";
import { getProgressContent, renderProgressChart } from "./views/progress.js";
import { getSettingsContent } from "./views/settings.js";
import { getMultiplier } from "./logic.js";

// --- Global Exports for HTML access ---
window.handleGoogleLogin = handleGoogleLogin;
window.handleLogout = handleLogout;
window.renderProgressChart = renderProgressChart;

let app = null;
let unsubscribe = null;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded");
    app = document.getElementById('app');
    console.log("App element:", app);

    // Set a timeout to show error if stuck loading
    setTimeout(() => {
        if (app && app.innerHTML.includes('Loading...')) {
            console.error("App stuck on loading screen");
            app.innerHTML = `
                <div class="card">
                    <h1>Loading Error</h1>
                    <p>The app is taking too long to load. Check the console for errors.</p>
                    <button class="btn" onclick="location.reload()">Reload Page</button>
                </div>
            `;
        }
    }, 5000);

    try {
        // Load saved state first
        console.log("Loading state...");
        loadState();
        console.log("State loaded:", state);

        // Pass callbacks to avoid circular dependency
        console.log("Initializing Firebase...");
        initFirebase(onAuthSuccess, onAuthFailure);
        console.log("Firebase initialized");

        init();
        console.log("Init complete");
    } catch (e) {
        console.error("Initialization failed:", e);
        app.innerHTML = `<div class="card"><h1>Error</h1><p>${e.message}</p><pre>${e.stack}</pre></div>`;
    }
});

function init() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function onAuthSuccess(user) {
    console.log("Auth Success - User:", user);
    state.uid = user.uid;
    state.user = user.displayName || user.email;
    loadFromFirestore();
}

function onAuthFailure() {
    console.log("Auth Failure - No user logged in");
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
            <div class="nav-logo" onclick="window.switchView('dashboard')" style="cursor: pointer; margin-bottom: 20px;">
                <img src="prodegilogo.png" alt="Prodegi" style="width: 40px; height: 40px; object-fit: contain;">
            </div>
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

    app.innerHTML = `
        ${renderNavigation()}
        <div class="main-content">
            ${content}
        </div>
    `;
    lucide.createIcons();
}

export function renderLogin() {
    console.log("Rendering login screen...");
    if (!app) {
        console.error("App element is null in renderLogin!");
        return;
    }

    const isSignup = state.showSignup || false;

    app.innerHTML = `
        <div class="card text-center" style="max-width: 400px; margin: 50px auto;">
            <div class="logo-container">
                <img src="prodegilogo.png" alt="Prodegi Logo" style="width: 100%; height: 100%; object-fit: contain;">
            </div>
            <h1>Prodegi</h1>
            <p>Track your progress. Crush your goals.</p>

            <h3 style="margin-top: 30px;">${isSignup ? 'Create Account' : 'Login'}</h3>

            <div class="input-group" style="text-align: left; margin-top: 20px;">
                <label>Email</label>
                <input type="email" id="auth-email" placeholder="your@email.com" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-color); color: var(--text-main);">
            </div>

            <div class="input-group" style="text-align: left; margin-top: 15px;">
                <label>Password</label>
                <input type="password" id="auth-password" placeholder="••••••••" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-color); color: var(--text-main);">
            </div>

            <button class="btn" style="width: 100%; margin-top: 20px;" onclick="window.handleEmailAuth(${isSignup})">
                ${isSignup ? 'Sign Up' : 'Login'}
            </button>

            <div style="margin: 20px 0; color: var(--text-muted);">or</div>

            <button class="btn btn-secondary" style="width: 100%;" onclick="handleGoogleLogin()">
                <i data-lucide="log-in" style="margin-right: 8px;"></i> Continue with Google
            </button>

            <p style="margin-top: 30px; font-size: 0.9rem;">
                ${isSignup ? 'Already have an account?' : "Don't have an account?"}
                <a href="#" onclick="window.toggleAuthMode(); return false;" style="color: var(--primary); text-decoration: none;">
                    ${isSignup ? 'Login' : 'Sign Up'}
                </a>
            </p>
        </div>
    `;
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    console.log("Login screen rendered");
}

window.handleEmailAuth = async (isSignup) => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    try {
        if (isSignup) {
            await handleEmailSignup(email, password);
        } else {
            await handleEmailLogin(email, password);
        }
    } catch (error) {
        console.error('Auth error:', error);
    }
};

window.toggleAuthMode = () => {
    state.showSignup = !state.showSignup;
    renderLogin();
};

// --- Setup Flow ---
function renderSetup() {
    if (!state.setupStep) state.setupStep = 1;

    if (state.setupStep === 1) {
        // Step 1: How many days per week
        app.innerHTML = `
            <div class="card text-center">
                <h2>Step 1: Training Frequency</h2>
                <p>How many days per week do you train?</p>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 30px 0;">
                    <button class="btn" onclick="window.setupFrequency(3)">3 Days</button>
                    <button class="btn" onclick="window.setupFrequency(4)">4 Days</button>
                    <button class="btn" onclick="window.setupFrequency(5)">5 Days</button>
                    <button class="btn" onclick="window.setupFrequency(6)">6 Days</button>
                </div>
            </div>
        `;
    } else if (state.setupStep === 2) {
        // Step 2: Select which days
        app.innerHTML = `
            <div class="card">
                <h2>Step 2: Select Training Days</h2>
                <p>Which ${state.setupFreq} days do you train?</p>
                <div class="input-group">
                    <label style="display: flex; align-items: center; gap: 10px; margin: 8px 0;">
                        <input type="checkbox" id="day-mon" value="Monday">
                        <span>Monday</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px; margin: 8px 0;">
                        <input type="checkbox" id="day-tue" value="Tuesday">
                        <span>Tuesday</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px; margin: 8px 0;">
                        <input type="checkbox" id="day-wed" value="Wednesday">
                        <span>Wednesday</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px; margin: 8px 0;">
                        <input type="checkbox" id="day-thu" value="Thursday">
                        <span>Thursday</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px; margin: 8px 0;">
                        <input type="checkbox" id="day-fri" value="Friday">
                        <span>Friday</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px; margin: 8px 0;">
                        <input type="checkbox" id="day-sat" value="Saturday">
                        <span>Saturday</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px; margin: 8px 0;">
                        <input type="checkbox" id="day-sun" value="Sunday">
                        <span>Sunday</span>
                    </label>
                </div>
                <button class="btn" onclick="window.setupDays()">Next Step</button>
            </div>
        `;
    } else if (state.setupStep === 3) {
        // Step 3: Overload multiplier
        app.innerHTML = `
            <div class="card text-center">
                <h2>Step 3: Overload Multiplier</h2>
                <p>How much weight do you want to add each workout?</p>
                <div class="input-group" style="margin: 40px 0;">
                    <label style="font-size: 1.5rem; color: var(--primary);"><span id="mult-display">2.5%</span></label>
                    <input type="range" id="multiplier" min="1" max="10" step="0.5" value="2.5"
                        oninput="document.getElementById('mult-display').textContent = this.value + '%'"
                        style="width: 100%; margin-top: 20px;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); margin-top: 10px;">
                        <span>1% (Conservative)</span>
                        <span>10% (Aggressive)</span>
                    </div>
                </div>
                <button class="btn" onclick="window.setupMultiplier()">Next Step</button>
            </div>
        `;
    }
}

// Setup step handlers
window.setupFrequency = (freq) => {
    state.setupFreq = freq;
    state.setupStep = 2;
    renderSetup();
};

window.setupDays = () => {
    const dayIds = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const selectedDays = [];

    dayIds.forEach(id => {
        const checkbox = document.getElementById(`day-${id}`);
        if (checkbox && checkbox.checked) {
            selectedDays.push(checkbox.value);
        }
    });

    if (selectedDays.length === 0) {
        alert('Please select at least one training day');
        return;
    }

    if (selectedDays.length !== state.setupFreq) {
        alert(`Please select exactly ${state.setupFreq} days`);
        return;
    }

    state.selectedDays = selectedDays;
    state.setupStep = 3;
    renderSetup();
};

window.setupMultiplier = () => {
    const mult = document.getElementById('multiplier').value;
    state.settings.multiplier = 1 + (parseFloat(mult) / 100);
    state.settings.customMultipliers = {};

    state.plan = {
        days: state.selectedDays.map(dayName => ({
            name: dayName,
            exercises: [],
            dayOfWeek: dayName
        }))
    };

    delete state.setupStep;
    delete state.setupFreq;
    delete state.selectedDays;

    saveStateLocal();
    renderExerciseSelection(0);
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

window.showWorkoutDetails = (dateStr) => {
    const workoutsOnDay = state.workouts.filter(w => new Date(w.date).toDateString() === dateStr);

    if (workoutsOnDay.length === 0) return;

    const workout = workoutsOnDay[0];
    const dayName = state.plan.days[workout.dayIndex]?.name || 'Unknown';

    app.innerHTML = `
        <div class="card">
            <div class="flex-between">
                <h2>Workout on ${new Date(dateStr).toLocaleDateString()}</h2>
                <button class="btn-cancel" onclick="window.location.reload()">Close</button>
            </div>
            <h3>${dayName}</h3>

            ${workout.exercises.map(ex => `
                <div class="card exercise-card" style="margin: 15px 0;">
                    <h4>${ex.name}</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 1px solid var(--border);">
                                <th style="padding: 8px; text-align: left;">Set</th>
                                <th style="padding: 8px; text-align: right;">Weight (kg)</th>
                                <th style="padding: 8px; text-align: right;">Reps</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ex.sets.map((set, idx) => `
                                <tr>
                                    <td style="padding: 8px;">${idx + 1}</td>
                                    <td style="padding: 8px; text-align: right;">${set.weight}</td>
                                    <td style="padding: 8px; text-align: right;">${set.reps}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `).join('')}
        </div>
    `;
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};

window.updateGlobalMultiplier = (val) => {
    state.settings.multiplier = 1 + (parseFloat(val) / 100);
    saveStateLocal();
    renderApp();
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
                <button class="btn-cancel" onclick="window.location.reload()">Cancel</button>
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
