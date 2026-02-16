import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { BookOpen, Mail, Lock, User, ArrowRight, Loader2, Star, FileText, Cookie, X, Eye, EyeOff } from 'lucide-react';
import Logo from '../assets/Logo.svg';

const AuthPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('login');
    const [isLoading, setIsLoading] = useState(false);
    const [activePolicy, setActivePolicy] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    // Forgot Password State
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotStep, setForgotStep] = useState(1);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotOtp, setForgotOtp] = useState('');
    const [newResetPassword, setNewResetPassword] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);

    useEffect(() => {
        if (location.pathname === '/signup') {
            setActiveTab('register');
        } else {
            setActiveTab('login');
        }
    }, [location.pathname]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const handleForgotPassword = async () => {
        if (forgotStep === 1) {
            if (!forgotEmail) return alert('Please enter your email');
            setForgotLoading(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: forgotEmail })
                });
                const data = await res.json();
                if (res.ok) {
                    alert(data.message);
                    setForgotStep(2);
                } else {
                    alert(data.message || 'Failed to send OTP');
                }
            } catch (error) {
                console.error(error);
                alert('Something went wrong');
            } finally {
                setForgotLoading(false);
            }
        } else if (forgotStep === 2) {
            if (!forgotOtp) return alert('Please enter the OTP');
            setForgotLoading(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/auth/verify-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: forgotEmail, otp: forgotOtp })
                });
                const data = await res.json();
                if (res.ok) {
                    alert(data.message);
                    setForgotStep(3);
                } else {
                    alert(data.message || 'Invalid or expired OTP');
                }
            } catch (error) {
                console.error(error);
                alert('Something went wrong');
            } finally {
                setForgotLoading(false);
            }
        } else if (forgotStep === 3) {
            if (!newResetPassword) return alert('Please enter a new password');
            setForgotLoading(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/auth/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, newPassword: newResetPassword })
                });
                const data = await res.json();
                if (res.ok) {
                    alert(data.message);
                    setShowForgotModal(false);
                    setForgotStep(1);
                    setForgotEmail('');
                    setForgotOtp('');
                    setNewResetPassword('');
                    setActiveTab('login');
                } else {
                    alert(data.message || 'Failed to reset password');
                }
            } catch (error) {
                console.error(error);
                alert('Something went wrong');
            } finally {
                setForgotLoading(false);
            }
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        flow: 'auth-code',
        onSuccess: async (codeResponse) => {
            setIsLoading(true);
            try {
                // Send the auth code to the backend
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/auth/google`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: codeResponse.code })
                });

                const data = await response.json();

                if (response.ok) {
                    if (data.isAdmin) {
                        window.location.href = `${window.location.protocol}//${window.location.hostname}:5174`;
                    } else {
                        localStorage.setItem('user', JSON.stringify(data.user));
                        navigate('/');
                    }
                } else {
                    alert(data.message || 'Google Login failed');
                }
            } catch (error) {
                console.error('Google Login Error:', error);
                alert('Connection error');
            } finally {
                setIsLoading(false);
            }
        },
        onError: (error) => {
            console.error('Google Login Error Response:', error);
            alert(`Google Login Failed: ${error?.error_description || error?.details || JSON.stringify(error)}`);
            setIsLoading(false);
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Artificial delay for smoother UX
        await new Promise(r => setTimeout(r, 800));

        if (activeTab === 'login') {
            try {
                // Try User Login First
                let response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: formData.email, password: formData.password })
                });

                // If user not found (404), try Admin Login
                if (response.status === 404) {
                    response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: formData.email, password: formData.password })
                    });
                }

                const data = await response.json();

                if (response.ok) {
                    // Check if admin
                    if (data.isAdmin) {
                        window.location.href = `${window.location.protocol}//${window.location.hostname}:5174`;
                    } else {
                        // Regular user
                        localStorage.setItem('user', JSON.stringify(data.user || data)); // Fallback if user object structure differs
                        navigate('/');
                    }
                } else {
                    alert(data.message || 'Login failed');
                }
            } catch (error) {
                console.error('Login Error:', error);
                alert('Connection error');
            } finally {
                setIsLoading(false);
            }
        } else {
            // Signup Logic
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/auth/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Account created successfully! Please sign in.');
                    setActiveTab('login');
                    navigate('/login');
                } else {
                    alert(data.message || 'Signup failed');
                }
            } catch (error) {
                console.error('Signup Error:', error);
                alert('Connection error');
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Policy Modal Component
    const PolicyModal = ({ isOpen, onClose, title, content, icon: Icon }) => {
        if (!isOpen) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                <Icon size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6 overflow-y-auto custom-scrollbar">
                        {content}
                    </div>
                    <div className="p-4 border-t border-gray-100 bg-gray-50 align-right flex justify-end">
                        <button onClick={onClose} className="px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };



    const ForgotPasswordModal = () => {
        if (!showForgotModal) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 relative">
                    <button
                        onClick={() => { setShowForgotModal(false); setForgotStep(1); }}
                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="p-8">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                                <Lock size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                {forgotStep === 1 ? 'Forgot Password?' : forgotStep === 2 ? 'Verify OTP' : 'Reset Password'}
                            </h3>
                            <p className="text-gray-500 text-sm">
                                {forgotStep === 1
                                    ? 'Enter your email to receive a verification code.'
                                    : forgotStep === 2
                                        ? 'Enter the 6-digit code sent to your email.'
                                        : 'Create a new secure password for your account.'}
                            </p>
                        </div>

                        <div className="space-y-4">
                            {forgotStep === 1 && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase ml-1 mb-3">Email Address</label>
                                    <input
                                        type="email"
                                        className="block w-full mt-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-sm"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                    />
                                </div>
                            )}

                            {forgotStep === 2 && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase ml-1">OTP Code</label>
                                    <input
                                        type="text"
                                        className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-sm text-center tracking-widest text-lg"
                                        placeholder="000000"
                                        value={forgotOtp}
                                        onChange={(e) => setForgotOtp(e.target.value)}
                                        maxLength={6}
                                    />
                                </div>
                            )}

                            {forgotStep === 3 && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase ml-1">New Password</label>
                                    <input
                                        type="password"
                                        className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-sm"
                                        placeholder="New password"
                                        value={newResetPassword}
                                        onChange={(e) => setNewResetPassword(e.target.value)}
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleForgotPassword}
                                disabled={forgotLoading}
                                className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                            >
                                {forgotLoading ? <Loader2 className="animate-spin mx-auto" /> : (forgotStep === 1 ? 'Send OTP' : forgotStep === 2 ? 'Verify Code' : 'Update Password')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const policies = {
        terms: {
            title: 'Terms of Service',
            icon: FileText,
            content: (
                <div className="space-y-4 text-justify text-gray-600">
                    <p><strong>1. Introduction</strong><br />Welcome to Bookify. By accessing our website, you agree to these Terms of Service. Please read them carefully.</p>
                    <p><strong>2. User Accounts</strong><br />You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
                    <p><strong>3. Library Services</strong><br />Bookify provides access to physical and digital books. Users must comply with borrowing limits and return policies.</p>
                    <p><strong>4. Intellectual Property</strong><br />All content included on this site, such as text, graphics, logos, and software, is the property of Bookify or its content suppliers.</p>
                    <p><strong>5. Termination</strong><br />We reserve the right to terminate or suspend your account at our sole discretion, without notice, for conduct that we believe violates these Terms.</p>
                    <p><strong>6. Limitation of Liability</strong><br />Bookify shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use our services.</p>
                    <p><strong>7. Changes to Terms</strong><br />We reserve the right to modify these terms at any time. Your continued use of the service constitutes acceptance of the new terms.</p>
                </div>
            )
        },
        privacy: {
            title: 'Privacy Policy',
            icon: Lock,
            content: (
                <div className="space-y-4 text-justify text-gray-600">
                    <p><strong>1. Information We Collect</strong><br />We collect information you provide directly to us, such as your name, email address, and reading preferences. We also collect usage data automatically.</p>
                    <p><strong>2. How We Use Your Information</strong><br />We use your information to provide, maintain, and improve our services, process transactions, and send you related information.</p>
                    <p><strong>3. Data Sharing</strong><br />We do not share your personal information with third parties except as described in this policy, such as with service providers who assist our operations.</p>
                    <p><strong>4. Data Security</strong><br />We use reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access.</p>
                    <p><strong>5. Cookies</strong><br />We use cookies to improve your experience. You can set your browser to refuse all or some browser cookies.</p>
                    <p><strong>6. Your Rights</strong><br />You have the right to access, correct, or delete your personal information. Contact us for assistance.</p>
                </div>
            )
        },
        cookie: {
            title: 'Cookie Policy',
            icon: Cookie,
            content: (
                <div className="space-y-4 text-justify text-gray-600">
                    <p className="text-sm text-gray-400">Last Updated: February 2026</p>
                    <p>
                        This Cookie Policy explains how Bookify uses cookies and similar technologies to enhance user experience, improve platform performance, and ensure secure operation of our services. By using our website, you agree to the use of cookies in accordance with this policy. Cookies are small text files that are stored on your device when you visit a website. These files help us recognize your browser, remember your preferences, and provide a smoother and more personalized experience. Cookies allow us to maintain login sessions, remember selected settings, and analyze how users interact with our platform.
                    </p>
                    <p>
                        Bookifyyy uses cookies to support essential website functionality, such as secure authentication, session management, and protection against fraudulent activity. Without these cookies, certain parts of the platform may not function properly. We may also use performance and analytics cookies to understand how users navigate our website, which pages are visited most often, and how we can improve usability and performance.
                    </p>
                    <p>
                        In some cases, third-party services integrated into our platform, such as payment processors or analytics providers, may place cookies on your device. These third parties are responsible for their own privacy and cookie practices. Users have the ability to control or disable cookies through their browser settings. Most web browsers allow you to refuse cookies or delete existing ones. However, disabling cookies may affect the functionality and overall experience of the Bookify platform.
                    </p>
                    <p>
                        We may update this Cookie Policy from time to time to reflect changes in technology, legal requirements, or platform improvements. Any updates will be posted on this page with a revised “Last Updated” date. If you have questions regarding our use of cookies, you may contact us at <a href="mailto:bookifyyy@gmail.com" className="text-indigo-600 font-semibold">bookifyyy@gmail.com</a>
                    </p>
                </div>
            )
        }
    };

    return (
        <div className="fixed inset-0 w-full h-full flex bg-gradient-to-br from-indigo-50 via-white to-purple-50 font-['Outfit'] overflow-hidden overscroll-none">

            {activePolicy && (
                <PolicyModal
                    isOpen={!!activePolicy}
                    onClose={() => setActivePolicy(null)}
                    title={policies[activePolicy].title}
                    content={policies[activePolicy].content}
                    icon={policies[activePolicy].icon}
                />
            )}

            <ForgotPasswordModal />

            {/* Background Decorative Elements (Mobile/Tablet) */}
            <div className="lg:hidden absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-60 mix-blend-multiply animate-blob"></div>
                <div className="absolute top-1/2 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl opacity-60 mix-blend-multiply animate-blob animation-delay-2000"></div>
            </div>

            {/* Left Side - Visual & Brand */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0f172a] text-white p-12 xl:p-20 flex-col justify-between z-10 transition-all duration-500 ease-in-out">
                {/* Advanced Animated Background */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600/30 via-transparent to-purple-600/30"></div>

                    {/* Floating Orbs */}
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/30 rounded-full blur-[100px] animate-pulse duration-[4000ms]"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/30 rounded-full blur-[100px] animate-pulse duration-[5000ms] delay-1000"></div>

                    {/* Grid Overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]"></div>
                </div>

                {/* Logo */}
                <div className="relative z-10 animate-in slide-in-from-top-8 duration-700 w-full overflow-hidden">
                    <a href="" className="inline-flex items-center gap-4 group">
                        <img src={Logo} alt="Bookify Logo" className="h-10 w-auto group-hover:scale-105 transition-transform duration-300 drop-shadow-lg" />
                        <span className="text-3xl font-bold text-white tracking-tight drop-shadow-md group-hover:text-indigo-100 transition-colors">Bookifyyy</span>
                    </a>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 max-w-2xl mb-2">
                    <h1 className="text-5xl xl:text-7xl font-bold mb-8 leading-[1.1] tracking-tight animate-in slide-in-from-bottom-8 duration-700 delay-100">
                        Discover worlds <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">beyond details.</span>
                    </h1>

                    <p className="text-lg text-gray-300 mb-12 max-w-lg leading-relaxed animate-in slide-in-from-bottom-8 duration-700 delay-200">
                        Join our community of avid readers. Access thousands of books, track your reading journey, and discuss with fellow bookworms.
                    </p>

                    {/* Premium Testimonial Card */}
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-3xl shadow-2xl relative overflow-hidden group hover:bg-white/10 transition-all duration-500 hover:border-white/20 hover:translate-x-2 animate-in slide-in-from-bottom-8 duration-700 delay-300">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full group-hover:bg-indigo-500/30 transition-colors"></div>

                        <div className="flex items-start gap-5 relative z-10">
                            <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-br from-indigo-400 to-pink-400 shadow-lg">
                                <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-xl font-bold text-white overflow-hidden">
                                    <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User" className="w-full h-full object-cover" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex gap-1 mb-2 text-amber-400">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} fill="currentColor" className="drop-shadow-sm" />)}
                                </div>
                                <p className="text-gray-200 text-lg font-light leading-relaxed italic mb-4">
                                    "The interface is stunningly beautiful and intuitive. It makes managing my reading list an absolute joy."
                                </p>
                                <div>
                                    <p className="font-bold text-white text-base">Elena Rodriguez</p>
                                    <p className="text-sm text-indigo-300 font-medium">Verified Member</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Meta */}
                <div className="relative z-10 flex items-center justify-between text-sm font-medium text-gray-400 border-t border-white/10 pt-8 animate-in fade-in duration-700 delay-500">
                    <p>© 2026 Bookify Inc.</p>
                    <div className="flex gap-8">
                        <button onClick={() => setActivePolicy('privacy')} className="hover:text-white transition-colors cursor-pointer">Privacy Policy</button>
                        <button onClick={() => setActivePolicy('terms')} className="hover:text-white transition-colors cursor-pointer">Terms of Service</button>
                        <button onClick={() => setActivePolicy('cookie')} className="hover:text-white transition-colors cursor-pointer">Cookie Policy</button>
                    </div>
                </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 relative z-20 bg-white/50 lg:bg-transparent">
                {/* Mobile Header */}
                <a href="/" className="lg:hidden absolute top-6 left-6 flex items-center gap-2 text-indigo-600 font-bold z-30">
                    <img src={Logo} alt="Bookify" className="h-8 w-auto" />
                </a>

                <div className="w-full max-w-[500px] bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] p-8 sm:p-12 border border-gray-100 mx-4 animate-in fade-in slide-in-from-bottom-8 duration-700">

                    {/* Header Section */}
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">
                            {activeTab === 'login' ? 'Welcome back' : 'Create an account'}
                        </h2>
                        <p className="text-gray-500 text-sm font-medium">
                            {activeTab === 'login'
                                ? 'Enter your details to access your library'
                                : ''
                            }
                        </p>
                    </div>

                    {/* Custom Tab Switcher */}
                    <div className="bg-gray-50 p-1 rounded-xl flex relative mb-8 border border-gray-100">
                        <div
                            className={`absolute inset-y-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm ring-1 ring-black/5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-0 ${activeTab === 'login' ? 'left-1' : 'left-[calc(50%+2px)]'
                                }`}
                        ></div>
                        <button
                            onClick={() => { setActiveTab('login'); navigate('/login'); }}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 relative z-10 flex items-center justify-center gap-2 ${activeTab === 'login' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => { setActiveTab('register'); navigate('/signup'); }}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 relative z-10 flex items-center justify-center gap-2 ${activeTab === 'register' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Social Login */}
                    <div className="space-y-6 mb-5">
                        <button
                            type="button"
                            onClick={() => handleGoogleLogin()}
                            className="w-full flex justify-center items-center py-3.5 px-6 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group active:scale-[0.98]"
                        >
                            <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Continue with Google
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-widest">
                                <span className="px-4 bg-white text-gray-400 font-medium">Or continue with your details</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {activeTab === 'register' && (
                            <div className="space-y-2.5 group">
                                <label className="text-xs font-bold text-gray-700 uppercase ml-1 mb-3">Full Name</label>
                                <div className="relative mt-1.5">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors duration-300" />
                                    </div>
                                    <input
                                        type="text"
                                        required={activeTab === 'register'}
                                        className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200 font-medium text-sm"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5 group">
                            <label className="text-xs font-bold text-gray-700 uppercase ml-1 mb-3">Email Address</label>
                            <div className="relative mt-1.5">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors duration-300" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200 font-medium text-sm"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 group">
                            <label className="text-xs font-bold text-gray-700 uppercase ml-1 mb-3">Password</label>
                            <div className="relative mt-1.5">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors duration-300" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="block w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200 font-medium text-sm"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-indigo-600 transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {activeTab === 'login' && (
                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            id="remember-me"
                                            name="remember-me"
                                            type="checkbox"
                                            className="sr-only peer"
                                        />
                                        <div className="w-5 h-5 border-2 border-gray-300 rounded-md transition-all group-hover:border-indigo-500 peer-checked:bg-indigo-600 peer-checked:border-indigo-600"></div>
                                        <svg className="w-3 h-3 text-white absolute top-1 left-1 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="ml-2 text-sm text-gray-600 font-medium group-hover:text-gray-900 transition-colors select-none">Remember me</span>
                                </label>
                                <button type="button" onClick={() => setShowForgotModal(true)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-all">
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-6"
                        >
                            {isLoading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    {activeTab === 'login' ? 'Sign In' : 'Create Account'}
                                    <ArrowRight size={18} />
                                </span>
                            )}
                        </button>
                    </form>
                </div>

                {/* Mobile Footer */}
                <div className="mt-8 text-center text-sm text-gray-400 lg:hidden">
                    © 2026 Bookify Inc. All rights reserved.
                </div>
            </div>
        </div>
    );
};


export default AuthPage;
