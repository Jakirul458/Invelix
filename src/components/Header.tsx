import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const scrollToAbout = () => {
    navigate("/about");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    setMobileMenuOpen(false);
  };

  const scrollToHome = () => {
    navigate("/");

    setTimeout(() => {
      const element = document.getElementById("home");
      element?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    setMobileMenuOpen(false);
  };
  
  const scrollToContact = () => {
  navigate("/contact");
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  setMobileMenuOpen(false);
};

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b border-slate-700 bg-slate-900/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={scrollToHome}
          >
            <div className="h-10 w-10 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src="/favicon.png"
                alt="Invelix Logo"
                className="h-full w-full object-cover"
              />
            </div>

            <span className="font-bold text-lg hidden sm:inline text-white">
              Invelix
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={scrollToHome}
              className="text-slate-300 hover:text-cyan-400 transition-colors duration-300 text-sm font-medium"
            >
              Home
            </button>

            <button
              onClick={scrollToAbout}
              className="text-slate-300 hover:text-cyan-400 transition-colors duration-300 text-sm font-medium"
            >
              About
            </button>

            <button
              onClick={scrollToContact}
              className="text-slate-300 hover:text-cyan-400 transition-colors duration-300 text-sm font-medium"
            >
              Contact
            </button>

            <Button
              onClick={() => handleNavigation("/auth")}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-none hover:text-white animate-pulse-glow"
            >
              {user ? "Dashboard" : "Login"}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-300 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2 border-t border-slate-700 pt-4">
            <button
              onClick={scrollToHome}
              className="block w-full text-left px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors text-sm font-medium"
            >
              Home
            </button>

            <button
              onClick={scrollToAbout}
              className="block w-full text-left px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors text-sm font-medium"
            >
              About
            </button>

            <button
              onClick={scrollToContact}
              className="block w-full text-left px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors text-sm font-medium"
            >
              Contact
            </button>

            <Button
              onClick={() => handleNavigation("/auth")}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-none hover:text-white animate-pulse-glow text-sm"
            >
              {user ? "Dashboard" : "Login"}
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}