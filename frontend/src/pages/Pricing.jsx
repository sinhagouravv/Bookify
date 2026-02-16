import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useRazorpay from '../hooks/useRazorpay';
import axios from 'axios';
import { generateInvoice } from '../utils/invoiceGenerator';

const Pricing = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loadingPlan, setLoadingPlan] = useState(null);
    const isRazorpayLoaded = useRazorpay();
    const navigate = useNavigate();

    useEffect(() => {
        const user = localStorage.getItem('user');
        setIsLoggedIn(!!user);
    }, []);

    const plans = [
        {
            name: 'Basic',
            price: '₹9',
            period: '/month',
            description: 'For individual readers',
            features: [
                'Access to library collection',
                'Borrow up to 10 books in a month',
                '7 days lending period per book',
                'Book reservation facility',
                'Email due-date reminders',
                'Due-date reminders via email',
                'Standard member assistance'
            ],
            color: 'from-blue-500 to-cyan-500',
            highlighted: false,
            buttonVariant: 'outline'
        },
        {
            name: 'Premium',
            price: '₹19',
            period: '/month',
            description: 'For students and frequent readers',
            features: [
                'Access to full library collection',
                'Borrow up to 20 books in a month',
                '15-day lending period per book',
                'Advanced research tools',
                'Priority support',
                'Offline reading mode',
                'Early access to new arrivals'
            ],
            color: 'from-indigo-600 to-violet-600',
            highlighted: true,
            buttonVariant: 'solid'
        },
        {
            name: 'Elite',
            price: '₹29',
            period: '/month',
            description: 'For institutions, schools & study groups',
            features: [
                'Borrow up to 30 books in a month',
                '30-day lending period per book',
                'Custom lending policies',
                'Access to academic & research collections',
                'Analytics & reporting',
                'Dedicated account manager',
                'Institutional priority support'
            ],
            color: 'from-purple-500 to-pink-500',
            highlighted: false,
            buttonVariant: 'outline'
        }
    ];

    // Determine current plan index for comparison
    const user = isLoggedIn ? JSON.parse(localStorage.getItem('user')) : null;
    // Default to 'Regular' if no membership or empty
    const currentPlanName = user?.membership ? (user.membership.charAt(0).toUpperCase() + user.membership.slice(1)) : 'Regular';

    // Map plan names to value for comparison
    // Regular = -1 (Default/Free, no borrowing)
    // Basic = 0 (Paid, start borrowing)
    const planLevels = { 'Regular': -1, 'Basic': 0, 'Premium': 1, 'Elite': 2 };
    const currentLevel = planLevels[currentPlanName] !== undefined ? planLevels[currentPlanName] : -1;

    const handleSubscribe = async (plan) => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }



        if (!isRazorpayLoaded) {
            alert('Payment gateway is loading...');
            return;
        }

        setLoadingPlan(plan.name);
        try {
            const API_URL = import.meta.env.VITE_API_URL;
            const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
            const user = JSON.parse(localStorage.getItem('user'));

            // 1. Get Key
            const { data: { key } } = await axios.get(`${baseUrl}/payment/key`);

            // 2. Create Order
            // Parse price string "₹19" -> 19
            const amount = parseInt(plan.price.replace('₹', ''));

            const { data: order } = await axios.post(`${baseUrl}/payment/create-order`, {
                amount,
                currency: 'INR'
            });

            // 3. Open Modal
            const options = {
                key,
                amount: order.amount,
                currency: order.currency,
                name: 'Bookify Membership',
                description: `Upgrade to ${plan.name}`,
                order_id: order.id,
                handler: async function (response) {
                    try {
                        // 4. Verify & Upgrade
                        const upgradeRes = await axios.post(`${baseUrl}/payment/upgrade-membership`, {
                            userId: user._id || user.id,
                            plan: plan.name,
                            paymentId: response.razorpay_payment_id,
                            orderId: response.razorpay_order_id
                        });

                        if (upgradeRes.data.success) {
                            // Update local user
                            const updatedUser = { ...user, membership: plan.name.toLowerCase() };
                            localStorage.setItem('user', JSON.stringify(updatedUser));
                            localStorage.setItem('user', JSON.stringify(updatedUser));
                            window.dispatchEvent(new Event('storage')); // Trigger updates

                            // Auto-generate Invoice
                            // Need to construct payment object similar to ProfilePage
                            const paymentData = {
                                id: response.razorpay_payment_id,
                                date: new Date(),
                                amount: amount, // amount is in INR
                                status: 'Completed',
                                itemsCount: 1,
                                items: [{ title: `${plan.name} Membership`, quantity: 1, price: amount }],
                                type: 'subscription',
                                paymentMethod: 'Razorpay',
                                orderId: response.razorpay_order_id,
                                name: user.name,
                                email: user.email
                            };
                            generateInvoice(paymentData, user);

                            // Navigate to Home with success state

                            // Navigate to Home with success state
                            navigate('/', { state: { upgraded: true, plan: plan.name } });
                        }
                    } catch (err) {
                        console.error("Upgrade failed:", err);
                        alert("Upgrade failed after payment. Contact support.");
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone || ''
                },
                theme: { color: '#4F46E5' },
                modal: {
                    ondismiss: () => setLoadingPlan(null)
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                alert(response.error.description);
                setLoadingPlan(null);
            });
            rzp.open();

        } catch (error) {
            console.error("Subscription Error:", error);
            alert("Could not initiate subscription.");
            setLoadingPlan(null);
        }
    };

    return (
        <section id="pricing" className="scroll-mt-14 min-h-screen flex flex-col justify-center py-16 md:py-24 px-6 relative overflow-hidden bg-gray-50/50 pt-[20px]">
            {/* Background Decorations */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10 mt-[-50px]">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                        Simple, Transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Pricing.</span>
                    </h2>
                    <p className="text-xl text-gray-500 leading-relaxed">
                        Choose the plan that best fits your reading needs. No hidden fees, cancel anytime.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    {plans.map((plan, index) => {
                        const planLevel = planLevels[plan.name] || 0;
                        const isCurrent = plan.name === currentPlanName;
                        const isDowngrade = planLevel < currentLevel;

                        return (
                            <div
                                key={plan.name}
                                className={`relative bg-white rounded-3xl p-8 transition-all duration-300 ${plan.highlighted
                                    ? 'shadow-2xl scale-105 border-2 border-indigo-500 z-10'
                                    : 'shadow-lg hover:shadow-xl hover:-translate-y-1 border border-gray-100'
                                    }`}
                            >
                                {plan.highlighted && (
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-indigo-500/30">
                                        Most Popular
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-4">
                                        <span className="text-4xl font-bold text-gray-900 tracking-tight">{plan.price}</span>
                                        <span className="text-gray-500 font-medium">{plan.period}</span>
                                    </div>
                                    <p className="text-gray-500 text-sm leading-relaxed">{plan.description}</p>
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                            <div className={`mt-0.5 p-0.5 rounded-full text-white bg-gradient-to-r ${plan.color}`}>
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleSubscribe(plan)}
                                    disabled={loadingPlan === plan.name || isCurrent || isDowngrade}
                                    className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${isCurrent
                                        ? 'bg-gray-100 text-gray-400 cursor-default border-2 border-gray-100'
                                        : isDowngrade
                                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-2 border-gray-100'
                                            : plan.highlighted
                                                ? 'bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-900/20 hover:scale-[1.02]'
                                                : 'bg-white text-gray-900 border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                        } ${loadingPlan === plan.name ? 'opacity-70 cursor-wait' : ''}`}
                                >
                                    {loadingPlan === plan.name
                                        ? 'Processing...'
                                        : (currentLevel === -1
                                            ? 'Choose Plan'
                                            : (isCurrent
                                                ? 'Current Plan'
                                                : (isDowngrade ? 'Included' : `Upgrade to ${plan.name}`)))}
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    );
};

export default Pricing;
