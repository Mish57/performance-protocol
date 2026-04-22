# Performance Protocol

A clean, mobile-first React + Tailwind app to run a structured daily system for:
- sexual stamina discipline
- erection quality tracking
- workout and cardio adherence
- sleep consistency

## Stack
- React 18
- Vite 5
- Tailwind CSS 3
- LocalStorage persistence

## Run
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Included Features
- Multi-page routing:
  - `/` Dashboard
  - `/workout` Workout Session
  - `/edit-workout` Workout Builder
  - `/progress` Insights
  - `/settings` Settings
- Mobile-first bottom navigation (Home, Workout, Progress, Settings)
- Dashboard redesign:
  - dynamic Today Focus block
  - compact Today Status block
  - 4 simplified task cards (Workout, Cardio, Kegels, Control)
  - quick logging (workout toggle + sleep quick buttons)
- Adaptive logic engine:
  - sleep < 6h -> next day light/adjusted plan
  - missed workout -> forward smart rescheduling
  - 2 intense days back-to-back -> forced recovery/cardio
- Control logic:
  - weekly limit 2-4 (configurable)
  - no consecutive days
  - recommendation message (Do/Skip)
- Workout Session page:
  - start/pause/end controls
  - live timer
  - set-level completion tracking
  - session save to localStorage
  - weekly total workout time
- Workout Builder page:
  - edit workout days
  - add/remove exercises
  - sets/reps/notes editing
  - save/reset/default actions
- Insights page:
  - weekly completion %
  - workout consistency
  - control sessions used
  - average sleep
  - recovery score
  - smart insight messages
- Structured settings sections:
  - General
  - Workout Plan
  - Control Limits
  - Notifications
- Local storage structure:
  - `userSettings`
  - `workoutPlans`
  - `dailyLogs`
  - `sessionLogs`

## Main Files
- `src/App.jsx`
- `src/state/AppState.jsx`
- `src/lib/smartEngine.js`
- `src/lib/defaultData.js`
- `src/hooks/useProtocolNotifications.js`
- `src/pages/*`
- `src/components/*`
