import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export function LoginPage({ onLogin, error }) {
    const [isLoading, setIsLoading] = useState(false);
    const [dynamicClientId, setDynamicClientId] = useState(null);
    const [configError, setConfigError] = useState(false);

    useEffect(() => {
        // Fetch the Client ID from the backend dynamically
        fetch('/api/auth/config')
            .then(res => res.json())
            .then(data => {
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Soft Ambient Background Elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-[#FF5F2D]/5 blur-[80px]" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-slate-200 blur-[80px]" />
            
            <div className="max-w-md w-full relative z-10 space-y-12 animate-fade-in text-center">
                {/* Branding Block */}
                <div className="space-y-8">
                    <div className="flex justify-center mb-6">
                        <img 
                            src="/logo.png" 
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

                    {configError ? (
                        <div className="bg-orange-50 text-orange-600 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-orange-100 leading-loose">
                            Authentication Disabled.<br/>
                            Please configure VITE_GOOGLE_CLIENT_ID in your .env file.
                        </div>
                    ) : !dynamicClientId ? (
                        <div className="text-sm font-bold text-slate-400 animate-pulse">Loading Security Config...</div>
                    ) : (
                        <div className="space-y-4 flex flex-col items-center justify-center pt-2">
                            {isLoading ? (
                                <div className="text-sm font-bold text-slate-500 animate-pulse">Authenticating...</div>
                            ) : (
                                <GoogleOAuthProvider clientId={dynamicClientId}>
                                    <GoogleLogin
                                        onSuccess={handleSuccess}
                                        onError={handleError}
                                        useFedCM={true}
                                        useOneTap
                                        theme="filled_black"
                                        shape="pill"
                                        size="large"
                                    />
                                </GoogleOAuthProvider>
                            )}
                        </div>
                    )}
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
