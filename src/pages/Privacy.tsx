import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { useEffect } from "react";

export default function Privacy() {
  const navigate = useNavigate();

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-8 hover:bg-slate-800"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="bg-slate-900 border-slate-700 p-8">
          <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>

          <div className="text-slate-300 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">1. Introduction</h2>
              <p>
                Invelix ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services, including all related features and functionalities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">2. Information We Collect</h2>
              <p>We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>Personal Data:</strong> Name, email address, phone number, billing address, payment information</li>
                <li><strong>Business Data:</strong> Company name, GST number, business type, location</li>
                <li><strong>Usage Data:</strong> Pages visited, time spent on pages, referring/exit pages, operating system, device information</li>
                <li><strong>Transaction Data:</strong> Invoice records, product information, payment history</li>
                <li><strong>Communication Data:</strong> Messages sent through our contact forms or customer support</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">3. Use of Your Information</h2>
              <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Provide, operate, and maintain our services</li>
                <li>Improve, personalize, and expand our services</li>
                <li>Understand and analyze how you use our services</li>
                <li>Develop new features, products, and services</li>
                <li>Communicate with you, including customer support</li>
                <li>Process transactions and send related information</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Detect and prevent fraudulent transactions and other illegal activities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">4. Disclosure of Your Information</h2>
              <p>We may share information we have collected about you in certain situations:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>By Law or to Protect Rights:</strong> When required by law or when we believe in good faith that disclosure is necessary to protect our rights, your safety, or the safety of others</li>
                <li><strong>Third-Party Service Providers:</strong> We may share your information with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf</li>
                <li><strong>Business Transfers:</strong> If Invelix is involved in a merger, acquisition, or asset sale, your information may be transferred</li>
                <li><strong>With Your Consent:</strong> We may disclose your information with your prior consent for any other purpose</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">5. Security of Your Information</h2>
              <p>
                We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that no security measures are perfect or impenetrable. We cannot guarantee the absolute security of your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">6. Cookies and Tracking Technologies</h2>
              <p>
                We use cookies, web beacons, and similar tracking technologies to track activity on our Site and hold certain information. Cookies are files with a small amount of data that may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. If you do not accept cookies, however, you may not be able to use portions of our Site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">7. Third-Party Websites</h2>
              <p>
                The Site may contain links to third-party websites and applications that are not operated by Invelix. This Privacy Policy does not apply to third-party websites and applications, and we are not responsible for their privacy practices. We encourage you to review the privacy policies of third-party websites and applications before providing your information or using these services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">8. Contact Us and Your Rights</h2>
              <p>
                If you have questions or comments about this Privacy Policy, please contact us at:
              </p>
              <div className="mt-4 space-y-2">
                <p><strong>Email:</strong> privacy@invelix.com</p>
                <p><strong>Address:</strong> Invelix Support Team</p>
                <p className="text-sm text-slate-400 mt-4">
                  You have the right to access, update, or delete your personal information at any time by logging into your account or contacting us directly.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">9. Changes to This Privacy Policy</h2>
              <p>
                We reserve the right to make changes to this Privacy Policy at any time and for any reason. We will alert you about any changes by updating the "Last Updated" date of this Privacy Policy. Any changes or modifications will be effective immediately upon posting the updated Privacy Policy on the Site, and you waive the right to receive specific notice of each such change or modification.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">10. CCPA Privacy Rights</h2>
              <p>
                If you are a California resident, you are entitled to learn about the categories of personal information which we collect and the purposes for which we use the information. In addition, California consumers have the following rights:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The right to know what personal information is collected</li>
                <li>The right to know whether your personal information is sold or disclosed</li>
                <li>The right to say no to the sale or sharing of your personal information</li>
                <li>The right to delete personal information collected</li>
                <li>The right to non-discrimination for exercising your CCPA rights</li>
              </ul>
            </section>

            <div className="mt-12 pt-8 border-t border-slate-700">
              <p className="text-slate-400 text-sm">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
