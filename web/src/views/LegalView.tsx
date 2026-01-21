
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Terminal, CheckCircle2 } from 'lucide-react';
import { Language } from '../types';

interface LegalViewProps {
  type: 'offer' | 'privacy' | 'payment';
  language: Language;
  onBack: () => void;
}

export const LegalView: React.FC<LegalViewProps> = ({ type, language, onBack }) => {
    const [secretCode, setSecretCode] = useState('');
    const [devActivated, setDevActivated] = useState(false);

    useEffect(() => {
        if (secretCode === '123123') {
            localStorage.setItem('x5_dev_mode', 'true');
            setDevActivated(true);
            if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
            
            // Auto hide message after 2s
            setTimeout(() => {
                setSecretCode('');
                // Optional: Auto back to settings
                // onBack(); 
            }, 2000);
        }
    }, [secretCode]);

    return (
        <div className="flex flex-col h-full animate-fade-in px-6 pt-16 pb-12 overflow-hidden bg-white md:bg-transparent relative">
            
            {/* Dev Mode Toast */}
            {devActivated && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50 animate-scale-in">
                    <CheckCircle2 className="text-green-400" size={20} />
                    <span className="font-bold text-sm">Режим разработчика: ON</span>
                </div>
            )}

            <div className="flex items-center gap-4 mb-4 shrink-0">
                <button onClick={onBack} className="w-10 h-10 bg-slate-100 md:bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"><ChevronLeft size={20} /></button>
                <h2 className="text-xl font-bold text-slate-900">
                    {type === 'offer' ? 'Публичная оферта' : (type === 'privacy' ? 'Конфиденциальность' : 'Оплата и Возврат')}
                </h2>
            </div>
            <div className="bg-white p-6 rounded-[24px] shadow-sm flex-1 overflow-y-auto text-sm text-slate-600 leading-relaxed border border-slate-100">
                
                {/* --- PUBLIC OFFER --- */}
                {type === 'offer' && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-900 text-lg">Договор публичной оферты</h3>
                        <p>ИП "СЕЙДАХМЕТОВ", именуемое в дальнейшем «Исполнитель», предлагает любому физическому или юридическому лицу, именуемому в дальнейшем «Заказчик», заключить договор на условиях, изложенных ниже.</p>
                        
                        <h4 className="font-bold text-slate-900 mt-4">1. Предмет договора</h4>
                        <p>1.1. Исполнитель обязуется предоставить Заказчику доступ к программному комплексу «X5» (далее – Сервис) для генерации контента, создания документов и использования ИИ-инструментов, а Заказчик обязуется оплатить эти услуги.</p>
                        <p>1.2. Услуги оказываются путем предоставления доступа к функционалу Сервиса через сеть Интернет.</p>

                        <h4 className="font-bold text-slate-900 mt-4">2. Стоимость услуг и порядок расчетов</h4>
                        <p>2.1. Стоимость услуг определяется в соответствии с Тарифами, размещенными в разделе «Моя подписка» и на странице оплаты.</p>
                        <p>2.2. Единица тарификации – 1 Кредит (внутренняя расчетная единица). Стоимость пакета "Pro" составляет 4 990 тенге.</p>
                        <p>2.3. Оплата производится в безналичном порядке банковской картой через платежную систему Freedom Pay.</p>
                        <p>2.4. Услуга считается оказанной с момента зачисления Кредитов на баланс аккаунта Заказчика или активации статуса "Pro".</p>

                        <h4 className="font-bold text-slate-900 mt-4">3. Условия возврата</h4>
                        <p>3.1. В соответствии с законодательством РК, возврат денежных средств за оказанные цифровые услуги надлежащего качества (предоставленный доступ) не производится.</p>
                        <p>3.2. В случае технической ошибки (двойное списание), возврат осуществляется на ту же карту в течение 5-30 рабочих дней по заявлению Заказчика на email: adilkhanskii@gmail.com.</p>

                        <h4 className="font-bold text-slate-900 mt-4">4. Права и обязанности сторон</h4>
                        <p>4.1. <b>Исполнитель обязан:</b> обеспечить круглосуточную доступность Сервиса (за исключением времени на тех. работы).</p>
                        <p>4.2. <b>Заказчик обязан:</b> не использовать Сервис для противоправных действий и оплачивать услуги в установленном порядке.</p>

                        <h4 className="font-bold text-slate-900 mt-4">5. Ответственность и разрешение споров</h4>
                        <p>5.1. Стороны несут ответственность в соответствии с законодательством Республики Казахстан.</p>
                        <p>5.2. Все споры решаются путем переговоров. Срок рассмотрения претензии – 30 календарных дней.</p>
                        
                        <h4 className="font-bold text-slate-900 mt-4">6. Реквизиты Исполнителя</h4>
                        <p>ИП СЕЙДАХМЕТОВ<br/>ИИН 911022351047<br/>Адрес: г. Астана, ул. Газаппаратура, 253<br/>Email: adilkhanskii@gmail.com</p>
                    </div>
                )}

                {/* --- PRIVACY POLICY --- */}
                {type === 'privacy' && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-900 text-lg">Политика в отношении обработки персональных данных</h3>
                        
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <p className="font-bold text-blue-800 text-xs uppercase mb-1">Согласие на обработку</p>
                            <p className="text-blue-900 italic">"Регистрируясь в приложении X5, я даю свое безусловное согласие ИП СЕЙДАХМЕТОВ на сбор, обработку, хранение и использование моих персональных данных (Email, имя, фото профиля, платежные данные) в целях предоставления услуг Сервиса."</p>
                        </div>

                        <h4 className="font-bold text-slate-900 mt-4">1. Общие положения</h4>
                        <p>1.1. Настоящая Политика определяет порядок обработки и защиты информации о физических лицах, пользующихся услугами приложения X5.</p>

                        <h4 className="font-bold text-slate-900 mt-4">2. Состав данных</h4>
                        <p>2.1. Мы обрабатываем следующие данные: адрес электронной почты, имя пользователя, файлы cookies, данные об использовании приложения.</p>

                        <h4 className="font-bold text-slate-900 mt-4">3. Цели обработки</h4>
                        <p>3.1. Идентификация стороны в рамках соглашений; предоставление пользователю персонализированных услуг; связь с пользователем; улучшение качества приложения.</p>

                        <h4 className="font-bold text-slate-900 mt-4">4. Передача данных</h4>
                        <p>4.1. Персональные данные Пользователя не передаются третьим лицам, за исключением случаев, прямо предусмотренных законодательством (запросы госорганов) и для проведения платежей (платежному шлюзу).</p>

                        <h4 className="font-bold text-slate-900 mt-4">5. Безопасность</h4>
                        <p>5.1. Приложение принимает необходимые и достаточные организационные и технические меры для защиты персональной информации от неправомерного доступа.</p>
                    </div>
                )}

                {/* --- PAYMENT RULES --- */}
                {type === 'payment' && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-900 text-lg">Процедура оплаты и безопасность</h3>
                        
                        <div className="flex gap-4 items-center py-4 border-b border-slate-100">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-6" alt="Visa" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-6" alt="Mastercard" />
                            <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">Freedom Pay</span>
                        </div>

                        <h4 className="font-bold text-slate-900 mt-2">1. Способы оплаты</h4>
                        <p>Оплата услуг осуществляется банковскими картами Visa и MasterCard через безопасный платежный шлюз Freedom Pay.</p>

                        <h4 className="font-bold text-slate-900 mt-4">2. Процесс оплаты</h4>
                        <ul className="list-decimal pl-4 space-y-2">
                            <li>Выберите тариф или пакет кредитов в приложении.</li>
                            <li>Нажмите кнопку «Оплатить».</li>
                            <li>Вы будете перенаправлены на защищенную страницу платежной системы Freedom Pay.</li>
                            <li>Введите данные банковской карты (номер, срок действия, CVC/CVV код).</li>
                            <li>Подтвердите операцию кодом из SMS (3D Secure).</li>
                            <li>После успешной оплаты вы автоматически вернетесь в приложение, и услуга будет активирована мгновенно.</li>
                        </ul>

                        <h4 className="font-bold text-slate-900 mt-4">3. Безопасность платежей</h4>
                        <p>Ваши данные надежно защищены. Мы не храним полные данные ваших банковских карт. Ввод и обработка конфиденциальных платежных данных производится на стороне процессингового центра. Платежная страница защищена сертификатом SSL.</p>
                    </div>
                )}

                <div className="mt-8 border-t border-slate-100 pt-4 flex justify-between items-end">
                    <p className="text-xs text-slate-400">Редакция от: 01.03.2025</p>
                    
                    {/* SECRET INPUT FOR ADMIN - NOW VISIBLE FOR EASE OF USE */}
                    {type === 'offer' && (
                        <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                            <Terminal size={12} className="text-slate-400" />
                            <input 
                                type="text" 
                                value={secretCode}
                                onChange={(e) => setSecretCode(e.target.value)}
                                placeholder="ADMIN CODE"
                                className="w-24 bg-transparent border-none text-[10px] font-mono text-slate-600 focus:ring-0 focus:outline-none tracking-widest"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
