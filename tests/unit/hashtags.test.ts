import { describe, it, expect } from "vitest";
import { extractHashtags } from "@/lib/hashtags";

describe("extractHashtags", () => {
  it("extracts a single hashtag, lowercased, without the #", () => {
    expect(extractHashtags("Great match today #Cricket")).toEqual(["cricket"]);
  });

  it("extracts multiple hashtags", () => {
    expect(extractHashtags("#Football and #Cricket fan here")).toEqual(["football", "cricket"]);
  });

  it("de-duplicates repeated tags", () => {
    expect(extractHashtags("#gym #gym #GYM")).toEqual(["gym"]);
  });

  it("returns an empty array when there are no hashtags", () => {
    expect(extractHashtags("Just a normal post, no tags")).toEqual([]);
  });

  it("ignores a lone # with no word characters after it", () => {
    expect(extractHashtags("price is $5 # nothing here")).toEqual([]);
  });

  it("caps at 10 unique tags", () => {
    const content = Array.from({ length: 15 }, (_, i) => `#tag${i}`).join(" ");
    expect(extractHashtags(content)).toHaveLength(10);
  });
});
