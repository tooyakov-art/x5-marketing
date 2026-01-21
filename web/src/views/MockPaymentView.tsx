
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface MockPaymentViewProps {
  onSuccess: () => void;
  onCancel: () => void;
  price?: number;
  title?: string;
}

export const MockPaymentView: React.FC<MockPaymentViewProps> = ({ onSuccess, onCancel, price = 4990, title = 'X5 Pro' }) => {
  const [processing, setProcessing] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    // Simulate bank processing delay
    setTimeout(() => {
      onSuccess();
    }, 1500);
  };

  const formattedPrice = price.toLocaleString() + ' ₸';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative transform transition-all animate-scale-in">
        <div className="bg-gray-900 p-6 text-white flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Сумма к оплате</p>
            <h1 className="text-3xl font-bold mt-1">{formattedPrice}</h1>
            <p className="text-[10px] text-gray-400 mt-1 truncate max-w-[200px]">{title}</p>
          </div>
          <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center font-bold text-green-400">FP</div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex gap-2">
            <div className="h-8 w-14 bg-white rounded border border-gray-200 flex items-center justify-center p-1">
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-full w-full object-contain" alt="Visa" />
            </div>
            <div className="h-8 w-14 bg-white rounded border border-gray-200 flex items-center justify-center p-1">
               <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-full w-full object-contain" alt="Mastercard" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Номер карты</label>
              <input type="text" readOnly className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 font-mono text-gray-700 outline-none focus:border-green-500 transition-colors" value="4400 4301 9494 4949" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Срок</label>
                <input type="text" readOnly className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 font-mono text-gray-700 outline-none" value="12/28" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">CVV</label>
                <input type="password" readOnly className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 font-mono text-gray-700 outline-none" value="***" />
              </div>
            </div>
          </div>

          <button 
            onClick={handlePay} 
            disabled={processing}
            className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl shadow-lg shadow-green-500/30 transition-all active:scale-95 text-lg flex justify-center items-center gap-2"
          >
            {processing ? <Loader2 className="animate-spin" /> : `Оплатить ${formattedPrice}`}
          </button>
          
          <button 
            onClick={onCancel} 
            disabled={processing}
            className="w-full py-3 text-red-400 font-bold text-sm hover:text-red-600 transition-colors"
          >
            Отменить / Ошибка
          </button>
        </div>
        
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span> Защищено Freedom Pay (Эмуляция)
          </p>
        </div>
      </div>
    </div>
  );
};
