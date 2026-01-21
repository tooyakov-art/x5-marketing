import React, { useState, useEffect } from 'react';
import { X, Check, Zap, Crown, ShieldCheck, CheckCircle } from 'lucide-react';
import { sendToApp, isMobileApp } from '../utils/appBridge';
import { NativeBridge } from '../services/nativeBridge';
import { Platform, User } from '../types';
import { t } from '../services/translations';
import { motion, AnimatePresence } from 'framer-motion';

// Lemon Squeezy Checkout URLs
const LEMON_SQUEEZY_YEARLY = 'https://x5ai.lemonsqueezy.com/buy/YOUR_YEARLY_PRODUCT_ID';
const LEMON_SQUEEZY_MONTHLY = 'https://x5ai.lemonsqueezy.com/buy/YOUR_MONTHLY_PRODUCT_ID';
const LEMON_SQUEEZY_CREDITS = 'https://x5ai.lemonsqueezy.com/buy/YOUR_CREDITS_PRODUCT_ID';

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

        // Web Flow - Lemon Squeezy Overlay
        let checkoutUrl = LEMON_SQUEEZY_MONTHLY;
        if (selectedProduct === 'x5_pro_yearly') {
            checkoutUrl = LEMON_SQUEEZY_YEARLY;
        } else if (selectedProduct === 'x5_credits_1000') {
            checkoutUrl = LEMON_SQUEEZY_CREDITS;
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
            </div>
        </div>
    );
};
