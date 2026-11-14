import { describe, expect, it } from "vitest";
import { splitLineComment } from "./workbench/codeComments.ts";

describe("splitLineComment", () => {
  it("splits at //", () => {
    expect(splitLineComment('Add</button> //label defined off-screen')).toEqual({
      before: "Add</button> ",
      comment: "//label defined off-screen",
    });
  });

  it("splits when // has no space after it", () => {
    expect(splitLineComment("x; //onLog defined off-screen")).toEqual({
      before: "x; ",
      comment: "//onLog defined off-screen",
    });
  });

  it("leaves URLs alone", () => {
    expect(splitLineComment('href="https://example.com"')).toBeNull();
  });

  it("returns null when there is no comment", () => {
    expect(splitLineComment("const x = 1;")).toBeNull();
  });
});
