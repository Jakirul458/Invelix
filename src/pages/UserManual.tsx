import { useEffect, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function UserManual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Neural Network Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, raf = 0;
    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COUNT = Math.min(90, Math.floor((window.innerWidth * window.innerHeight) / 18000));
    const nodes = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.6 + 0.6,
    }));

    const mouse = { x: -9999, y: -9999 };
    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener("mousemove", onMove);

    const tick = () => {
      ctx.clearRect(0, 0, w, h);

      // Update + draw nodes
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        // Pull toward mouse slightly
        const dx = mouse.x - n.x, dy = mouse.y - n.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 160) {
          n.vx += (dx / dist) * 0.02;
          n.vy += (dy / dist) * 0.02;
          n.vx = Math.max(-1.2, Math.min(1.2, n.vx));
          n.vy = Math.max(-1.2, Math.min(1.2, n.vy));
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "hsla(180, 100%, 70%, 0.9)";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "hsla(180, 100%, 50%, 0.8)";
        ctx.fill();
      }

      // Draw connections
      ctx.shadowBlur = 0;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < 130) {
            const alpha = (1 - d / 130) * 0.35;
            ctx.strokeStyle = `hsla(190, 100%, 60%, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        // Mouse line
        const mdx = nodes[i].x - mouse.x, mdy = nodes[i].y - mouse.y;
        const md = Math.hypot(mdx, mdy);
        if (md < 180) {
          ctx.strokeStyle = `hsla(280, 100%, 70%, ${(1 - md / 180) * 0.5})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden flex flex-col">
      {/* Neural Network Background Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />

      {/* Animated Gradient Overlays */}
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,255,255,0.08),transparent_40%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1">
        <Header />

        {/* User Manual Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-1">
          {/* Header */}
          <div className="mb-16">
            <h1 className="text-5xl sm:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,255,255,0.3)]">
                User Manual
              </span>
            </h1>
            <p className="text-slate-300 text-lg">
              Learn how to use Invelix to manage your business operations efficiently.
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-8 text-slate-300">
            {/* Getting Started Section */}
            <section className="bg-slate-800/50 backdrop-blur rounded-lg p-8 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300">
              <h2 className="text-2xl font-semibold text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text mb-4">Getting Started</h2>
              <div className="space-y-3">
                <p>
                  Welcome to Invelix! This guide will help you get started with managing your business invoices, products, and subscriptions.
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Sign up or log in to your account</li>
                  <li>Complete your profile in Settings</li>
                  <li>Add your products to the Products section</li>
                  <li>Create your first invoice</li>
                </ol>
              </div>
            </section>

            {/* Dashboard Section */}
            <section className="bg-slate-800/50 backdrop-blur rounded-lg p-8 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300">
              <h2 className="text-2xl font-semibold text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text mb-4">Dashboard</h2>
              <p className="mb-3">
                Your dashboard is your command center. Here you can:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>View your business statistics and metrics</li>
                <li>Access quick links to all main features</li>
                <li>Monitor your subscription status</li>
                <li>See recent activities</li>
              </ul>
            </section>

            {/* Products Section */}
            <section className="bg-slate-800/50 backdrop-blur rounded-lg p-8 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300">
              <h2 className="text-2xl font-semibold text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text mb-4">Managing Products</h2>
              <p className="mb-3">
                Products are the items or services you offer. To manage products:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Navigate to the Products section</li>
                <li>Click "Add Product" to create a new product</li>
                <li>Fill in product details including name, price, and description</li>
                <li>Edit or delete products as needed</li>
                <li>Assign HSN/SAC codes for tax compliance</li>
              </ul>
            </section>

            {/* Invoices Section */}
            <section className="bg-slate-800/50 backdrop-blur rounded-lg p-8 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300">
              <h2 className="text-2xl font-semibold text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text mb-4">Creating Invoices</h2>
              <p className="mb-3">
                Invoices are essential for tracking your sales. To create an invoice:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Go to Invoices section and click "New Invoice"</li>
                <li>Select customer details or add a new customer</li>
                <li>Add line items from your products</li>
                <li>Review tax calculations and totals</li>
                <li>Generate QR codes and barcodes</li>
                <li>Export as PDF for printing or sharing</li>
              </ul>
            </section>

            {/* Subscription Section */}
            <section className="bg-slate-800/50 backdrop-blur rounded-lg p-8 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300">
              <h2 className="text-2xl font-semibold text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text mb-4">Subscription & Billing</h2>
              <p className="mb-3">
                Manage your Invelix subscription:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>View your current subscription plan and features</li>
                <li>Upgrade to premium plans for additional features</li>
                <li>Download invoices for your subscription</li>
                <li>Manage billing information in Settings</li>
              </ul>
            </section>

            {/* Settings Section */}
            <section className="bg-slate-800/50 backdrop-blur rounded-lg p-8 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300">
              <h2 className="text-2xl font-semibold text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text mb-4">Settings</h2>
              <p className="mb-3">
                Customize your Invelix experience:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Update your business information</li>
                <li>Configure invoice settings and templates</li>
                <li>Manage security and privacy preferences</li>
                <li>Set up payment methods</li>
                <li>Change your password</li>
              </ul>
            </section>

            {/* Tips & Tricks Section */}
            <section className="bg-slate-800/50 backdrop-blur rounded-lg p-8 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300">
              <h2 className="text-2xl font-semibold text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text mb-4">Tips & Tricks</h2>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Use keyboard shortcuts to speed up invoice creation</li>
                <li>Bulk upload products to save time</li>
                <li>Utilize invoice templates for consistency</li>
                <li>Enable GST compliance for tax calculations</li>
                <li>Generate reports for business analytics</li>
              </ul>
            </section>

            {/* Support Section */}
            <section className="bg-slate-800/50 backdrop-blur rounded-lg p-8 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300">
              <h2 className="text-2xl font-semibold text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text mb-4">Need Help?</h2>
              <p className="mb-3">
                If you need assistance:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Check our FAQ section for common questions</li>
                <li>Contact our support team</li>
                <li>Visit our documentation for detailed guides</li>
              </ul>
            </section>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
