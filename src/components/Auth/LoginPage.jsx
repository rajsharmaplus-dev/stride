import React, { useState, useEffect } from 'react';
import { Shield, Lock, ArrowRight, Chrome, Sparkles, User, UserCheck, Settings } from 'lucide-react';

export function LoginPage({ onLogin, error }) {
    const [isLoading, setIsLoading] = useState(false);

    // Mock login for development/demo purposes
    const handleMockLogin = (role) => {
        setIsLoading(true);
        // Map roles to mock users matching initDb.js seeds
        const mockUsers = {
            'Employee': { name: 'Alex Submitter', email: 'alex@company.com', sub: 'google_u1' },
            'Manager': { name: 'Sarah Manager', email: 'sarah@company.com', sub: 'google_u2' },
            'Admin': { name: 'David Business Head', email: 'david@company.com', sub: 'google_u3' }
        };
        
        const user = mockUsers[role];
        
        // Create a dummy JWT-like string for the backend to decode
        const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=/g, '');
        const payload = btoa(JSON.stringify(user)).replace(/=/g, '');
        const signature = "dummy_signature";
        const credential = `${header}.${payload}.${signature}`;
        
        // Simulate network delay
        setTimeout(() => {
            onLogin(credential);
            setIsLoading(false);
        }, 800);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-600/20 blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse" />
            
            <div className="max-w-md w-full relative z-10 space-y-8 animate-fade-in">
                {/* Branding */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-indigo-600 shadow-2xl shadow-primary-500/20 mb-4 group hover:scale-110 transition-transform duration-500">
                        <Shield className="text-white w-10 h-10 group-hover:rotate-12 transition-transform" />
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter italic">STRIDE</h1>
                    <p className="text-slate-400 font-medium tracking-wide uppercase text-[10px]">Enterprise Project Governance Portal</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-white">Security Checkpoint</h2>
                            <p className="text-slate-500 text-sm mt-1">Authenticate to access the strategic portfolio</p>
                        </div>

                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 text-rose-400 text-sm font-bold">
                                <Lock size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            disabled={isLoading}
                            className="w-full group relative flex items-center justify-center gap-3 bg-white text-slate-950 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-xl shadow-white/5"
                        >
                            <Chrome size={18} className="text-primary-600" />
                            {isLoading ? 'Decrypting Session...' : 'Sign in with Google'}
                            <ArrowRight size={16} className="absolute right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                        </button>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black"><span className="px-4 bg-transparent text-slate-600">Development Access</span></div>
                        </div>

                        {/* Mock Role Selectors for Dev Environment */}
                        <div className="grid grid-cols-1 gap-3">
                            <MockRoleButton 
                                icon={<User size={16} />} 
                                label="Log in as Employee" 
                                role="Employee" 
                                onClick={() => handleMockLogin('Employee')} 
                                isLoading={isLoading}
                            />
                            <MockRoleButton 
                                icon={<UserCheck size={16} />} 
                                label="Log in as Manager" 
                                role="Manager" 
                                onClick={() => handleMockLogin('Manager')} 
                                isLoading={isLoading}
                            />
                            <MockRoleButton 
                                icon={<Settings size={16} />} 
                                label="Log in as Administrator" 
                                role="Admin" 
                                onClick={() => handleMockLogin('Admin')} 
                                isLoading={isLoading}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="text-center">
                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                        <Sparkles size={10} className="text-primary-500" />
                        Secure Internal Access Only
                    </p>
                </div>
            </div>
        </div>
    );
}

function MockRoleButton({ icon, label, onClick, isLoading }) {
    return (
        <button
            onClick={onClick}
            disabled={isLoading}
            className="flex items-center gap-3 w-full px-5 py-3.5 rounded-2xl bg-white/5 border border-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all text-[11px] font-bold uppercase tracking-widest text-left group"
        >
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-colors">
                {icon}
            </div>
            {label}
        </button>
    );
}
