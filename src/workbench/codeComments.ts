/** Style for line and block comments in the code panel. */
export const commentStyle = {
  color: "#7d9a6e",
  fontStyle: "italic" as const,
};

/**
 * Split a token's text at the first // that begins a line comment.
 * Skips :// so URLs stay intact.
 */
export function splitLineComment(content: string): { before: string; comment: string } | null {
  for (let index = 0; index < content.length - 1; index += 1) {
    if (content[index] !== "/" || content[index + 1] !== "/") continue;
    if (index > 0 && content[index - 1] === ":") continue;
    return {
      before: content.slice(0, index),
      comment: content.slice(index),
    };
  }
  return null;
}
