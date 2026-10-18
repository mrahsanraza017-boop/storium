import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, Loader2, Eye, ShieldCheck, Server, RefreshCw } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { getOrderReceiptHtmlPreview } from '../../services/emailService';

export const AdminEmailTab: React.FC = () => {
  const { orders, sendTestEmail, sendConfirmationEmail, addToast } = useStore();

  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; method?: string; error?: string } | null>(null);

  const [previewOrderIndex, setPreviewOrderIndex] = useState<number>(0);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      addToast('error', 'Invalid Email', 'Please enter a valid email address to receive the test confirmation.');
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await sendTestEmail(testEmailAddress);
      setTestResult(res);
      if (res.success) {
        addToast('success', 'Email Sent', res.message || `Test confirmation email dispatched to ${testEmailAddress}`);
      } else {
        addToast('error', 'Email Delivery Notice', res.error || 'Server reported an issue delivering the test email.');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err?.message || 'Network error occurred while contacting email endpoint.',
      });
      addToast('error', 'Delivery Failed', 'Could not reach the email API endpoint.');
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleOpenPreview = async () => {
    const targetOrder = orders.length > 0 ? orders[previewOrderIndex] || orders[0] : null;
    if (!targetOrder) {
      addToast('info', 'No Orders Available', 'Place a test order or sample to generate a preview.');
      return;
    }

    setIsLoadingPreview(true);
    setIsPreviewModalOpen(true);
    try {
      const html = await getOrderReceiptHtmlPreview(targetOrder);
      setPreviewHtml(html);
    } catch (err) {
      console.error(err);
      setPreviewHtml('<p style="color: white; padding: 20px;">Could not render receipt preview.</p>');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  return (
    <div className="space-y-8 text-xs text-[#CBD0DC]">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#121316] border border-[#262930] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-lg font-bold text-[#F5F5F7] font-serif-luxury">
              Customer Order Confirmation &amp; Receipts
            </h2>
          </div>
          <p className="text-xs text-[#8E929E] max-w-2xl">
            When customers complete checkout (Cash on Delivery or Online Card via Rapid Gateway), an itemized luxury receipt is automatically generated and dispatched to their email address.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenPreview}
          className="py-2.5 px-4 rounded-xl bg-[#181A1F] hover:bg-[#22252C] border border-[#262930] text-[#D4AF37] font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Eye className="w-4 h-4" />
          <span>Preview Live Receipt</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Email Dispatch Test */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-5">
            <div className="flex items-center gap-2.5 border-b border-[#262930] pb-3">
              <Mail className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="text-sm font-bold text-[#F5F5F7]">Send Live Test Confirmation Email</h3>
            </div>

            <p className="text-[#8E929E] leading-relaxed">
              Enter your email address below to immediately receive an authentic STORIUM luxury order receipt in your inbox.
            </p>

            <form onSubmit={handleSendTest} className="space-y-4">
              <div>
                <label htmlFor="test-email-input" className="block uppercase tracking-wider text-[#8E929E] text-[10px] font-bold mb-1.5">
                  Recipient Email Address *
                </label>
                <div className="flex gap-2">
                  <input
                    id="test-email-input"
                    type="email"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder="your-email@example.com"
                    required
                    className="flex-1 py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-xs text-[#F5F5F7] placeholder-[#626673] focus:outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="submit"
                    disabled={isSendingTest}
                    className="py-2.5 px-5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {isSendingTest ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending…</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Test</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Test Result Feedback */}
            {testResult && (
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${testResult.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block">
                    {testResult.success ? 'Email Dispatched Successfully' : 'Delivery Issue'}
                  </span>
                  <p className="mt-0.5 text-[11px] text-[#CBD0DC]">
                    {testResult.message || testResult.error}
                  </p>
                  {testResult.method && (
                    <span className="mt-1.5 inline-block px-2 py-0.5 rounded bg-black/40 text-[10px] font-mono text-[#D4AF37]">
                      Transport Method: {testResult.method}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Resend from Recent Orders */}
          <div className="p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-4">
            <div className="flex items-center justify-between border-b border-[#262930] pb-3">
              <h3 className="text-sm font-bold text-[#F5F5F7]">Recent Customer Orders</h3>
              <span className="text-[11px] text-[#8E929E]">{orders.length} total</span>
            </div>

            {orders.length === 0 ? (
              <p className="text-[#8E929E] italic py-3 text-center">No orders have been recorded yet.</p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {orders.slice(0, 5).map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3 rounded-xl bg-[#0B0C0E] border border-[#262930] flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#D4AF37]">{ord.orderNumber}</span>
                        <span className="text-[10px] text-[#8E929E]">&bull; {ord.customer.fullName}</span>
                      </div>
                      <span className="text-[11px] text-[#8E929E] block">{ord.customer.email}</span>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        addToast('info', 'Sending…', `Resending confirmation to ${ord.customer.email}`);
                        const res = await sendConfirmationEmail(ord);
                        if (res.success) {
                          addToast('success', 'Email Sent', `Order receipt sent to ${ord.customer.email}`);
                        } else {
                          addToast('error', 'Send Failed', res.error || 'Could not send confirmation.');
                        }
                      }}
                      className="py-1.5 px-3 rounded-lg bg-[#181A1F] hover:bg-[#22252C] text-[#E8E8EC] border border-[#262930] text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Resend receipt email to this customer"
                    >
                      <RefreshCw className="w-3 h-3 text-[#D4AF37]" />
                      <span>Resend</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Email Configuration & Methods */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-4">
            <div className="flex items-center gap-2 border-b border-[#262930] pb-3">
              <Server className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="text-sm font-bold text-[#F5F5F7]">Supported Delivery Transports</h3>
            </div>

            <div className="space-y-3">
              {/* Option 1: PHP Mail */}
              <div className="p-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#F5F5F7] text-xs">1. Native Hosting Mail (Default)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">Ready</span>
                </div>
                <p className="text-[11px] text-[#8E929E] leading-relaxed">
                  Uses PHP <code className="text-[#D4AF37] font-mono">mail()</code> on standard cPanel, LiteSpeed, or Apache hosts. Delivers immediately without third-party accounts.
                </p>
              </div>

              {/* Option 2: SMTP */}
              <div className="p-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#F5F5F7] text-xs">2. SMTP Server (Gmail / Domain Webmail)</span>
                  <span className="px-2 py-0.5 rounded bg-[#181A1F] text-[#D4AF37] border border-[#262930] text-[10px] font-bold">Configurable</span>
                </div>
                <p className="text-[11px] text-[#8E929E] leading-relaxed">
                  Configure <code className="text-[#D4AF37] font-mono">public/api/email-config.php</code> or set <code className="text-[#D4AF37] font-mono">SMTP_HOST</code>, <code className="text-[#D4AF37] font-mono">SMTP_USER</code>, and <code className="text-[#D4AF37] font-mono">SMTP_PASS</code> for guaranteed inbox delivery.
                </p>
              </div>

              {/* Option 3: Resend API */}
              <div className="p-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#F5F5F7] text-xs">3. Resend API</span>
                  <span className="px-2 py-0.5 rounded bg-[#181A1F] text-[#8E929E] border border-[#262930] text-[10px] font-bold">Optional</span>
                </div>
                <p className="text-[11px] text-[#8E929E] leading-relaxed">
                  Set <code className="text-[#D4AF37] font-mono">RESEND_API_KEY</code> in environment variables or <code className="text-[#D4AF37] font-mono">email-config.php</code> to use Resend transactional delivery.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#181A1F] border border-[#262930] text-[11px] space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#D4AF37] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sender Identity &amp; Branding</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[#8E929E]">
                <li><strong className="text-[#F5F5F7]">From Name:</strong> STORIUM Pakistan</li>
                <li><strong className="text-[#F5F5F7]">Sender Email:</strong> orders@storium.online</li>
                <li><strong className="text-[#F5F5F7]">Reply-To:</strong> support@storium.online</li>
                <li><strong className="text-[#F5F5F7]">Admin Copy:</strong> Enabled (Receives BCC of all incoming orders)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Live Email Preview */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-3xl bg-[#121418] border border-[#262930] rounded-2xl p-6 space-y-4 max-h-[92vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262930] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#F5F5F7] font-serif-luxury">
                  Live Customer Receipt Preview
                </h3>
                <span className="text-[11px] text-[#8E929E]">
                  This is the exact email format received by customers after placing an order.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="py-1 px-3 rounded-lg bg-[#181A1F] hover:bg-[#22252C] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto rounded-xl border border-[#232730] bg-[#0B0C0E] p-2 min-h-[400px]">
              {isLoadingPreview ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3 text-center">
                  <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
                  <span className="text-xs text-[#8E929E]">Rendering luxury email template…</span>
                </div>
              ) : (
                <iframe
                  title="Receipt Preview"
                  srcDoc={previewHtml}
                  className="w-full h-[540px] border-0 rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
