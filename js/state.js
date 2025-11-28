export const state = {
    user: null, 
    uid: null,
    plan: null,
    workouts: [],
    settings: {
        multiplier: 1.025,
        customMultipliers: {}
    },
    currentView: 'dashboard', // dashboard, progress, settings
    selectedDate: null,
    calendarDate: new Date()
};

export function loadState() {
    const saved = localStorage.getItem('gymTrackerState');
    if (saved) {
        Object.assign(state, JSON.parse(saved));
        // Restore Date objects
        if (state.calendarDate) state.calendarDate = new Date(state.calendarDate);
    }
}

export function saveState(db) {
    localStorage.setItem('gymTrackerState', JSON.stringify(state));
    // We import db dynamically or pass it in to avoid circular deps if possible, 
    // but here we will rely on the caller to handle DB sync or use the global db instance from app
    // For now, we'll just save to local storage here, and the main app logic handles DB sync
}
