import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

export default function TermsOfUse() {
  const navigate = useNavigate();

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
          <h1 className="text-4xl font-bold text-white mb-8">Terms of Use</h1>

          <div className="text-slate-300 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">1. Agreement to Terms</h2>
              <p>
                By accessing and using Invelix ("Service"), you accept and agree to be bound by the
                terms and provision of this agreement. If you do not agree to abide by the above, please
                do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">2. Use License</h2>
              <p>
                Permission is granted to temporarily download one copy of the materials (information or
                software) from Invelix for personal, non-commercial transitory viewing only. This is the
                grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Modifying or copying the materials</li>
                <li>Using the materials for any commercial purpose or for any public display</li>
                <li>Attempting to decompile or reverse engineer any software contained on the Service</li>
                <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
                <li>Removing or altering any copyright or other proprietary notices from the materials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">3. Disclaimer</h2>
              <p>
                The materials on Invelix are provided on an 'as is' basis. Invelix makes no warranties,
                expressed or implied, and hereby disclaims and negates all other warranties including,
                without limitation, implied warranties or conditions of merchantability, fitness for a
                particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">4. Limitations</h2>
              <p>
                In no event shall Invelix or its suppliers be liable for any damages (including, without
                limitation, damages for loss of data or profit, or due to business interruption) arising out
                of the use or inability to use the materials on Invelix, even if Invelix or an authorized
                representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">5. Accuracy of Materials</h2>
              <p>
                The materials appearing on Invelix could include technical, typographical, or photographic
                errors. Invelix does not warrant that any of the materials on the Service are accurate,
                complete, or current. Invelix may make changes to the materials contained on the Service at
                any time without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">6. Links</h2>
              <p>
                Invelix has not reviewed all of the sites linked to its website and is not responsible for
                the contents of any such linked site. The inclusion of any link does not imply endorsement by
                Invelix of the site. Use of any such linked website is at the user's own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">7. Modifications</h2>
              <p>
                Invelix may revise these terms of service for the website at any time without notice. By using
                this website, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">8. Governing Law</h2>
              <p>
                These terms and conditions are governed by and construed in accordance with the laws of India,
                and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">9. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Use, please contact us at:
              </p>
              <p className="mt-2">
                Email:{" "}
                <a
                  href="mailto:support@invelix.com"
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  alpinewebs312@gmail.com
                </a>
              </p>
            </section>

            <div className="border-t border-slate-700 pt-6 mt-8">
              <p className="text-sm text-slate-400">
                Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
