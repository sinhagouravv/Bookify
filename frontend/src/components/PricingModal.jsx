import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import axios from 'axios';
import useRazorpay from '../hooks/useRazorpay';
import { generateInvoice } from '../utils/invoiceGenerator';

const PricingModal = ({ isOpen, onClose, onUpgradeSuccess }) => {
    const [loadingPlan, setLoadingPlan] = useState(null);
    const isRazorpayLoaded = useRazorpay();
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (isOpen) {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !user) return null;

    const plans = [
        {
            name: 'Basic',
            price: '₹9',
            period: '/month',
            description: 'For casual readers.',
            features: [
                'Access to library collection',
                'Borrow up to 10 books in a month',
                '7 days lending period per book',
                'Book reservation facility',
                'Email due-date reminders',
                'Due-date reminders via email',
                'Standard member assistance'],
            color: 'from-blue-500 to-cyan-500',
            highlighted: false,
        },
        {
            name: 'Premium',
            price: '₹19',
            period: '/month',
            description: 'For avid readers.',
            features: [
                'Access to full library collection',
                'Borrow up to 20 books in a month',
                '15-day lending period per book',
                'Advanced research tools',
                'Priority support',
                'Offline reading mode',
                'Early access to new arrivals'],
            color: 'from-indigo-600 to-violet-600',
            highlighted: true,
        },
        {
            name: 'Elite',
            price: '₹29',
            period: '/month',
            description: 'For power users.',
            features: [
                'Access to full library collection',
                'Borrow up to 30 books in a month',
                '30-day lending period per book',
                'Advanced research tools',
                'Priority support',
                'Offline reading mode',
                'Early access to new arrivals'],
            color: 'from-purple-500 to-pink-500',
            highlighted: false,
        }
    ];

    const currentPlanName = user.membership ? (user.membership.charAt(0).toUpperCase() + user.membership.slice(1)) : 'Regular';
    const planLevels = { 'Regular': -1, 'Basic': 0, 'Premium': 1, 'Elite': 2 };
    const currentLevel = planLevels[currentPlanName] !== undefined ? planLevels[currentPlanName] : -1;

    // Helper: Calculate Pro-rated Price
    const getProrationDetails = (newPlanPrice) => {
        if (!user || !user.orders || currentLevel === -1) return { isProrated: false, finalPrice: newPlanPrice };

        const subscriptionOrders = user.orders
            .filter(o => o.type === 'subscription' || (o.items && o.items[0]?.title.includes('Membership')))
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (subscriptionOrders.length === 0) return { isProrated: false, finalPrice: newPlanPrice };

        const lastOrder = subscriptionOrders[0];
        const lastOrderDate = new Date(lastOrder.date);
        const lastPrice = lastOrder.total || 0; // Assuming total matches the plan price paid

        // If trying to buy same or lower tier, no pro-ration (or handle downgrade differently)
        if (lastPrice >= newPlanPrice) return { isProrated: false, finalPrice: newPlanPrice };

        // Calculate remaining days
        const now = new Date();
        const expiryDate = new Date(lastOrderDate);
        expiryDate.setDate(expiryDate.getDate() + 30); // 30 day cycle

        const timeDiff = expiryDate - now;
        const remainingDays = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

        if (remainingDays <= 0) return { isProrated: false, finalPrice: newPlanPrice };

        // Pro-ration Formula: (New - Old) * (Remaining / 30)
        const priceDiff = newPlanPrice - lastPrice;
        const prorated = priceDiff * (remainingDays / 30);
        const finalPrice = Math.max(1, Math.round(prorated)); // Minimum ₹1 to process

        return { isProrated: true, finalPrice, remainingDays, originalPrice: newPlanPrice };
    };

    const handleSubscribe = async (plan) => {
        if (!isRazorpayLoaded) {
            alert('Payment gateway is loading...');
            return;
        }

        setLoadingPlan(plan.name);
        try {
            const API_URL = import.meta.env.VITE_API_URL;
            const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

            // 1. Get Key
            const { data: { key } } = await axios.get(`${baseUrl}/payment/key`);

            // 2. Create Order
            let amount = parseInt(plan.price.replace('₹', ''));
            const { isProrated, finalPrice } = getProrationDetails(amount);
            amount = finalPrice;

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
                            const newOrder = {
                                date: new Date(),
                                items: [{ title: `${plan.name} Membership`, quantity: 1, id: 'membership', price: amount }],
                                total: amount,
                                paymentId: response.razorpay_payment_id,
                                orderId: response.razorpay_order_id,
                                type: 'subscription'
                            };

                            const updatedUser = {
                                ...user,
                                membership: plan.name.toLowerCase(),
                                orders: [newOrder, ...(user.orders || [])]
                            };
                            localStorage.setItem('user', JSON.stringify(updatedUser));
                            window.dispatchEvent(new Event('storage'));

                            // Auto-generate Invoice
                            const paymentData = {
                                id: response.razorpay_payment_id,
                                date: new Date(),
                                amount: amount,
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

                            // Trigger Success Callback
                            onUpgradeSuccess(plan.name);
                        }
                    } catch (err) {
                        console.error("Upgrade failed:", err);
                        alert("Upgrade failed after payment. Contact support.");
                    } finally {
                        setLoadingPlan(null);
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto transform transition-all scale-100 p-6 md:p-10">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-20"
                >
                    <X size={20} />
                </button>

                <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Upgrade Your Experience
                    </h2>
                    <p className="text-gray-500">Unlock premium features and unlimited reading.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => {
                        const planLevel = planLevels[plan.name] || 0;
                        const isCurrent = plan.name === currentPlanName;
                        const isDowngrade = planLevel < currentLevel;

                        return (
                            <div
                                key={plan.name}
                                className={`relative rounded-2xl p-6 transition-all duration-300 flex flex-col ${plan.highlighted
                                    ? 'bg-gray-900 text-white shadow-xl scale-105 ring-4 ring-indigo-500/20'
                                    : 'bg-white border border-gray-100 hover:border-indigo-100 hover:shadow-lg text-gray-900'
                                    }`}
                            >
                                {plan.highlighted && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                        Recommended
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className={`text-lg font-bold mb-1 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-2">
                                        {(() => {
                                            const planPrice = parseInt(plan.price.replace('₹', ''));
                                            const { isProrated, finalPrice } = getProrationDetails(planPrice);

                                            if (isProrated && !isCurrent && !isDowngrade) {
                                                return (
                                                    <div className="flex flex-col">
                                                        <div className="flex items-baseline gap-1">
                                                            <span className={`text-3xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>₹{finalPrice}</span>
                                                            <span className={`text-sm ${plan.highlighted ? 'text-gray-400' : 'text-gray-500'}`}>pro-rated</span>
                                                        </div>
                                                        <span className={`text-xs line-through ${plan.highlighted ? 'text-gray-500' : 'text-gray-400'}`}>{plan.price}</span>
                                                    </div>
                                                );
                                            }
                                            return (
                                                <>
                                                    <span className={`text-3xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                                                    <span className={`text-sm ${plan.highlighted ? 'text-gray-400' : 'text-gray-500'}`}>{plan.period}</span>
                                                </>
                                            );
                                        })()}
                                    </div>
                                    <p className={`text-sm ${plan.highlighted ? 'text-gray-400' : 'text-gray-500'}`}>{plan.description}</p>
                                </div>

                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <div className={`mt-0.5 p-0.5 rounded-full flex-shrink-0 ${plan.highlighted ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600'
                                                }`}>
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                            <span className={plan.highlighted ? 'text-gray-300' : 'text-gray-600'}>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleSubscribe(plan)}
                                    disabled={loadingPlan === plan.name || isCurrent || isDowngrade}
                                    className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${isCurrent
                                        ? 'bg-gray-100 text-gray-400 cursor-default'
                                        : isDowngrade
                                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                            : plan.highlighted
                                                ? 'bg-white text-gray-900 hover:bg-indigo-50'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'
                                        } ${loadingPlan === plan.name ? 'opacity-70 cursor-wait' : ''}`}
                                >
                                    {loadingPlan === plan.name
                                        ? 'Processing...'
                                        : (isCurrent
                                            ? 'Current Plan'
                                            : (isDowngrade ? 'Included' : `Upgrade to ${plan.name}`))}
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default PricingModal;
