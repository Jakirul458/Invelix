import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FAQ from "@/pages/FAQ";
import AboutSection from "@/components/AboutSection";
import WhereYouCanUseSection from "@/components/WhereYouCanUseSection";
import { useEffect, useRef } from "react";

export default function Home() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
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

                {/* Hero Section */}
                <section
                    id="home"
                    className="scroll-mt-20 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 flex items-center justify-center w-full"
                >
                    <div className="text-center space-y-8 w-full flex flex-col items-center justify-center">
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold">
                            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,255,255,0.3)]">
                                Invoice Management
                            </span>
                            <br />
                            <span className="text-white">Made Simple</span>
                        </h1>
                        <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                            Create professional invoices, manage products, track payments, and generate barcodes all in one place. Perfect for your businesses and entrepreneurs.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <Button
                                onClick={() => navigate("/auth")}
                                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0 px-8 py-3 text-lg rounded-lg font-semibold transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-cyan-500/50"
                            >
                                {user ? "Go to Dashboard" : "Get Started"}
                            </Button>
                            <Button
                                onClick={() => navigate("/about")}
                                variant="outline"
                                className="bg-transparent border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/10 hover:text-white px-8 py-3 text-lg rounded-lg font-semibold transition-all duration-300 transform hover:scale-110 active:scale-95"
                            >
                                Learn More
                            </Button>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-4">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <h2 className="text-4xl font-bold text-white">Ready to streamline your business?</h2>
                        <p className="text-lg text-slate-300">
                            Start managing your invoices and inventory with Invelix today. It's free to get started!
                        </p>
                        <Button
                            onClick={() => navigate("/auth")}
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0 px-12 py-3 text-lg rounded-lg font-semibold transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-cyan-500/50"
                        >
                            Start Free Now
                        </Button>
                    </div>
                </section>

                {/* About Section */}
                <AboutSection />

                {/* Where You Can Use Section */}
                <WhereYouCanUseSection />

                {/* FAQ Section */}
                <FAQ />

                {/* Footer */}
                <footer className="border-t border-cyan-400/20 bg-black/50 mt-auto">
                    <Footer />
                </footer>
            </div>
        </div>
    );
}

