import type { WeekData } from "../../types";
import week1 from "./week1";
import week2 from "./week2";
import week3 from "./week3";
import week4 from "./week4";
import week5 from "./week5";

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
  { length: TOTAL_WEEKS - 5 },
  (_, i) => emptyWeek(i + 6, `Week ${i + 6}`)
);

export const weeks: WeekData[] = [
  week1,
  week2,
  week3,
  week4,
  week5,
  ...placeholderWeeks,
];

export const getWeek = (n: number): WeekData | undefined =>
  weeks.find((w) => w.week === n);