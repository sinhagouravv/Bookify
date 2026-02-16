import { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, defaultTab = 'login', onLogin }) => {
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Placeholder for API call
        console.log('Submitting:', activeTab, formData);
        if (onLogin) onLogin();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors z-10"
                >
                    <X size={20} />
                </button>

                <div className="p-8 pb-0 text-center">
                    <div className="inline-flex items-center gap-2 mb-2">
                        <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                            <User size={20} />
                        </div>
                        <span className="font-bold text-xl text-gray-900">Bookify</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {activeTab === 'login' ? 'Welcome Back!' : 'Join Our Community'}
                    </h2>
                    <p className="text-gray-500 text-sm">
                        {activeTab === 'login'
                            ? 'Please enter your details to sign in.'
                            : 'Start your reading journey with us today.'}
                    </p>
                </div>

                <div className="p-8">
                    <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                        <button
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'login'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => setActiveTab('login')}
                        >
                            Sign In
                        </button>
                        <button
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'register'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => setActiveTab('register')}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {activeTab === 'register' && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required={activeTab === 'register'}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {activeTab === 'login' && (
                            <div className="flex justify-end">
                                <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Forgot password?</a>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-gray-900 hover:bg-black text-white py-3.5 rounded-xl font-bold transition-all transform hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2 mt-6"
                        >
                            {activeTab === 'login' ? 'Sign In' : 'Create Account'}
                            <ArrowRight size={18} />
                        </button>
                    </form>
                </div>

                <div className="bg-gray-50 p-4 text-center text-sm font-medium text-gray-500 border-t border-gray-100">
                    By continuing, you agree to our <a href="#" className="text-gray-900 hover:underline">Terms</a> and <a href="#" className="text-gray-900 hover:underline">Privacy Policy</a>.
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
