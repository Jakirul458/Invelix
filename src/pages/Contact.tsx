import { useState, useRef, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send, MessageCircle } from "lucide-react";
import { Loader2 } from "lucide-react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  useEffect(() => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
  
}, []);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    const COUNT = Math.min(60, Math.floor((window.innerWidth * window.innerHeight) / 18000));
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

      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // For now, we'll just show success (you can integrate with your backend)
      // Example: send to your backend API
      
      setSuccess("Your message has been sent successfully! We'll get back to you within 24-48 hours.");
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError("Failed to send message. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    { 
      icon: Mail, 
      title: "Email", 
      detail: "alpinewebs312@gmail.com", 
      href: "mailto:alpinewebs312@gmail.com",
      color: "text-cyan-400" 
    },
    { 
      icon: Phone, 
      title: "Phone", 
      detail: "+91 6294527072", 
      href: "tel:+916294527072",
      color: "text-blue-400" 
    },
    { 
      icon: MapPin, 
      title: "Address", 
      detail: "kolkata, India", 
      href: "#",
      color: "text-purple-400" 
    }
    
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#020617] relative overflow-hidden">
      {/* Neural Network Background */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />
      
      {/* Gradient Overlays */}
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
      <div className="relative z-10">
        <Header />
        <main className="pt-24 pb-16 flex-1">
          <div className="container mx-auto px-4">
            {/* Page Header */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="text-white">Get In</span>{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(0,255,255,0.6)]">
                  Touch
                </span>
              </h1>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Have a question, suggestion, or want to collaborate? We'd love to hear from you!
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Contact Form */}
              <Card className="bg-black/25 backdrop-blur-2xl border border-cyan-400/20 transform transition-all duration-500 hover:scale-105">
                <CardContent className="p-8">
                  <div className="flex items-center space-x-3 mb-8">
                    <MessageCircle className="h-8 w-8 text-cyan-400" />
                    <h2 className="text-2xl font-bold text-white">Send us a message</h2>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Name *</label>
                        <Input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Your full name"
                          className="bg-slate-900/50 border-cyan-400/20 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="your.email@example.com"
                          className="bg-slate-900/50 border-cyan-400/20 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+91 9876543210"
                        className="bg-slate-900/50 border-cyan-400/20 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Subject *</label>
                      <Input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="What's this about?"
                        className="bg-slate-900/50 border-cyan-400/20 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Message *</label>
                      <Textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Tell us more about your inquiry..."
                        rows={6}
                        className="bg-slate-900/50 border-cyan-400/20 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20 resize-none"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0 font-semibold py-2 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-5 w-5" />
                          Send Message
                        </>
                      )}
                    </Button>

                    {/* Success / Error messages */}
                    {success && (
                      <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-center text-sm">
                        {success}
                      </div>
                    )}
                    {error && (
                      <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-center text-sm">
                        {error}
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <div className="space-y-8">
                <Card className="bg-black/25 backdrop-blur-2xl border border-cyan-400/20 transform transition-all duration-500 hover:scale-105">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold text-white mb-8">Contact Information</h2>
                    <div className="space-y-6">
                      {contactInfo.map((info, index) => {
                        const Icon = info.icon;
                        return (
                          <a
                            key={index}
                            href={info.href}
                            className="flex items-start space-x-4 group transform transition-all duration-300 hover:translate-x-2"
                          >
                            <div
                              className={`w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0 ${info.color} group-hover:scale-110 transition-transform duration-300`}
                            >
                              <Icon className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white mb-1">{info.title}</h3>
                              <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">
                                {info.detail}
                              </p>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Response Time Notice */}
                <Card className="bg-black/25 backdrop-blur-2xl border border-cyan-400/20">
                  <CardContent className="p-6">
                    <p className="text-slate-300 text-sm">
                      <strong className="text-cyan-400">Response Time:</strong> We typically respond to all inquiries within <strong>24-48 hours</strong>. For urgent matters, please mention "URGENT" in your subject line.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-black/50 border-t border-slate-700">
        <Footer />
      </footer>
    </div>
  );
};

export default Contact;
