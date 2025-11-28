import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, enableIndexedDbPersistence, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * Prodegi - Core Logic
 */

// --- Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyAHLLbo6zbVryKiCH96r84dGX8cOXfzTHE",
  authDomain: "progredi-1.firebaseapp.com",
  projectId: "progredi-1",
  storageBucket: "progredi-1.firebasestorage.app",
  messagingSenderId: "603628930060",
  appId: "1:603628930060:web:2336837d9f7be899771a29",
  measurementId: "G-Z3PEPCMLN3"
};

// --- State Management ---
const state = {
    user: null, // Local user name or Auth User object
    uid: null,  // Firebase User ID
    plan: null,
    workouts: [],
    settings: {
        multiplier: 1.025,
        customMultipliers: {} // { "Bench Press": 1.05 }
    },
    currentView: 'dashboard', // dashboard, calendar, settings
    selectedDate: null,
    calendarDate: new Date()
};

let db = null;
let auth = null;
let analytics = null;
let unsubscribe = null;

// --- DOM Elements ---
const app = document.getElementById('app');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    try {
        initFirebase();
        init();
    } catch (e) {
        console.error("Initialization failed:", e);
        app.innerHTML = `<div class="card"><h1>Error</h1><p>${e.message}</p></div>`;
    }
});

function initFirebase() {
    const appInstance = initializeApp(firebaseConfig);
    analytics = getAnalytics(appInstance);
    auth = getAuth(appInstance);
    db = getFirestore(appInstance);
    
    // Enable offline persistence
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn("Persistence failed: Multiple tabs open");
        } else if (err.code == 'unimplemented') {
            console.warn("Persistence failed: Browser not supported");
        }
    });
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            state.uid = user.uid;
            state.user = user.displayName || user.email;
            loadFromFirestore();
        } else {
            // If not logged in, ensure we show login screen
            state.user = null;
            state.uid = null;
            if (unsubscribe) unsubscribe();
            renderLogin();
        }
    });
}

function init() {
    // We rely on onAuthStateChanged to trigger the flow
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function loadState() {
    const saved = localStorage.getItem('gymTrackerState');
    if (saved) {
        Object.assign(state, JSON.parse(saved));
    }
}

function saveState() {
    localStorage.setItem('gymTrackerState', JSON.stringify(state));
    if (state.uid && db) {
        setDoc(doc(db, 'users', state.uid), state, { merge: true });
    }
}

function loadFromFirestore() {
    if (!state.uid || !db) return;
    
    if (unsubscribe) {
        unsubscribe();
    }

    const docRef = doc(db, 'users', state.uid);
    
    // Use onSnapshot for better offline support and real-time updates
    unsubscribe = onSnapshot(docRef, 
        (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                Object.assign(state, data);
                if (data.settings) {
                    state.settings = { ...state.settings, ...data.settings };
                }
                
                // Only render if we are NOT in an active workout to prevent disruption
                const activeWorkout = document.getElementById('active-workout');
                if (!activeWorkout) {
                    if (!state.plan) {
                        renderSetup();
                    } else {
                        renderDashboard(); // This now calls renderApp()
                    }
                }
            } else {
                renderSetup();
            }
        },
        (error) => {
            console.error("Error loading data:", error);
            // Only show error if we have no data loaded at all
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
            <div class="nav-item ${state.currentView === 'dashboard' ? 'active' : ''}" onclick="switchView('dashboard')">
                <i data-lucide="layout-dashboard"></i>
                <span>Home</span>
            </div>
            <div class="nav-item ${state.currentView === 'calendar' ? 'active' : ''}" onclick="switchView('calendar')">
                <i data-lucide="calendar"></i>
                <span>Calendar</span>
            </div>
            <div class="nav-item ${state.currentView === 'settings' ? 'active' : ''}" onclick="switchView('settings')">
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

function renderApp() {
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
        case 'calendar':
            content = getCalendarContent();
            break;
        case 'settings':
            content = getSettingsContent();
            break;
    }

    app.innerHTML = content + renderNavigation();
    lucide.createIcons();
}

// --- Views ---

function renderLogin() {
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

window.handleGoogleLogin = () => {
    if (!auth) return alert("Firebase not configured.");
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(error => alert(error.message));
};

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
            <button class="btn" onclick="handleSetupStep1()">Next: Name Days</button>
        </div>
    `;
}

window.handleSetupStep1 = () => {
    const freq = document.getElementById('frequency').value;
    const mult = document.getElementById('multiplier').value;
    
    state.settings.multiplier = parseFloat(mult);
    state.settings.customMultipliers = {};
    
    // Initialize empty plan
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
            <button class="btn" onclick="handleDayNaming()">Next: Choose Exercises</button>
        </div>
    `;
}

window.handleDayNaming = () => {
    state.plan.days.forEach((_, i) => {
        const name = document.getElementById(`day-name-${i}`).value;
        if (name) state.plan.days[i].name = name;
    });
    saveState();
    renderExerciseSelection(0);
};

function renderExerciseSelection(dayIndex) {
    if (dayIndex >= state.plan.days.length) {
        saveState();
        renderDashboard();
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
                <button class="btn btn-secondary mt-2" onclick="addExercise(${dayIndex})">Add Exercise</button>
            </div>

            <button class="btn mt-4" onclick="renderExerciseSelection(${dayIndex + 1})">
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
    saveState();
    renderExerciseSelection(dayIndex);
};

// Modified to be called by renderApp or loadFromFirestore
function renderDashboard() {
    renderApp();
}

function getDashboardContent() {
    const lastWorkout = state.workouts[state.workouts.length - 1];
    let nextDayIndex = 0;
    
    if (lastWorkout) {
        nextDayIndex = (lastWorkout.dayIndex + 1) % state.plan.days.length;
    }
    
    const nextWorkout = state.plan.days[nextDayIndex];
    const userName = state.user ? state.user.split(' ')[0] : 'User';

    return `
        <header class="flex-between" style="margin-bottom: 20px;">
            <div>
                <h2>Hi, ${userName}</h2>
                <p>Let's get to work.</p>
            </div>
            <div class="flex-center gap-2">
                ${state.uid ? '<span style="font-size:0.8rem; color:var(--success)">Synced</span>' : ''}
            </div>
        </header>

        <div class="card">
            <h3>Next Session: ${nextWorkout.name}</h3>
            <div class="workout-preview">
                ${nextWorkout.exercises.map(ex => {
                    const rec = getRecommendation(ex);
                    const mult = getMultiplier(ex);
                    return `
                    <div class="exercise-item" style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <span style="display:block; font-weight:600;">${ex}</span>
                            <span style="font-size:0.8rem; color: var(--text-muted);">Mult: ${((mult - 1) * 100).toFixed(1)}%</span>
                        </div>
                        <div style="text-align:right;">
                            <span style="color: var(--primary); font-weight:bold; display:block;">Target: ${rec}</span>
                        </div>
                    </div>
                `}).join('')}
            </div>
            <button class="btn" onclick="startWorkout(${nextDayIndex})">Start Workout</button>
        </div>

        <div class="card">
            <h3>Recent Progress</h3>
             <div style="max-height: 200px; overflow-y: auto;">
                ${state.workouts.slice().reverse().slice(0, 3).map(wo => `
                    <div class="exercise-item">
                        <span>${new Date(wo.date).toLocaleDateString()}</span>
                        <span style="color: var(--primary)">${state.plan.days[wo.dayIndex].name}</span>
                    </div>
                `).join('')}
                ${state.workouts.length === 0 ? '<p class="text-center">No workouts yet.</p>' : ''}
            </div>
        </div>
    `;
}

function getCalendarContent() {
    // Ensure calendarDate is a Date object (in case it came from JSON as string)
    if (!(state.calendarDate instanceof Date)) {
        state.calendarDate = new Date(state.calendarDate || Date.now());
    }

    const displayDate = state.calendarDate;
    const currentMonth = displayDate.getMonth();
    const currentYear = displayDate.getFullYear();
    
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
    
    const monthName = displayDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    let calendarHTML = `
        <div class="card">
            <div class="flex-between" style="margin-bottom: 20px;">
                <button class="btn-secondary btn-sm" onclick="changeMonth(-1)">
                    <i data-lucide="chevron-left"></i>
                </button>
                <h2 class="text-center" style="margin: 0;">${monthName}</h2>
                <button class="btn-secondary btn-sm" onclick="changeMonth(1)">
                    <i data-lucide="chevron-right"></i>
                </button>
            </div>
            
            <div class="calendar-grid">
                <div class="calendar-day-header">Sun</div>
                <div class="calendar-day-header">Mon</div>
                <div class="calendar-day-header">Tue</div>
                <div class="calendar-day-header">Wed</div>
                <div class="calendar-day-header">Thu</div>
                <div class="calendar-day-header">Fri</div>
                <div class="calendar-day-header">Sat</div>
    `;

    // Empty cells for days before start of month
    for (let i = 0; i < firstDay; i++) {
        calendarHTML += `<div></div>`;
    }

    const today = new Date();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(currentYear, currentMonth, day);
        const dateStr = dateObj.toDateString();
        const isToday = dateObj.toDateString() === today.toDateString();
        
        // Check if workout exists on this day
        const hasWorkout = state.workouts.some(w => new Date(w.date).toDateString() === dateStr);
        
        calendarHTML += `
            <div class="calendar-day ${isToday ? 'today' : ''} ${hasWorkout ? 'has-workout' : ''}" onclick="alert('Workout details for ${day} coming soon!')">
                <span class="day-number">${day}</span>
                ${hasWorkout ? '<div class="workout-dot"></div>' : ''}
            </div>
        `;
    }

    calendarHTML += `
            </div>
        </div>
    `;
    return calendarHTML;
}

window.changeMonth = (offset) => {
    const newDate = new Date(state.calendarDate);
    newDate.setMonth(newDate.getMonth() + offset);
    state.calendarDate = newDate;
    renderApp();
};

function getSettingsContent() {
    return `
        <div class="card">
            <h2>Settings</h2>
            
            <div class="input-group">
                <label>Global Overload Multiplier</label>
                <select id="setting-multiplier" onchange="updateGlobalMultiplier(this.value)">
                    <option value="1.025" ${state.settings.multiplier === 1.025 ? 'selected' : ''}>2.5% (Conservative)</option>
                    <option value="1.05" ${state.settings.multiplier === 1.05 ? 'selected' : ''}>5% (Aggressive)</option>
                </select>
            </div>

            <h3>Custom Multipliers</h3>
            <div id="custom-multipliers-list">
                ${Object.entries(state.settings.customMultipliers || {}).map(([ex, mult]) => `
                    <div class="exercise-item">
                        <span>${ex}</span>
                        <div class="flex-center gap-2">
                            <span>${((mult - 1) * 100).toFixed(1)}%</span>
                            <button class="btn-secondary btn-sm" onclick="removeCustomMultiplier('${ex}')">Reset</button>
                        </div>
                    </div>
                `).join('')}
                ${Object.keys(state.settings.customMultipliers || {}).length === 0 ? '<p>No custom multipliers set.</p>' : ''}
            </div>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--border);">
                <button class="btn-secondary" style="color: #ef4444; border-color: #ef4444;" onclick="resetApp()">
                    <i data-lucide="trash-2"></i> Reset All Data
                </button>
            </div>
        </div>
    `;
}

window.updateGlobalMultiplier = (val) => {
    state.settings.multiplier = parseFloat(val);
    saveState();
};

window.removeCustomMultiplier = (ex) => {
    delete state.settings.customMultipliers[ex];
    saveState();
    renderApp();
};

function getMultiplier(exerciseName) {
    if (state.settings.customMultipliers && state.settings.customMultipliers[exerciseName]) {
        return state.settings.customMultipliers[exerciseName];
    }
    return state.settings.multiplier;
}

function getRecommendation(exerciseName) {
    const multiplier = getMultiplier(exerciseName);
    
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

window.startWorkout = (dayIndex) => {
    const day = state.plan.days[dayIndex];
    
    app.innerHTML = `
        <div class="card">
            <div class="flex-between">
                <h2>${day.name}</h2>
                <button class="btn-secondary" style="width:auto" onclick="renderApp()">Cancel</button>
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
                        <button class="btn-secondary btn-sm mt-2" onclick="addSet(${exIdx})">+ Add Set</button>
                    </div>
                `).join('')}
            </div>
            <button class="btn" onclick="finishWorkout(${dayIndex})">Complete Workout</button>
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
    saveState();
    
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
