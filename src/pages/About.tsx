import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useEffect } from "react";

export default function About() {
  const navigate = useNavigate();

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-[-120px] left-1/3 w-[32rem] h-[32rem] bg-blue-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-12 hover:bg-slate-800/80 text-cyan-400 hover:text-cyan-300"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Why Choose Invelix?
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Everything you need to manage your business efficiently
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {[
            {
              title: "Easy Invoice Creation",
              description: "Create professional GST-ready invoices in seconds with automatic calculations",
              icon: "📄",
              features: ["Instant invoice generation", "GST compliance", "Auto calculations", "Multiple templates"]
            },
            {
              title: "Product Management",
              description: "Track inventory, manage pricing, and generate barcodes for all your products",
              icon: "📦",
              features: ["Real-time inventory", "Barcode generation", "Price management", "Stock tracking"]
            },
            {
              title: "Smart Analytics",
              description: "Get insights into sales, profits, and business metrics at a glance",
              icon: "📊",
              features: ["Sales insights", "Profit analysis", "Customer tracking", "Business reports"]
            },
            {
              title: "Payment Tracking",
              description: "Monitor and manage all payment transactions with detailed records",
              icon: "💰",
              features: ["Payment records", "Due tracking", "Payment status", "Financial reports"]
            },
            {
              title: "Multi-User Support",
              description: "Manage your business with multiple team members and roles",
              icon: "👥",
              features: ["User management", "Role-based access", "Team collaboration", "Activity logs"]
            },
            {
              title: "Cloud Storage",
              description: "Secure cloud storage for all your business data and documents",
              icon: "☁️",
              features: ["Secure backup", "Auto sync", "Data protection", "Anywhere access"]
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl p-8 border border-cyan-400/30 hover:border-cyan-400/60 transition-all duration-300 group hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-105"
            >
              <div className="text-6xl mb-4 transform group-hover:scale-125 transition-transform duration-300">
                {item.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                {item.title}
              </h3>
              <p className="text-slate-300 text-sm mb-4">
                {item.description}
              </p>
              <ul className="space-y-2">
                {item.features.map((feature, fidx) => (
                  <li key={fidx} className="flex items-center text-slate-300 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-3" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-8 py-16 border-t border-cyan-400/20">
          <h2 className="text-4xl font-bold text-white">
            Ready to transform your business?
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Join thousands of businesses already using Invelix to streamline their operations and boost productivity.
          </p>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0 px-12 py-3 text-lg rounded-lg font-semibold transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-cyan-500/50"
          >
            Start Free Now
          </Button>
        </div>
      </div>
    </div>
  );
}
