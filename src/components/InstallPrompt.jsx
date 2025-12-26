import React, { useState, useEffect } from 'react';
import { Share, X } from 'lucide-react';

export function InstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Check if running in standalone mode
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

        // Check if previously dismissed (optional, for now just show if not installed)
        // const isDismissed = localStorage.getItem('pwa-prompt-dismissed');

        if (!isStandalone) {
            // Delay prompt slightly
            const timer = setTimeout(() => setShowPrompt(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    if (!showPrompt) return null;

    return (
        <div className="fixed top-4 left-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-neutral-800/95 backdrop-blur-md border border-purple-500/30 p-4 rounded-xl shadow-2xl flex items-start gap-4 max-w-md mx-auto">
                <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400">
                    <Share className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-white text-sm">Install for Background Play</h3>
                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                        To prevent iOS from stopping playback, tap <span className="inline-flex items-center mx-1 bg-neutral-700 px-1.5 py-0.5 rounded text-neutral-200"><Share className="w-3 h-3 mr-1" /> Share</span> and select <strong>"Add to Home Screen"</strong>.
                    </p>
                </div>
                <button
                    onClick={() => setShowPrompt(false)}
                    className="text-neutral-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
