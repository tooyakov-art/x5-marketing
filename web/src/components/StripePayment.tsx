import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe, PaymentRequest } from '@stripe/stripe-js';
import { Loader2, CreditCard, CheckCircle, XCircle } from 'lucide-react';

// Stripe public key from environment
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';

interface StripePaymentProps {
    amount: number; // in cents (e.g., 4990 = 49.90)
    currency?: string;
    productName: string;
    onSuccess: (paymentId: string) => void;
    onError: (error: string) => void;
    onCancel: () => void;
    language?: 'ru' | 'en' | 'kz';
}

export const StripePayment: React.FC<StripePaymentProps> = ({
    amount,
    currency = 'kzt',
    productName,
    onSuccess,
    onError,
    onCancel,
    language = 'ru'
}) => {
    const [stripe, setStripe] = useState<Stripe | null>(null);
    const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
    const [canMakePayment, setCanMakePayment] = useState<boolean | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // Initialize Stripe
    useEffect(() => {
        if (!STRIPE_PUBLIC_KEY) {
            console.error('Stripe public key not configured');
            return;
        }

        loadStripe(STRIPE_PUBLIC_KEY).then(stripeInstance => {
            if (stripeInstance) {
                setStripe(stripeInstance);
            }
        });
    }, []);

    // Create Payment Request (for Google Pay / Apple Pay)
    useEffect(() => {
        if (!stripe) return;

        const pr = stripe.paymentRequest({
            country: 'KZ',
            currency: currency.toLowerCase(),
            total: {
                label: productName,
                amount: amount,
            },
            requestPayerName: true,
            requestPayerEmail: true,
        });

        // Check if Google Pay / Apple Pay is available
        pr.canMakePayment().then(result => {
            if (result) {
                setPaymentRequest(pr);
                setCanMakePayment(true);
            } else {
                setCanMakePayment(false);
            }
        });

        // Handle payment method
        pr.on('paymentmethod', async (event) => {
            setIsProcessing(true);
            setStatus('processing');

            try {
                // In production, you would create a PaymentIntent on your server
                // and confirm it here. For now, we'll simulate success.

                // Simulated server call to create PaymentIntent
                // const response = await fetch('/api/create-payment-intent', {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify({ amount, currency, paymentMethodId: event.paymentMethod.id })
                // });
                // const { clientSecret, error } = await response.json();

                // For demo purposes, simulate success after delay
                await new Promise(resolve => setTimeout(resolve, 2000));

                event.complete('success');
                setStatus('success');
                onSuccess(event.paymentMethod.id);
            } catch (error) {
                event.complete('fail');
                setStatus('error');
                setErrorMessage(language === 'ru' ? 'Ошибка оплаты' : 'Payment failed');
                onError('Payment processing failed');
            } finally {
                setIsProcessing(false);
            }
        });

        pr.on('cancel', () => {
            onCancel();
        });
    }, [stripe, amount, currency, productName, onSuccess, onError, onCancel, language]);

    // Format price for display
    const formatPrice = (cents: number) => {
        const value = cents / 100;
        if (currency.toLowerCase() === 'kzt') {
            return `${value.toLocaleString()} ₸`;
        }
        return `$${value.toFixed(2)}`;
    };

    // Handle manual card payment (fallback)
    const handleCardPayment = async () => {
        if (!stripe) return;

        setIsProcessing(true);
        setStatus('processing');

        try {
            // In production, redirect to Stripe Checkout or show card form
            // For demo, simulate processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            setStatus('success');
            onSuccess('demo_payment_' + Date.now());
        } catch (error) {
            setStatus('error');
            setErrorMessage(language === 'ru' ? 'Ошибка оплаты' : 'Payment failed');
            onError('Card payment failed');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!STRIPE_PUBLIC_KEY) {
        return (
            <div className="text-center p-6">
                <XCircle className="mx-auto text-red-500 mb-3" size={48} />
                <p className="text-red-500 font-medium">
                    {language === 'ru' ? 'Stripe не настроен' : 'Stripe not configured'}
                </p>
                <p className="text-sm text-slate-400 mt-2">
                    {language === 'ru'
                        ? 'Добавьте VITE_STRIPE_PUBLIC_KEY в переменные окружения'
                        : 'Add VITE_STRIPE_PUBLIC_KEY to environment variables'}
                </p>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="text-center p-6 animate-fade-in">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="text-green-500" size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {language === 'ru' ? 'Оплата успешна!' : 'Payment successful!'}
                </h3>
                <p className="text-slate-500">
                    {language === 'ru' ? 'Кредиты зачислены на ваш счёт' : 'Credits added to your account'}
                </p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="text-center p-6 animate-fade-in">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="text-red-500" size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {language === 'ru' ? 'Ошибка оплаты' : 'Payment failed'}
                </h3>
                <p className="text-slate-500 mb-4">{errorMessage}</p>
                <button
                    onClick={() => setStatus('idle')}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold"
                >
                    {language === 'ru' ? 'Попробовать снова' : 'Try again'}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Product Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">{productName}</span>
                    <span className="text-xl font-bold text-slate-900">{formatPrice(amount)}</span>
                </div>
            </div>

            {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="animate-spin text-slate-900 mb-4" size={40} />
                    <p className="text-slate-600 font-medium">
                        {language === 'ru' ? 'Обработка платежа...' : 'Processing payment...'}
                    </p>
                </div>
            ) : (
                <>
                    {/* Google Pay / Apple Pay Button */}
                    {canMakePayment && paymentRequest && (
                        <div className="mb-4">
                            <button
                                onClick={() => paymentRequest.show()}
                                className="w-full py-4 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
                            >
                                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                <span>Google Pay</span>
                            </button>

                            <div className="flex items-center my-4">
                                <div className="flex-1 h-px bg-slate-200"></div>
                                <span className="px-4 text-sm text-slate-400">
                                    {language === 'ru' ? 'или' : 'or'}
                                </span>
                                <div className="flex-1 h-px bg-slate-200"></div>
                            </div>
                        </div>
                    )}

                    {/* Card Payment Button */}
                    <button
                        onClick={handleCardPayment}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
                    >
                        <CreditCard size={20} />
                        <span>
                            {language === 'ru' ? 'Оплатить картой' : 'Pay with card'}
                        </span>
                    </button>

                    {/* Cancel Button */}
                    <button
                        onClick={onCancel}
                        className="w-full py-3 text-slate-500 font-medium"
                    >
                        {language === 'ru' ? 'Отмена' : 'Cancel'}
                    </button>

                    {/* Security Note */}
                    <p className="text-center text-xs text-slate-400 mt-4">
                        <span className="inline-flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                            </svg>
                            {language === 'ru'
                                ? 'Безопасная оплата через Stripe'
                                : 'Secure payment via Stripe'}
                        </span>
                    </p>
                </>
            )}
        </div>
    );
};
