import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const leakedIntervals = new Set<number>();

export function rememberInterval(id: number) {
  leakedIntervals.add(id);
}

export function useClearLeakedIntervals() {
  useEffect(() => {
    return () => {
      for (const id of leakedIntervals) window.clearInterval(id);
      leakedIntervals.clear();
    };
  }, []);
}

export function RenderMark({ name, label = name }: { name: string; label?: string }) {
  const count = useRef(0);
  count.current += 1;
  const renders = count.current;
  return (
    <span
      className="render-mark"
      data-render-name={name}
      data-renders={renders}
      key={renders}
    >
      {label ? `${label} · render ${renders}` : `render ${renders}`}
    </span>
  );
}

export function useLog() {
  const [lines, setLines] = useState<string[]>([]);
  const push = useCallback((line: string) => {
    setLines((current) => [...current, line].slice(-24));
  }, []);
  return { lines, push };
}

export function useStableLog() {
  const { lines, push } = useLog();
  const ref = useRef(push);
  ref.current = push;
  const onLog = useCallback((line: string) => {
    ref.current(line);
  }, []);
  return { lines, onLog };
}

export function LogView({ lines }: { lines: string[] }) {
  return (
    <div className="log" data-testid="log" aria-live="polite">
      {lines.length === 0 ? (
        <p className="log-empty">Log is empty.</p>
      ) : (
        lines.map((line, index) => (
          <div key={`${index}:${line}`} className="log-line">
            {line}
          </div>
        ))
      )}
    </div>
  );
}

function formatConsole(args: unknown[]) {
  return args
    .map((arg) => {
      if (typeof arg === "string") return arg;
      if (arg instanceof Error) return arg.message;
      return "";
    })
    .filter(Boolean)
    .join(" ")
    .split("\n")[0];
}

let consoleDepth = 0;
let consoleOriginal: typeof console.error | null = null;

function patchedConsoleError(...args: unknown[]) {
  const line = formatConsole(args);
  if (line) {
    queueMicrotask(() => {
      for (const push of consolePushers) push(line);
    });
  }
  if (consoleOriginal) Reflect.apply(consoleOriginal, console, args);
}

const consolePushers = new Set<(line: string) => void>();

export function useConsoleLines() {
  const [lines, setLines] = useState<string[]>([]);
  const push = useCallback((line: string) => {
    setLines((current) => (current.includes(line) ? current : [...current, line].slice(-3)));
  }, []);
  const installed = useRef(false);
  if (!installed.current) {
    installed.current = true;
    if (consoleDepth === 0) {
      consoleOriginal = console.error;
      console.error = patchedConsoleError;
    }
    consoleDepth += 1;
    consolePushers.add(push);
  }
  useEffect(() => {
    return () => {
      consolePushers.delete(push);
      consoleDepth -= 1;
      if (consoleDepth === 0 && consoleOriginal) {
        console.error = consoleOriginal;
        consoleOriginal = null;
      }
    };
  }, [push]);
  return lines;
}

export function WarningList({ lines }: { lines: string[] }) {
  if (lines.length === 0) {
    return <p className="hint chrome">No console warning yet.</p>;
  }
  return (
    <ul className="warnings" data-testid="warnings">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

type BoundaryProps = {
  resetKey: string;
  children: ReactNode;
  title?: string;
  onReset?: () => void;
};

type BoundaryState = {
  error: Error | null;
};

export class CatchBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(thrown: unknown): BoundaryState {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown));
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  componentDidUpdate(previous: BoundaryProps) {
    if (previous.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="caught" role="alert" data-testid="caught">
          <p className="caught-kicker">{this.props.title ?? "Error boundary"}</p>
          <p className="caught-message">{this.state.error.message}</p>
          {this.props.onReset ? (
            <button type="button" onClick={this.props.onReset}>
              Reset boundary
            </button>
          ) : (
            <p className="caught-hint">
              Reset lesson, at the bottom of the panels, mounts this widget again.
            </p>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
