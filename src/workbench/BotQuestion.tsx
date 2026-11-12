import { useEffect, useState } from "react";

function botPrompt(lessonTitle: string, scenarioLabel: string, scenarioTease: string) {
  const about = lessonTitle.charAt(0).toLowerCase() + lessonTitle.slice(1);
  const subtitle = scenarioTease.replace(/\.$/, "");
  return `I am reading a React lesson about ${about} and the scenario is ${scenarioLabel} (${subtitle}), I have the following question: [enter your question here]`;
}

export function BotQuestion({
  lessonTitle,
  scenarioLabel,
  scenarioTease,
}: {
  lessonTitle: string;
  scenarioLabel: string;
  scenarioTease: string;
}) {
  const prompt = botPrompt(lessonTitle, scenarioLabel, scenarioTease);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(prompt);
  const [prevPrompt, setPrevPrompt] = useState(prompt);
  const [copied, setCopied] = useState(false);

  if (prompt !== prevPrompt) {
    setPrevPrompt(prompt);
    setDraft(prompt);
    setCopied(false);
  }

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(id);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="bot-q" aria-label="Create a bot question">
      <button
        type="button"
        className="bot-q-toggle"
        aria-expanded={open}
        aria-controls="bot-question-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="chevron" data-open={open} />
        Create a bot question
      </button>
      {open ? (
        <div className="bot-q-body" id="bot-question-panel">
          <label htmlFor="bot-question">Question with context</label>
          <textarea
            id="bot-question"
            className="bot-q-text"
            rows={4}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setCopied(false);
            }}
          />
          <div className="bot-q-actions">
            <button type="button" onClick={() => void copy()}>
              {copied ? "Copied" : "Copy"}
            </button>
            <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">
              Ask ChatGPT
            </a>
            <a href="https://gemini.google.com/app" target="_blank" rel="noopener noreferrer">
              Ask Gemini
            </a>
            <span className="sr-only" aria-live="polite">
              {copied ? "Copied" : ""}
            </span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
