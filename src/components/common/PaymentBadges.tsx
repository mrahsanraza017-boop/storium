import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';

export const PaymentBadges: React.FC<{ className?: string; showRapidBadge?: boolean }> = ({
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>

      {/* Visa */}
      <div className="px-2.5 py-1 rounded-lg bg-[#0F172A] border border-blue-900/50 text-blue-400 font-extrabold text-[11px] tracking-wider italic">
        VISA
      </div>

      {/* MasterCard */}
      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#181A1F] border border-red-900/40 text-[11px] font-bold">
        <div className="flex -space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EB001B] inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#F79E1B]/90 inline-block" />
        </div>
        <span className="text-[#CBD0DC] ml-1 text-[10px]">Mastercard</span>
      </div>

      {/* PayPak */}
      <div className="px-2.5 py-1 rounded-lg bg-[#062419] border border-emerald-800/50 text-emerald-400 font-bold text-[10px] tracking-wider">
        PayPak
      </div>

      {/* 3D Secure / SSL */}
      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#121316] border border-[#262930] text-[#CBD0DC] text-[10px]">
        <Lock className="w-3 h-3 text-[#D4AF37]" />
        <span>3D Secure 256-Bit</span>
      </div>
    </div>
  );
};
