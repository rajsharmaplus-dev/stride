import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export function LoginPage({ onLogin, error }) {
    const [isLoading, setIsLoading] = useState(false);
    const [dynamicClientId, setDynamicClientId] = useState(null);
    const [configError, setConfigError] = useState(false);

    useEffect(() => {
        fetch('/api/auth/config')
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                console.log('Auth Config Received:', data);
                if (data.clientId && data.clientId !== 'your_google_client_id_here') {
                    setDynamicClientId(data.clientId);
                } else {
                    setConfigError(true);
                }
            })
            .catch(err => {
                console.error('Failed to fetch Auth config:', err);
                setConfigError(true);
            });
    }, []);

    const handleSuccess = (credentialResponse) => {
        setIsLoading(true);
        onLogin(credentialResponse.credential);
    };

    const handleError = () => {
        console.error('Google Login Failed');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans select-none">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#F05A28]/5 blur-[120px]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-slate-100/40 blur-[120px]" />
            
            <div className="max-w-md w-full relative z-10 space-y-8 animate-fade-in text-center">
                {/* Branding Block */}
                <div className="space-y-4">
                    <div className="flex justify-center mb-2">
                        <img 
                            src="/logo.png" 
                            alt="GlobalLogic Logo" 
                            className="h-32 w-auto max-w-[80%] object-contain"
                        />
                    </div>
                    <div>
                        <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none font-display uppercase">STRIDE</h1>
                        <p className="text-[#F05A28] font-black tracking-[0.5em] uppercase text-[9px] mt-3">
                            Corporate Strategic Governance
                        </p>
                    </div>
                </div>

                {/* Login Card */}
                <div className="bg-white p-8 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.12)] rounded-[40px] space-y-6 border border-white relative overflow-hidden">
                    <div className="relative z-10 space-y-3">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Authentication</h2>
                        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                            Enterprise Login Required
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 italic">
                            {error}
                        </div>
                    )}

                    {configError ? (
                        <div className="bg-orange-50 text-orange-600 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-orange-100 leading-loose">
                            Security Error: Config Missing.<br/>
                            Contact Site Admin.
                        </div>
                    ) : !dynamicClientId ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-6 h-6 border-2 border-[#F05A28] border-t-transparent rounded-full animate-spin" />
                            <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Validating Infrastructure...</span>
                        </div>
                    ) : (
                        <div className="space-y-4 flex flex-col items-center justify-center pt-2">
                            {isLoading ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Identifying Session...</span>
                                </div>
                            ) : (
                                <div className="space-y-6 w-full">
                                    <GoogleOAuthProvider clientId={dynamicClientId}>
                                        <div className="transition-transform active:scale-95 duration-200 flex justify-center">
                                            <GoogleLogin
                                                onSuccess={handleSuccess}
                                                onError={handleError}
                                                useFedCM={false}
                                                theme="filled_blue"
                                                shape="circle"
                                                size="large"
                                                text="continue_with"
                                            />
                                        </div>
                                    </GoogleOAuthProvider>

                                    <div className="pt-4 border-t border-slate-100">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mb-4">Verification Access</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            {[
                                                { id: 'u3', label: 'Admin Access', role: 'Corporate' },
                                                { id: 'u2', label: 'Manager Access', role: 'Operations' },
                                                { id: 'u1', label: 'Employee Access', role: 'Portfolio' }
                                            ].map(mock => (
                                                <button
                                                    key={mock.id}
                                                    onClick={() => {
                                                        setIsLoading(true);
                                                        fetch('/api/auth/dev-login', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ userId: mock.id })
                                                        })
                                                        .then(res => res.json())
                                                        .then(data => {
                                                            if (data.success) onLogin(null, data.user);
                                                        })
                                                        .catch(() => setIsLoading(false));
                                                    }}
                                                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all group"
                                                >
                                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{mock.label}</span>
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-[#F05A28] transition-colors">{mock.role}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Decorative line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#F05A28] to-transparent opacity-30" />
                </div>

                {/* Footer Seal */}
                <div className="pt-6 flex flex-col items-center gap-4 opacity-30 group">
                    <div className="flex items-center gap-3 text-slate-400">
                        <Globe size={14} />
                        <span className="text-[9px] font-black uppercase tracking-[0.6em]">Internal Network Secure</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
