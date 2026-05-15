import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TrialPopupProps {
  isOpen: boolean;
  fullName: string;
  onContinueTrial: () => void;
  onSubscribeNow: () => void;
}

export default function TrialPopup({
  isOpen,
  fullName,
  onContinueTrial,
  onSubscribeNow,
}: TrialPopupProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Welcome to Invelix</DialogTitle>
          <DialogDescription className="text-slate-300 text-base pt-4">
            <span className="block text-white font-semibold mb-3">{fullName ? `Hi ${fullName},` : "Hi,"}</span>
            <span className="block mb-4">
              You will get <span className="text-cyan-400 font-bold">14 days free trial access</span>. After the
              trial ends, you must purchase a subscription to continue.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 mt-4">
          <Button onClick={onContinueTrial} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white">
            Continue Free Trial
          </Button>
          <Button
            onClick={onSubscribeNow}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
          >
            Subscribe Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
