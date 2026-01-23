import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, AlertTriangle } from 'lucide-react';

interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'default' | 'credits' | 'danger';
  creditCost?: number;
  userCredits?: number;
}

interface ConfirmDialogContextType {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | null>(null);

export const useConfirmDialog = () => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within a ConfirmDialogProvider');
  }
  return context;
};

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    options: ConfirmDialogOptions | null;
    resolve: ((value: boolean) => void) | null;
  }>({ isOpen: false, options: null, resolve: null });

  const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({ isOpen: true, options, resolve });
    });
  }, []);

  const handleConfirm = () => {
    dialogState.resolve?.(true);
    setDialogState({ isOpen: false, options: null, resolve: null });
  };

  const handleCancel = () => {
    dialogState.resolve?.(false);
    setDialogState({ isOpen: false, options: null, resolve: null });
  };

  const options = dialogState.options;

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}

      <AnimatePresence>
        {dialogState.isOpen && options && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              {options.type === 'credits' && (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Zap size={32} className="text-white fill-white" />
                </div>
              )}
              {options.type === 'danger' && (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <AlertTriangle size={32} className="text-white" />
                </div>
              )}

              {/* Title */}
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
                {options.title}
              </h3>

              {/* Message */}
              <p className="text-slate-500 text-center text-sm mb-4">
                {options.message}
              </p>

              {/* Credit Info */}
              {options.type === 'credits' && options.creditCost !== undefined && (
                <div className="bg-slate-100 rounded-2xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-500">Стоимость:</span>
                    <div className="flex items-center gap-1">
                      <Zap size={14} className="text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-slate-900">{options.creditCost}</span>
                    </div>
                  </div>
                  {options.userCredits !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Ваш баланс:</span>
                      <div className="flex items-center gap-1">
                        <Zap size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-slate-900">{options.userCredits}</span>
                      </div>
                    </div>
                  )}
                  {options.userCredits !== undefined && options.creditCost !== undefined && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                      <span className="text-sm text-slate-500">После операции:</span>
                      <div className="flex items-center gap-1">
                        <Zap size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className={`font-bold ${options.userCredits - options.creditCost < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                          {options.userCredits - options.creditCost}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm transition-all active:scale-95"
                >
                  {options.cancelText || 'Отмена'}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
                    options.type === 'danger'
                      ? 'bg-red-500 text-white'
                      : 'bg-slate-900 text-white'
                  }`}
                >
                  {options.confirmText || 'Подтвердить'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmDialogContext.Provider>
  );
};
