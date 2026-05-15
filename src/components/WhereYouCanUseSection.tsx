import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function WhereYouCanUseSection() {
  const navigate = useNavigate();

  const shopCategories = [
    { id: 1, icon: "🎁", name: "Gift Shop" },
    { id: 2, icon: "📱", name: "Mobile Shop" },
    { id: 3, icon: "🔌", name: "Mobile Accessories" },
    { id: 4, icon: "⚡", name: "Electric Shop" },
    { id: 5, icon: "💻", name: "Electronics Shop" },
    { id: 6, icon: "🏭", name: "Wholesale" },
    { id: 7, icon: "🛍️", name: "Retail Shop" },
    { id: 8, icon: "🌐", name: "E-Commerce" },
    { id: 9, icon: "👕", name: "Clothes Shop" },
    { id: 10, icon: "💊", name: "Medicine Shop" },
    { id: 11, icon: "📦", name: "Distributor" },
    { id: 12, icon: "🏢", name: "Any Business" }
  ];

  // Duplicate the array for seamless loop
  const duplicatedCategories = [...shopCategories, ...shopCategories];

  return (
    <section className="scroll-mt-20 py-20 px-4 border-t border-cyan-400/20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Where You Can Use Invelix?</h2>
          <p className="text-lg text-slate-300">Perfect for all types product base businesses and enterprises</p>
        </div>
        
        <div className="relative overflow-hidden mb-8">
          <div className="flex gap-4 animate-scroll-infinite">
            {duplicatedCategories.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="flex-shrink-0 w-64"
              >
                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg p-6 border border-cyan-400/30 hover:border-cyan-400/60 transition-all duration-300 text-center hover:scale-105 group cursor-pointer hover:-translate-y-1">
                  <div className="text-4xl mb-3 group-hover:scale-125 transition-transform duration-300">{item.icon}</div>
                  <h3 className="text-white font-semibold text-sm group-hover:text-cyan-300 transition-colors">{item.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scroll-infinite {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll-infinite {
          animation: scroll-infinite 20s linear infinite;
        }

        .animate-scroll-infinite:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}