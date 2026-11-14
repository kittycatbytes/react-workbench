import { useEffect, useState, type FormEvent } from "react";

const ADDRESS = "ctaneyhill@gmail.com";

export const FEEDBACK_ENDPOINT = `https://formsubmit.co/ajax/${ADDRESS}`;

export function feedbackDraft(lessonTitle: string, scenarioLabel: string) {
  return `I am on ${lessonTitle}, scenario ${scenarioLabel}, and have some feedback.\n`;
}

export function feedbackPayload(lessonTitle: string, body: string, honey = "") {
  return {
    _subject: `React workbench feedback: ${lessonTitle}`,
    _captcha: "false",
    _template: "box",
    _honey: honey,
    message: body,
  };
}

type FeedbackReply = { success?: unknown; message?: unknown };

export async function postFeedback(
  lessonTitle: string,
  body: string,
  honey = "",
): Promise<"sent" | "held"> {
  let reply: FeedbackReply;
  try {
    const response = await fetch(FEEDBACK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(feedbackPayload(lessonTitle, body, honey)),
    });
    reply = (await response.json()) as FeedbackReply;
  } catch {
    throw new Error("Could not send. Try again.");
  }

  const message = typeof reply.message === "string" ? reply.message : "";
  // FormSubmit answers HTTP 200 for a refusal, and success is the string "true" or "false".
  if (String(reply.success) === "true") return "sent";
  if (/activat/i.test(message)) return "held";
  throw new Error(message || "Could not send. Try again.");
}

const STATUS = {
  sent: "Sent.",
  held: "Saved. It will be delivered after a one-time confirmation.",
};

export function Feedback({
  lessonTitle,
  scenarioLabel,
}: {
  lessonTitle: string;
  scenarioLabel: string;
}) {
  const draft = feedbackDraft(lessonTitle, scenarioLabel);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(draft);
  const [honey, setHoney] = useState("");
  const [prevDraft, setPrevDraft] = useState(draft);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "held" | "error">("idle");
  const [error, setError] = useState("");
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (status !== "sending") return;
    const timer = window.setTimeout(() => setSlow(true), 4000);
    return () => window.clearTimeout(timer);
  }, [status]);

  if (draft !== prevDraft) {
    setPrevDraft(draft);
    setText(draft);
    setStatus("idle");
    setError("");
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (text.trim() === "") return;
    if (honey !== "") {
      setStatus("sent");
      setError("");
      return;
    }
    setStatus("sending");
    setSlow(false);
    setError("");
    try {
      setStatus(await postFeedback(lessonTitle, text));
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Could not send. Try again.");
    }
  }

  const notice =
    status === "sending"
      ? slow
        ? "Still sending. The button changes when the reply comes back."
        : "Sending. This can take a little while."
      : status === "error"
        ? error
        : status === "sent" || status === "held"
          ? STATUS[status]
          : "";

  return (
    <section className="bot-q" aria-label="Send Feedback">
      <button
        type="button"
        className="bot-q-toggle"
        aria-expanded={open}
        aria-controls="feedback-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="chevron" data-open={open} />
        Send Feedback
      </button>
      {open ? (
        <form className="bot-q-body" id="feedback-panel" onSubmit={send}>
          <label htmlFor="feedback-text">Send kittycatbytes feedback:</label>
          <textarea
            id="feedback-text"
            className="bot-q-text"
            rows={4}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <div className="feedback-honey" aria-hidden="true">
            <label htmlFor="feedback-website">Website</label>
            <input
              id="feedback-website"
              name="_honey"
              tabIndex={-1}
              autoComplete="off"
              value={honey}
              onChange={(event) => setHoney(event.target.value)}
            />
          </div>
          <div className="bot-q-actions">
            <button type="submit" disabled={status === "sending" || text.trim() === ""}>
              {status === "sending" ? "Sending…" : "Send"}
            </button>
          </div>
          {notice ? (
            <p className="feedback-status" role="status" data-kind={status === "error" ? "error" : "ok"}>
              {notice}
            </p>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}
