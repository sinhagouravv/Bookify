import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Search, Sun } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

const Layout = () => {
    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 ml-72"> {/* Added margin-left to offset fixed sidebar */}
                {/* Top Header */}
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4 w-96">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search anything..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-100/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <NotificationDropdown />
                        <div className="h-8 w-px bg-gray-200"></div>
                        <div className="text-sm text-gray-500">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </header>

                <div className="px-6 pb-8 pt-6 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
