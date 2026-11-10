import { Highlight } from "prism-react-renderer";
import { codeTheme } from "./codeTheme.ts";

export function CodeView({ code, focus }: { code: string; focus: number[] }) {
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
                    : line.map((token, tokenIndex) => (
                        <span key={tokenIndex} {...getTokenProps({ token })} />
                      ))}
                </span>
              </div>
            );
          })}
        </pre>
      )}
    </Highlight>
  );
}
