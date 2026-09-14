import type { WeekData } from "../../types";
import week1 from "./week1";
import week2 from "./week2";

const emptyWeek = (n: number, title: string): WeekData => ({
  week: n,
  title,
  status: "empty",
  notes: [],
  slides: [],
  mcqs: [],
  flashcards: [],
});

const TOTAL_WEEKS = 8;

const placeholderWeeks: WeekData[] = Array.from(
  { length: TOTAL_WEEKS - 2 },
  (_, i) => emptyWeek(i + 3, `Week ${i + 3}`)
);

export const weeks: WeekData[] = [week1, week2, ...placeholderWeeks];

export const getWeek = (n: number): WeekData | undefined =>
  weeks.find((w) => w.week === n);