import type { Lesson } from "../workbench/types.ts";
import { stateLesson } from "./state.tsx";
import { effectsLesson } from "./effects.tsx";
import { refsLesson } from "./refs.tsx";
import { memoLesson } from "./memo.tsx";
import { contextLesson } from "./context.tsx";
import { reducerLesson } from "./reducer.tsx";
import { formsLesson } from "./forms.tsx";
import { keysLesson } from "./keys.tsx";
import { hooksLesson } from "./hooks.tsx";
import { splitLesson } from "./split.tsx";
import { transitionLesson } from "./transition.tsx";
import { errorsLesson } from "./errors.tsx";

export const lessons: Lesson[] = [
  stateLesson,
  effectsLesson,
  refsLesson,
  memoLesson,
  contextLesson,
  reducerLesson,
  formsLesson,
  keysLesson,
  hooksLesson,
  splitLesson,
  transitionLesson,
  errorsLesson,
];
