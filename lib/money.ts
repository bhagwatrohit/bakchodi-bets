import Decimal from "decimal.js";

/*
  Money helpers. All values are strings (matching Postgres `numeric`).
  Never use raw JS number arithmetic on balances/stakes — float bugs.
  decimal.js is configured for plenty of precision; we round for storage/display.
*/

Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP });

export type Money = string;

export const D = (v: Money | number) => new Decimal(v);

export const add = (a: Money, b: Money): Money => D(a).plus(b).toString();
export const sub = (a: Money, b: Money): Money => D(a).minus(b).toString();
export const mul = (a: Money, b: Money): Money => D(a).times(b).toString();
export const div = (a: Money, b: Money): Money => D(a).dividedBy(b).toString();

/** -1 if a<b, 0 if equal, 1 if a>b. */
export const cmp = (a: Money, b: Money): number => D(a).comparedTo(b);

export const isPositive = (a: Money): boolean => D(a).greaterThan(0);
export const isZero = (a: Money): boolean => D(a).isZero();
export const lte = (a: Money, b: Money): boolean => D(a).lessThanOrEqualTo(b);
export const gte = (a: Money, b: Money): boolean => D(a).greaterThanOrEqualTo(b);
export const neg = (a: Money): Money => D(a).negated().toString();

/** Round to 2 decimals (storage + comparison normalization). */
export const round2 = (a: Money): Money => D(a).toDecimalPlaces(2).toString();

/** Human display, e.g. format("1234.5", "Bakchodi Bucks") -> "1,234.50 Bakchodi Bucks". */
export function format(value: Money, currencyName = "credits"): string {
  const n = D(value).toDecimalPlaces(2).toNumber();
  const formatted = n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${currencyName}`;
}

/** Parse user input into a validated Money string, or null if invalid. */
export function parseMoney(input: string): Money | null {
  if (input == null || input.trim() === "") return null;
  try {
    const d = new Decimal(input.trim());
    if (!d.isFinite()) return null;
    return d.toString();
  } catch {
    return null;
  }
}
