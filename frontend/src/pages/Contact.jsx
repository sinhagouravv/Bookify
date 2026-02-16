import { useState } from 'react';
import { Mail, MapPin, Phone, Send, Sparkles } from 'lucide-react';
import axios from 'axios';

const Contact = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [showPopup, setShowPopup] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // API Call
            const baseUrl = `${import.meta.env.VITE_API_URL}/api`; // Or use from config/env if available in frontend
            await axios.post(`${baseUrl}/messages`, formData);

            setIsSubmitting(false);
            setShowPopup(true);
            setTimeout(() => {
                setShowPopup(false);
                setIsSent(false); // Reset fully
            }, 3000);
            setFormData({ name: '', email: '', message: '' }); // Reset form state

        } catch (error) {
            console.error('Failed to send message:', error);
            setIsSubmitting(false);
            alert('Failed to send message. Please try again.');
        }
    };

    return (
        <div id="contact" className="scroll-mt-1 flex flex-col justify-center pt-20 md:pt-32 pb-10 px-6 bg-gray-50/50 relative overflow-hidden">


            {/* Success Popup */}
            {/* Premium Success Popup */}
            {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowPopup(false)}></div>

                    <div className="relative bg-white rounded-3xl shadow-2xl p-8 md:p-12 flex flex-col items-center gap-6 text-center max-w-sm w-full animate-in zoom-in-95 duration-300">
                        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-2">
                            <svg className="w-12 h-12 text-green-500 animate-in zoom-in duration-500 delay-150" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-3xl font-black text-gray-900 tracking-tight">Sent!</h3>
                            <p className="text-gray-500 font-medium leading-relaxed">
                                Thanks for reaching out! <br /> We'll get back to you shortly.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowPopup(false)}
                            className="mt-4 w-full bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-gray-900/20"
                        >
                            Awesome
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
                <div className="flex flex-col justify-center animate-in slide-in-from-left duration-700 mb-10 fade-in">

                    <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-5 tracking-tight leading-tight">
                        LET'S START A <br />
                        <span className="text-indigo-600">CONVERSATION</span>
                    </h1>

                    <p className="text-base text-gray-600 mb-4 text-justify leading-relaxed max-w-lg font-medium">
                        Have inquiries regarding Bookifyyy? Require any assistance with membership, book access, or partnerships? Our dedicated team is committed to providing comprehensive support, ensuring a seamless and user-friendly library experience. Contact us today to get more information and discover how we can enhance your reading journey. Don’t hesitate to reach out and take the first step towards a more enriching reading experience with Bookifyyy.
                    </p>

                    <div className="space-y-4">
                        <ContactCard
                            icon={Mail}
                            title="Email Us"
                            info={['bookifyyy@gmail.com']}
                            delay="0"
                            color="text-blue-600"
                            bg="bg-blue-50"
                            href="mailto:bookifyyy@gmail.com"
                        />
                        <ContactCard
                            icon={MapPin}
                            title="Visit Us"
                            info={['bookifyyy.com']}
                            delay="200"
                            color="text-purple-600"
                            bg="bg-purple-50"
                        />
                    </div>
                </div>

                <div className="relative animate-in slide-in-from-right duration-700 fade-in mb-15 delay-200">
                    {/* Simplified Glow Effect */}
                    <div className="absolute -inset-1 bg-gray-200 rounded-3xl blur opacity-20"></div>

                    <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-xl border border-white/60">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <Sparkles size={64} className="text-gray-400" />
                        </div>

                        <h3 className="text-2xl font-bold text-center text-gray-900 mb-10">SEND US A MESSAGE</h3>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
                                <InputField
                                    label="Full Name"
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <InputField
                                label="Email Address"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 ml-1">Message</label>
                                <textarea
                                    required
                                    rows="4"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none transition-all resize-none placeholder-gray-400 text-gray-700 hover:bg-gray-50"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || showPopup}
                                className={`group w-full bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-bold transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg flex items-center justify-center gap-3 overflow-hidden relative ${isSubmitting || showPopup ? 'cursor-default opacity-90' : ''}`}
                            >
                                <span className={`transition-all duration-300 ${isSubmitting ? 'opacity-80' : ''}`}>
                                    {isSubmitting ? 'Sending...' : 'Send Message'}
                                </span>

                                {!isSubmitting && !showPopup && (
                                    <Send
                                        size={18}
                                        className="transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                                    />
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ContactCard = ({ icon: Icon, title, info, delay, color, bg, href }) => {
    const Component = href ? 'a' : 'div';
    return (
        <Component
            href={href}
            className={`flex items-start gap-5 p-4 rounded-2xl bg-white shadow-sm hover:bg-gray-50 hover:shadow-md hover:shadow-indigo-100 transition-all duration-300 border border-gray-100 hover:border-indigo-100 group animate-in slide-in-from-bottom-4 fade-in fill-mode-backwards cursor-pointer`}
            style={{ animationDelay: `${delay}ms` }}
            {...(href && href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0 transition-transform duration-300 group-hover:scale-110 ${bg} ${color}`}>
                <Icon size={22} />
            </div>
            <div>
                <h3 className="font-bold text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors">{title}</h3>
                {info.map((line, i) => (
                    <p key={i} className="text-gray-500 text-sm group-hover:text-gray-700 transition-colors">{line}</p>
                ))}
            </div>
        </Component>
    );
};

const InputField = ({ label, type, placeholder, ...props }) => (
    <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 ml-1">{label}</label>
        <input
            type={type}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none transition-all placeholder-gray-400 text-gray-700 hover:bg-gray-50"
            placeholder={placeholder}
            {...props}
        />
    </div>
);

export default Contact;
