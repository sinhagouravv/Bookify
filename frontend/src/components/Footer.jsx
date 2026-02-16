import React, { useState } from 'react';
import { BookOpen, Github, Twitter, Linkedin, Facebook, Instagram, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import FooterPolicyModal from './FooterPolicyModal';

const Footer = () => {
    const location = useLocation();
    const isAuthPage = ['/login', '/signup'].includes(location.pathname);
    const [policyModal, setPolicyModal] = useState({ isOpen: false, type: 'terms' });

    const openPolicy = (type, e) => {
        e.preventDefault();
        setPolicyModal({ isOpen: true, type });
    };

    if (isAuthPage) return null;
    return (
        <footer className="bg-white border-t border-gray-100 pt-6 pb-5 ">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12 mb-1">
                    <div className="col-span-2 text-center md:col-span-1">
                        <div className="text-center gap-2 text-xl font-bold text-gray-900 mb-1">
                            Bookifyyy
                        </div>
                        <p className="text-gray-500 leading-relaxed mb-6">
                            Empowering library and reader's with a modern seamless management experience.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors"><Twitter size={18} /></a>
                            <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors"><Facebook size={18} /></a>
                            <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors"><Instagram size={18} /></a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900  text-center mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-sm text-center text-gray-500">
                            <li>
                                <button
                                    onClick={() => {
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                        if (location.pathname !== '/') {
                                            navigate('/');
                                        }
                                    }}
                                    className="hover:text-indigo-600 transition-colors"
                                >
                                    Home
                                </button>
                            </li>
                            <li><Link to="/explore" className="hover:text-indigo-600 transition-colors">Catalog</Link></li>
                            <li>
                                {(() => {
                                    const user = localStorage.getItem('user');
                                    return user ? (
                                        <Link to="/profile" state={{ openUpgrade: true }} className="hover:text-indigo-600 transition-colors">Upgrade</Link>
                                    ) : (
                                        <Link to="/" state={{ targetId: 'pricing' }} className="hover:text-indigo-600 transition-colors">Pricing</Link>
                                    );
                                })()}
                            </li>
                            <li><Link to="/profile?tab=issued" state={{ openRenew: true }} className="hover:text-indigo-600 transition-colors">Renew</Link></li>
                            <li><Link to="/profile?tab=issued" state={{ openReturn: true }} className="hover:text-indigo-600 transition-colors">Return</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 text-center mb-4">User Links</h4>
                        <ul className="space-y-2 text-sm text-center text-gray-500">
                            <li><Link to="/profile" className="hover:text-indigo-600 transition-colors">My Account</Link></li>
                            <li><Link to="/profile?tab=issued" className="hover:text-indigo-600 transition-colors">Issued Books</Link></li>
                            <li><Link to="/profile?tab=history" className="hover:text-indigo-600 transition-colors">Reading History</Link></li>
                            <li><Link to="/profile?tab=payments" className="hover:text-indigo-600 transition-colors">Payments</Link></li>
                            <li><Link to="/profile?tab=notifications" className="hover:text-indigo-600 transition-colors">Notifications</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 text-center mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-center text-gray-500">
                            <li>
                                <button
                                    onClick={() => {
                                        if (location.pathname !== '/') {
                                            navigate('/', { state: { targetId: 'about' } });
                                        } else {
                                            document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                                        }
                                    }}
                                    className="hover:text-indigo-600 transition-colors"
                                >
                                    About Us
                                </button>
                            </li>
                            <li><button onClick={(e) => openPolicy('careers', e)} className="hover:text-indigo-600 transition-colors">Careers</button></li>
                            <li><button onClick={(e) => openPolicy('faq', e)} className="hover:text-indigo-600 transition-colors">FAQ's</button></li>
                            <li><button onClick={(e) => openPolicy('support', e)} className="hover:text-indigo-600 transition-colors">Support</button></li>
                            <li><button onClick={(e) => openPolicy('help', e)} className="hover:text-indigo-600 transition-colors">Help Center</button></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 text-center mb-4 ml-7">
                            For business
                            <sup className="text-[9px] font-bold text-indigo-600 uppercase tracking-wide ml-1 relative -top-2 cursor-pointer group">
                                BETA
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] normal-case font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 text-center shadow-lg leading-tight">
                                    Our Business section is currently under development, but you may still submit your application.
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                            </sup>
                        </h4>
                        <ul className="space-y-2 text-sm text-center text-gray-500">
                            <li><button onClick={(e) => openPolicy('partner', e)} className="hover:text-indigo-600 transition-colors">Partner with us</button></li>
                            <li><button onClick={(e) => openPolicy('advertise', e)} className="hover:text-indigo-600 transition-colors">Advertise with us</button></li>
                            <li><button onClick={(e) => openPolicy('publisher', e)} className="hover:text-indigo-600 transition-colors">Become a Publisher</button></li>
                            <li><button onClick={(e) => openPolicy('moderator', e)} className="hover:text-indigo-600 transition-colors">Become a Moderator</button></li>
                            <li><button onClick={(e) => openPolicy('developer', e)} className="hover:text-indigo-600 transition-colors">Become a Developer</button></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row justify-center gap-6 md:gap-11 items-center text-xs text-gray-400">
                    <p>&copy; 2026 Bookify Systems. All rights reserved</p>
                    <div className="flex gap-4 md:gap-11 flex-wrap justify-center">
                        <button onClick={(e) => openPolicy('terms', e)} className="hover:text-gray-600 transition-colors">Terms of Service</button>
                        <button onClick={(e) => openPolicy('privacy', e)} className="hover:text-gray-600 transition-colors">Privacy Policy</button>
                        <button onClick={(e) => openPolicy('security', e)} className="hover:text-gray-600 transition-colors">Security</button>
                        <button onClick={(e) => openPolicy('status', e)} className="hover:text-gray-600 transition-colors">Status</button>
                        <button onClick={(e) => openPolicy('docs', e)} className="hover:text-gray-600 transition-colors">Docs</button>
                        <button onClick={(e) => openPolicy('refund', e)} className="hover:text-gray-600 transition-colors">Refund Policy</button>
                        <button onClick={(e) => openPolicy('community', e)} className="hover:text-gray-600 transition-colors">Community</button>
                        <button onClick={(e) => openPolicy('cookie', e)} className="hover:text-gray-600 transition-colors">Cookie Policy</button>
                    </div>
                </div>
            </div>

            <FooterPolicyModal
                isOpen={policyModal.isOpen}
                onClose={() => setPolicyModal({ ...policyModal, isOpen: false })}
                type={policyModal.type}
            />
        </footer>
    );
};

export default Footer;
