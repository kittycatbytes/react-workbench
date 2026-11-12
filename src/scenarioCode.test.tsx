import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { lessons } from "./lessons/index.ts";
import type { Scenario } from "./workbench/types.ts";

// Workbench chrome and record lists are not part of the scenario sample.
// Render marks, logs, warnings, and rows of data stay out of the comparison.
const SKIP =
  ".render-mark, .warnings, .chrome, .log-empty, .caught-kicker, .caught-hint, .caught button, .matches, .tracks, .thread, .keys-row > span, .bars";

afterEach(() => {
  cleanup();
});

function quotedLiterals(code: string) {
  const literals: string[] = [];
  const pattern = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g;
  for (const match of code.matchAll(pattern)) {
    const literal = match[1] ?? match[2] ?? "";
    if (literal.length >= 2) literals.push(literal);
  }
  return literals.sort((left, right) => right.length - left.length);
}

function words(text: string) {
  return text.match(/[\p{L}\p{N}]+/gu) ?? [];
}

function phraseWords(text: string, literals: string[]) {
  let remaining = text;
  for (const literal of literals) {
    const escaped = literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    remaining = remaining.replace(
      new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "gu"),
      " ",
    );
  }
  return words(remaining).filter((word) => !/^\d+$/.test(word));
}

function isValueElement(element: Element, literals: string[]) {
  const text = element.textContent?.replace(/\s+/g, " ").trim() ?? "";
  if (!text) return true;
  if (/^\d+$/.test(text)) return true;
  return literals.includes(text);
}

function displayedPhrases(root: HTMLElement, literals: string[]) {
  const phrases: string[][] = [];

  function visit(element: Element) {
    if (element.matches(SKIP)) return;
    const parts: string[] = [];
    for (const child of element.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        parts.push(child.textContent ?? "");
        continue;
      }
      if (!(child instanceof Element) || child.matches(SKIP)) continue;
      if (isValueElement(child, literals)) parts.push(" ");
      else visit(child);
    }
    const phrase = phraseWords(parts.join(" "), literals);
    if (phrase.length > 0) phrases.push(phrase);
  }

  visit(root);
  return phrases;
}

function missingPhrases(root: HTMLElement, code: string) {
  const literals = quotedLiterals(code);
  const covered = words(code);
  return displayedPhrases(root, literals).filter((phrase) => !containsSequence(covered, phrase));
}

function containsSequence(haystack: string[], needle: string[]) {
  let cursor = 0;
  for (const word of needle) {
    const found = haystack.indexOf(word, cursor);
    if (found < 0) return false;
    cursor = found + 1;
  }
  return true;
}

function show(lessonId: string, scenario: Scenario, repaired: boolean) {
  const lesson = lessons.find((item) => item.id === lessonId);
  if (!lesson) throw new Error(`Missing lesson ${lessonId}`);
  const view = render(
    <lesson.Demo scenarioId={scenario.id} repaired={repaired} />,
  );
  return view.container;
}

describe.each(lessons)("$title", (lesson) => {
  describe.each(lesson.scenarios)("$label", (scenario) => {
    it("includes the text on the stage", () => {
      const root = show(lesson.id, scenario, false);
      const missing = missingPhrases(root, scenario.code).map((phrase) => phrase.join(" "));
      expect(missing.join(" | ")).toBe("");
    });

    const repair = scenario.repair;
    if (!repair) return;

    it("includes the text on the stage when fixed", () => {
      const root = show(lesson.id, scenario, true);
      const missing = missingPhrases(root, repair.code).map((phrase) => phrase.join(" "));
      expect(missing.join(" | ")).toBe("");
    });
  });
});
