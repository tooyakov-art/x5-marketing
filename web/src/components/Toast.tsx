import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const getToastIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return <Check size={18} className="text-white" />;
    case 'error':
      return <X size={18} className="text-white" />;
    case 'warning':
      return <AlertTriangle size={18} className="text-white" />;
    case 'info':
      return <Info size={18} className="text-white" />;
  }
};

const getToastStyles = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'bg-emerald-500';
    case 'error':
      return 'bg-red-500';
    case 'warning':
      return 'bg-amber-500';
    case 'info':
      return 'bg-blue-500';
  }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const toast: Toast = { id, message, type, duration };

    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-0 left-0 right-0 z-[99999] flex flex-col items-center pt-4 pointer-events-none" style={{ paddingTop: 'max(16px, env(safe-area-inset-top, 16px))' }}>
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="pointer-events-auto mb-2"
            >
              <div
                className={`${getToastStyles(toast.type)} px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 max-w-[90vw] mx-4`}
                onClick={() => hideToast(toast.id)}
              >
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  {getToastIcon(toast.type)}
                </div>
                <span className="text-white font-semibold text-sm">{toast.message}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
