import { describe, expect, it } from "vitest";
import { generatePlan } from "../index";
import {
  REFERENCE_DATE,
  complexCards,
  typicalCards,
} from "../__fixtures__";

describe("golden plan snapshots", () => {
  it("generates correct plan for typical scenario (snowball)", () => {
    const plan = generatePlan(typicalCards, 100_000, "snowball", {
      referenceDate: REFERENCE_DATE,
    });

    expect(plan).toMatchSnapshot();
  });

  it("generates correct plan for complex scenario (utilization)", () => {
    const plan = generatePlan(complexCards, 50_000, "utilization", {
      referenceDate: REFERENCE_DATE,
    });

    expect(plan).toMatchSnapshot();
  });
});
