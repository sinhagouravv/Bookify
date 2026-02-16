import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    LayoutDashboard, Search, Filter, Mail, CheckCircle, XCircle,
    Calendar, Eye, MoreHorizontal, ChevronDown, Check, X,
    Briefcase, Building2, Megaphone, Share2, ShieldCheck, Code, FileText
} from 'lucide-react';

const Business = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedApp, setSelectedApp] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/applications');
            setApplications(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching applications:', error);
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await axios.put(`http://localhost:5001/api/applications/${id}/status`, { status: newStatus });
            // Optimistic update
            setApplications(apps => apps.map(app =>
                app._id === id ? { ...app, status: newStatus } : app
            ));
            if (selectedApp && selectedApp._id === id) {
                setSelectedApp({ ...selectedApp, status: newStatus });
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'partner': return Building2;
            case 'advertise': return Megaphone;
            case 'publisher': return Share2;
            case 'moderator': return ShieldCheck;
            case 'developer': return Code;
            default: return FileText;
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-50 text-green-700 border-green-200';
            case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-amber-50 text-amber-700 border-amber-200';
        }
    };

    const filteredApplications = applications.filter(app => {
        const matchesType = filterType === 'all' || app.type === filterType;
        const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
        const matchesSearch = searchTerm === '' ||
            JSON.stringify(app.formData).toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.type.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesType && matchesStatus && matchesSearch;
    });

    const stats = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'pending').length,
        approved: applications.filter(a => a.status === 'approved').length,
        rejected: applications.filter(a => a.status === 'rejected').length
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Business Applications</h1>
                <p className="text-gray-500 mt-2 text-lg">Manage inquiries and applications from partners, advertisers, and more.</p>
            </div>

            {/* Header & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 font-medium">Total Applications</h3>
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 font-medium">Pending Review</h3>
                        <div className="p-2 bg-amber-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-amber-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{stats.pending}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 font-medium">Approved</h3>
                        <div className="p-2 bg-green-50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{stats.approved}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 font-medium">Rejected</h3>
                        <div className="p-2 bg-red-50 rounded-lg">
                            <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{stats.rejected}</div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {['all', 'partner', 'advertise', 'publisher', 'moderator', 'developer'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all whitespace-nowrap ${filterType === type
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search applications..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Applications List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading applications...</div>
                ) : filteredApplications.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No applications found</h3>
                        <p className="text-gray-500">Try adjusting your filters or search terms.</p>
                    </div>
                ) : (
                    filteredApplications.map(app => {
                        const Icon = getIcon(app.type);
                        // Extract primary identifier (Name or Brand Name or Institution Name)
                        const primaryName = app.formData.name || app.formData.brandName || app.formData.institutionName || app.formData.publisherName || 'Unknown Applicant';
                        const email = app.formData.email || 'No email provided';

                        return (
                            <div key={app._id} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-all group">
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${app.type === 'partner' ? 'bg-blue-50 text-blue-600' :
                                        app.type === 'advertise' ? 'bg-purple-50 text-purple-600' :
                                            app.type === 'publisher' ? 'bg-pink-50 text-pink-600' :
                                                app.type === 'moderator' ? 'bg-orange-50 text-orange-600' :
                                                    'bg-teal-50 text-teal-600'
                                        }`}>
                                        <Icon className="w-6 h-6" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="text-lg font-bold text-gray-900 truncate">{primaryName}</h4>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyles(app.status)}`}>
                                                {app.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span className="capitalize font-medium">{app.type} Application</span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                            <span>{email}</span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                            <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto ml-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 mt-4 md:mt-0">
                                        <button
                                            onClick={() => setSelectedApp(app)}
                                            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border border-gray-200"
                                        >
                                            <Eye className="w-4 h-4" /> View Details
                                        </button>

                                        {app.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => updateStatus(app._id, 'approved')}
                                                    className="p-2 bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 rounded-xl transition-all"
                                                    title="Approve"
                                                >
                                                    <Check className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(app._id, 'rejected')}
                                                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl transition-all"
                                                    title="Reject"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Application Detail Modal */}
            {selectedApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedApp(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl shadow-sm ${selectedApp.type === 'partner' ? 'bg-blue-50 text-blue-600' :
                                    selectedApp.type === 'advertise' ? 'bg-purple-50 text-purple-600' :
                                        'bg-indigo-50 text-indigo-600'
                                    }`}>
                                    {React.createElement(getIcon(selectedApp.type), { size: 24 })}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 capitalize">{selectedApp.type} Application</h3>
                                    <p className="text-sm text-gray-500">Submitted on {new Date(selectedApp.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {Object.entries(selectedApp.formData).map(([key, value]) => (
                                    <div key={key} className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                        <div className="text-gray-900 font-medium break-words bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
                                        </div>
                                    </div>
                                ))}
                                {selectedApp.cvUrl && (
                                    <div className="col-span-1 md:col-span-2 space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Attached CV</label>
                                        <div>
                                            <a
                                                href={`http://localhost:5001/${selectedApp.cvUrl}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium border border-indigo-200"
                                            >
                                                <FileText className="w-4 h-4" /> Download/View CV (PDF)
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 bg-gray-50/30 -mx-6 -mb-6 p-6">
                                {selectedApp.status === 'pending' ? (
                                    <>
                                        <button
                                            onClick={() => updateStatus(selectedApp._id, 'rejected')}
                                            className="px-6 py-2.5 bg-white hover:bg-red-50 text-red-600 font-medium rounded-xl border border-gray-200 hover:border-red-200 transition-all flex items-center gap-2 shadow-sm"
                                        >
                                            <X className="w-4 h-4" /> Reject
                                        </button>
                                        <button
                                            onClick={() => updateStatus(selectedApp._id, 'approved')}
                                            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl shadow-lg shadow-green-200 transition-all flex items-center gap-2"
                                        >
                                            <Check className="w-4 h-4" /> Approve
                                        </button>
                                    </>
                                ) : (
                                    <div className={`px-4 py-2 rounded-xl text-sm font-bold border ${getStatusStyles(selectedApp.status)}`}>
                                        {selectedApp.status.toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Business;
