import { useEffect, useState, ReactNode } from 'react';

interface DatabaseModeWrapperProps {
    children: ReactNode;
}

function DatabaseModeWrapper({ children }: DatabaseModeWrapperProps) {
    const [mode, setMode] = useState<'production' | 'development'>('development');

    useEffect(() => {
        // Load mode dari localStorage
        const savedMode = localStorage.getItem('db_mode') as 'production' | 'development' | null;
        if (savedMode) {
            setMode(savedMode);
        }

        // Listen to localStorage changes (ketika mode diubah)
        const handleStorageChange = () => {
            const newMode = localStorage.getItem('db_mode') as 'production' | 'development' | null;
            if (newMode) {
                setMode(newMode);
            }
        };

        // Custom event untuk trigger update mode
        window.addEventListener('db-mode-changed', handleStorageChange);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('db-mode-changed', handleStorageChange);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    if (mode === 'development') {
        return (
            <div className="h-screen w-full flex flex-col bg-amber-50/10">
                {/* Development Mode Banner - Bright Amber/Orange */}
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-6 py-2 shadow-lg border-b border-amber-400/30">
                    <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                {/* Ikon Segitiga Peringatan dengan Efek Bounce */}
                                <svg className="w-5 h-5 text-amber-100 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span className="font-extrabold text-sm tracking-wider">DEVELOPMENT MODE</span>
                            </div>
                            <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded animate-pulse shadow-sm">
                                LOCAL DEV DB
                            </span>
                            <span className="text-xs bg-black/20 px-3 py-1 rounded-full border border-amber-400/30 font-semibold text-amber-100">
                                Database: simrs_rsud2
                            </span>
                        </div>
                        <p className="text-xs font-bold text-amber-50 bg-black/15 px-3 py-1 rounded border border-amber-400/20">
                            ⚠️ Hati-hati: Anda bekerja dengan data simulasi. Perubahan tidak akan mempengaruhi produksi.
                        </p>
                    </div>
                </div>

                {/* Content dengan border Amber tebal & Inner Glow */}
                <div className="flex-1 overflow-hidden border-4 border-amber-400 shadow-[inset_0_0_20px_rgba(245,158,11,0.15)]">
                    {children}
                </div>
            </div>
        );
    }

    // Production mode - tampilan normal tanpa banner
    return <div className="h-screen w-full">{children}</div>;
}

export default DatabaseModeWrapper;
