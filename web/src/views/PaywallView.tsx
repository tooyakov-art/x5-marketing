import React, { useState, useEffect } from 'react';
import { X, Check, Zap, Crown, ShieldCheck, CheckCircle, AlertTriangle, CreditCard } from 'lucide-react';
import { sendToApp, isMobileApp } from '../utils/appBridge';
import { NativeBridge } from '../services/nativeBridge';
import { Platform, User } from '../types';
import { t } from '../services/translations';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/Toast';
import { StripePayment } from '../components/StripePayment';

// Lemon Squeezy Checkout URLs - Configure these in .env.local
// VITE_LEMON_SQUEEZY_YEARLY=https://x5ai.lemonsqueezy.com/buy/xxxxx
// VITE_LEMON_SQUEEZY_MONTHLY=https://x5ai.lemonsqueezy.com/buy/xxxxx
// VITE_LEMON_SQUEEZY_CREDITS=https://x5ai.lemonsqueezy.com/buy/xxxxx
const LEMON_SQUEEZY_YEARLY = import.meta.env.VITE_LEMON_SQUEEZY_YEARLY || '';
const LEMON_SQUEEZY_MONTHLY = import.meta.env.VITE_LEMON_SQUEEZY_MONTHLY || '';
const LEMON_SQUEEZY_CREDITS = import.meta.env.VITE_LEMON_SQUEEZY_CREDITS || '';

// Stripe configuration
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
const USE_STRIPE = !!STRIPE_PUBLIC_KEY; // Use Stripe if key is configured

// Check if payment URLs are configured
const isPaymentConfigured = USE_STRIPE || (LEMON_SQUEEZY_YEARLY && LEMON_SQUEEZY_MONTHLY && LEMON_SQUEEZY_CREDITS &&
  !LEMON_SQUEEZY_YEARLY.includes('YOUR_') &&
  !LEMON_SQUEEZY_MONTHLY.includes('YOUR_') &&
  !LEMON_SQUEEZY_CREDITS.includes('YOUR_'));

interface PaywallViewProps {
    language: string;
    onClose: () => void;
    onBuy?: () => void;
    platform?: Platform;
    user?: User;
}

type ProductId = 'x5_pro_monthly' | 'x5_pro_yearly' | 'x5_credits_1000';

// Lemon Squeezy global
declare global {
    interface Window {
        createLemonSqueezy?: () => void;
        LemonSqueezy?: {
            Url: {
                Open: (url: string) => void;
            };
        };
    }
}

export const PaywallView: React.FC<PaywallViewProps> = ({
    language,
    onClose,
    onBuy,
    platform = 'web',
    user
}) => {
    const { showToast } = useToast();

    // Check if user has active subscription
    const hasActiveSubscription = user?.plan === 'pro' && user?.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date();

    // Determine subscription type
    const hasMonthlySubscription = hasActiveSubscription && user?.subscriptionType === 'monthly';
    const hasYearlySubscription = hasActiveSubscription && user?.subscriptionType === 'yearly';

    // Default product based on subscription status:
    // - No subscription: show yearly (best value)
    // - Monthly subscription: show yearly upgrade
    // - Yearly subscription: show credits only
    const getDefaultProduct = (): ProductId => {
        if (hasYearlySubscription) return 'x5_credits_1000';
        if (hasMonthlySubscription) return 'x5_pro_yearly'; // Upgrade to yearly
        return 'x5_pro_yearly'; // New user
    };

    const [selectedProduct, setSelectedProduct] = useState<ProductId>(getDefaultProduct());
    const [isProcessing, setIsProcessing] = useState(false);
    const [showStripeModal, setShowStripeModal] = useState(false);

    // Get price in cents for Stripe
    const getProductPrice = (product: ProductId): number => {
        switch (product) {
            case 'x5_pro_yearly': return 19900; // $199.00
            case 'x5_pro_monthly': return 1900; // $19.00
            case 'x5_credits_1000': return 900; // $9.00
            default: return 900;
        }
    };

    // Get product name for display
    const getProductName = (product: ProductId): string => {
        switch (product) {
            case 'x5_pro_yearly': return language === 'ru' ? 'X5 Pro Годовой' : 'X5 Pro Yearly';
            case 'x5_pro_monthly': return language === 'ru' ? 'X5 Pro Месячный' : 'X5 Pro Monthly';
            case 'x5_credits_1000': return language === 'ru' ? '1000 Кредитов' : '1000 Credits';
            default: return 'X5 Pro';
        }
    };

    // Handle successful Stripe payment
    const handleStripeSuccess = (paymentId: string) => {
        console.log('[Paywall] Stripe payment success:', paymentId);
        showToast(language === 'ru' ? 'Оплата успешна!' : 'Payment successful!', 'success');

        // Update user credits/subscription based on product
        // This should trigger onBuy callback which updates user state
        if (onBuy) {
            onBuy();
        }

        setTimeout(() => {
            setShowStripeModal(false);
            onClose();
        }, 2000);
    };

    // Handle Stripe payment error
    const handleStripeError = (error: string) => {
        console.error('[Paywall] Stripe payment error:', error);
        showToast(language === 'ru' ? 'Ошибка оплаты' : 'Payment failed', 'error');
    };

    // Handle Stripe cancel
    const handleStripeCancel = () => {
        setShowStripeModal(false);
    };

    // Load Lemon Squeezy script for web
    useEffect(() => {
        if (!isMobileApp() && platform === 'web') {
            const script = document.createElement('script');
            script.src = 'https://app.lemonsqueezy.com/js/lemon.js';
            script.defer = true;
            script.onload = () => {
                window.createLemonSqueezy?.();
            };
            document.head.appendChild(script);
            return () => {
                document.head.removeChild(script);
            };
        }
    }, [platform]);

    const handleSelectProduct = (id: ProductId) => {
        setSelectedProduct(id);
    };

    const handleBuy = () => {
        if (isProcessing) return;
        setIsProcessing(true);

        // Mobile App Flow (In-App Purchase via Flutter)
        if (isMobileApp()) {
            sendToApp('payBridge', selectedProduct);
            setTimeout(() => setIsProcessing(false), 3000);
            return;
        }

        // Native Bridge (Legacy iOS/Android wrapper)
        if (platform === 'ios' || platform === 'android') {
            NativeBridge.triggerHaptic('medium');
            const price = selectedProduct === 'x5_pro_yearly' ? 199 :
                selectedProduct === 'x5_pro_monthly' ? 19 : 9;
            NativeBridge.requestPayment(selectedProduct, price, 'USD');
            setTimeout(() => setIsProcessing(false), 3000);
            return;
        }

        // Web Flow - Use Stripe if configured, otherwise Lemon Squeezy
        if (USE_STRIPE) {
            setShowStripeModal(true);
            setIsProcessing(false);
            return;
        }

        // Fallback: Lemon Squeezy Overlay
        let checkoutUrl = LEMON_SQUEEZY_MONTHLY;
        if (selectedProduct === 'x5_pro_yearly') {
            checkoutUrl = LEMON_SQUEEZY_YEARLY;
        } else if (selectedProduct === 'x5_credits_1000') {
            checkoutUrl = LEMON_SQUEEZY_CREDITS;
        }

        // Validate checkout URL
        if (!checkoutUrl || checkoutUrl.includes('YOUR_')) {
            showToast(
                language === 'ru'
                    ? 'Оплата временно недоступна. Попробуйте позже.'
                    : 'Payment temporarily unavailable. Please try again later.',
                'error'
            );
            setIsProcessing(false);
            console.error('Lemon Squeezy checkout URLs not configured. Set VITE_LEMON_SQUEEZY_* in .env.local');
            return;
        }

        if (window.LemonSqueezy?.Url?.Open) {
            window.LemonSqueezy.Url.Open(checkoutUrl);
        } else {
            window.open(checkoutUrl, '_blank');
        }

        setTimeout(() => setIsProcessing(false), 1000);
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[99999] bg-[#f2f4f6] flex flex-col"
            style={{
                touchAction: 'pan-y',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none'
            }}
        >
            {/* Header */}
            <div
                className="flex-shrink-0 px-5 pb-3 flex justify-between items-center bg-[#f2f4f6] relative z-50"
                style={{
                    paddingTop: 'max(16px, env(safe-area-inset-top, 16px))'
                }}
            >
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-lg">
                        X5
                    </div>
                    <span className="font-extrabold text-slate-900 text-lg uppercase tracking-tight">
                        Pro
                    </span>
                </div>
                <button
                    type="button"
                    onClick={handleClose}
                    className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-md"
                    style={{
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                    }}
                >
                    <X size={22} className="text-slate-900" />
                </button>
            </div>

            {/* Scrollable Content */}
            <div
                className="flex-1 overflow-y-auto px-5"
                style={{
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain',
                    paddingBottom: '200px'
                }}
            >
                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-6 mt-2"
                >
                    <h1 className="text-2xl font-black text-slate-900 mb-2 leading-tight">
                        {t('paywall_title', language)}
                    </h1>
                    <p className="text-sm text-slate-500 font-medium max-w-[260px] mx-auto">
                        {t('paywall_desc', language)}
                    </p>
                </motion.div>

                {/* Product Cards */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="space-y-4 max-w-md mx-auto"
                >

                    {/* Active Subscription Banner */}
                    <AnimatePresence>
                    {hasActiveSubscription && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="w-full p-5 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-2xl"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <CheckCircle size={28} className="text-white" />
                                <div>
                                    <h3 className="font-extrabold text-lg">{t('paywall_active', language)}</h3>
                                    <p className="text-xs text-green-100">
                                        {t('paywall_until', language)}: {user?.subscriptionEndDate ? new Date(user.subscriptionEndDate).toLocaleDateString() : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-white/20 rounded-2xl p-3 mt-2">
                                <p className="text-sm font-semibold text-center">
                                    ✓ {t('paywall_all_features', language)}
                                </p>
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>

                    {/* Credits Card - Always visible, highlighted for subscribers */}
                    <div
                        onClick={() => handleSelectProduct('x5_credits_1000')}
                        className={`relative w-full text-left p-5 rounded-3xl border-2 transition-all duration-200 ${selectedProduct === 'x5_credits_1000'
                            ? 'bg-slate-900 border-slate-900 shadow-2xl'
                            : 'bg-white border-slate-100 shadow-sm opacity-80'
                            }`}
                        style={{
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent',
                            cursor: 'pointer'
                        }}
                    >
                        {hasActiveSubscription && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-400 to-purple-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                                {t('paywall_recommend', language)}
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className={`font-extrabold text-lg ${selectedProduct === 'x5_credits_1000' ? 'text-white' : 'text-slate-900'
                                    }`}>
                                    {t('paywall_credits_1000', language)}
                                </h3>
                                <p className={`text-xs font-medium ${selectedProduct === 'x5_credits_1000' ? 'text-slate-400' : 'text-slate-500'
                                    }`}>
                                    {t('paywall_one_time', language)}
                                </p>
                            </div>
                            {selectedProduct === 'x5_credits_1000' && (
                                <div className="bg-white text-black p-1 rounded-full">
                                    <Check size={14} strokeWidth={4} />
                                </div>
                            )}
                        </div>

                        <div className={`text-xl font-black mb-4 ${selectedProduct === 'x5_credits_1000' ? 'text-white' : 'text-slate-900'
                            }`}>
                            $9
                        </div>

                        <div className="space-y-2">
                            {[t('paywall_credits_feature_1', language), t('paywall_credits_feature_2', language), t('paywall_credits_feature_3', language)].map((f, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Check size={12} className={
                                        selectedProduct === 'x5_credits_1000' ? 'text-green-400' : 'text-green-600'
                                    } />
                                    <span className={`text-[11px] font-bold ${selectedProduct === 'x5_credits_1000' ? 'text-slate-300' : 'text-slate-600'
                                        }`}>
                                        {f}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Yearly Card - Show for: new users OR monthly subscribers (upgrade) */}
                    {(!hasActiveSubscription || hasMonthlySubscription) && (
                        <div
                            onClick={() => handleSelectProduct('x5_pro_yearly')}
                            className={`relative w-full text-left p-5 rounded-3xl border-2 transition-all duration-200 ${selectedProduct === 'x5_pro_yearly'
                                ? 'bg-slate-900 border-slate-900 shadow-2xl'
                                : 'bg-white border-slate-100 shadow-sm opacity-80'
                                }`}
                            style={{
                                touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent',
                                cursor: 'pointer'
                            }}
                        >
                            {/* Badge */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                                {hasMonthlySubscription ? t('paywall_upgrade', language) : t('paywall_best_value', language)}
                            </div>

                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className={`font-extrabold text-lg ${selectedProduct === 'x5_pro_yearly' ? 'text-white' : 'text-slate-900'
                                        }`}>
                                        {hasMonthlySubscription ? t('paywall_upgrade_yearly', language) : t('paywall_yearly', language)}
                                    </h3>
                                    <p className={`text-xs font-medium ${selectedProduct === 'x5_pro_yearly' ? 'text-slate-400' : 'text-slate-500'
                                        }`}>
                                        {hasMonthlySubscription ? t('paywall_save_50', language) : t('paywall_12_months', language)}
                                    </p>
                                </div>
                                {selectedProduct === 'x5_pro_yearly' && (
                                    <div className="bg-white text-black p-1 rounded-full">
                                        <Check size={14} strokeWidth={4} />
                                    </div>
                                )}
                            </div>

                            <div className={`text-xl font-black mb-4 ${selectedProduct === 'x5_pro_yearly' ? 'text-white' : 'text-slate-900'
                                }`}>
                                $199
                            </div>

                            <div className="space-y-2">
                                {[t('paywall_feature_unlimited', language), t('paywall_feature_courses', language), t('paywall_feature_credits_year', language), t('paywall_feature_support', language)].map((f, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <Check size={12} className={
                                            selectedProduct === 'x5_pro_yearly' ? 'text-green-400' : 'text-green-600'
                                        } />
                                        <span className={`text-[11px] font-bold ${selectedProduct === 'x5_pro_yearly' ? 'text-slate-300' : 'text-slate-600'
                                            }`}>
                                            {f}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Monthly Card - Hidden for active subscribers */}
                    {!hasActiveSubscription && (
                        <div
                            onClick={() => handleSelectProduct('x5_pro_monthly')}
                            className={`relative w-full text-left p-5 rounded-3xl border-2 transition-all duration-200 ${selectedProduct === 'x5_pro_monthly'
                                ? 'bg-slate-900 border-slate-900 shadow-2xl'
                                : 'bg-white border-slate-100 shadow-sm opacity-80'
                                }`}
                            style={{
                                touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent',
                                cursor: 'pointer'
                            }}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className={`font-extrabold text-lg ${selectedProduct === 'x5_pro_monthly' ? 'text-white' : 'text-slate-900'
                                        }`}>
                                        {t('paywall_monthly', language)}
                                    </h3>
                                    <p className={`text-xs font-medium ${selectedProduct === 'x5_pro_monthly' ? 'text-slate-400' : 'text-slate-500'
                                        }`}>
                                        {t('paywall_billed_monthly', language)}
                                    </p>
                                </div>
                                {selectedProduct === 'x5_pro_monthly' && (
                                    <div className="bg-white text-black p-1 rounded-full">
                                        <Check size={14} strokeWidth={4} />
                                    </div>
                                )}
                            </div>

                            <div className={`text-xl font-black mb-4 ${selectedProduct === 'x5_pro_monthly' ? 'text-white' : 'text-slate-900'
                                }`}>
                                $19
                            </div>

                            <div className="space-y-2">
                                {[t('paywall_feature_unlimited', language), t('paywall_feature_courses', language), t('paywall_feature_credits_month', language)].map((f, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <Check size={12} className={
                                            selectedProduct === 'x5_pro_monthly' ? 'text-green-400' : 'text-green-600'
                                        } />
                                        <span className={`text-[11px] font-bold ${selectedProduct === 'x5_pro_monthly' ? 'text-slate-300' : 'text-slate-600'
                                            }`}>
                                            {f}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Trust Icons */}
                <div className="mt-8 text-center pb-8">
                    <div className="flex items-center justify-center gap-8 text-slate-400">
                        <div className="flex flex-col items-center gap-1">
                            <ShieldCheck size={24} />
                            <span className="text-[10px] font-bold uppercase">{t('paywall_secure', language)}</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <Zap size={24} />
                            <span className="text-[10px] font-bold uppercase">{t('paywall_fast', language)}</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <Crown size={24} />
                            <span className="text-[10px] font-bold uppercase">{t('paywall_premium', language)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Button */}
            <div
                className="fixed bottom-0 left-0 w-full p-5 bg-white/95 backdrop-blur-xl border-t border-slate-100 z-[60]"
                style={{
                    paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))'
                }}
            >
                <button
                    type="button"
                    onClick={handleBuy}
                    disabled={isProcessing}
                    className="w-full py-4 bg-slate-900 text-white rounded-3xl font-bold text-lg shadow-xl shadow-slate-900/20 disabled:opacity-70 flex items-center justify-center gap-2"
                    style={{
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        minHeight: '56px'
                    }}
                >
                    {isProcessing ? 'Processing...' : (
                        <>
                            <CreditCard size={20} className="mr-1" />
                            <span>
                                {selectedProduct === 'x5_credits_1000'
                                    ? t('paywall_btn_credits', language)
                                    : hasActiveSubscription
                                        ? t('paywall_btn_add_credits', language)
                                        : t('paywall_btn_continue', language)}
                            </span>
                            {!hasActiveSubscription && selectedProduct !== 'x5_credits_1000' && (
                                <span className="px-2 py-0.5 bg-white/20 rounded-lg text-xs">
                                    {t('paywall_trial', language)}
                                </span>
                            )}
                            {selectedProduct === 'x5_credits_1000' && (
                                <span className="px-2 py-0.5 bg-white/20 rounded-lg text-xs">
                                    $9
                                </span>
                            )}
                        </>
                    )}
                </button>

                {/* Google Pay badge */}
                {USE_STRIPE && (
                    <div className="flex items-center justify-center gap-2 mt-3">
                        <span className="text-xs text-slate-400">
                            {language === 'ru' ? 'Поддерживается:' : 'Supported:'}
                        </span>
                        <div className="flex items-center gap-2">
                            <div className="bg-white border border-slate-200 rounded px-2 py-1 flex items-center gap-1">
                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#4285F4">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                <span className="text-[10px] font-bold text-slate-600">Pay</span>
                            </div>
                            <div className="bg-white border border-slate-200 rounded px-2 py-1 flex items-center gap-1">
                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.384a.77.77 0 0 1 .757-.645h6.393c2.108 0 3.6.576 4.43 1.712.381.522.621 1.102.723 1.725.107.654.07 1.426-.11 2.298l-.003.015v.004c-.322 2.106-1.33 3.534-2.996 4.247-.796.339-1.748.509-2.825.509H8.57l-.934 6.09a.773.773 0 0 1-.76.645v-.647z" fill="#002c8a"/>
                                </svg>
                                <span className="text-[10px] font-bold text-slate-600">PayPal</span>
                            </div>
                            <div className="bg-white border border-slate-200 rounded px-2 py-1">
                                <CreditCard size={14} className="text-slate-600" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Stripe Payment Modal */}
            <AnimatePresence>
                {showStripeModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4"
                        onClick={() => setShowStripeModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {language === 'ru' ? 'Оплата' : 'Payment'}
                                </h2>
                                <button
                                    onClick={() => setShowStripeModal(false)}
                                    className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"
                                >
                                    <X size={18} className="text-slate-600" />
                                </button>
                            </div>

                            <StripePayment
                                amount={getProductPrice(selectedProduct)}
                                currency="usd"
                                productName={getProductName(selectedProduct)}
                                onSuccess={handleStripeSuccess}
                                onError={handleStripeError}
                                onCancel={handleStripeCancel}
                                language={language as 'ru' | 'en' | 'kz'}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
