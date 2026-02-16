import { useState, useEffect } from 'react';
import { Mail, Calendar, Trash2, Search, Filter, X, ChevronDown, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';

const Messages = () => {
    const [messages, setMessages] = useState([]);
    const [filteredMessages, setFilteredMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMessage, setSelectedMessage] = useState(null);

    // Fetch messages
    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/messages');
            if (response.data.success) {
                setMessages(response.data.data);
                setFilteredMessages(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter logic
    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = messages.filter(msg =>
            msg.name.toLowerCase().includes(lowerTerm) ||
            msg.email.toLowerCase().includes(lowerTerm) ||
            msg.subject.toLowerCase().includes(lowerTerm)
        );
        setFilteredMessages(filtered);
    }, [searchTerm, messages]);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this message?')) {
            try {
                await axios.delete(`http://localhost:5001/api/messages/${id}`);
                setMessages(messages.filter(msg => msg._id !== id));
                if (selectedMessage && selectedMessage._id === id) {
                    setSelectedMessage(null);
                }
            } catch (error) {
                console.error('Error deleting message:', error);
                alert('Failed to delete message');
            }
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Messages</h1>
                    <p className="text-gray-500 mt-1">Manage inquiries from the contact form</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="bg-white px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 shadow-sm">
                        Total: {messages.length}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or subject..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">

                {/* Message List */}
                <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Inbox</h3>
                    </div>

                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Loading messages...</div>
                        ) : filteredMessages.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No messages found</div>
                        ) : (
                            filteredMessages.map((msg) => (
                                <div
                                    key={msg._id}
                                    onClick={() => setSelectedMessage(msg)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedMessage?._id === msg._id
                                            ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                            : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`font-bold ${selectedMessage?._id === msg._id ? 'text-indigo-900' : 'text-gray-900'}`}>
                                            {msg.name}
                                        </h4>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                            {new Date(msg.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 truncate mb-1">{msg.subject}</p>
                                    <p className="text-xs text-gray-500 truncate">{msg.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Message Detail View */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    {selectedMessage ? (
                        <div className="flex flex-col h-full">
                            {/* Detail Header */}
                            <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedMessage.subject}</h2>
                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                        <span className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-gray-200">
                                            <Mail size={14} className="text-indigo-500" />
                                            {selectedMessage.email}
                                        </span>
                                        <span className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-gray-200">
                                            <Clock size={14} className="text-gray-400" />
                                            {formatDate(selectedMessage.createdAt)}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(selectedMessage._id, e)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Message"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            {/* Detail Body */}
                            <div className="p-8 overflow-y-auto flex-1 bg-white">
                                <div className="prose prose-indigo max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {selectedMessage.message}
                                </div>
                            </div>

                            {/* Detail Footer (Reply Action) */}
                            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                                <a
                                    href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                                >
                                    <Mail size={18} />
                                    Reply via Email
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Mail size={32} className="text-gray-300" />
                            </div>
                            <p className="font-medium">Select a message to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;
