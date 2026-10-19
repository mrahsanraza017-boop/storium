import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Truck, Clock, ShieldCheck, CheckCircle2, AlertCircle, Compass } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { CityDeliveryRule } from '../../types';

interface DeliveryEstimatorProps {
  productPrice?: number;
  className?: string;
}

export const DeliveryEstimator: React.FC<DeliveryEstimatorProps> = ({
  productPrice = 15000,
  className = '',
}) => {
  const { businessSettings } = useStore();
  const deliveryConfig = businessSettings.promotions?.deliveryEstimates;

  const [selectedCity, setSelectedCity] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('storium_user_city') || 'Lahore';
    }
    return 'Lahore';
  });

  const [customCityInput, setCustomCityInput] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && selectedCity) {
      localStorage.setItem('storium_user_city', selectedCity);
    }
  }, [selectedCity]);

  // If delivery estimation is globally disabled by admin
  if (deliveryConfig && deliveryConfig.enabled === false) {
    return (
      <div className={`p-4 rounded-2xl bg-[#121316] border border-[#262930] text-xs text-[#CBD0DC] flex items-center gap-3 ${className}`}>
        <Truck className="w-4 h-4 text-[#D4AF37] shrink-0" />
        <span>Estimated delivery times are currently being calibrated. All timepiece orders feature complimentary insured express transit with live courier tracking.</span>
      </div>
    );
  }

  // City rules from configuration
  const rules = deliveryConfig?.rules || [];

  // Match rule for current selected city
  const activeRule: CityDeliveryRule | undefined = useMemo(() => {
    return rules.find((r) => r.city.toLowerCase() === selectedCity.toLowerCase());
  }, [rules, selectedCity]);

  // Calculate estimated dates
  const estimateDates = useMemo(() => {
    const today = new Date();
    const minDays = activeRule ? activeRule.minDays : (deliveryConfig?.defaultMinDays || 2);
    const maxDays = activeRule ? activeRule.maxDays : (deliveryConfig?.defaultMaxDays || 4);

    const minDate = new Date(today);
    minDate.setDate(today.getDate() + minDays);

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + maxDays);

    const formatOpt: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return {
      min: minDate.toLocaleDateString('en-PK', formatOpt),
      max: maxDate.toLocaleDateString('en-PK', formatOpt),
      minDays,
      maxDays,
    };
  }, [activeRule, deliveryConfig]);

  // Same-day dispatch cutoff calculation
  const cutoffInfo = useMemo(() => {
    const cutoffStr = deliveryConfig?.cutoffTime || '16:00';
    const [cutoffHour, cutoffMin] = cutoffStr.split(':').map(Number);

    const now = new Date();
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffHour || 16, cutoffMin || 0, 0, 0);

    const diffMs = cutoffTime.getTime() - now.getTime();
    if (diffMs > 0) {
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return {
        isSameDay: true,
        text: `Order within ${hours}h ${minutes}m for Same-Day Dispatch`,
      };
    }
    return {
      isSameDay: false,
      text: 'Order today for Priority Dispatch tomorrow morning',
    };
  }, [deliveryConfig?.cutoffTime]);

  // Geolocation detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setDetectionMessage('Location detection not supported by your browser.');
      return;
    }

    setIsDetecting(true);
    setDetectionMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetecting(false);
        const { latitude, longitude } = pos.coords;

        // Approximate proximity mapping for Pakistani regions
        // Karachi ~24.86, Lahore ~31.52, Islamabad ~33.68, Peshawar ~34.01, Quetta ~30.17
        let detected = 'Lahore';
        if (latitude < 26.5) detected = 'Karachi';
        else if (latitude > 33.2) detected = 'Islamabad';
        else if (longitude < 68.0) detected = 'Quetta';
        else if (latitude > 31.0 && latitude < 32.5) detected = 'Lahore';

        setSelectedCity(detected);
        setIsCustomMode(false);
        setDetectionMessage(`Location detected: ${detected}`);
        setTimeout(() => setDetectionMessage(null), 3000);
      },
      () => {
        setIsDetecting(false);
        setDetectionMessage('Could not detect location. Please select your city manually.');
        setTimeout(() => setDetectionMessage(null), 3500);
      },
      { timeout: 7000 }
    );
  };

  const isFreeDelivery = productPrice >= (businessSettings?.shippingFreeAbove || 15000);

  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-[#121316] border border-[#262930] space-y-4 ${className}`}>
      {/* City Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#262930]">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#F5F5F7]">
          <MapPin className="w-4 h-4 text-[#D4AF37]" />
          <span>Delivery Timeline to:</span>
        </div>

        <div className="flex items-center gap-2">
          {!isCustomMode ? (
            <select
              value={selectedCity}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setIsCustomMode(true);
                } else {
                  setSelectedCity(e.target.value);
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#D4AF37] text-xs font-bold focus:border-[#D4AF37] focus:outline-none cursor-pointer"
            >
              {rules.map((r) => (
                <option key={r.city} value={r.city} className="bg-[#121316] text-[#E8E8EC]">
                  {r.city}
                </option>
              ))}
              <option value="__custom__" className="bg-[#121316] text-[#D4AF37]">
                + Other City / Town
              </option>
            </select>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Enter city..."
                value={customCityInput}
                onChange={(e) => setCustomCityInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customCityInput.trim()) {
                    setSelectedCity(customCityInput.trim());
                    setIsCustomMode(false);
                  }
                }}
                className="w-32 px-2.5 py-1 rounded-xl bg-[#0B0C0E] border border-[#262930] text-xs text-[#F5F5F7] focus:border-[#D4AF37] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (customCityInput.trim()) setSelectedCity(customCityInput.trim());
                  setIsCustomMode(false);
                }}
                className="px-2.5 py-1 rounded-xl bg-[#D4AF37] text-[#0B0C0E] text-[10px] font-bold uppercase"
              >
                Set
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isDetecting}
            title="Auto-detect city"
            className="p-1.5 rounded-xl border border-[#262930] bg-[#181A1F] hover:bg-[#20232A] text-[#8E929E] hover:text-[#D4AF37] transition-colors cursor-pointer"
            aria-label="Detect my location"
          >
            <Compass className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin text-[#D4AF37]' : ''}`} />
          </button>
        </div>
      </div>

      {detectionMessage && (
        <p className="text-[11px] text-[#D4AF37] bg-[#D4AF37]/10 p-2 rounded-lg border border-[#D4AF37]/20">
          {detectionMessage}
        </p>
      )}

      {/* Delivery Estimate Output */}
      <div className="space-y-3">
        {activeRule && activeRule.available === false ? (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-[#F5F5F7] block">Delivery Estimate Unavailable for {selectedCity}</span>
              <p className="text-[11px] text-[#CBD0DC] leading-relaxed">
                Direct automated courier dispatch to this specific region is currently unavailable or requires special transit verification. Please contact our 24/7 VIP Concierge to arrange custom air cargo booking and insured delivery arrangements.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] shrink-0 mt-0.5">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#8E929E] uppercase tracking-wider">
                  Estimated Delivery Window
                </div>
                <div className="text-sm font-bold text-[#F5F5F7] mt-0.5">
                  {estimateDates.min} &mdash; {estimateDates.max}
                  <span className="text-xs font-normal text-[#8E929E] ml-2">
                    ({estimateDates.minDays}&ndash;{estimateDates.maxDays} working days)
                  </span>
                </div>
                <div className="text-[11px] text-[#CBD0DC] mt-1 flex items-center gap-1.5">
                  <span className="text-emerald-400 font-semibold">
                    {isFreeDelivery ? '✓ Free Express Delivery' : `✓ Flat Delivery: Rs. ${businessSettings.shippingFlatFee}`}
                  </span>
                  <span>&bull;</span>
                  <span>{activeRule?.courier || 'TCS / RUN Couriers Nationwide'}</span>
                </div>
              </div>
            </div>

            {/* Dispatch cutoff info */}
            <div className="flex items-center gap-2 text-xs text-[#CBD0DC] bg-[#181A1F] p-2.5 rounded-xl border border-[#262930]/80">
              <Clock className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span className="text-[11px] font-medium">{cutoffInfo.text}</span>
            </div>

            {/* Verification Badges */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Cash on Delivery Available</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#D4AF37]">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>100% Insured Transit</span>
              </div>
            </div>

            {!activeRule && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#181A1F] border border-[#262930] text-[11px] text-[#CBD0DC]">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#D4AF37] mt-0.5" />
                <span>
                  Destination {selectedCity} is serviced through our standard nationwide network. Delivery typically arrives in 3–5 working days with live SMS tracking.
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
