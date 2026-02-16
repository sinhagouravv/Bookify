import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Book, Users, MessageSquare, Settings, LogOut, ChevronRight, Moon, Briefcase, Mail } from 'lucide-react';

const Sidebar = () => {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
            : 'text-gray-400 hover:bg-gray-800/50 hover:text-white';
    };

    const menuItems = [
        { path: '/', name: 'Dashboard', icon: LayoutDashboard },
        { path: '/books', name: 'Book Management', icon: Book },
        { path: '/users', name: 'Users', icon: Users },
        { path: '/business', name: 'Business', icon: Briefcase },
        { path: '/reviews', name: 'Reviews', icon: MessageSquare },
        { path: '/messages', name: 'Messages', icon: Mail },
        { path: '/settings', name: 'Settings', icon: Settings },
    ];

    return (
        <aside className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300">
            <div className="p-6 mb-2">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Book className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Bookify</h1>
                        <p className="text-xs text-gray-500 font-medium tracking-wide">ADMIN PORTAL</p>
                    </div>
                </div>
            </div>

            <div className="px-4 mb-6">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Main Menu</div>
                <nav className="space-y-1.5">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 ${isActive(item.path)}`}
                        >
                            <div className="flex items-center gap-3.5">
                                <item.icon size={20} className={`transition-colors ${location.pathname === item.path ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
                                <span className="font-medium text-sm">{item.name}</span>
                            </div>
                            {item.badge && (
                                <span className="text-[10px] font-bold bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full border border-gray-700">
                                    {item.badge}
                                </span>
                            )}
                            {location.pathname === item.path && (
                                <ChevronRight size={16} className="text-indigo-300" />
                            )}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="mt-auto p-4 border-t border-gray-800">
                <div className="bg-gray-800/50 rounded-xl p-4 mb-4 flex items-center gap-3 mb-2 border border-gray-700/50">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-white font-bold text-sm border-2 border-gray-600">
                        AD
                    </div>
                    <div className="overflow-hidden">
                        <h4 className="text-sm font-bold text-white truncate">Admin User</h4>
                        <p className="text-xs text-gray-400 truncate">admin@bookify.com</p>
                    </div>
                </div>
                <button className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gray-800 text-gray-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 border border-transparent transition-all text-sm font-medium">
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
