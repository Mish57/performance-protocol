import { useEffect, useMemo, useState } from "react";

const DEFAULT_TIMER_STATE = {
  startTime: null,
  elapsedTime: 0,
  isRunning: false,
};

function readTimerState(storageKey) {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return DEFAULT_TIMER_STATE;
    }

    const parsed = JSON.parse(raw);
    const startTime = typeof parsed.startTime === "number" ? parsed.startTime : null;
    const elapsedTime = typeof parsed.elapsedTime === "number" && parsed.elapsedTime > 0 ? parsed.elapsedTime : 0;
    const isRunning = Boolean(parsed.isRunning) && startTime !== null;

    return {
      startTime,
      elapsedTime,
      isRunning,
    };
  } catch {
    return DEFAULT_TIMER_STATE;
  }
}

export function useTimer(storageKey = "workoutSessionTimer") {
  const [timerState, setTimerState] = useState(() => readTimerState(storageKey));
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setTimerState(readTimerState(storageKey));
    setNow(Date.now());
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(timerState));
    } catch {
      // Ignore localStorage write failures.
    }
  }, [storageKey, timerState]);

  useEffect(() => {
    if (!timerState.isRunning) {
      return undefined;
    }

    const tick = () => {
      setNow(Date.now());
      const totalMs = timerState.elapsedTime + Math.max(0, Date.now() - timerState.startTime);
      const remainder = totalMs % 1000;
      const delay = remainder === 0 ? 1000 : 1000 - remainder;
      timeoutId = window.setTimeout(tick, delay);
    };

    let timeoutId = window.setTimeout(tick, 250);
    return () => window.clearTimeout(timeoutId);
  }, [timerState.isRunning, timerState.elapsedTime, timerState.startTime]);

  const elapsedMs = useMemo(() => {
    if (!timerState.isRunning || timerState.startTime === null) {
      return timerState.elapsedTime;
    }
    return timerState.elapsedTime + Math.max(0, now - timerState.startTime);
  }, [now, timerState.elapsedTime, timerState.isRunning, timerState.startTime]);

  function start() {
    const currentTime = Date.now();
    setNow(currentTime);
    setTimerState((previous) => {
      if (previous.isRunning) {
        return previous;
      }
      return {
        ...previous,
        startTime: currentTime,
        isRunning: true,
      };
    });
  }

  function pause() {
    let nextElapsed = 0;
    const currentTime = Date.now();

    setTimerState((previous) => {
      if (!previous.isRunning || previous.startTime === null) {
        nextElapsed = previous.elapsedTime;
        return previous;
      }

      nextElapsed = previous.elapsedTime + Math.max(0, currentTime - previous.startTime);
      return {
        startTime: null,
        elapsedTime: nextElapsed,
        isRunning: false,
      };
    });

    setNow(currentTime);
    return nextElapsed;
  }

  function reset() {
    setTimerState(DEFAULT_TIMER_STATE);
    setNow(Date.now());
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Ignore localStorage delete failures.
    }
  }

  return {
    startTime: timerState.startTime,
    elapsedTime: timerState.elapsedTime,
    isRunning: timerState.isRunning,
    elapsedSec: Math.floor(elapsedMs / 1000),
    start,
    pause,
    reset,
  };
}
