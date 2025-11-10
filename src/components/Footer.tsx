import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold mb-4">VENVL</h3>
            <p className="text-sm text-slate-400">
              Powered by Dlleni Real Estate Consultancy
            </p>
            <p className="text-sm text-slate-400">
              Premium rental properties in Egypt
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-sm hover:text-white transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/host/signup"
                  className="text-sm hover:text-white transition-colors"
                >
                  List Your Property
                </Link>
              </li>
              <li>
                <Link
                  to="/guest/signup"
                  className="text-sm hover:text-white transition-colors"
                >
                  Sign Up as Guest
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/legal/privacy-policy"
                  className="text-sm hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/legal/terms-and-conditions"
                  className="text-sm hover:text-white transition-colors"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  to="/legal/cancellation-refund-policy"
                  className="text-sm hover:text-white transition-colors"
                >
                  Cancellation & Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <a
                  href="mailto:support@venvl.com"
                  className="text-sm hover:text-white transition-colors"
                >
                  support@venvl.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <a
                  href="tel:+201005400050"
                  className="text-sm hover:text-white transition-colors"
                >
                  +20 100 540 0050
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  Building 238, Second Sector,<br />
                  Fifth Settlement, New Cairo
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">
              &copy; {new Date().getFullYear()} VENVL. All rights reserved.
            </p>
            <p className="text-sm text-slate-400">
              Operated by Dlleni Real Estate Consultancy
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
