import { describe, expect, it } from "vitest";
import { canTransition } from "./dto/appointment";
import { toCents, fromCents } from "./money";

describe("canTransition", () => {
  it("allows valid moves from BOOKED and CONFIRMED", () => {
    expect(canTransition("BOOKED", "CONFIRMED")).toBe(true);
    expect(canTransition("BOOKED", "CANCELLED")).toBe(true);
    expect(canTransition("CONFIRMED", "COMPLETED")).toBe(true);
  });

  it("rejects transitions out of terminal states", () => {
    expect(canTransition("COMPLETED", "CONFIRMED")).toBe(false);
    expect(canTransition("CANCELLED", "BOOKED")).toBe(false);
    expect(canTransition("NO_SHOW", "CONFIRMED")).toBe(false);
  });

  it("rejects going back to BOOKED", () => {
    expect(canTransition("CONFIRMED", "BOOKED" as never)).toBe(false);
  });
});

describe("money (integer cents)", () => {
  it("converts colones to smallest unit without float drift", () => {
    expect(toCents(2500)).toBe(250000);
    expect(toCents(45.5)).toBe(4550);
    expect(fromCents(250000)).toBe(2500);
  });
});
