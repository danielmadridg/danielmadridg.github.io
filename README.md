# Prodegi Gym Tracker

A minimalist, gold-themed gym tracker with a built-in progressive overload algorithm.

## Features

- **Routine Creation**: Define your workout days, exercises, sets, and target reps.
- **Smart Tracking**: The app automatically suggests weight increments based on your performance (RPE/Reps).
- **Progress Visualization**: Track your strength gains over time with interactive charts.
- **Dark Mode**: Sleek dark and gold aesthetic.

## Getting Started

1.  Install dependencies:

    ```bash
    npm install
    ```

2.  Run the development server:

    ```bash
    npm run dev
    ```

3.  Open your browser at the URL shown (usually `http://localhost:5173`).

## Algorithm Details

The app uses a custom Progressive Overload algorithm that analyzes:

- **Top Set Performance**: If you exceed your target reps by ≥10%.
- **Volume Performance**: If your total volume exceeds the target by ≥5%.
- **Stagnation**: Deloads are suggested if performance drops for 2 consecutive sessions.

## Tech Stack

- React + TypeScript
- Vite
- Chart.js
- Lucide React Icons
