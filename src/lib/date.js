export function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function addDays(referenceDate, days) {
  const date = new Date(referenceDate);
  date.setDate(date.getDate() + days);
  return date;
}

export function getProtocolDayNumber(date) {
  return ((date.getDay() + 6) % 7) + 1; // Mon=1 ... Sun=7
}

export function startOfWeekMonday(referenceDate) {
  const date = new Date(referenceDate);
  const day = date.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + delta);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getWeekDates(referenceDate) {
  const start = startOfWeekMonday(referenceDate);
  return Array.from({ length: 7 }, (_, index) => {
    return addDays(start, index);
  });
}

export function formatReadableDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function compareDateKeys(left, right) {
  if (left === right) {
    return 0;
  }
  return left < right ? -1 : 1;
}

export function isDateKeyBefore(left, right) {
  return compareDateKeys(left, right) < 0;
}

export function isDateKeyAfter(left, right) {
  return compareDateKeys(left, right) > 0;
}
