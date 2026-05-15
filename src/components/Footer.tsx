import { Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const scrollToHome = () => {
    navigate("/");

    setTimeout(() => {
      const element = document.getElementById("home");
      element?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const scrollToAbout = () => {
    navigate("/about");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const goToContact = () => {
    navigate("/contact");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="border-t border-slate-700 bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-white mb-2">
              Invelix
            </h3>

            <p className="text-slate-400 text-sm leading-relaxed">
              Your all-in-one invoice and inventory management solution
              for modern businesses.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">
              Quick Links
            </h4>

            <ul className="space-y-3 text-sm">
              <li>
                <button
                  onClick={scrollToHome}
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Home
                </button>
              </li>

              <li>
                <button
                  onClick={scrollToAbout}
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  About
                </button>
              </li>

              <li>
                <button
                  onClick={goToContact}
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Contact
                </button>
              </li>

              <li>
                <button
                  onClick={() => navigate("/terms-of-use")}
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Terms of Use
                </button>
              </li>

              <li>
                <button
                  onClick={() => navigate("/privacy")}
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Privacy Policy
                </button>
              </li>

              {/* <li>
                <button
                  onClick={() => navigate("/where-you-can-use")}
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Where You Can Use
                </button>
              </li> */}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">
              Get In Touch
            </h4>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-cyan-400" />

                <a
                  href="mailto:support@invelix.com"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  alpinewebs312@gmail.com
                </a>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-cyan-400" />

                <a
                  href="tel:+919876543210"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  +91 6294527072
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700 pt-8">
          <p className="text-center text-slate-400 text-sm">
            © {currentYear} Invelix. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}