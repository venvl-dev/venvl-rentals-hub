import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const TermsAndConditions = () => {
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
          <h1 className="text-4xl font-bold mb-3">Terms & Conditions</h1>
          <p className="text-muted-foreground text-lg">
            Effective Date: 1 January 2025
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
            <h2 className="text-2xl font-semibold mb-4">OVERVIEW</h2>
            <p className="mb-4">
              This website and mobile app (the "Platform") are operated by Dlleni Real Estate Consultancy under the VENVL brand ("VENVL", "we", "us", "our"). By accessing or using the Platform and/or booking any unit or service, you agree to be bound by these Terms & Conditions ("Terms"), our{" "}
              <Link to="/privacy-policy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              , Cookie Policy, and our{" "}
              <Link to="/cancellation-refund-policy" className="text-primary hover:underline">
                Cancellation & Refund Policy
              </Link>{" "}
              (together, the "Policies"). If you do not agree, do not use the Platform.
            </p>
            <p>
              We may update these Terms at any time by posting a revised version on the Platform. Your continued use after posting constitutes acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1) ELIGIBILITY & ACCOUNT REGISTRATION</h2>
            <p className="mb-2">1.1 You must be 18+ to use the Platform or complete a booking.</p>
            <p className="mb-2">1.2 You are responsible for providing accurate information and keeping your account credentials secure.</p>
            <p>1.3 We may require KYC/AML verification before certain bookings or payouts (e.g., owners/investors).</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2) SCOPE OF SERVICES</h2>
            <p className="mb-2">
              2.1 VENVL provides a curated, fully-managed accommodation and property-management service, including short-, monthly-, and long-term stays, corporate housing, and related services (cleaning, maintenance, concierge where available).
            </p>
            <p>
              2.2 We control the quality standards of listed units and may add, change, or suspend features at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3) BOOKING, PRICING, TAXES & FEES</h2>
            <p className="mb-2">
              3.1 A booking is confirmed only after full payment (or an approved split plan, if offered) and receipt of our confirmation email/in-app receipt.
            </p>
            <p className="mb-2">
              3.2 Prices shown at checkout include applicable taxes/fees where required. Additional optional services may be charged separately.
            </p>
            <p className="mb-2">
              3.3 Security Deposits (if applicable) may be pre-authorized or charged prior to check-in and are refundable per policy after inspection.
            </p>
            <p>
              3.4 We reserve the right to correct pricing errors. If a material error occurs after payment, we will offer you the option to cancel for a full refund or proceed at the corrected price.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4) CANCELLATIONS, MODIFICATIONS & REFUNDS</h2>
            <p className="mb-2">
              4.1 Cancellations, no-shows, early departures, and modifications are governed by the{" "}
              <Link to="/cancellation-refund-policy" className="text-primary hover:underline">
                VENVL — Cancellation & Refund Policy
              </Link>{" "}
              (latest version on the Platform).
            </p>
            <p className="mb-2">4.2 The timestamp for requests follows Cairo time (EET).</p>
            <p>4.3 Approved refunds are returned to the original payment method only.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5) CHECK-IN / CHECK-OUT; HOUSE RULES</h2>
            <p className="mb-2">
              5.1 Standard check-in is 3:00 PM and check-out is 12:00 PM, unless otherwise stated for a specific unit.
            </p>
            <p className="mb-2">
              5.2 You must comply with building/compound rules, maximum occupancy limits, and local laws.
            </p>
            <p>
              5.3 No parties, excessive noise, illegal activities, or smoking in non-smoking units. Breaches may lead to immediate termination of stay and deductions from deposit and/or additional charges.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6) GUEST CONDUCT & DAMAGES</h2>
            <p className="mb-2">
              6.1 You are responsible for the condition of the unit and common areas you access during your stay.
            </p>
            <p>
              6.2 You authorize VENVL to charge for damage, missing items, excessive cleaning, or building fines identified during or after your stay, with documentation provided on request.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7) OWNER SERVICES (PROPERTY MANAGEMENT)</h2>
            <p className="mb-2">
              7.1 Owners partnering with VENVL are subject to a separate Owner Management Agreement (scope of management, fees, term, insurance, termination).
            </p>
            <p>
              7.2 Where these Terms conflict with a signed Owner Agreement, the Owner Agreement prevails for owner-specific matters.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8) CORPORATE BOOKINGS</h2>
            <p className="mb-2">
              8.1 Corporate clients may receive tailored terms (SLA, billing cycles, replacements).
            </p>
            <p>
              8.2 In case of conflict, the corporate agreement prevails for the specified bookings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9) INVESTOR PROGRAMS</h2>
            <p>
              Any investor wallet/financing/furnishing arrangements are governed by separate agreements and do not guarantee returns. Platform Terms apply only to Platform use.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10) PAYMENTS & CREDIT CARDS</h2>
            <p className="mb-2">
              10.1 Payments are processed by PayTabs over encrypted connections (e.g., TLS/SSL).
            </p>
            <p className="mb-2">
              10.2 We do not store full card details on our servers; the processor may be PCI DSS-compliant.
            </p>
            <p>
              10.3 You authorize us and/or the processor to charge your method of payment for bookings, deposits, add-ons, adjustments, and damage charges permitted under these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11) OPTIONAL TOOLS & THIRD-PARTY LINKS</h2>
            <p className="mb-2">
              11.1 We may provide access to third-party tools "as is" and "as available," without warranties or endorsements.
            </p>
            <p>
              11.2 Third-party websites, content, or services are not under our control; review their policies carefully. We are not liable for third-party acts or omissions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12) USER CONTENT, REVIEWS & LICENSE</h2>
            <p className="mb-2">
              12.1 By submitting reviews, photos, or comments ("User Content"), you grant VENVL a worldwide, royalty-free, non-exclusive, sublicensable license to use, reproduce, modify, publish, translate, and display such content for Platform operation and marketing, subject to our{" "}
              <Link to="/privacy-policy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
            <p>
              12.2 You must not post unlawful, defamatory, obscene, infringing, or misleading content, or upload malware. We may remove or moderate content at our discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13) INTELLECTUAL PROPERTY & PLATFORM LICENSE</h2>
            <p className="mb-2">
              13.1 The Platform, brand, software, designs, text, images, and content are owned by or licensed to VENVL.
            </p>
            <p>
              13.2 We grant you a limited, revocable, non-exclusive, non-transferable license to access and use the Platform strictly in accordance with these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14) PRIVACY & COOKIES</h2>
            <p>
              Your submission of personal information via the Platform is governed by our{" "}
              <Link to="/privacy-policy" className="text-primary hover:underline">
                Privacy Policy
              </Link>{" "}
              and Cookie Policy available on the Platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15) ACCURACY, AVAILABILITY & CHANGES</h2>
            <p className="mb-2">
              15.1 Information on the Platform is provided for general guidance and may not always be current, complete, or error-free.
            </p>
            <p>
              15.2 We may modify, suspend, or discontinue any part of the Platform or services at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">16) PROHIBITED USES</h2>
            <p>
              You may not use the Platform or its content to: (a) violate any applicable laws; (b) infringe intellectual-property or privacy rights; (c) harass, defame, or discriminate; (d) transmit malware or harmful code; (e) scrape or mine data without permission; (f) misrepresent your identity; (g) circumvent security; (h) engage in obscene or immoral activities; (i) collect others' personal data unlawfully.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">17) DISCLAIMER OF WARRANTIES</h2>
            <p>
              The Platform and services are provided "as is" and "as available" without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, and non-infringement. We do not warrant uninterrupted, error-free, or secure access, or that defects will be corrected.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">18) LIMITATION OF LIABILITY</h2>
            <p>
              To the maximum extent permitted by law, VENVL, its affiliates, officers, employees, agents, suppliers, and licensors shall not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages; or loss of profits, data, goodwill, or revenue, arising from or related to your use of the Platform or services. In all cases, our aggregate liability shall be limited to the total amounts paid by you for the booking giving rise to the claim (or EGP 10,000, whichever is lower), except where liability cannot be limited by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">19) INDEMNIFICATION</h2>
            <p>
              You agree to indemnify and hold harmless VENVL and affiliates, officers, employees, and agents from any claims, damages, liabilities, and expenses (including reasonable legal fees) arising out of your breach of these Terms, misuse of the Platform, or violation of law or third-party rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">20) TERMINATION & SUSPENSION</h2>
            <p>
              We may suspend or terminate your access immediately if you breach these Terms, cause security or legal risks, or engage in fraud/abuse. Amounts due up to termination remain payable. Sections intended to survive (e.g., IP, limitations, indemnities) shall survive termination.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">21) SEVERABILITY</h2>
            <p>
              If any provision is held unlawful or unenforceable, it shall be enforced to the maximum extent permitted, and the remaining provisions will remain in full force.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">22) ENTIRE AGREEMENT; NO WAIVER</h2>
            <p>
              These Terms, together with the Policies and any specific booking or owner/corporate/investor agreements, constitute the entire agreement between you and VENVL. Failure to enforce any provision is not a waiver.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">23) GOVERNING LAW & DISPUTE RESOLUTION</h2>
            <p>
              These Terms are governed by the laws of Egypt. Unless otherwise agreed in writing, disputes are subject to the exclusive jurisdiction of the competent courts in Cairo (including the Economic Courts). Parties may agree to arbitration administered by a recognized center in Cairo; if so, that agreement will prevail.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">24) CHANGES TO THESE TERMS</h2>
            <p>
              You can review the most current version on this page. We may update these Terms at our discretion by posting updates. Your continued use after posting constitutes acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">25) CONTACT</h2>
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
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
