import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const PrivacyPolicy = () => {
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
          <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>
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
            <h2 className="text-2xl font-semibold mb-4">1) Scope & Purpose</h2>
            <p className="mb-4">
              This Privacy Policy explains how VENVL ("we", "us", "our") collects, uses, discloses, and safeguards personal information through our website, mobile app, and related services (the "Platform"). It applies to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Guests/tenants booking short-, monthly-, or long-term stays,</li>
              <li>Owners partnering with VENVL for property management,</li>
              <li>Corporate clients,</li>
              <li>Investors using VENVL programs,</li>
              <li>Visitors browsing the Platform.</li>
            </ul>
            <p>By using the Platform, you consent to this Policy.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2) The Data We Collect</h2>
            <p className="mb-4">We collect only what we need to deliver a consistent, high-quality, and secure experience.</p>

            <h3 className="text-xl font-semibold mb-3">2.1 Directly from you</h3>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li><strong>Identification:</strong> name, email, phone, nationality, ID/passport details (where KYC is required).</li>
              <li><strong>Account & booking:</strong> check-in/out dates, preferences, special requests.</li>
              <li><strong>Payment details:</strong> amounts, billing info; we do not store full card numbers.</li>
              <li><strong>Owner/Property:</strong> ownership proofs, contracts, unit photos/specs.</li>
              <li><strong>Corporate & investor docs:</strong> company data, authorized signatories (as needed).</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">2.2 Automatically from devices</h3>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li><strong>Technical data:</strong> IP address, device identifiers, OS/app version, log files.</li>
              <li><strong>Cookies/SDKs:</strong> for essential functions, analytics, and (with consent) marketing.</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">2.3 From third parties</h3>
            <p>Payment processors, identity/AML/KYC vendors, security and support providers, and channel partners — only as necessary.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3) Why We Use Your Data (Purposes) & Legal Bases</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Provide and operate the Platform</strong> (create accounts, manage bookings, owner dashboards). (Contract)</li>
              <li><strong>Process payments and refunds</strong> via secure third-party processors. (Contract/Legal obligation)</li>
              <li><strong>Customer support</strong> (24/7 where available), service notifications. (Contract/Legitimate interest)</li>
              <li><strong>Property management operations</strong> (cleaning, maintenance, inspections, access control). (Legitimate interest/Contract)</li>
              <li><strong>Fraud prevention, security & compliance</strong> (ID checks, AML, sanctions screening where applicable). (Legal obligation/Legitimate interest)</li>
              <li><strong>Improve and personalize services</strong> (analytics, A/B testing). (Legitimate interest/Consent where required)</li>
              <li><strong>Marketing communications</strong> with easy opt-out. (Consent/Legitimate interest)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4) Cookies & Similar Technologies</h2>
            <p className="mb-2">We use:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li><strong>Essential cookies</strong> for login, checkout, and security,</li>
              <li><strong>Analytics</strong> to improve performance,</li>
              <li><strong>Marketing</strong> (only with consent).</li>
            </ul>
            <p>Manage preferences via our Cookie Settings or your browser.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5) Payments & Credit Cards</h2>
            <p>
              Payments are processed by PayTabs over encrypted connections (e.g., TLS/SSL). We do not store full credit/debit card numbers on our servers. Processor-side security complies with applicable standards (e.g., PCI DSS by the processor).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6) Sharing Your Data</h2>
            <p className="mb-4">We do not sell personal data. We share it only with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Service providers</strong> (payments, KYC, hosting, analytics, messaging, maintenance, insurance) under contracts that restrict use to our instructions,</li>
              <li><strong>Building/security partners</strong> for access management and compliance,</li>
              <li><strong>Professional advisers</strong> (legal, audit, insurance),</li>
              <li><strong>Authorities</strong> when required by law or to protect rights/safety,</li>
              <li><strong>Corporate booking contacts</strong> when arranged by your employer, strictly for booking administration.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7) International Transfers</h2>
            <p>
              Where data is transferred outside Egypt, we use appropriate safeguards (e.g., contractual clauses) and limit access to what's necessary.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8) Data Retention</h2>
            <p>
              We keep personal data only as long as needed for the purposes above and to meet legal, tax, and accounting requirements. When no longer required, we delete or anonymize it safely.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9) Security</h2>
            <p>
              We apply technical and organizational measures such as encryption in transit, access controls, network segregation, and regular reviews. No system is 100% secure; report any suspected incident to{" "}
              <a href="mailto:support@venvl.com" className="text-primary hover:underline">
                support@venvl.com
              </a>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10) Your Choices & Rights</h2>
            <p className="mb-4">Subject to applicable laws, you may:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Access a copy of your data,</li>
              <li>Correct inaccurate or incomplete data,</li>
              <li>Delete data where no longer needed,</li>
              <li>Restrict or object to certain processing,</li>
              <li>Withdraw consent where processing relies on consent,</li>
              <li>Port data where technically feasible.</li>
            </ul>
            <p>
              Use the in-app Privacy Center or contact{" "}
              <a href="mailto:support@venvl.com" className="text-primary hover:underline">
                support@venvl.com
              </a>
              . We'll respond within the legally required time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11) Marketing Preferences</h2>
            <p>
              You can unsubscribe from marketing emails/SMS at any time via the link in messages or in your profile settings. Operational messages (e.g., booking confirmations) will still be sent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12) Children's Data</h2>
            <p>
              Our Platform is not intended for children under 18. We do not knowingly collect children's data. If you believe a minor provided data, contact us to remove it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13) Owner, Corporate & Investor Specifics</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Owners:</strong> we process property docs, payments, and performance reports for management and payouts.</li>
              <li><strong>Corporate clients:</strong> we process business contact details and booking rosters under the corporate agreement.</li>
              <li><strong>Investors:</strong> we may process identity, eligibility, and participation records; investment returns are not guaranteed and are subject to separate agreements.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14) Third-Party Links</h2>
            <p>
              The Platform may link to third-party sites or apps. Their privacy practices are their own — please review their policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15) Changes to this Policy</h2>
            <p>
              We may update this Policy from time to time. The Effective Date shows the latest version. Material changes will be notified on the Platform and/or by email.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">16) How to Contact Us</h2>
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

export default PrivacyPolicy;
