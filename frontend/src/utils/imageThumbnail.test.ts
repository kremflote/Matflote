import { describe, expect, it } from "vitest";
import { getThumbnailSize, getThumbnailSrc } from "./imageThumbnail";

describe("getThumbnailSize", () => {
  it("makes the shorter side 320 px and keeps the aspect ratio", () => {
    expect(getThumbnailSize(800, 800)).toEqual({ width: 320, height: 320 });
    expect(getThumbnailSize(1200, 800)).toEqual({ width: 480, height: 320 });
    expect(getThumbnailSize(600, 1000)).toEqual({ width: 320, height: 533 });
  });

  it("never enlarges a small image", () => {
    expect(getThumbnailSize(200, 150)).toEqual({ width: 200, height: 150 });
  });
});

describe("getThumbnailSrc", () => {
  it("prefers the thumbnail and falls back to the full image", () => {
    expect(getThumbnailSrc({ imageUrl: "/images/a.jpg", thumbnailUrl: "/images/a.thumb.jpg" })).toMatch(/\/images\/a\.thumb\.jpg$/);
    expect(getThumbnailSrc({ imageUrl: "/images/a.jpg", thumbnailUrl: null })).toMatch(/\/images\/a\.jpg$/);
    expect(getThumbnailSrc({ imageUrl: "/images/a.jpg" })).toMatch(/\/images\/a\.jpg$/);
    expect(getThumbnailSrc({ imageUrl: null, thumbnailUrl: null })).toBeNull();
    expect(getThumbnailSrc(undefined)).toBeNull();
  });
});
