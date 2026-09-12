import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  checkSupabaseHealth,
  SUPABASE_SQL_SCHEMA,
} from '../../services/supabaseService';
import { SUPABASE_PROJECT_ID, SUPABASE_ANON_KEY } from '../../lib/supabase';

export const AdminSupabaseTab: React.FC = () => {
  const { orders, inquiries, reviews, syncWithSupabase, isSupabaseSyncing, addToast } = useStore();
  const [copied, setCopied] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    ordersTableExists: boolean;
    contactsTableExists: boolean;
    reviewsTableExists: boolean;
    message: string;
    testedAt?: string;
  } | null>(null);

  const runHealthCheck = async () => {
    setIsPinging(true);
    try {
      const result = await checkSupabaseHealth();
      setHealthStatus({
        ordersTableExists: result.ordersTableExists,
        contactsTableExists: result.contactsTableExists,
        reviewsTableExists: result.reviewsTableExists,
        message: result.message || '',
        testedAt: new Date().toLocaleTimeString(),
      });

      if (result.ordersTableExists && result.contactsTableExists && result.reviewsTableExists) {
        addToast('success', 'Supabase Connected', 'All tables (orders, contacts, reviews) are active.');
      } else {
        addToast(
          'info',
          'Database Setup Required',
          'Supabase project is reachable. Some tables need to be initialized in SQL Editor.'
        );
      }
    } catch (err) {
      console.error('Health check error:', err);
      addToast('error', 'Ping Failed', 'Could not reach Supabase endpoint.');
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    addToast('success', 'SQL Copied', 'Paste into Supabase SQL Editor and click Run.');
    setTimeout(() => setCopied(false), 3000);
  };

  const syncedOrdersCount = orders.filter((o) => o.supabaseSynced).length;
  const syncedInquiriesCount = inquiries.filter((i) => i.supabaseSynced).length;
  const syncedReviewsCount = reviews.filter((r) => r.id && !r.id.startsWith('rev-')).length;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-[#121316] border border-[#262930] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#181A1F] border border-[#262930] text-[#D4AF37]">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold font-serif-luxury text-[#F5F5F7]">
              Supabase Backend Infrastructure
            </h2>
          </div>
          <p className="text-xs text-[#8E929E] max-w-xl">
            Live integration with Supabase project <span className="font-mono text-[#D4AF37] font-semibold">{SUPABASE_PROJECT_ID}</span>. Customer orders and concierge contact submissions are dispatched directly to your cloud PostgreSQL tables.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={runHealthCheck}
            disabled={isPinging}
            className="py-2.5 px-4 rounded-xl bg-[#181A1F] hover:bg-[#20232A] text-xs font-semibold text-[#F5F5F7] border border-[#262930] transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-[#D4AF37]' : ''}`} />
            <span>{isPinging ? 'Pinging Tables...' : 'Test Connection'}</span>
          </button>

          <button
            type="button"
            onClick={() => syncWithSupabase()}
            disabled={isSupabaseSyncing}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E5C378] hover:to-[#D4AF37] text-xs font-bold text-[#0B0C0E] transition-all flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${isSupabaseSyncing ? 'animate-spin' : ''}`} />
            <span>{isSupabaseSyncing ? 'Syncing...' : 'Sync Cloud Data'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Credentials & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Project Card */}
        <div className="p-5 rounded-2xl bg-[#121316] border border-[#262930] space-y-3">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8E929E] block">
            Target Project
          </span>
          <div className="font-mono text-sm font-bold text-[#D4AF37]">
            {SUPABASE_PROJECT_ID}
          </div>
          <div className="text-[11px] text-[#8E929E] truncate">
            https://{SUPABASE_PROJECT_ID}.supabase.co
          </div>
          <div className="pt-2 border-t border-[#262930]">
            <a
              href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#D4AF37] hover:underline"
            >
              <span>Open Supabase Dashboard</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Orders Table Status */}
        <div className="p-5 rounded-2xl bg-[#121316] border border-[#262930] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8E929E] block">
              Orders Table
            </span>
            {healthStatus?.ordersTableExists ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> Active
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-950/60 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <AlertCircle className="w-2.5 h-2.5" /> Setup Needed
              </span>
            )}
          </div>
          <div className="text-2xl font-bold font-mono text-[#F5F5F7]">
            {orders.length}{' '}
            <span className="text-xs font-sans text-[#8E929E] font-normal">
              orders ({syncedOrdersCount} cloud synced)
            </span>
          </div>
          <p className="text-[11px] text-[#8E929E]">
            Table: <code className="text-[#D4AF37]">public.orders</code> (Stores checkout records, buyer shipping details, and items).
          </p>
        </div>

        {/* Contacts Table Status */}
        <div className="p-5 rounded-2xl bg-[#121316] border border-[#262930] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8E929E] block">
              Contacts Table
            </span>
            {healthStatus?.contactsTableExists ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> Active
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-950/60 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <AlertCircle className="w-2.5 h-2.5" /> Setup Needed
              </span>
            )}
          </div>
          <div className="text-2xl font-bold font-mono text-[#F5F5F7]">
            {inquiries.length}{' '}
            <span className="text-xs font-sans text-[#8E929E] font-normal">
              inquiries ({syncedInquiriesCount} cloud synced)
            </span>
          </div>
          <p className="text-[11px] text-[#8E929E]">
            Table: <code className="text-[#D4AF37]">public.contacts</code> (Stores customer contact form queries and topics).
          </p>
        </div>

        {/* Reviews Table Status */}
        <div className="p-5 rounded-2xl bg-[#121316] border border-[#262930] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8E929E] block">
              Reviews Table
            </span>
            {healthStatus?.reviewsTableExists ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> Active
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-950/60 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <AlertCircle className="w-2.5 h-2.5" /> Setup Needed
              </span>
            )}
          </div>
          <div className="text-2xl font-bold font-mono text-[#F5F5F7]">
            {reviews.length}{' '}
            <span className="text-xs font-sans text-[#8E929E] font-normal">
              reviews ({syncedReviewsCount} cloud synced)
            </span>
          </div>
          <p className="text-[11px] text-[#8E929E]">
            Table: <code className="text-[#D4AF37]">public.reviews</code> (Stores product reviews with moderation workflow).
          </p>
        </div>
      </div>

      {/* SQL Setup Instructions & Copy Box */}
      <div className="p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262930] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="text-base font-bold text-[#F5F5F7] font-serif-luxury">
                Database Schema Initialization
              </h3>
            </div>
            <p className="text-xs text-[#8E929E]">
              If you haven&apos;t run the schema yet in your Supabase project, copy this SQL script and execute it in your SQL Editor.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopySchema}
              className="py-2 px-4 rounded-xl bg-[#181A1F] hover:bg-[#20232A] text-xs font-semibold text-[#D4AF37] border border-[#262930] transition-colors flex items-center gap-2 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
            </button>

            <a
              href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql`}
              target="_blank"
              rel="noreferrer"
              className="py-2 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-xs font-bold text-[#0B0C0E] transition-colors flex items-center gap-1.5"
            >
              <span>Open SQL Editor</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#0B0C0E] border border-[#262930] space-y-2">
            <span className="w-6 h-6 rounded-full bg-[#181A1F] border border-[#262930] text-[#D4AF37] font-mono text-xs flex items-center justify-center font-bold">
              1
            </span>
            <span className="font-semibold text-[#F5F5F7] block">Click Copy SQL Script</span>
            <p className="text-[#8E929E]">
              Copies the optimized DDL script with table constraints, indexes, and permissive public RLS policies.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0C0E] border border-[#262930] space-y-2">
            <span className="w-6 h-6 rounded-full bg-[#181A1F] border border-[#262930] text-[#D4AF37] font-mono text-xs flex items-center justify-center font-bold">
              2
            </span>
            <span className="font-semibold text-[#F5F5F7] block">Paste &amp; Run in Supabase</span>
            <p className="text-[#8E929E]">
              Open the Supabase SQL Editor link above, paste the code into the query editor, and click &ldquo;Run&rdquo;.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0C0E] border border-[#262930] space-y-2">
            <span className="w-6 h-6 rounded-full bg-[#181A1F] border border-[#262930] text-[#D4AF37] font-mono text-xs flex items-center justify-center font-bold">
              3
            </span>
            <span className="font-semibold text-[#F5F5F7] block">Verify Connection</span>
            <p className="text-[#8E929E]">
              Click &ldquo;Test Connection&rdquo; above. Both tables will instantly show green active status.
            </p>
          </div>
        </div>

        {/* Code Preview */}
        <div className="relative rounded-xl bg-[#0B0C0E] border border-[#262930] p-4 max-h-72 overflow-y-auto font-mono text-[11px] text-[#A0A5B5]">
          <pre className="whitespace-pre-wrap">{SUPABASE_SQL_SCHEMA}</pre>
        </div>
      </div>
    </div>
  );
};
