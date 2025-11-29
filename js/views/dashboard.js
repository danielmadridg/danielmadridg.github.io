import { state } from "../state.js";
import { getRecommendation, getMultiplier } from "../logic.js";

export function getCalendarHTML() {
    // Ensure calendarDate is a Date object
    if (!(state.calendarDate instanceof Date) || isNaN(state.calendarDate)) {
        state.calendarDate = new Date();
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
                <button class="btn-secondary btn-sm" onclick="window.changeMonth(-1)">
                    <i data-lucide="chevron-left"></i>
                </button>
                <h2 class="text-center" style="margin: 0; font-size: 1.2rem;">${monthName}</h2>
                <button class="btn-secondary btn-sm" onclick="window.changeMonth(1)">
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

    for (let i = 0; i < firstDay; i++) {
        calendarHTML += `<div></div>`;
    }

    const today = new Date();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(currentYear, currentMonth, day);
        const dateStr = dateObj.toDateString();
        const isToday = dateObj.toDateString() === today.toDateString();

        const workoutsOnDay = state.workouts.filter(w => new Date(w.date).toDateString() === dateStr);
        const hasWorkout = workoutsOnDay.length > 0;

        const clickHandler = hasWorkout ? `onclick="window.showWorkoutDetails('${dateStr}')"` : '';

        calendarHTML += `
            <div class="calendar-day ${isToday ? 'today' : ''} ${hasWorkout ? 'has-workout' : ''}"
                 ${clickHandler} style="${hasWorkout ? 'cursor: pointer;' : ''}">
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

export function getDashboardContent() {
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

        <!-- Calendar Widget -->
        ${getCalendarHTML()}

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
            <button class="btn" onclick="window.startWorkout(${nextDayIndex})">Start Workout</button>
        </div>
    `;
}
