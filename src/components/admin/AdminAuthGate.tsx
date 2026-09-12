import React, { useEffect, useState } from 'react';
import { LockKeyhole, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../context/StoreContext';

interface AdminAuthGateProps {
    children: React.ReactNode;
}

export const AdminAuthGate: React.FC<AdminAuthGateProps> = ({ children }) => {
    const { addToast, syncWithSupabase } = useStore();
    const [session, setSession] = useState<Session | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;
        supabase.auth.getSession().then(({ data }) => {
            if (mounted) {
                setSession(data.session);
                setIsLoading(false);
            }
        });

        const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            if (mounted) setSession(nextSession);
        });

        return () => {
            mounted = false;
            data.subscription.unsubscribe();
        };
    }, []);

    const isAdmin = session?.user.app_metadata?.role === 'admin';

    const handleSignIn = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });

        if (signInError) {
            setError('Sign-in failed. Check your credentials and try again.');
        } else if (data.user?.app_metadata?.role !== 'admin') {
            await supabase.auth.signOut();
            setError('This account is not authorized for the administration portal.');
        } else {
            await syncWithSupabase();
            addToast('success', 'Admin Session Started', 'Secure administration access granted.');
        }

        setIsSubmitting(false);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        addToast('info', 'Admin Session Ended', 'The administration portal has been locked.');
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center bg-transparent text-[#8E929E]">
                <span className="text-xs uppercase tracking-[0.2em]">Verifying secure session...</span>
            </div>
        );
    }

    if (isAdmin) {
        return (
            <div className="relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSignOut}
                        className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#8E929E] hover:text-[#D4AF37] transition-colors"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Lock Admin Portal
                    </button>
                </div>
                {children}
            </div>
        );
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center bg-transparent px-4 py-16 text-[#E8E8EC]">
            <form onSubmit={handleSignIn} className="w-full max-w-md rounded-2xl border border-[#262930] bg-[#121316] p-8 shadow-2xl">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/50 bg-transparent p-1 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                        <img src="/favicon.png" alt="STORIUM Logo" width="60" height="60" className="h-full w-full object-contain rounded-xl" />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]">Restricted Access</span>
                    <h1 className="mt-2 font-serif-luxury text-2xl font-bold text-[#F5F5F7]">Admin Sign In</h1>
                    <p className="mt-2 text-xs leading-relaxed text-[#8E929E]">Use an authorized Supabase administrator account to continue.</p>
                </div>

                <div className="space-y-4">
                    <label className="block text-xs text-[#8E929E]">
                        Email
                        <input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#262930] bg-[#0B0C0E] px-3.5 py-3 text-sm text-[#F5F5F7] focus:border-[#D4AF37] focus:outline-none" />
                    </label>
                    <label className="block text-xs text-[#8E929E]">
                        Password
                        <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#262930] bg-[#0B0C0E] px-3.5 py-3 text-sm text-[#F5F5F7] focus:border-[#D4AF37] focus:outline-none" />
                    </label>
                </div>

                {error && <p role="alert" className="mt-4 rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-xs text-rose-300">{error}</p>}

                <button type="submit" disabled={isSubmitting} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#0B0C0E] transition-colors hover:bg-[#E5C378] disabled:cursor-not-allowed disabled:opacity-60">
                    {isSubmitting ? <LockKeyhole className="h-4 w-4 animate-pulse" /> : <LogIn className="h-4 w-4" />}
                    {isSubmitting ? 'Authenticating...' : 'Enter Admin Portal'}
                </button>
            </form>
        </div>
    );
};