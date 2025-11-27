export const DAY_NAMES: Record<string, number> = {
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thur: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
  sunday: 7,
  sun: 7,
};

export const MONTH_NAMES: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

export const SPECIAL_DATES: Record<string, { month: number; day: number }> = {
  christmas: { month: 12, day: 25 },
  xmas: { month: 12, day: 25 },
  "new year": { month: 1, day: 1 },
  newyear: { month: 1, day: 1 },
  halloween: { month: 10, day: 31 },
  valentine: { month: 2, day: 14 },
  valentines: { month: 2, day: 14 },
};

export const DATE_KEYWORDS = [
  "next",
  "last",
  "ago",
  "until",
  "between",
  "and",
  "from",
  "now",
  "today",
  "tomorrow",
  "yesterday",
  "days",
  "weeks",
  "months",
  "years",
];

export function findDayName(name: string): number | undefined {
  return DAY_NAMES[name.toLowerCase()];
}

export function findMonthName(name: string): number | undefined {
  return MONTH_NAMES[name.toLowerCase()];
}

export function findSpecialDate(
  name: string
): { month: number; day: number } | undefined {
  return SPECIAL_DATES[name.toLowerCase()];
}
