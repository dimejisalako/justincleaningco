import { PriceResult } from "@/lib/pricing";
import { formatMoney } from "@/lib/dates";

/** Presentational price summary. Used by the home calculator and the booking form. */
export function PriceBox({
  result,
  frequencyLabel,
  perVisitLabel = true,
}: {
  result: PriceResult;
  frequencyLabel: string;
  perVisitLabel?: boolean;
}) {
  if (result.kind === "custom_quote") {
    return (
      <div className="rounded-xl border border-teal-100 bg-teal-50 p-5" aria-live="polite">
        <p className="text-lg font-bold text-navy">Custom quote</p>
        <p className="mt-1 text-sm text-navy-600">
          Homes over 3,500 sq ft are quoted individually. Book with this size and we&apos;ll contact you with a price, or message us on WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-navy-100 bg-navy-50 p-5" aria-live="polite">
      <p className="text-sm font-semibold uppercase tracking-wide text-navy-600">Estimated price</p>
      <p className="mt-1 text-4xl font-extrabold text-navy">
        {formatMoney(result.totalCents)}
        {perVisitLabel ? <span className="text-base font-semibold text-navy-600"> / visit</span> : null}
      </p>
      <dl className="mt-4 space-y-1 text-sm text-navy-600">
        <div className="flex justify-between gap-4">
          <dt>Base price</dt>
          <dd>{formatMoney(result.baseCents)}</dd>
        </div>
        {result.cleanCents !== result.baseCents ? (
          <div className="flex justify-between gap-4">
            <dt>Deep clean (1.5×)</dt>
            <dd>{formatMoney(result.cleanCents)}</dd>
          </div>
        ) : null}
        {result.discountCents > 0 ? (
          <div className="flex justify-between gap-4 text-teal-700">
            <dt>{frequencyLabel} discount</dt>
            <dd>−{formatMoney(result.discountCents)}</dd>
          </div>
        ) : null}
        {result.addonsCents > 0 ? (
          <div className="flex justify-between gap-4">
            <dt>Add-ons</dt>
            <dd>{formatMoney(result.addonsCents)}</dd>
          </div>
        ) : null}
        {result.deepClean ? (
          <div className="flex justify-between gap-4">
            <dt>Add-ons</dt>
            <dd>Included</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-4 text-xs text-navy-600">
        Pay after each visit by invoice or payment link. No subscription and no automatic charges.
      </p>
    </div>
  );
}
