import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface ShopCategory {
  id: number;
  name: string;
  icon: string;
  features: string[];
  description: string;
}

const shopCategories: ShopCategory[] = [
  {
    id: 1,
    name: "Gift Shop",
    icon: "🎁",
    description: "Manage gift inventory, orders, and customer tracking",
    features: ["Inventory Management", "Order Tracking", "Customer Database"]
  },
  {
    id: 2,
    name: "Mobile Shop",
    icon: "📱",
    description: "Handle phone inventory, specifications, and sales",
    features: ["Stock Management", "Model Tracking", "Sales Analytics"]
  },
  {
    id: 3,
    name: "Mobile Accessories Shop",
    icon: "🔌",
    description: "Organize accessories catalog and quick invoicing",
    features: ["Catalog Management", "Quick Orders", "Barcode Support"]
  },
  {
    id: 4,
    name: "Electric Shop",
    icon: "⚡",
    description: "Manage electrical products and warranty tracking",
    features: ["Product Variants", "Warranty Management", "Invoice Generation"]
  },
  {
    id: 5,
    name: "Electronics Shop",
    icon: "💻",
    description: "Complete electronics store management solution",
    features: ["Multi-category Support", "GST Compliance", "Profit Analysis"]
  },
  {
    id: 6,
    name: "Wholesale",
    icon: "🏭",
    description: "Bulk order management and inventory control",
    features: ["Bulk Pricing", "Batch Management", "Payment Tracking"]
  },
  {
    id: 7,
    name: "Retail Shop",
    icon: "🛍️",
    description: "Point of sale and retail inventory solutions",
    features: ["POS Integration", "Real-time Inventory", "Daily Reports"]
  },
  {
    id: 8,
    name: "E-Commerce",
    icon: "🌐",
    description: "Online store order and inventory management",
    features: ["Multi-channel Support", "Automated Invoicing", "Shipping Integration"]
  },
  {
    id: 9,
    name: "Clothes Shop",
    icon: "👕",
    description: "Fashion retail with size and color variants",
    features: ["Size Management", "Color Variants", "Fashion Analytics"]
  },
  {
    id: 10,
    name: "Medicine Shop",
    icon: "💊",
    description: "Pharmacy management with expiry tracking",
    features: ["Expiry Tracking", "Batch Management", "GST Compliance"]
  },
  {
    id: 11,
    name: "Wholesale Distributor",
    icon: "📦",
    description: "Large-scale distribution network management",
    features: ["Multi-location Support", "Distributor Tracking", "Bulk Analytics"]
  },
  {
    id: 12,
    name: "Any Business",
    icon: "🏢",
    description: "Generic business invoice and inventory solution",
    features: ["Custom Categories", "Flexible Pricing", "Easy Setup"]
  }
];

export default function WhereYouCanUse() {
  const navigate = useNavigate();
  const [animatedCards, setAnimatedCards] = useState<Set<number>>(new Set());

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Animate cards one by one with staggered delay on page load
    const timeouts: NodeJS.Timeout[] = [];
    
    shopCategories.forEach((category, index) => {
      const timeout = setTimeout(() => {
        setAnimatedCards(prev => new Set([...prev, category.id]));
      }, index * 80); // 80ms stagger between each card
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
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
              Where You Can Use Invelix?
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Invelix is designed for all types of businesses. Whether you run a small retail shop or manage a large wholesale operation, Invelix has the tools you need to succeed.
          </p>
        </div>

        {/* Shop Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 overflow-hidden">
          {shopCategories.map((category) => (
            <div
              key={category.id}
              className={`transform transition-all duration-700 ease-out ${
                animatedCards.has(category.id)
                  ? "translate-x-0 opacity-100"
                  : "translate-x-full opacity-0"
              }`}
            >
              <div className="h-full bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl p-8 border border-cyan-400/30 hover:border-cyan-400/60 transition-all duration-300 group hover:shadow-lg hover:shadow-cyan-500/20 cursor-pointer hover:scale-105 hover:-translate-y-1">
                {/* Icon */}
                <div className="text-6xl mb-4 transform group-hover:scale-125 transition-transform duration-300">
                  {category.icon}
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                  {category.name}
                </h3>

                {/* Description */}
                <p className="text-slate-300 text-sm mb-4">
                  {category.description}
                </p>

                {/* Features */}
                <div className="space-y-2">
                  {category.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-center text-slate-300 text-sm"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-3" />
                      {feature}
                    </div>
                  ))}
                </div>

                {/* Button */}
                <button className="mt-6 w-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/40 hover:to-blue-500/40 text-cyan-300 hover:text-cyan-100 font-semibold py-2 px-4 rounded-lg transition-all duration-300 border border-cyan-400/50 hover:border-cyan-400">
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-8 py-16 border-t border-cyan-400/20">
          <h2 className="text-4xl font-bold text-white">
            Ready to get started?
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Join thousands of businesses using Invelix to manage their operations efficiently. Start your free account today.
          </p>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0 px-12 py-3 text-lg rounded-lg font-semibold transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-cyan-500/50"
          >
            Create Your Account
          </Button>
        </div>
      </div>
    </div>
  );
}
