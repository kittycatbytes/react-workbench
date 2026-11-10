export type Sample = {
  text: string;
  focus: number[];
};

export function sample(
  strings: TemplateStringsArray,
  ...values: string[]
): Sample {
  let raw = strings[0] ?? "";
  for (let index = 0; index < values.length; index += 1) {
    raw += values[index] + (strings[index + 1] ?? "");
  }
  raw = raw.replace(/^\n/, "").replace(/[ \t]*$/, "");
  const lines = raw.split("\n");
  const indents = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => line.search(/\S/));
  const min = indents.length > 0 ? Math.min(...indents) : 0;
  const focus: number[] = [];
  const text = lines
    .map((line) => (line.trim().length === 0 ? "" : line.slice(min)))
    .map((line, index) => {
      if (!line.includes("/*focus*/")) return line;
      focus.push(index + 1);
      return line.replace(/\s*\/\*focus\*\//g, "");
    })
    .join("\n");
  return { text, focus };
}
