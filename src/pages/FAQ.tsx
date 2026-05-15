import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";

interface FAQItem {
    question: string;
    answer: string;
}

const faqs: FAQItem[] = [
    {
        question: "What is Invelix?",
        answer: "Invelix is a comprehensive invoice and inventory management platform designed for businesses and entrepreneurs. It helps you create professional GST-ready invoices, manage products, track inventory, generate barcodes, and gain insights into your business performance—all in one place."
    },
    {
        question: "Is Invelix free to use?",
        answer: "Yes! Invelix offers a free tier to get you started with essential features including invoice creation, product management, and basic analytics. Premium features and advanced capabilities are available through our paid plans."
    },
    {
        question: "How do I create an invoice?",
        answer: "Creating an invoice is simple: navigate to the Dashboard, click 'Create Invoice', add your customer details, select products from your inventory, and the system will automatically calculate taxes and totals. You can then download, print, or share the invoice directly with your customers."
    },
    {
        question: "Does Invelix support GST compliance?",
        answer: "Absolutely! Invelix is built with GST compliance in mind. All invoices include proper GST calculations, tax breakdowns, and comply with Indian tax regulations. You can configure your GSTIN and tax rates in the settings."
    },
    {
        question: "Can I manage my product inventory?",
        answer: "Yes! Invelix includes a complete inventory management system. You can add products with details like name, SKU, price, stock quantity, and even generate barcodes. The system automatically updates inventory when you create invoices."
    },
    {
        question: "How does barcode generation work?",
        answer: "When you add a product, Invelix can automatically generate a unique barcode for it. You can download and print these barcodes to attach to your products. This makes inventory tracking and invoice creation faster and more accurate."
    },
    {
        question: "What analytics does Invelix provide?",
        answer: "Invelix offers smart analytics including total sales tracking, profit margins, top-selling products, customer insights, payment status reports, and monthly/yearly revenue trends. All data is presented in easy-to-understand charts and graphs."
    },
    {
        question: "Can I export or print invoices?",
        answer: "Yes! Every invoice can be downloaded as a PDF, printed directly, or shared via email. The invoices are professionally formatted and ready to send to your customers immediately."
    },
    {
        question: "Is my data secure?",
        answer: "Security is our top priority. All your data is encrypted and stored securely. We use industry-standard security protocols to ensure your business information, customer details, and financial records are protected."
    },
    {
        question: "Can I access Invelix on mobile devices?",
        answer: "Yes! Invelix is fully responsive and works seamlessly on smartphones, tablets, and desktop computers. You can manage your business on the go from any device with an internet connection."
    },
    {
        question: "How do I add customers to my account?",
        answer: "You can add customers while creating an invoice or manage them separately in the Customers section. Simply enter their name, contact details, address, and GSTIN (if applicable). The system saves customer information for future use."
    },
    {
        question: "What payment methods can I track?",
        answer: "Invelix allows you to track various payment methods including cash, UPI, bank transfer, cheque, and credit/debit cards. You can mark invoices as paid, partially paid, or pending, helping you keep track of outstanding payments."
    }
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const navigate = useNavigate();

    const toggleQuestion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section
            id="faq"
            className="scroll-mt-20 relative py-20 border-t border-cyan-400/20 overflow-hidden"
        >
            {/* Neural Glow Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-20 left-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
                <div
                    className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
                    style={{ animationDelay: "1.5s" }}
                />
                <div
                    className="absolute top-1/2 left-1/3 w-[28rem] h-[28rem] bg-blue-500/10 rounded-full blur-3xl animate-pulse"
                    style={{ animationDelay: "3s" }}
                />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center space-y-4 mb-12">
                    <h2 className="text-4xl sm:text-5xl font-bold text-white">
                        Frequently Asked{" "}
                        <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Questions
                        </span>
                    </h2>
                    <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                        Everything you need to know about Invelix. Can't find what you're looking for? Contact our support team.
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-xl border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300 overflow-hidden backdrop-blur-sm"
                        >
                            <button
                                onClick={() => toggleQuestion(index)}
                                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-cyan-500/5 transition-colors duration-200"
                            >
                                <span className="text-lg font-semibold text-white pr-4">
                                    {faq.question}
                                </span>
                                <ChevronDown
                                    className={`w-6 h-6 text-cyan-400 flex-shrink-0 transition-transform duration-300 ${
                                        openIndex === index ? "rotate-180" : ""
                                    }`}
                                />
                            </button>
                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                    openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                }`}
                            >
                                <div className="px-6 pb-5 pt-1">
                                    <p className="text-slate-300 leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contact CTA */}
                <div className="mt-12 text-center">
                    <p className="text-slate-300 mb-4">Still have questions?</p>
                    <button
                        onClick={() => navigate("/contact")}
                        className="inline-block bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-cyan-500/50 cursor-pointer"
                    >
                        Contact Support
                    </button>
                </div>
            </div>
        </section>
    );
}