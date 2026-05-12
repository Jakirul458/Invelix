import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-700 bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Invelix</h3>
            <p className="text-slate-400 text-sm">
              Your all-in-one invoice and inventory management solution for modern businesses.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="/auth" className="hover:text-white transition-colors">Sign In</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Get In Touch</h4>
            <div className="space-y-2 text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-cyan-400" />
                <a href="mailto:support@invelix.com" className="hover:text-white transition-colors">
                  support@invelix.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-cyan-400" />
                <a href="tel:+919876543210" className="hover:text-white transition-colors">
                  +91 98765 43210
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700 pt-8">
          <p className="text-center text-slate-400 text-sm">
            &copy; {currentYear} Invelix. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
