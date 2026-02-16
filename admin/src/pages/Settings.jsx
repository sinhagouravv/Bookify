import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Database, RefreshCw, CheckCircle, AlertCircle, Server, X, Loader2 } from 'lucide-react';

const SyncModal = ({ isOpen, onClose, onSyncComplete }) => {
    const [progress, setProgress] = useState(0);
    const [fetchedCount, setFetchedCount] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Initializing...');
    const [isComplete, setIsComplete] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen) return;

        // Reset state on open
        setProgress(0);
        setFetchedCount(0);
        setStatusMessage('Starting synchronization...');
        setIsComplete(false);
        setError(null);

        const startSync = async () => {
            try {
                // Trigger sync
                await fetch('http://localhost:5001/api/books/sync');

                // Start polling
                const pollInterval = setInterval(async () => {
                    try {
                        const res = await fetch('http://localhost:5001/api/books/sync-status');
                        const data = await res.json();

                        setProgress(data.progress);
                        setStatusMessage(data.message);
                        setFetchedCount(data.syncedCount || 0);

                        if (!data.isSyncing && data.progress === 100) {
                            clearInterval(pollInterval);
                            setIsComplete(true);
                            setTimeout(() => {
                                onSyncComplete();
                                onClose();
                            }, 2000);
                        } else if (!data.isSyncing && data.message.startsWith('Error')) {
                            clearInterval(pollInterval);
                            setError(data.message);
                        }

                    } catch (err) {
                        console.error('Polling error:', err);
                        setError('Failed to get sync status');
                        clearInterval(pollInterval);
                    }
                }, 1000);

            } catch (err) {
                console.error('Sync start error:', err);
                setError('Failed to start synchronization');
            }
        };

        startSync();

    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Syncing Books</h2>
                    {!isComplete && (
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {error ? (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3">
                        <AlertCircle size={24} />
                        <div>
                            <p className="font-bold">Sync Failed</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-center">
                            {isComplete ? (
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                                    <CheckCircle size={32} />
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium text-gray-700">
                                <span>{statusMessage}</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-600 transition-all duration-500 ease-out rounded-full"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>

                        {isComplete && (
                            <p className="text-center text-green-600 font-medium animate-in fade-in slide-in-from-bottom-2">
                                Synchronization completed successfully!
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const Settings = () => {
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSyncComplete = () => {
        setMessage({ type: 'success', text: 'Sync completed successfully!' });
        setTimeout(() => setMessage(null), 5000);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
                <p className="text-gray-500 mt-2 text-lg">Manage system configurations and operations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* System Operations Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-indigo-50 rounded-xl">
                            <Server className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">System Operations</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">Google Books Sync</h3>
                                    <p className="text-sm text-gray-500">Fetch and update book data from Google Books API.</p>
                                </div>
                                <Database className="text-gray-400" size={20} />
                            </div>

                            <button
                                onClick={() => setIsSyncModalOpen(true)}
                                className="w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 active:scale-95"
                            >
                                <RefreshCw size={18} />
                                Sync Now
                            </button>

                            {message && (
                                <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                    }`}>
                                    {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                    {message.text}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Placeholder for future settings */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 opacity-60 pointer-events-none">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <SettingsIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-400">General Preferences</h2>
                    </div>
                    <div className="h-32 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-sm font-medium">
                        Coming Soon
                    </div>
                </div>
            </div>

            <SyncModal
                isOpen={isSyncModalOpen}
                onClose={() => setIsSyncModalOpen(false)}
                onSyncComplete={handleSyncComplete}
            />
        </div>
    );
};

export default Settings;
