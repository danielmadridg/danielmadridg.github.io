let timerInterval = null;
let timerSeconds = 0;
let timerRunning = false;

export function showRestTimer() {
    const timerModal = document.createElement('div');
    timerModal.id = 'rest-timer-modal';
    timerModal.className = 'timer-modal';
    timerModal.innerHTML = `
        <div class="timer-content">
            <h3>Rest Timer</h3>
            <div class="timer-display" id="timer-display">00:00</div>
            <div class="timer-controls">
                <button class="btn-secondary btn-sm" onclick="window.setRestTime(30)">30s</button>
                <button class="btn-secondary btn-sm" onclick="window.setRestTime(60)">1m</button>
                <button class="btn-secondary btn-sm" onclick="window.setRestTime(90)">90s</button>
                <button class="btn-secondary btn-sm" onclick="window.setRestTime(120)">2m</button>
            </div>
            <button class="btn" id="timer-toggle" onclick="window.toggleTimer()">Start</button>
            <button class="btn-secondary" onclick="window.closeRestTimer()" style="margin-top: 10px;">Close</button>
        </div>
    `;
    document.body.appendChild(timerModal);
}

window.setRestTime = (seconds) => {
    timerSeconds = seconds;
    updateTimerDisplay();
    if (!timerRunning) {
        toggleTimer();
    }
};

window.toggleTimer = () => {
    const toggleBtn = document.getElementById('timer-toggle');

    if (timerRunning) {
        clearInterval(timerInterval);
        timerRunning = false;
        toggleBtn.textContent = 'Resume';
    } else {
        timerRunning = true;
        toggleBtn.textContent = 'Pause';

        timerInterval = setInterval(() => {
            if (timerSeconds > 0) {
                timerSeconds--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                timerRunning = false;
                toggleBtn.textContent = 'Start';
                playTimerSound();
            }
        }, 1000);
    }
};

window.closeRestTimer = () => {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    timerRunning = false;
    timerSeconds = 0;
    const modal = document.getElementById('rest-timer-modal');
    if (modal) {
        modal.remove();
    }
};

function updateTimerDisplay() {
    const display = document.getElementById('timer-display');
    if (display) {
        const mins = Math.floor(timerSeconds / 60);
        const secs = timerSeconds % 60;
        display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

function playTimerSound() {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGnODwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGnODwtmMcBjiR1/LMeSwF');
    audio.play().catch(() => {});
}
