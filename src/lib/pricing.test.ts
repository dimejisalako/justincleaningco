import { describe, expect, it } from "vitest";
import { calculatePrice } from "./pricing";

describe("calculatePrice", () => {
  it("prices a one-time clean at the tier base price", () => {
    const r = calculatePrice({ tier: "under_1500", frequency: "one_time" });
    expect(r).toMatchObject({ kind: "priced", totalCents: 14000, discountCents: 0 });
  });

  it("applies the 15% weekly discount", () => {
    // 1,500–2,500 sq ft: $190 base, weekly 15% off => $161.50
    const r = calculatePrice({ tier: "1500_2500", frequency: "weekly" });
    expect(r).toMatchObject({ kind: "priced", totalCents: 16150, discountCents: 2850 });
  });

  it("applies the 10% every-two-weeks discount", () => {
    // 2,500–3,500 sq ft: $245 base, every two weeks 10% off => $220.50
    const r = calculatePrice({ tier: "2500_3500", frequency: "every_two_weeks" });
    expect(r).toMatchObject({ kind: "priced", totalCents: 22050 });
  });

  it("gives no discount for monthly", () => {
    const r = calculatePrice({ tier: "2500_3500", frequency: "monthly" });
    expect(r).toMatchObject({ kind: "priced", totalCents: 24500 });
  });

  it("charges 1.5x the one-time price for a deep clean, before the frequency discount", () => {
    const oneTime = calculatePrice({ tier: "under_1500", frequency: "one_time", deepClean: true });
    expect(oneTime).toMatchObject({ kind: "priced", cleanCents: 21000, totalCents: 21000 });

    // Deep clean $285, then 15% weekly discount ($42.75) => $242.25
    const weekly = calculatePrice({ tier: "1500_2500", frequency: "weekly", deepClean: true });
    expect(weekly).toMatchObject({ kind: "priced", cleanCents: 28500, discountCents: 4275, totalCents: 24225 });
  });

  it("adds fixed add-on prices without discounting them", () => {
    // $140 base + inside fridge $30 + inside oven $35
    const r = calculatePrice({
      tier: "under_1500",
      frequency: "one_time",
      addons: ["inside_fridge", "inside_oven"],
    });
    expect(r).toMatchObject({ kind: "priced", addonsCents: 6500, totalCents: 20500 });

    // Weekly discount applies to the clean only: $190 - 15% = $161.50, plus $60 windows
    const weekly = calculatePrice({ tier: "1500_2500", frequency: "weekly", addons: ["interior_windows"] });
    expect(weekly).toMatchObject({ kind: "priced", totalCents: 16150 + 6000 });
  });

  it("includes every add-on in a deep clean at no extra charge", () => {
    // $140 base x 1.5 = $210; add-ons are included, so no add-on charge is added
    const r = calculatePrice({
      tier: "under_1500",
      frequency: "one_time",
      deepClean: true,
      addons: ["inside_fridge"],
    });
    expect(r).toMatchObject({ kind: "priced", deepClean: true, addonsCents: 0, totalCents: 21000 });
  });

  it("returns a custom quote for homes over 3,500 sq ft instead of a price", () => {
    expect(calculatePrice({ tier: "over_3500", frequency: "weekly" })).toEqual({ kind: "custom_quote" });
  });
});
