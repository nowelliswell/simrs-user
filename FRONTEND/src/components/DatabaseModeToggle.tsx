import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface DatabaseModeToggleProps {
    onModeChange?: (mode: 'production' | 'development') => void;
}

function DatabaseModeToggle({ onModeChange }: DatabaseModeToggleProps) {
    const [mode, setMode] = useState<'production' | 'development'>('development');

    // Load mode dari localStorage saat pertama kali
    useEffect(() => {
        const savedMode = localStorage.getItem('db_mode') as 'production' | 'development' | null;
        if (savedMode) {
            setMode(savedMode);
        }
    }, []);

    const handleToggle = () => {
        const newMode = mode === 'production' ? 'development' : 'production';

        // Simpan ke localStorage
        localStorage.setItem('db_mode', newMode);
        setMode(newMode);

        // Dispatch custom event untuk trigger wrapper update
        window.dispatchEvent(new Event('db-mode-changed'));

        toast.success(`Switched to ${newMode.toUpperCase()} database`, {
            position: 'top-right',
            autoClose: 2000,
            theme: 'colored',
        });

        // Callback untuk refresh data
        if (onModeChange) {
            onModeChange(newMode);
        }
    };

    return (
        <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline text-sm font-medium text-gray-600">Database Mode:</span>
            <span className="sm:hidden text-xs font-medium text-gray-600">DB:</span>
            <div className="flex items-center gap-1.5 sm:gap-2">
                <span className={`text-xs font-semibold ${mode === 'development' ? 'text-blue-600' : 'text-gray-400'}`}>
                    DEV
                </span>
                <button
                    onClick={handleToggle}
                    className={`relative inline-flex h-6 w-12 sm:h-7 sm:w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        mode === 'production'
                            ? 'bg-green-500 focus:ring-green-500'
                            : 'bg-blue-500 focus:ring-blue-500'
                    } cursor-pointer`}
                >
                    <span
                        className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                            mode === 'production' ? 'translate-x-7 sm:translate-x-8' : 'translate-x-1'
                        }`}
                    />
                    <span
                        className={`absolute inset-0 flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-white transition-opacity ${
                            mode === 'production' ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{ paddingRight: '18px' }}
                    >
                        ON
                    </span>
                </button>
                <span className={`text-xs font-semibold ${mode === 'production' ? 'text-green-600' : 'text-gray-400'}`}>
                    PROD
                </span>
            </div>
        </div>
    );
}

export default DatabaseModeToggle;
