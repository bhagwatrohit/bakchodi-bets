import { describe, it, expect } from "vitest";
import { assertAtLeastMinBet } from "@/lib/services/validation";
import { ServiceError } from "@/lib/errors";

describe("assertAtLeastMinBet", () => {
  it("passes when stake equals the minimum", () => {
    expect(() => assertAtLeastMinBet("100", "100")).not.toThrow();
  });
  it("passes when stake exceeds the minimum", () => {
    expect(() => assertAtLeastMinBet("250", "100")).not.toThrow();
  });
  it("throws when stake is below the minimum", () => {
    expect(() => assertAtLeastMinBet("50", "100")).toThrow(ServiceError);
  });
});
