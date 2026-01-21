
import { Platform } from '../types';

type BridgeMessageType = 'PAYMENT_REQUEST' | 'AUTH_STATE' | 'HAPTIC' | 'NAVIGATION' | 'LOGIN_GOOGLE' | 'LOGIN_APPLE';

interface BridgeMessage {
    type: BridgeMessageType;
    payload?: any;
}

export const NativeBridge = {
    /**
     * Post a message to the native iOS/Android wrapper.
     * Supports both legacy webkit handler and Flutter InAppWebView.
     */
    postMessage: (type: BridgeMessageType, payload?: any) => {
        try {
            // Flutter InAppWebView Handler (PRIMARY)
            if ((window as any).flutter_inappwebview && (window as any).flutter_inappwebview.callHandler) {
                (window as any).flutter_inappwebview.callHandler('nativeBridge', JSON.stringify({ type, payload }));
                console.log(`[NativeBridge] Sent to Flutter: ${type}`, payload);
                return;
            }

            // iOS WKWebView Handler (Legacy)
            if ((window as any).webkit && (window as any).webkit.messageHandlers && (window as any).webkit.messageHandlers.x5App) {
                (window as any).webkit.messageHandlers.x5App.postMessage({ type, payload });
                console.log(`[NativeBridge] Sent to iOS: ${type}`, payload);
                return;
            }

            // Android Handler (Legacy)
            if ((window as any).x5App && (window as any).x5App.postMessage) {
                (window as any).x5App.postMessage(JSON.stringify({ type, payload }));
                console.log(`[NativeBridge] Sent to Android: ${type}`, payload);
                return;
            }

            console.warn(`[NativeBridge] Native handler not found. Message ignored: ${type}`);
        } catch (e) {
            console.error("[NativeBridge] Error sending message", e);
        }
    },

    /**
     * Request a native payment flow.
     */
    requestPayment: (productId: string, price: number, currency = 'USD') => {
        NativeBridge.postMessage('PAYMENT_REQUEST', { productId, price, currency });
    },

    /**
     * Trigger native haptic feedback.
     */
    triggerHaptic: (style: 'light' | 'medium' | 'heavy' = 'medium') => {
        NativeBridge.postMessage('HAPTIC', { style });
    },

    /**
     * Request native Google Login via Flutter.
     * Flutter should listen for 'authBridge' handler and check for 'google' provider.
     */
    loginGoogle: () => {
        // Try Flutter authBridge first
        if ((window as any).flutter_inappwebview && (window as any).flutter_inappwebview.callHandler) {
            (window as any).flutter_inappwebview.callHandler('authBridge', 'google');
            console.log('[NativeBridge] Sent authBridge:google to Flutter');
            return;
        }
        // Fallback to legacy
        NativeBridge.postMessage('LOGIN_GOOGLE');
    },

    /**
     * Request native Apple Login via Flutter.
     * Flutter should listen for 'authBridge' handler and check for 'apple' provider.
     */
    loginApple: () => {
        // Try Flutter authBridge first
        if ((window as any).flutter_inappwebview && (window as any).flutter_inappwebview.callHandler) {
            (window as any).flutter_inappwebview.callHandler('authBridge', 'apple');
            console.log('[NativeBridge] Sent authBridge:apple to Flutter');
            return;
        }
        // Fallback to legacy
        NativeBridge.postMessage('LOGIN_APPLE');
    }
};
