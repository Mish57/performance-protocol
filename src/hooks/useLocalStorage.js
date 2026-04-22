import { useCallback, useEffect, useRef, useState } from "react";

function resolveInitialValue(initialValue) {
  return typeof initialValue === "function" ? initialValue() : initialValue;
}

function safeParseJson(rawValue, fallbackValue) {
  if (typeof rawValue !== "string" || rawValue.trim() === "") {
    return fallbackValue;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return fallbackValue;
  }
}

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStorageValue(key, initialValue, deserialize, sanitize) {
  const fallbackValue = resolveInitialValue(initialValue);

  if (!hasStorage()) {
    return sanitize(fallbackValue, fallbackValue);
  }

  try {
    const item = window.localStorage.getItem(key);
    const parsedValue = item === null ? fallbackValue : deserialize(item, fallbackValue);
    return sanitize(parsedValue, fallbackValue);
  } catch {
    return sanitize(fallbackValue, fallbackValue);
  }
}

export function useLocalStorage(key, initialValue, options = {}) {
  const {
    deserialize = safeParseJson,
    serialize = JSON.stringify,
    sanitize = (value, fallbackValue) => (value === undefined ? fallbackValue : value),
  } = options;

  const [storedValue, setStoredValue] = useState(() =>
    readStorageValue(key, initialValue, deserialize, sanitize),
  );

  const skipWriteRef = useRef(false);
  const previousKeyRef = useRef(key);

  const setValue = useCallback((valueOrUpdater) => {
    setStoredValue((previousValue) => {
      const nextValue =
        typeof valueOrUpdater === "function" ? valueOrUpdater(previousValue) : valueOrUpdater;
      const fallbackValue = resolveInitialValue(initialValue);
      return sanitize(nextValue, fallbackValue);
    });
  }, [initialValue, sanitize]);

  useEffect(() => {
    if (previousKeyRef.current === key) {
      return;
    }

    previousKeyRef.current = key;
    skipWriteRef.current = true;
    setStoredValue(readStorageValue(key, initialValue, deserialize, sanitize));
  }, [deserialize, initialValue, key, sanitize]);

  useEffect(() => {
    if (!hasStorage()) {
      return;
    }

    if (skipWriteRef.current) {
      skipWriteRef.current = false;
      return;
    }

    try {
      window.localStorage.setItem(key, serialize(storedValue));
    } catch {
      // Ignore write failures to keep UI responsive.
    }
  }, [key, serialize, storedValue]);

  return [storedValue, setValue];
}
