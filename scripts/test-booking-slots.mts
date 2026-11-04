/**
 * Checks the appointment-time rules (src/lib/booking/slots.ts) without any
 * network: run `npm run test:booking`. Exits with an error if anything is wrong.
 */
import assert from "node:assert/strict";
import { candidateSlots, freeSlots, londonToUtc, type BookingRules } from "../src/lib/booking/slots.ts";

const rules: BookingRules = {
  durationMinutes: 30,
  gapMinutes: 5,
  noticeHours: 24,
  weeksAhead: 8,
  days: [{ day: "3", start: "09:30", end: "17:30", breakStart: "13:30", breakEnd: "14:00" }],
  closed: [],
};

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log(`ok  ${name}`);
};

// Monday 2 November 2026, 10:00 London (GMT).
const monday = new Date("2026-11-02T10:00:00Z");

test("a Wednesday has the 13 expected times, skipping lunch", () => {
  const day = candidateSlots(rules, monday).filter((s) => s.date === "2026-11-04");
  assert.deepEqual(
    day.map((s) => s.time),
    ["09:30", "10:05", "10:40", "11:15", "11:50", "12:25", "13:00", "14:00", "14:35", "15:10", "15:45", "16:20", "16:55"],
  );
});

test("only Wednesdays, and only within 8 weeks", () => {
  const all = candidateSlots(rules, monday);
  assert.ok(all.every((s) => new Date(`${s.date}T12:00:00Z`).getUTCDay() === 3));
  assert.equal(new Set(all.map((s) => s.date)).size, 8);
});

test("24 hours' notice: Tuesday 10:00 can't book Wednesday 09:30, but can book 10:05", () => {
  const tuesday = new Date("2026-11-03T10:00:00Z");
  const times = candidateSlots(rules, tuesday).filter((s) => s.date === "2026-11-04").map((s) => s.time);
  assert.ok(!times.includes("09:30"));
  assert.equal(times[0], "10:05");
});

test("winter (GMT) and summer (BST) times land on the right moment", () => {
  assert.equal(londonToUtc("2026-12-02", 9 * 60 + 30).toISOString(), "2026-12-02T09:30:00.000Z");
  assert.equal(londonToUtc("2027-04-07", 9 * 60 + 30).toISOString(), "2027-04-07T08:30:00.000Z");
});

test("across the clocks going forward (28 March 2027), Wednesdays either side stay at 09:30 London", () => {
  const before = new Date("2027-03-15T10:00:00Z");
  const slots = candidateSlots(rules, before);
  const first = (date: string) => slots.find((s) => s.date === date)!;
  assert.equal(first("2027-03-24").start, "2027-03-24T09:30:00.000Z"); // GMT
  assert.equal(first("2027-03-31").start, "2027-03-31T08:30:00.000Z"); // BST
  assert.equal(first("2027-03-31").time, "09:30");
});

test("across the clocks going back (25 October 2026)", () => {
  const before = new Date("2026-10-12T10:00:00Z");
  const slots = candidateSlots(rules, before);
  assert.equal(slots.find((s) => s.date === "2026-10-21")!.start, "2026-10-21T08:30:00.000Z"); // BST
  assert.equal(slots.find((s) => s.date === "2026-10-28")!.start, "2026-10-28T09:30:00.000Z"); // GMT
});

test("a busy calendar entry removes the clashing time, and the gap either side", () => {
  // Busy 10:00–10:40 London on 4 Nov: clashes with 09:30 (ends 10:00, gap to 10:05) ,10:05 and 10:40 (gap).
  const busy = [{ start: Date.parse("2026-11-04T10:00:00Z"), end: Date.parse("2026-11-04T10:40:00Z") }];
  const times = freeSlots(rules, monday, busy).filter((s) => s.date === "2026-11-04").map((s) => s.time);
  assert.ok(!times.includes("09:30") && !times.includes("10:05") && !times.includes("10:40"));
  assert.ok(times.includes("11:15"));
});

test("an existing appointment blocks only its own time", () => {
  const busy = [{ start: Date.parse("2026-11-04T11:15:00Z"), end: Date.parse("2026-11-04T11:45:00Z") }];
  const times = freeSlots(rules, monday, busy).filter((s) => s.date === "2026-11-04").map((s) => s.time);
  assert.ok(!times.includes("11:15"));
  assert.ok(times.includes("10:40") && times.includes("11:50"));
});

test("closed days (holidays) offer nothing", () => {
  const closed: BookingRules = { ...rules, closed: [{ from: "2026-12-23", to: "2026-12-31" }, { from: "2026-11-11" }] };
  const dates = new Set(candidateSlots(closed, monday).map((s) => s.date));
  assert.ok(!dates.has("2026-11-11") && !dates.has("2026-12-23") && !dates.has("2026-12-30"));
  assert.ok(dates.has("2026-11-18"));
});

test("nonsense hours are ignored rather than crashing", () => {
  const bad: BookingRules = { ...rules, days: [{ day: "3", start: "9am", end: "17:30" }] };
  assert.equal(candidateSlots(bad, monday).length, 0);
});

console.log(`\n${passed} checks passed`);
