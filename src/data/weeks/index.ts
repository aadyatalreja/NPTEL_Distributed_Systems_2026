import type { WeekData } from "../../types";
import week1 from "./week1";

const emptyWeek = (n: number, title: string): WeekData => ({
  week: n,
  title,
  status: "empty",
  notes: [],
  slides: [],
  mcqs: [],
  flashcards: [],
});

export const weeks: WeekData[] = [
  week1,
  emptyWeek(2, "Week 2"),
  emptyWeek(3, "Week 3"),
  emptyWeek(4, "Week 4"),
  emptyWeek(5, "Week 5"),
  emptyWeek(6, "Week 6"),
  emptyWeek(7, "Week 7"),
  emptyWeek(8, "Week 8"),
];

export const getWeek = (n: number): WeekData | undefined =>
  weeks.find((w) => w.week === n);
