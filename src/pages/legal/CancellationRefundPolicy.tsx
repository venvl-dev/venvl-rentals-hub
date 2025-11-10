import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const CancellationRefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-2">VENVL — Cancellation & Refund Policy</h1>
          <p className="text-muted-foreground mb-8">
            <strong>Effective Date:</strong> 1 January 2025
          </p>

          <div className="bg-muted/50 p-6 rounded-lg mb-8">
            <p className="mb-0">
              <strong>Applies to:</strong> VENVL website or app bookings for short-, mid-, and long-term stays in Egypt.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1) Definitions</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Guest / Tenant:</strong> Any individual or company booking a VENVL unit.</li>
              <li><strong>Short Stay:</strong> 1–27 nights.</li>
              <li><strong>Monthly Stay:</strong> 28–89 nights.</li>
              <li><strong>Long-Term Stay:</strong> 90+ nights.</li>
              <li><strong>Non-Refundable Rate:</strong> Discounted rate with no refunds after booking.</li>
              <li><strong>Security Deposit:</strong> A refundable damage deposit shown at checkout.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2) Booking & Payment</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                A booking is confirmed only after full payment (or an approved split plan, if offered) and receipt of our confirmation email or in-app receipt.
              </li>
              <li>
                We do not reserve units without payment. Prices include applicable taxes/fees shown at checkout.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3) How to Cancel or Modify</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                You can cancel or modify via Profile → Bookings in the app/website, or by email at{" "}
                <a href="mailto:support@venvl.com" className="text-primary hover:underline">
                  support@venvl.com
                </a>{" "}
                or phone{" "}
                <a href="tel:+201005400050" className="text-primary hover:underline">
                  +201005400050
                </a>
                .
              </li>
              <li>The timestamp of your request is based on Cairo time (EET).</li>
              <li>Refunds are returned to the original payment method only.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4) Free Cancellation Windows & Fees</h2>

            <div className="bg-blue-50 dark:bg-blue-950/30 p-6 rounded-lg mb-6">
              <h3 className="text-xl font-semibold mb-3">4.1 Short Stays (1–27 nights)</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Free cancellation:</strong> Up to 48 hours before the check-in time (3:00 PM on the arrival date).</li>
                <li><strong>Late cancellation (&lt;48 hours):</strong> Charge equals 1 night + taxes/fees.</li>
                <li><strong>No-show:</strong> Charge equals 1 night + taxes/fees.</li>
              </ul>
            </div>

            <div className="bg-green-50 dark:bg-green-950/30 p-6 rounded-lg mb-6">
              <h3 className="text-xl font-semibold mb-3">4.2 Monthly Stays (28–89 nights)</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Free cancellation:</strong> Up to 7 days before check-in.</li>
                <li><strong>Late cancellation (&lt;7 days):</strong> Fee equals 7 nights of the booked rate.</li>
                <li><strong>No-show:</strong> Fee equals 7 nights.</li>
              </ul>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/30 p-6 rounded-lg mb-6">
              <h3 className="text-xl font-semibold mb-3">4.3 Long-Term Stays (90+ nights)</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Free cancellation:</strong> Up to 14 days before check-in.</li>
                <li><strong>Late cancellation (&lt;14 days):</strong> Fee equals 1 month (30 nights).</li>
                <li><strong>No-show:</strong> Fee equals 1 month (30 nights).</li>
              </ul>
            </div>

            <div className="bg-red-50 dark:bg-red-950/30 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">4.4 Non-Refundable Rates (any duration)</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Cancellations / No-shows:</strong> No refund. Date changes are treated as a cancellation unless otherwise stated for the rate.</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5) Early Departure (After Check-in)</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Short stays:</strong> Unused nights are refundable only if you give 24 hours' notice and the unit is re-sold; otherwise, non-refundable.
              </li>
              <li>
                <strong>Monthly / Long-Term:</strong> Early-termination fee equals 7 nights (Monthly) or 30 nights (Long-Term), unless your agreement states otherwise.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6) Modifications (Dates / Guests / Unit Type)</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Modifications are subject to availability and price differences at the time of change.
              </li>
              <li>
                If the new total is lower, the difference follows the refund timelines below. If higher, you pay the difference to confirm.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7) Security Deposit & Incidentals</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                A refundable security deposit may be pre-authorized or charged before check-in.
              </li>
              <li>
                After a check-out inspection, we release/refund within 7 business days, minus any approved charges for damage, missing items, excessive cleaning, or building fines. Bank release times may vary.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8) Refund Timelines</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Approved refunds are initiated within 14 business days from acceptance of your request; bank/issuer timings may extend this period.
              </li>
              <li>
                Currency conversion/FX fees charged by your bank are not controlled by VENVL.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9) Force Majeure</h2>
            <p className="mb-4">
              If your stay is directly impacted by events beyond our reasonable control (e.g., government restrictions, natural disasters), provide evidence, and we will offer, at our discretion:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>A free date change, a credit voucher, or a full/partial refund depending on the case and duration.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10) Overbooking / Unit Unavailability by VENVL</h2>
            <p className="mb-4">In the unlikely event your unit becomes unavailable:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                We will offer a comparable or better unit at no extra cost, or a full refund if relocation is not acceptable to you. This is your sole remedy.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11) Taxes, Fees & Add-Ons</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Mandatory taxes/fees are refunded when the related nights are refunded.
              </li>
              <li>
                Optional add-ons already delivered (e.g., cleaning, concierge) are non-refundable.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12) Corporate & Special Agreements</h2>
            <p>
              Corporate bookings and promotional packages may have bespoke terms. Where conflicts exist, the special terms prevail.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13) Abuse & Fraud</h2>
            <p>
              We may deny or revoke refunds in suspected fraud/abuse cases (e.g., chargeback misuse, falsified documents).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14) Contact</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Email:</strong>{" "}
                <a href="mailto:support@venvl.com" className="text-primary hover:underline">
                  support@venvl.com
                </a>
              </li>
              <li>
                <strong>Phone/WhatsApp:</strong>{" "}
                <a href="tel:+201005400050" className="text-primary hover:underline">
                  +201005400050
                </a>
              </li>
              <li><strong>Address:</strong> Building 238, Second Sector, Fifth Settlement, New Cairo</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15) Changes to this Policy</h2>
            <p>
              We may update this policy; the Effective Date above reflects the latest version.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CancellationRefundPolicy;
