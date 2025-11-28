import { state } from "../state.js";
import { getAllExercises } from "../logic.js";

export function getProgressContent() {
    const exercises = getAllExercises();
    
    return `
        <div class="card">
            <h2>Progress</h2>
            <p>Select an exercise to view your progress.</p>
            
            <div class="input-group">
                <select id="progress-exercise-select" onchange="window.renderProgressChart(this.value)">
                    <option value="">-- Select Exercise --</option>
                    ${exercises.map(ex => `<option value="${ex}">${ex}</option>`).join('')}
                </select>
            </div>
            
            <div style="position: relative; height: 300px; width: 100%;">
                <canvas id="progressChart"></canvas>
            </div>
        </div>
    `;
}

export function renderProgressChart(exerciseName) {
    const ctx = document.getElementById('progressChart');
    if (!ctx) return;

    // Destroy existing chart if any
    if (window.myChart) {
        window.myChart.destroy();
    }

    if (!exerciseName) return;

    // Prepare data
    const dataPoints = state.workouts
        .filter(w => w.exercises.some(e => e.name === exerciseName))
        .map(w => {
            const exData = w.exercises.find(e => e.name === exerciseName);
            const maxWeight = Math.max(...exData.sets.map(s => s.weight));
            return {
                x: new Date(w.date).toLocaleDateString(),
                y: maxWeight
            };
        });

    if (dataPoints.length === 0) {
        // Handle no data
        return;
    }

    // Create Chart
    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dataPoints.map(d => d.x),
            datasets: [{
                label: `${exerciseName} (kg)`,
                data: dataPoints.map(d => d.y),
                borderColor: '#BFA35F',
                backgroundColor: 'rgba(191, 163, 95, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                pointBackgroundColor: '#BFA35F'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    grid: { color: '#333' },
                    ticks: { color: '#888' }
                },
                x: {
                    grid: { color: '#333' },
                    ticks: { color: '#888' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#fff' }
                }
            }
        }
    });
}
