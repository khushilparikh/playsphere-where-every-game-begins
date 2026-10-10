"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { QRCodeSVG } from "qrcode.react";
import { CreditCard, Smartphone, Building, Wallet, X, CheckCircle, AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { PaymentOtpModal } from "@/components/payments/PaymentOtpModal";

interface DemoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (transactionId: string) => void;
  sessionToken: string;
  idempotencyKey: string;
  expiresAt: string;
  amount: number;
  upiLink: string | null;
}

export function DemoPaymentModal({ isOpen, onClose, onSuccess, sessionToken, idempotencyKey, expiresAt, amount, upiLink }: DemoPaymentModalProps) {
  const [activeTab, setActiveTab] = useState<"UPI" | "CARD" | "NETBANKING" | "WALLET">("CARD");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  
  // Card state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  
  // OTP Modal
  const [showOtp, setShowOtp] = useState(false);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [successTxId, setSuccessTxId] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const target = new Date(expiresAt).getTime();
    
    const tick = () => {
      const now = new Date().getTime();
      const diff = Math.floor((target - now) / 1000);
      if (diff <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
      } else {
        setTimeLeft(diff);
        setIsExpired(false);
      }
    };
    
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isOpen, expiresAt]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handlePayClick = () => {
    if (isExpired) return;
    setError("");
    
    if (activeTab === "CARD" || activeTab === "NETBANKING") {
      setShowOtp(true);
    } else {
      processPayment("123456"); // For wallet or auto-upi testing
    }
  };

  const processPayment = async (authCode: string) => {
    setShowOtp(false);
    setIsProcessing(true);
    setError("");

    try {
      const res = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          idempotencyKey,
          simulateFailure,
          authCode
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Payment failed");
      }

      setSuccessTxId(data.transactionId);
      setTimeout(() => {
        onSuccess(data.transactionId);
      }, 2000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  if (successTxId) {
    return (
      <Modal open={isOpen} onClose={() => {}} title="">
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">Payment Successful!</h2>
          <p className="text-slate-400">Transaction ID: {successTxId}</p>
          <p className="text-sm text-slate-500">Redirecting...</p>
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal open={isOpen} onClose={onClose} title="Secure Checkout">
        <div className="flex flex-col space-y-6">
          {/* Header & Timer */}
          <div className="flex flex-col space-y-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Order Summary</p>
                <p className="text-lg font-bold text-white tracking-wide">PlaySphere Checkout</p>
              </div>
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border ${timeLeft < 60 ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse" : "bg-slate-900/50 border-slate-700 text-slate-300"}`}>
                <ShieldCheck className="w-4 h-4" />
                <span className="font-mono text-sm">{formatTime(timeLeft)}</span>
              </div>
            </div>
            
            <div className="border-t border-slate-700/50 pt-3 flex justify-between items-end">
              <div>
                <p className="text-xs text-slate-400">Total Amount</p>
                <p className="text-3xl font-display text-volt mt-1">₹{amount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {isExpired && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start space-x-3 text-red-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Session Expired</p>
                <p className="opacity-80">This payment session has timed out. Please restart the checkout process.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex flex-col text-red-400 text-sm">
              <p className="font-semibold">Payment Failed</p>
              <p className="opacity-80">{error}</p>
            </div>
          )}

          {/* Dev Demo Controls */}
          <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl text-xs text-indigo-300">
            <span className="font-semibold">Demo Sandbox Controls:</span>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={simulateFailure} 
                onChange={(e) => setSimulateFailure(e.target.checked)}
                className="rounded border-indigo-500/50 text-indigo-500 bg-slate-900/50 focus:ring-indigo-500/30"
              />
              <span>Simulate Decline/Failure</span>
            </label>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 border-b border-slate-800">
            {[
              { id: "CARD", label: "Card", icon: CreditCard },
              { id: "UPI", label: "UPI/QR", icon: Smartphone },
              { id: "NETBANKING", label: "NetBanking", icon: Building },
              { id: "WALLET", label: "Wallet", icon: Wallet },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                disabled={isExpired}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-volt text-volt"
                    : "border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700"
                } ${isExpired ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[250px] relative">
            {isProcessing && (
              <div className="absolute inset-0 z-10 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
                <Loader2 className="w-8 h-8 text-volt animate-spin mb-4" />
                <p className="text-volt font-medium animate-pulse">Processing Payment...</p>
                <p className="text-xs text-slate-400 mt-2">Securing connection & verifying...</p>
              </div>
            )}

            {activeTab === "CARD" && (
              <div className="space-y-4">
                {/* 3D Glass Card Preview */}
                <div className="w-full h-48 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl p-6 border border-slate-600/50 shadow-xl relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                  
                  <div className="flex justify-between items-start z-10">
                    <div className="w-12 h-8 bg-yellow-600/60 rounded-md border border-yellow-500/30"></div>
                    <div className="text-xl font-bold text-white/50 italic tracking-wider">BANK</div>
                  </div>
                  
                  <div className="z-10 font-mono text-2xl tracking-[0.2em] text-white">
                    {cardNumber || "•••• •••• •••• ••••"}
                  </div>
                  
                  <div className="flex justify-between items-end z-10 font-mono text-sm text-slate-300">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Card Holder</div>
                      <div className="uppercase tracking-wider truncate max-w-[150px]">{cardName || "YOUR NAME"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Expires</div>
                      <div>{cardExpiry || "MM/YY"}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400">Card Number</label>
                    <input 
                      type="text" 
                      placeholder="0000 0000 0000 0000" 
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-volt"
                      disabled={isExpired}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Expiry (MM/YY)</label>
                    <input 
                      type="text" 
                      placeholder="MM/YY" 
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-volt"
                      disabled={isExpired}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">CVV</label>
                    <input 
                      type="password" 
                      placeholder="•••" 
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-volt"
                      disabled={isExpired}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400">Cardholder Name</label>
                    <input 
                      type="text" 
                      placeholder="Name on card" 
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-volt"
                      disabled={isExpired}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "UPI" && (
              <div className="flex flex-col items-center justify-center py-6 space-y-6">
                <div className="bg-white p-4 rounded-xl shadow-lg border-4 border-slate-800 relative overflow-hidden group">
                  {/* Laser Scan Animation */}
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-volt shadow-[0_0_8px_rgba(255,71,87,0.8)] animate-scan-laser pointer-events-none z-10 hidden group-hover:block"></div>
                  {upiLink ? (
                    <QRCodeSVG value={upiLink} size={160} level="H" />
                  ) : (
                    <div className="w-[160px] h-[160px] bg-slate-200 flex items-center justify-center">
                      <span className="text-xs text-slate-500">Generating QR...</span>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-slate-300 font-medium">Scan with any UPI App</p>
                  <div className="flex justify-center space-x-3 mt-4">
                    <div className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-400 border border-slate-700">GPay</div>
                    <div className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-400 border border-slate-700">PhonePe</div>
                    <div className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-400 border border-slate-700">Paytm</div>
                  </div>
                </div>
                
                <div className="w-full">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-slate-900 px-2 text-slate-500">Or enter UPI ID</span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <input 
                      type="text" 
                      placeholder="mobile@upi" 
                      className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-volt"
                      disabled={isExpired}
                    />
                    <button 
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
                      disabled={isExpired}
                      onClick={handlePayClick}
                    >
                      Verify
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "NETBANKING" && (
              <div className="space-y-4 pt-4">
                <p className="text-sm text-slate-400 mb-2">Select your bank</p>
                <div className="grid grid-cols-2 gap-3">
                  {["HDFC Bank", "SBI", "ICICI Bank", "Axis Bank", "Kotak", "Yes Bank"].map((bank) => (
                    <button 
                      key={bank}
                      onClick={handlePayClick}
                      disabled={isExpired}
                      className="flex items-center p-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:border-slate-600 transition-colors text-left"
                    >
                      <Building className="w-5 h-5 text-slate-400 mr-3" />
                      <span className="text-sm text-slate-200">{bank}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "WALLET" && (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <div className="w-16 h-16 rounded-full bg-volt/20 flex items-center justify-center mb-2">
                  <Wallet className="w-8 h-8 text-volt" />
                </div>
                <div className="text-center">
                  <p className="text-slate-400 text-sm">PlaySphere Wallet Balance</p>
                  <p className="text-3xl font-bold text-white mt-1">₹5,000</p>
                </div>
                <p className="text-sm text-slate-500">1-click instant checkout</p>
              </div>
            )}
          </div>

          <button
            onClick={handlePayClick}
            disabled={isExpired || isProcessing}
            className="w-full py-4 bg-volt hover:bg-volt-light text-slate-900 font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(132,204,22,0.3)]"
          >
            Pay ₹{amount.toLocaleString()} Now
          </button>
        </div>
      </Modal>

      {showOtp && (
        <PaymentOtpModal
          isOpen={showOtp}
          onClose={() => setShowOtp(false)}
          onSubmit={processPayment}
          amount={amount}
          merchant="PlaySphere Arena"
        />
      )}
    </>
  );
}
