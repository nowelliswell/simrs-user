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
            <div className="h-screen w-full flex flex-col bg-blue-50/30">
                {/* Development Mode Banner */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 shadow-md">
                    <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <span className="font-semibold text-sm">DEVELOPMENT MODE</span>
                            </div>
                            <span className="text-xs bg-blue-400/40 px-3 py-1 rounded-full">
                                Database: simrs_rsud2
                            </span>
                        </div>
                        <p className="text-xs opacity-90">
                            ⚠️ You are working with development data - Changes won't affect production
                        </p>
                    </div>
                </div>

                {/* Content dengan border biru */}
                <div className="flex-1 overflow-hidden border-4 border-blue-200">
                    {children}
                </div>
            </div>
        );
    }

    // Production mode - tampilan normal tanpa banner
    return <div className="h-screen w-full">{children}</div>;
}

export default DatabaseModeWrapper;
