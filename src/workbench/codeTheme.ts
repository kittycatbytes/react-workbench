import type { PrismTheme } from "prism-react-renderer";

export const codeTheme: PrismTheme = {
  plain: {
    color: "#f6f1e8",
    backgroundColor: "#201c18",
  },
  styles: [
    {
      types: ["comment", "prolog", "doctype", "cdata"],
      style: { color: "#7d9a6e", fontStyle: "italic" },
    },
    {
      types: ["keyword", "boolean"],
      style: { color: "#f0a070" },
    },
    {
      types: ["function", "function-variable"],
      style: { color: "#8fccc4" },
    },
    {
      types: ["string", "attr-value", "template-string"],
      style: { color: "#e6d39a" },
    },
    {
      types: ["number", "constant"],
      style: { color: "#e6d39a" },
    },
    {
      types: ["class-name", "maybe-class-name", "builtin"],
      style: { color: "#9fd0c8" },
    },
    {
      types: ["tag", "attr-name"],
      style: { color: "#f0a070" },
    },
    {
      types: ["punctuation", "operator"],
      style: { color: "#f6f1e8" },
    },
  ],
};
