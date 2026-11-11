import { Highlight } from "prism-react-renderer";
import { codeTheme } from "./codeTheme.ts";
import { termLessons } from "./terms.ts";

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
                  {line.length === 0
                    ? " "
                    : line.map((token, tokenIndex) => {
                        const tokenProps = getTokenProps({ token });
                        const target = termLessons[token.content];
                        if (!target) return <span key={tokenIndex} {...tokenProps} />;
                        const here = target === lessonId;
                        const title = here ? "Current lesson" : "Jump to lesson.";
                        return (
                          <a
                            key={tokenIndex}
                            {...tokenProps}
                            className={[tokenProps.className, "code-term"].filter(Boolean).join(" ")}
                            href={`#${target}`}
                            title={title}
                            aria-label={`${token.content}. ${title}`}
                            data-current={here ? "true" : "false"}
                            aria-current={here ? "page" : undefined}
                            onClick={(event) => {
                              event.preventDefault();
                              if (!here) onJump(target);
                            }}
                          />
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
