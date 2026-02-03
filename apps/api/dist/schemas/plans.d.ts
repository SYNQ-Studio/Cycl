import { z } from "zod";
export declare const generatePlanRequestSchema: any;
export declare const planSnapshotResponseSchema: import("zod").ZodObject<{
    planId: import("zod").ZodString;
    generatedAt: import("zod").ZodString;
    cycleLabel: import("zod").ZodDefault<import("zod").ZodString>;
    focusSummary: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodString, "many">>;
    portfolio: import("zod").ZodObject<{
        utilization: import("zod").ZodOptional<import("zod").ZodNumber>;
        confidence: import("zod").ZodDefault<import("zod").ZodEnum<["high", "medium", "low"]>>;
    }, "strip", import("zod").ZodTypeAny, {
        confidence: "high" | "medium" | "low";
        utilization?: number | undefined;
    }, {
        utilization?: number | undefined;
        confidence?: "high" | "medium" | "low" | undefined;
    }>;
} & {
    actions: any;
    nextAction: any;
}, "strip", import("zod").ZodTypeAny, {
    [x: string]: any;
    planId?: unknown;
    generatedAt?: unknown;
    cycleLabel?: unknown;
    focusSummary?: unknown;
    portfolio?: unknown;
    actions?: unknown;
    nextAction?: unknown;
}, {
    [x: string]: any;
    planId?: unknown;
    generatedAt?: unknown;
    cycleLabel?: unknown;
    focusSummary?: unknown;
    portfolio?: unknown;
    actions?: unknown;
    nextAction?: unknown;
}>;
export type GeneratePlanRequest = z.infer<typeof generatePlanRequestSchema>;
//# sourceMappingURL=plans.d.ts.map