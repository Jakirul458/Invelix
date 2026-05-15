import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function AboutSection() {
  const navigate = useNavigate();

  return (
    <section id="about" className="scroll-mt-20 relative py-20 border-t border-cyan-400/20 overflow-hidden">
      {/* Neural Glow Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />

        <div
          className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />

        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-blue-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-12">
          <div>
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose Invelix?</h2>
            <p className="text-lg text-slate-300">Everything you need to manage your business efficiently</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                title: "Easy Invoice Creation",
                description: "Create professional GST-ready invoices in seconds with automatic calculations",
                icon: "📄"
              },
              {
                title: "Product Management",
                description: "Track inventory, manage pricing, and generate barcodes for all your products",
                icon: "📦"
              },
              {
                title: "Smart Analytics",
                description: "Get insights into sales, profits, and business metrics at a glance",
                icon: "📊"
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-8 border border-cyan-400/20 hover:border-cyan-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20"
              >
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-300 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
          <Button
            onClick={() => navigate("/about")}
            variant="outline"
            className="bg-transparent border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/10 hover:text-white px-8 py-3 text-lg rounded-lg font-semibold transition-all duration-300 transform hover:scale-110 active:scale-95"
          >
            View All Features
          </Button>
        </div>
      </div>
    </section>
  );
}
