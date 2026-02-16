import { useState, useEffect } from 'react';
import { Users, Search, Trash2, Mail, Calendar, Shield } from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, [currentPage, searchTerm]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit: 10,
                search: searchTerm
            });
            const response = await fetch(`http://localhost:5001/api/users?${queryParams}`);
            const data = await response.json();

            setUsers(data.users || []);
            setTotalPages(data.totalPages || 1);
            setTotalUsers(data.totalUsers || 0);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching users:', error);
            setLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                await fetch(`http://localhost:5001/api/users/${id}`, { method: 'DELETE' });
                fetchUsers();
                if (selectedUser && selectedUser._id === id) {
                    setSelectedUser(null);
                }
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    const handleRowClick = (user) => {
        setSelectedUser(user);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">User Management</h1>
                <p className="text-gray-500 mt-2 text-lg">Manage library members and permissions.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase font-semibold">
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Membership</th>
                                <th className="px-6 py-4">Join Date</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-gray-500">Loading users...</td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-gray-500">No users found.</td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr
                                        key={user._id}
                                        onClick={() => handleRowClick(user)}
                                        className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{user.name}</div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Mail size={12} />
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase ${user.membership === 'premium' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                user.membership === 'elite' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                    'bg-green-50 text-green-700 border-green-100'
                                                }`}>
                                                {user.membership || 'Regular'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} className="text-gray-400" />
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={(e) => handleDelete(e, user._id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                title="Delete User"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                        <span className="text-sm text-gray-500">
                            Showing {(currentPage - 1) * 10 + 1}-{Math.min(currentPage * 10, totalUsers)} of {totalUsers} users
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-900">
                                {currentPage}
                            </span>
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {/* User Details Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setSelectedUser(null)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="flex flex-col items-center mb-6">
                            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold mb-4">
                                {selectedUser.name.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h2>
                            <p className="text-gray-500">{selectedUser.email}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Account Details</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="text-gray-500 mb-1">User ID</div>
                                        <div className="font-mono text-gray-900 text-xs truncate" title={selectedUser._id}>{selectedUser._id}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 mb-1">Membership</div>
                                        <div>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border uppercase ${selectedUser.membership === 'premium' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                selectedUser.membership === 'elite' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                    'bg-green-50 text-green-700 border-green-100'
                                                }`}>
                                                {selectedUser.membership || 'Regular'}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 mb-1">Joined On</div>
                                        <div className="font-medium text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 mb-1">Total Orders</div>
                                        <div className="font-medium text-gray-900">{selectedUser.orders?.length || 0}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-gray-500 mb-1">Google ID</div>
                                        <div className="font-mono text-gray-900 text-xs truncate">{selectedUser.googleId || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Orders Preview (if any) */}
                            {selectedUser.orders && selectedUser.orders.length > 0 && (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Recent Orders</h3>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                        {selectedUser.orders.slice(0, 5).map((order, index) => (
                                            <div
                                                key={index}
                                                onClick={() => setSelectedOrder(order)}
                                                className="bg-white p-2.5 rounded-lg border border-gray-200 text-sm flex justify-between items-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
                                            >
                                                <span className="text-gray-600 font-medium group-hover:text-indigo-600">Order #{index + 1}</span>
                                                <span className="text-xs text-gray-400 group-hover:text-indigo-500">
                                                    {order.date ? new Date(order.date).toLocaleDateString() : 'Unknown Date'}
                                                </span>
                                            </div>
                                        ))}
                                        {selectedUser.orders.length > 5 && (
                                            <div className="text-center text-xs text-gray-500 pt-1">
                                                +{selectedUser.orders.length - 5} more orders
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setSelectedOrder(null)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                            <p className="text-sm text-gray-500">
                                {selectedOrder.date ? new Date(selectedOrder.date).toLocaleString() : 'Date Unknown'}
                            </p>
                            {selectedOrder.orderId && (
                                <p className="text-xs font-mono text-gray-400 mt-1">{selectedOrder.orderId}</p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Items</h3>
                                <div className="space-y-3">
                                    {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-start text-sm">
                                            <div>
                                                <div className="font-medium text-gray-900">{item.title}</div>
                                                <div className="text-xs text-gray-500">Qty: {item.quantity || 1}</div>
                                            </div>
                                            <div className="font-semibold text-gray-900">
                                                ₹{item.price}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                                    <span className="font-medium text-gray-900">Total</span>
                                    <span className="text-lg font-bold text-indigo-600">
                                        ₹{selectedOrder.total || selectedOrder.amount || 0}
                                    </span>
                                </div>
                            </div>

                            {selectedOrder.paymentId && (
                                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                                    <Shield size={14} />
                                    <span>Payment Verified: <span className="font-mono">{selectedOrder.paymentId}</span></span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
