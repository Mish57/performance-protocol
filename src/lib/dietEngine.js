function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundMacro(value) {
  return Math.round(value);
}

export function generateDiet({ todayFocus, sleepHours, proteinBoost = false }) {
  const normalizedFocus = String(todayFocus ?? "").toLowerCase();
  const isRecovery = normalizedFocus.includes("recovery");

  let calories = 2400;
  let protein = 180;
  let carbs = 260;
  let fats = 70;

  if (isRecovery) {
    calories = 2200;
    protein = 170;
    carbs = 190;
    fats = 80;
  }

  if (Number(sleepHours) > 0 && Number(sleepHours) < 6) {
    calories = roundMacro(calories * 0.9);
    carbs = roundMacro(carbs * 0.85);
    fats = roundMacro(fats * 0.9);
  }

  if (proteinBoost) {
    protein += 20;
    calories += 80;
  }

  protein = clamp(roundMacro(protein), 120, 260);
  carbs = clamp(roundMacro(carbs), 80, 400);
  fats = clamp(roundMacro(fats), 35, 130);
  calories = clamp(roundMacro(calories), 1400, 4200);

  const meals = [
    {
      name: "Breakfast",
      focus: "Protein + fiber",
    },
    {
      name: "Lunch",
      focus: isRecovery ? "Lean protein + vegetables" : "Protein + carbs",
    },
    {
      name: "Dinner",
      focus: isRecovery ? "Protein + healthy fats" : "Protein + carbs + greens",
    },
  ];

  return {
    calories,
    protein,
    carbs,
    fats,
    meals,
  };
}
