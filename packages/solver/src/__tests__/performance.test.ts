import { describe, expect, it } from "vitest";
import { performance } from "node:perf_hooks";
import { generatePlan } from "../index";
import {
  REFERENCE_DATE,
  complexCards,
  typicalCards,
} from "../__fixtures__";

describe("solver performance", () => {
  it("executes in <100ms for typical scenario", () => {
    generatePlan(typicalCards, 100_000, "snowball", {
      referenceDate: REFERENCE_DATE,
    });

    const start = performance.now();
    generatePlan(typicalCards, 100_000, "snowball", {
      referenceDate: REFERENCE_DATE,
    });
    const duration = performance.now() - start;

    console.info(`Typical plan duration: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(100);
  });

  it("executes in <500ms for complex scenario", () => {
    generatePlan(complexCards, 50_000, "utilization", {
      referenceDate: REFERENCE_DATE,
    });

    const start = performance.now();
    generatePlan(complexCards, 50_000, "utilization", {
      referenceDate: REFERENCE_DATE,
    });
    const duration = performance.now() - start;

    console.info(`Complex plan duration: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(500);
  });
});
