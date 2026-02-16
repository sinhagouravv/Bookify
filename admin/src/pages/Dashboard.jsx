import { useState, useEffect } from 'react';
import { BookOpen, Users, ArrowUpRight, ArrowDownRight, Activity, DollarSign } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, color, trendColor }) => {
    // Map titles to specific color configurations
    const colorConfig = {
        "Total Books": {
            wrapper: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
            icon: "text-blue-600"
        },
        "Total Users": {
            wrapper: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100",
            icon: "text-indigo-600"
        },
        "Books Issued": {
            wrapper: "bg-orange-50 text-orange-600 group-hover:bg-orange-100",
            icon: "text-orange-600"
        },
        "Revenue": {
            wrapper: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
            icon: "text-emerald-600"
        }
    };

    // Fallback if title doesn't match
    const config = colorConfig[title] || {
        wrapper: "bg-gray-50 text-gray-600 group-hover:bg-gray-100",
        icon: "text-gray-600"
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-gray-100 hover:shadow-lg transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${config.wrapper} transition-colors duration-300`}>
                    <Icon className={`w-6 h-6 ${config.icon}`} />
                </div>
                {trend && (
                    <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${trendColor === 'green' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {trendColor === 'green' ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">{value}</h3>
                <p className="text-gray-500 text-sm font-medium">{title}</p>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalBooks: 0,
        totalUsers: 0,
        booksIssued: 0,
        revenue: 0,
        trends: {},
        monthlyTrends: [],
        weeklyTrends: [],
        recentActivity: []
    });
    const [loading, setLoading] = useState(true);
    const [trendView, setTrendView] = useState('monthly'); // 'monthly' or 'weekly'

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('http://localhost:5001/api/dashboard/stats');
                const data = await response.json();
                setStats(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Helper to calculate height percentage for chart
    const currentTrends = trendView === 'monthly' ? stats.monthlyTrends : stats.weeklyTrends;
    const maxTrendValue = Math.max(...(currentTrends.map(m => m.value) || [0]), 1); // Avoid division by zero
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
                    <p className="text-gray-500 mt-2 text-lg">Detailed analysis of your library's performance.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard
                    title="Total Books"
                    value={loading ? "..." : stats.totalBooks.toLocaleString()}
                    icon={BookOpen}
                    color="bg-blue-600"
                    trend={`${stats.trends?.books}% vs last week`}
                    trendColor={stats.trends?.books >= 0 ? "green" : "red"}
                />
                <StatCard
                    title="Total Users"
                    value={loading ? "..." : stats.totalUsers.toLocaleString()}
                    icon={Users}
                    color="bg-indigo-600"
                    trend={`${stats.trends?.users}% vs last week`}
                    trendColor={stats.trends?.users >= 0 ? "green" : "red"}
                />
                <StatCard
                    title="Books Issued"
                    value={loading ? "..." : stats.booksIssued.toLocaleString()}
                    icon={Activity}
                    color="bg-orange-600"
                    trend={`${stats.trends?.issued}% vs last week`}
                    trendColor={stats.trends?.issued >= 0 ? "green" : "red"}
                />
                <StatCard
                    title="Revenue"
                    value={loading ? "..." : `₹${stats.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={DollarSign}
                    color="bg-emerald-600"
                    trend={`${stats.trends?.revenue}% vs last week`}
                    trendColor={stats.trends?.revenue >= 0 ? "green" : "red"}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Simple Chart Placeholder */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-lg font-bold text-gray-900">
                            Borrowing Trends ({trendView === 'monthly' ? 'Last 12 Months' : 'Last 7 Weeks'})
                        </h2>
                        <select
                            className="bg-gray-50 border-none text-sm font-medium text-gray-500 rounded-lg p-2 outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                            value={trendView}
                            onChange={(e) => setTrendView(e.target.value)}
                        >
                            <option value="monthly">Monthly View</option>
                            <option value="weekly">Weekly View</option>
                        </select>
                    </div>
                    <div className="h-64 flex items-end gap-2 justify-between px-2">
                        {currentTrends.map((item, i) => (
                            <div key={i} className="w-full bg-gray-50 rounded-t-lg relative group h-full flex items-end">
                                <div
                                    className="w-full bg-indigo-500/10 group-hover:bg-indigo-600 transition-all duration-500 rounded-t-md relative"
                                    style={{ height: `${(item.value / maxTrendValue) * 100}%` }}
                                >
                                    {/* Tooltip on bar hover */}
                                </div>
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg transition-all duration-200 pointer-events-none whitespace-nowrap z-20 shadow-xl transform translate-y-2 group-hover:translate-y-0">
                                    <div className="font-bold">{item.value} orders</div>
                                    <div className="text-[10px] text-gray-300 font-normal">{item.name}</div>
                                    <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 text-xs text-gray-400 font-medium uppercase tracking-wider">
                        {currentTrends.map((item, i) => (
                            <span key={i} className="truncate max-w-[60px] text-center" title={item.name}>
                                {item.name}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Recent Activity</h2>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[400px]">
                        {loading ? (
                            <div className="text-center py-8 text-gray-500">Loading activity...</div>
                        ) : stats.recentActivity.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <div className="bg-white p-3 rounded-full shadow-sm w-12 h-12 flex items-center justify-center mx-auto mb-3">
                                    <Activity className="text-gray-400" size={20} />
                                </div>
                                <h3 className="text-gray-900 font-medium mb-1">No recent activity</h3>
                                <p className="text-gray-500 text-sm">New transactions will appear here.</p>
                            </div>
                        ) : (
                            stats.recentActivity.map((activity, index) => (
                                <div key={index} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                        {activity.userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {activity.userName}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {activity.items.length} items • ₹{Number(activity.amount).toFixed(2)}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            {new Date(activity.date).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
