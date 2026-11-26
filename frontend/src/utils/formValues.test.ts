import { describe, expect, it } from "vitest";
import { numberToInputValue, parseOptionalNumber, toggleValue } from "./formValues";

describe("parseOptionalNumber", () => {
  it.each([
    ["", null],
    ["   ", null],
    ["12", 12],
    [" 2.5 ", 2.5],
    ["2,5", 2.5],
    ["abc", null],
    ["0", 0],
  ])("reads %j as %j", (text, expected) => {
    expect(parseOptionalNumber(text)).toBe(expected);
  });
});

describe("numberToInputValue and toggleValue", () => {
  it("shows no value as an empty field", () => {
    expect(numberToInputValue(null)).toBe("");
    expect(numberToInputValue(undefined)).toBe("");
    expect(numberToInputValue(0)).toBe("0");
  });

  it("adds a missing value and removes a present one", () => {
    expect(toggleValue(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleValue(["a", "b"], "a")).toEqual(["b"]);
  });
});
