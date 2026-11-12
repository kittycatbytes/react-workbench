import type { ReactNode } from "react";

const hrefs = {
  "Object.is": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is",
  "import()": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import",
  "Math.random()": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random",
  "focus()": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus",
  scrollTop: "https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTop",
  readOnly: "https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/readOnly",
  "try/catch": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch",
  error: "https://developer.mozilla.org/en-US/docs/Web/API/Window/error_event",
} as const;

type JsApiName = keyof typeof hrefs;

export function JsApi({
  name,
  n,
  label,
  children,
}: {
  name: JsApiName;
  n: number;
  label?: string;
  children?: ReactNode;
}) {
  const title = label ?? name;
  return (
    <>
      <code>{children ?? name}</code>
      <a
        className="fn"
        href={hrefs[name]}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${title} on MDN`}
        title={`${title} on MDN`}
      >
        <sup>{n}</sup>
      </a>
    </>
  );
}
