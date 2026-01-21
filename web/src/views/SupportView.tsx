import React from 'react';
import { ChevronLeft, Mail, Phone, MapPin } from 'lucide-react';
import { t } from '../services/translations';
import { Language } from '../types';

interface SupportViewProps {
  language: Language;
  onBack: () => void;
}

export const SupportView: React.FC<SupportViewProps> = ({ language, onBack }) => {
    return (
        <div className="flex flex-col h-full animate-fade-in px-6 pt-16 pb-12 overflow-y-auto">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"><ChevronLeft size={20} /></button>
                <h2 className="text-xl font-bold">{t('settings_support', language)}</h2>
            </div>
            
            <div className="space-y-4">
                <div className="bg-white p-6 rounded-[24px] shadow-sm space-y-4">
                    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                        <Mail className="text-purple-600" size={24} />
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase">Email</p>
                            <p className="text-sm font-bold text-slate-900">adilkhanskii@gmail.com</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                        <Phone className="text-blue-600" size={24} />
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase">Телефон</p>
                            <p className="text-sm font-bold text-slate-900">+7 700 774 4401</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-xl">
                        <MapPin className="text-red-600 mt-1" size={24} />
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase">Юр. адрес</p>
                            <p className="text-sm font-bold text-slate-900">Астана, ГАЗАППАРАТУРА, дом 253</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[24px] shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Реквизиты</h3>
                    <div className="space-y-2 text-xs text-slate-600 font-medium">
                        <p className="flex justify-between"><span className="text-slate-400">Компания:</span> <span className="text-slate-900">ИП СЕЙДАХМЕТОВ</span></p>
                        <p className="flex justify-between"><span className="text-slate-400">ИИН:</span> <span className="text-slate-900">911022351047</span></p>
                        <p className="flex justify-between"><span className="text-slate-400">Директор:</span> <span className="text-slate-900 text-right">Сейдахметов Адильхан Мырзаханулы</span></p>
                        <div className="h-px bg-slate-100 my-2"></div>
                        <p className="flex justify-between"><span className="text-slate-400">Банк:</span> <span className="text-slate-900">АО "Kaspi Bank"</span></p>
                        <p className="flex justify-between"><span className="text-slate-400">БИК:</span> <span className="text-slate-900">CASPKZKA</span></p>
                        <p className="flex justify-between"><span className="text-slate-400">КБе:</span> <span className="text-slate-900">19</span></p>
                        <div className="mt-2">
                            <span className="text-slate-400 block mb-1">IBAN (Счет):</span>
                            <span className="text-slate-900 font-mono bg-slate-50 p-2 rounded-lg block text-center select-all">KZ04722S000022520163</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};