import md5 from 'crypto-js/md5';

// Твои данные из личного кабинета
const MERCHANT_ID = "580452"; 
const SECRET_KEY = "4ACPXEUMYE9xfcGO"; 

export const getPaymentData = (amount: number, email?: string) => {
  // Для перехода из браузера на страницу оплаты используется payment.php
  const scriptName = "payment.php"; 
  const baseUrl = `https://api.freedompay.kz/${scriptName}`;
  
  // Создаем уникальный ID заказа на основе времени (как просила поддержка)
  const orderId = `${Date.now()}`;

  const requestObj: Record<string, string> = {
    pg_merchant_id: MERCHANT_ID,
    pg_amount: amount.toString(),
    pg_currency: "KZT",
    pg_description: "Order Purchase",
    pg_order_id: orderId,
    pg_salt: Math.random().toString(36).substring(7),
    pg_testing_mode: "1", // Оставляем "1" для теста, потом поменяешь на "0"
    pg_request_method: "POST", //
    pg_success_url: window.location.origin,
    pg_failure_url: window.location.origin,
    pg_result_url: window.location.origin,
  };

  if (email) {
    requestObj.pg_user_contact_email = email;
  }

  // Генерация подписи ( Signature )
  const sortedKeys = Object.keys(requestObj).sort();
  const sortedValues = sortedKeys.map(key => requestObj[key]);
  
  // Скрипт в начале, параметры в алфавитном порядке, секретный ключ в конце
  const signatureString = [scriptName, ...sortedValues, SECRET_KEY].join(';');
  const signature = md5(signatureString).toString();

  return {
    action: baseUrl,
    params: { ...requestObj, pg_sig: signature }
  };
};