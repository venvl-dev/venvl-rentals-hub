import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const CancellationRefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">Cancellation & Refund Policy</h1>
          <p className="text-muted-foreground text-lg">
            Effective Date: 1 January 2025
          </p>
          <p className="text-muted-foreground">
            Applies to: VENVL website or app bookings for short-, mid-, and long-term stays in Egypt
          </p>
        </div>

        {/* Company Info Card */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Brand</p>
              <p className="font-semibold">VENVL</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Powered By</p>
              <p className="font-semibold">Dlleni Real Estate Consultancy</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground mb-1">Registered Address</p>
              <p className="font-semibold">Building 238, Second Sector, Fifth Settlement, New Cairo</p>
            </div>
          </div>

          {/* Contact Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button variant="default" asChild>
              <a href="mailto:support@venvl.com">
                <Mail className="mr-2 h-4 w-4" />
                Email Us
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="tel:+201005400050">
                <Phone className="mr-2 h-4 w-4" />
                Call Us
              </a>
            </Button>
          </div>
        </Card>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1) Definitions</h2>
            <ul className="list-disc pl-6 space-y-1">
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
            <ul className="list-disc pl-6 space-y-1">
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
            <ul className="list-disc pl-6 space-y-1">
              <li>
                You can cancel or modify via Profile → Bookings in the app/website, or by email at{" "}
                <a href="mailto:support@venvl.com" className="text-primary hover:underline">
                  support@venvl.com
                </a>{" "}
                or phone{" "}
                <a href="tel:+201005400050" className="text-primary hover:underline">
                  +20 100 540 0050
                </a>
                .
              </li>
              <li>The timestamp of your request is based on Cairo time (EET).</li>
              <li>Refunds are returned to the original payment method only.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4) Free Cancellation Windows & Fees</h2>

            <Card className="p-6 mb-4 border-l-4 border-l-blue-500">
              <h3 className="text-xl font-semibold mb-3">4.1 Short Stays (1–27 nights)</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Free cancellation:</strong> Up to 48 hours before the check-in time (3:00 PM on the arrival date).</li>
                <li><strong>Late cancellation (&lt;48 hours):</strong> Charge equals 1 night + taxes/fees.</li>
                <li><strong>No-show:</strong> Charge equals 1 night + taxes/fees.</li>
              </ul>
            </Card>

            <Card className="p-6 mb-4 border-l-4 border-l-green-500">
              <h3 className="text-xl font-semibold mb-3">4.2 Monthly Stays (28–89 nights)</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Free cancellation:</strong> Up to 7 days before check-in.</li>
                <li><strong>Late cancellation (&lt;7 days):</strong> Fee equals 7 nights of the booked rate.</li>
                <li><strong>No-show:</strong> Fee equals 7 nights.</li>
              </ul>
            </Card>

            <Card className="p-6 mb-4 border-l-4 border-l-purple-500">
              <h3 className="text-xl font-semibold mb-3">4.3 Long-Term Stays (90+ nights)</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Free cancellation:</strong> Up to 14 days before check-in.</li>
                <li><strong>Late cancellation (&lt;14 days):</strong> Fee equals 1 month (30 nights).</li>
                <li><strong>No-show:</strong> Fee equals 1 month (30 nights).</li>
              </ul>
            </Card>

            <Card className="p-6 border-l-4 border-l-red-500">
              <h3 className="text-xl font-semibold mb-3">4.4 Non-Refundable Rates (any duration)</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Cancellations / No-shows:</strong> No refund. Date changes are treated as a cancellation unless otherwise stated for the rate.</li>
              </ul>
            </Card>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5) Early Departure (After Check-in)</h2>
            <ul className="list-disc pl-6 space-y-1">
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
            <ul className="list-disc pl-6 space-y-1">
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
            <ul className="list-disc pl-6 space-y-1">
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
            <ul className="list-disc pl-6 space-y-1">
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
            <ul className="list-disc pl-6 space-y-1">
              <li>A free date change, a credit voucher, or a full/partial refund depending on the case and duration.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10) Overbooking / Unit Unavailability by VENVL</h2>
            <p className="mb-4">In the unlikely event your unit becomes unavailable:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                We will offer a comparable or better unit at no extra cost, or a full refund if relocation is not acceptable to you. This is your sole remedy.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11) Taxes, Fees & Add-Ons</h2>
            <ul className="list-disc pl-6 space-y-1">
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
            <div className="flex flex-wrap gap-3">
              <Button variant="default" asChild>
                <a href="mailto:support@venvl.com">
                  <Mail className="mr-2 h-4 w-4" />
                  support@venvl.com
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="tel:+201005400050">
                  <Phone className="mr-2 h-4 w-4" />
                  +20 100 540 0050
                </a>
              </Button>
              <Button variant="outline" className="cursor-default">
                <MapPin className="mr-2 h-4 w-4" />
                Building 238, New Cairo
              </Button>
            </div>
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
