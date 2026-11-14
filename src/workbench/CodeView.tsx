import { Highlight, type Token } from "prism-react-renderer";
import type { CSSProperties } from "react";
import { commentStyle, splitLineComment } from "./codeComments.ts";
import { codeTheme } from "./codeTheme.ts";
import { termLessons } from "./terms.ts";

type Painted = {
  content: string;
  className: string;
  style?: CSSProperties;
  comment: boolean;
};

function paintLine(
  line: Token[],
  getTokenProps: (options: { token: Token }) => {
    className?: string;
    style?: CSSProperties;
    children?: string;
  },
): Painted[] {
  const painted: Painted[] = [];
  let lineComment = false;

  for (const token of line) {
    const tokenProps = getTokenProps({ token });
    const content = token.content;
    const prismComment = token.types.includes("comment");

    if (lineComment || prismComment) {
      painted.push({
        content,
        className: "token comment",
        style: commentStyle,
        comment: true,
      });
      if (!prismComment) lineComment = true;
      continue;
    }

    const split = splitLineComment(content);
    if (!split) {
      painted.push({
        content,
        className: tokenProps.className ?? "token",
        style: tokenProps.style,
        comment: false,
      });
      continue;
    }

    if (split.before) {
      painted.push({
        content: split.before,
        className: tokenProps.className ?? "token",
        style: tokenProps.style,
        comment: false,
      });
    }
    painted.push({
      content: split.comment,
      className: "token comment",
      style: commentStyle,
      comment: true,
    });
    lineComment = true;
  }

  return painted;
}

export function CodeView({
  code,
  focus,
  lessonId,
  onJump,
}: {
  code: string;
  focus: number[];
  lessonId: string;
  onJump: (lessonId: string) => void;
}) {
  const marked = new Set(focus);
  return (
    <Highlight theme={codeTheme} code={code} language="tsx">
      {({ tokens, getLineProps, getTokenProps }) => (
        <pre className="code-pre" tabIndex={0} aria-label="Code running on the stage">
          {tokens.map((line, index) => {
            const lineNumber = index + 1;
            const lineProps = getLineProps({ line });
            const focused = marked.has(lineNumber);
            const painted = paintLine(line, getTokenProps);
            return (
              <div
                key={lineNumber}
                {...lineProps}
                className={
                  focused
                    ? `${lineProps.className} code-line is-focus`
                    : `${lineProps.className} code-line`
                }
              >
                <span className="gutter">{lineNumber}</span>
                <span className="code-text">
                  {painted.length === 0
                    ? " "
                    : painted.map((token, tokenIndex) => {
                        if (token.comment) {
                          return (
                            <span
                              key={tokenIndex}
                              className={token.className}
                              style={token.style}
                            >
                              {token.content}
                            </span>
                          );
                        }
                        const target = termLessons[token.content];
                        if (!target) {
                          return (
                            <span
                              key={tokenIndex}
                              className={token.className}
                              style={token.style}
                            >
                              {token.content}
                            </span>
                          );
                        }
                        const here = target === lessonId;
                        const title = here ? "Current lesson" : "Jump to lesson.";
                        return (
                          <a
                            key={tokenIndex}
                            className={[token.className, "code-term"].filter(Boolean).join(" ")}
                            style={token.style}
                            href={`#${target}`}
                            title={title}
                            aria-label={`${token.content}. ${title}`}
                            data-current={here ? "true" : "false"}
                            aria-current={here ? "page" : undefined}
                            onClick={(event) => {
                              event.preventDefault();
                              if (!here) onJump(target);
                            }}
                          >
                            {token.content}
                          </a>
                        );
                      })}
                </span>
              </div>
            );
          })}
        </pre>
      )}
    </Highlight>
  );
}
