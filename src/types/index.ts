export interface NoteSection {
  heading: string;
  body: string; // markdown
}

export interface Mcq {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  topic?: string;
}

export interface SlideRef {
  label: string;
  url?: string; // optional external link to the slide deck
  note?: string; // key takeaway from that slide/section
}

export interface WeekData {
  week: number;
  title: string;
  status: "empty" | "in-progress" | "ready";
  notes: NoteSection[];
  slides: SlideRef[];
  mcqs: Mcq[];
  flashcards: Flashcard[];
}
