"use client";

import { useState, useRef, useEffect } from "react";
import { ShieldCheck, Smartphone, RefreshCw, X } from "lucide-react";

interface PaymentOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (otp: string) => void;
  amount: number;
  merchant: string;
}

export function PaymentOtpModal({ isOpen, onClose, onSubmit, amount, merchant }: PaymentOtpModalProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Focus first input on mount
  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next
    if (value !== "" && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const newOtp = [...otp];
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i];
      }
      setOtp(newOtp);
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    onSubmit(fullOtp);
  };

  const fillDemoOtp = () => {
    setOtp(["1", "2", "3", "4", "5", "6"]);
    inputRefs.current[5]?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header - Bank UI Style */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-800">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span className="font-bold">3D Secure Verification</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Enter OTP</h3>
            <p className="text-sm text-slate-500 mt-1">
              We&apos;ve sent a One Time Password (OTP) to your registered mobile number ending in <span className="font-semibold text-slate-700">XXXX</span>.
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 mb-6 text-sm border border-slate-100 flex justify-between items-center">
            <span className="text-slate-500">Merchant</span>
            <span className="font-medium text-slate-800">{merchant}</span>
          </div>
          
          <div className="bg-slate-50 rounded-lg p-4 mb-6 text-sm border border-slate-100 flex justify-between items-center">
            <span className="text-slate-500">Amount</span>
            <span className="font-bold text-slate-800 text-lg">₹{amount.toLocaleString()}</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex justify-between gap-2 mb-6" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-12 text-center text-xl font-bold bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={otp.some(d => !d)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/30"
            >
              Submit & Pay
            </button>
          </form>
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between text-sm">
          {timeLeft > 0 ? (
            <span className="text-slate-500 flex items-center">
              Resend OTP in <span className="font-bold text-slate-700 ml-1">00:{timeLeft.toString().padStart(2, "0")}</span>
            </span>
          ) : (
            <button className="text-blue-600 font-medium flex items-center hover:underline">
              <RefreshCw className="w-4 h-4 mr-1" />
              Resend OTP
            </button>
          )}
          
          <button onClick={fillDemoOtp} className="text-slate-500 hover:text-slate-800 transition-colors underline decoration-dotted">
            Use Demo OTP (123456)
          </button>
        </div>
      </div>
    </div>
  );
}
