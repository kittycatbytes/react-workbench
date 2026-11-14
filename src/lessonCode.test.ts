import { describe, expect, it } from "vitest";
import { lessons } from "./lessons/index.ts";

// Wrappers such as memo() never appear as stage text, so the scenario-text
// test cannot tell when a sample drops the call the lesson is teaching.
// Each scenario lists the snippets that have to stay in its code panel.
// A contrast sample lists the broken pattern, not the tool it is leaving out.
const keeps: Record<string, Record<string, { broken: string[]; fixed?: string[] }>> = {
  state: {
    snapshot: { broken: ["useState"] },
    stale: { broken: ["useState"], fixed: ["useState"] },
    mutate: { broken: ["useState"], fixed: ["useState"] },
    batch: { broken: ["useState"] },
  },
  effects: {
    cleanup: { broken: ["useEffect"] },
    class: { broken: ["componentDidMount", "componentDidUpdate", "componentWillUnmount"] },
    stale: { broken: ["useEffect"], fixed: ["useEffect"] },
    leak: { broken: ["useEffect"], fixed: ["useEffect"] },
    strict: { broken: ["StrictMode"], fixed: ["StrictMode"] },
    layout: { broken: ["useLayoutEffect"] },
    passive: { broken: ["useEffect"] },
  },
  refs: {
    ref: { broken: ["useRef"] },
    state: { broken: ["useState"] },
    during: { broken: ["useRef"], fixed: ["useState"] },
  },
  memo: {
    stable: { broken: ["const Row = memo(", "useCallback("] },
    inline: { broken: ["const Row = memo("], fixed: ["const Row = memo(", "useCallback("] },
    bare: { broken: ["function Row("], fixed: ["const Row = memo(", "useCallback("] },
    usememo: { broken: ["cities.filter"], fixed: ["useMemo("] },
  },
  context: {
    stable: { broken: ["value={{ artist }}", "useContext"], fixed: ["useMemo(", "useContext"] },
    none: { broken: ["createContext"] },
    drill: { broken: ["<Middle artist={artist}"] },
  },
  reducer: {
    pure: { broken: ["state.items.push", "return state"], fixed: ["function pureReducer", "...state.items"] },
    impure: { broken: ["useReducer", "sideEffects.push"], fixed: ["useReducer"] },
  },
  forms: {
    controlled: { broken: ["value={name}", "onChange"] },
    uncontrolled: { broken: ["defaultValue"] },
    frozen: { broken: ["value="], fixed: ["onChange"] },
    flip: { broken: ["defaultValue"] },
  },
  keys: {
    stable: { broken: ["key={row.id}"] },
    index: { broken: ["key={index}"], fixed: ["key={row.id}"] },
    random: { broken: ["Math.random()"], fixed: ["key={row.id}"] },
  },
  hooks: {
    custom: { broken: ["function useToggle", "function useSeconds"] },
    two: { broken: ["useToggle"] },
    conditional: { broken: ["if (extra)", "useState(0)"], fixed: ["useState(false)", "useState(0)"] },
  },
  split: {
    split: { broken: ["lazy(", "Suspense"] },
    eager: { broken: ["import ChartFigure"] },
    missing: { broken: ["lazy("] },
    fail: { broken: ["lazy(", "Suspense"] },
  },
  transition: {
    transition: { broken: ["useTransition"] },
    blocking: { broken: ["setText(event.target.value)"] },
    deferred: { broken: ["useDeferredValue"] },
  },
  errors: {
    render: { broken: ["getDerivedStateFromError", "componentDidCatch"] },
    event: { broken: ["throw new Error"] },
    effect: { broken: ["useEffect", "throw new Error"] },
  },
};

describe("lesson code", () => {
  it("covers every lesson", () => {
    expect(Object.keys(keeps).sort()).toEqual(lessons.map((lesson) => lesson.id).sort());
  });

  describe.each(lessons)("$title", (lesson) => {
    const table = keeps[lesson.id];

    it("names every scenario", () => {
      expect(Object.keys(table).sort()).toEqual(lesson.scenarios.map((scenario) => scenario.id).sort());
    });

    describe.each(lesson.scenarios)("$label", (scenario) => {
      const row = table[scenario.id];

      it("keeps the code this scenario is teaching", () => {
        const missing = row.broken.filter((snippet) => !scenario.code.includes(snippet));
        expect(missing.join(" | ")).toBe("");
      });

      if (scenario.repair) {
        it("keeps the code in the fixed sample", () => {
          const fixed = row.fixed ?? [];
          const missing = fixed.filter((snippet) => !scenario.repair?.code.includes(snippet));
          expect(fixed.length).toBeGreaterThan(0);
          expect(missing.join(" | ")).toBe("");
        });
      } else {
        it("has no fixed sample to check", () => {
          expect(row.fixed).toBeUndefined();
        });
      }
    });
  });
});
