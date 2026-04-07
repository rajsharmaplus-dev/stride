import React, { useState, useEffect } from 'react';
import { ArrowRight, LogIn, ShieldCheck, Globe } from 'lucide-react';

export function LoginPage({ onLogin, error }) {
    const [isLoading, setIsLoading] = useState(false);

    // Mock login for development/demo purposes
    const handleMockLogin = (role) => {
        setIsLoading(true);
        const mockUsers = {
            'Employee': { name: 'Alex Submitter', email: 'alex@company.com', sub: 'google_u1' },
            'Manager': { name: 'Sarah Manager', email: 'sarah@company.com', sub: 'google_u2' },
            'Admin': { name: 'David Business Head', email: 'david@company.com', sub: 'google_u3' }
        };
        
        const user = mockUsers[role];
        const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=/g, '');
        const payload = btoa(JSON.stringify(user)).replace(/=/g, '');
        const signature = "dummy_signature";
        const credential = `${header}.${payload}.${signature}`;
        
        setTimeout(() => {
            onLogin(credential);
            setIsLoading(false);
        }, 800);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Soft Ambient Background Elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-[#FF5F2D]/5 blur-[80px]" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-slate-200 blur-[80px]" />
            
            <div className="max-w-md w-full relative z-10 space-y-12 animate-fade-in text-center">
                {/* Branding Block */}
                <div className="space-y-8">
                    <div className="flex justify-center mb-6">
                        <img 
                            src="/src/assets/logo.png" 
                            alt="GlobalLogic Logo" 
                            className="h-32 w-auto object-contain"
                        />
                    </div>
                    <div className="flex justify-center">
                        <div className="w-12 h-1.5 bg-[#FF5F2D] rounded-full" />
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none font-display uppercase">STRIDE</h1>
                    <p className="text-slate-400 font-bold tracking-[0.25em] uppercase text-[10px]">
                        Corporate Strategic Governance
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white p-10 md:p-14 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] rounded-[40px] space-y-8 border border-white/50 backdrop-blur-sm">
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display">Sign In</h2>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                            Access the global initiative landscape with your enterprise account.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 italic">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <button
                            onClick={() => handleMockLogin('Employee')}
                            disabled={isLoading}
                            className="w-full group relative flex items-center justify-center gap-3 bg-[#FF5F2D] text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-slate-900 shadow-xl shadow-[#FF5F2D]/20 hover:shadow-slate-900/20 active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? 'Authenticating...' : 'Continue with Google'}
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>

                        <div className="flex items-center gap-4 py-4">
                            <div className="flex-1 h-px bg-slate-100" />
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Developer Console</span>
                            <div className="flex-1 h-px bg-slate-100" />
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <MockRoleButton label="Employee Sandbox" onClick={() => handleMockLogin('Employee')} isLoading={isLoading} />
                            <MockRoleButton label="Manager Portal" onClick={() => handleMockLogin('Manager')} isLoading={isLoading} />
                            <MockRoleButton label="Business Cabinet" onClick={() => handleMockLogin('Admin')} isLoading={isLoading} />
                        </div>
                    </div>
                </div>

                {/* Footer Seal */}
                <div className="pt-6 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-300">
                        <Globe size={14} />
                        <span className="text-[9px] font-bold uppercase tracking-[0.4em]">GlobalLogic Internal</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MockRoleButton({ label, onClick, isLoading }) {
    return (
        <button
            onClick={onClick}
            disabled={isLoading}
            className="w-full px-6 py-4 bg-slate-50 text-slate-400 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] text-center hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95 disabled:opacity-30"
        >
            {label}
        </button>
    );
}
