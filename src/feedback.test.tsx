import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App.tsx";
import { lessons } from "./lessons/index.ts";
import {
  FEEDBACK_ENDPOINT,
  feedbackDraft,
  feedbackPayload,
  postFeedback,
  Feedback,
} from "./workbench/Feedback.tsx";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown) {
  return { json: async () => body };
}

describe("feedback", () => {
  const lesson = lessons[0];
  const scenario = lesson.scenarios[0];
  const opening = feedbackDraft(lesson.title, scenario.label);

  it("starts with the lesson and scenario on the first line", () => {
    expect(opening).toBe(
      `I am on ${lesson.title}, scenario ${scenario.label}, and have some feedback.\n`,
    );
  });

  it("posts the note to FormSubmit for kittycatbytes", () => {
    const body = feedbackPayload(lesson.title, opening);
    expect(FEEDBACK_ENDPOINT).toBe("https://formsubmit.co/ajax/ctaneyhill@gmail.com");
    expect(body._subject).toBe(`React workbench feedback: ${lesson.title}`);
    expect(body.message).toContain(scenario.label);
    expect(body._captcha).toBe("false");
  });

  it("treats the string success flag as delivery, and an activation reply as held", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ success: "true", message: "OK" }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(postFeedback(lesson.title, opening)).resolves.toBe("sent");

    fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: "false", message: "This form needs Activation." }),
    );
    await expect(postFeedback(lesson.title, opening)).resolves.toBe("held");

    fetchMock.mockResolvedValueOnce(jsonResponse({ success: "false", message: "Rejected." }));
    await expect(postFeedback(lesson.title, opening)).rejects.toThrow("Rejected.");
  });

  it("sits above the bot question and sends without leaving the page", async () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<ReturnType<typeof jsonResponse>>>(
      async () => jsonResponse({ success: "true", message: "OK" }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    const feedback = screen.getByRole("button", { name: "Send Feedback" });
    const bot = screen.getByRole("button", { name: "Create a bot question" });
    expect(feedback.compareDocumentPosition(bot) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    fireEvent.click(feedback);
    const field = screen.getByLabelText("Send kittycatbytes feedback:");
    expect((field as HTMLTextAreaElement).value).toBe(opening);
    fireEvent.change(field, { target: { value: `${opening}The middle layer is clear now.` } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Sent.")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(FEEDBACK_ENDPOINT);
    expect(JSON.parse(String(init?.body)).message).toContain("The middle layer is clear now.");
  });

  it("drops a filled honeypot instead of posting it", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { container } = render(
      <Feedback lessonTitle={lesson.title} scenarioLabel={scenario.label} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Send Feedback" }));
    const trap = container.querySelector("#feedback-website");
    fireEvent.change(trap!, { target: { value: "https://spam.example" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toBe("Sent.");
  });

  it("rewrites the first line when the scenario changes", () => {
    const { rerender } = render(
      <Feedback lessonTitle={lesson.title} scenarioLabel={scenario.label} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Send Feedback" }));
    rerender(<Feedback lessonTitle="Keys decide identity" scenarioLabel="Key by id" />);
    expect((screen.getByLabelText("Send kittycatbytes feedback:") as HTMLTextAreaElement).value).toBe(
      feedbackDraft("Keys decide identity", "Key by id"),
    );
  });
});
