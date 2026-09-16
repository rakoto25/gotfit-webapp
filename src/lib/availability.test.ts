import { describe, expect, it } from "vitest";
import { availableTimes } from "./availability";

const annonce = { id: 1, duration: 60, available_days: ["monday"], available_hours: ["09:00-11:00"] };
const now = new Date("2030-01-01T00:00:00");

describe("Coach availability", () => {
  it("offers only starts that fit the entire session", () => {
    expect(availableTimes(annonce, "2030-01-07", now)).toEqual(["09:00", "09:15", "09:30", "09:45", "10:00"]);
  });
  it("rejects unavailable days and unspecified hours", () => {
    expect(availableTimes(annonce, "2030-01-08", now)).toEqual([]);
    expect(availableTimes({ ...annonce, available_hours: [] }, "2030-01-07", now)).toEqual([]);
  });
  it("ignores malformed ranges, past starts and duplicate ranges", () => {
    expect(availableTimes({ ...annonce, available_hours: ["invalid", "09:00-11:00", "09:00-11:00"] }, "2030-01-07", new Date("2030-01-07T09:45:00"))).toEqual(["10:00"]);
  });
});
