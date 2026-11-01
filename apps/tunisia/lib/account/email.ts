// The sign-in code email, in the customer's language. French and Arabic need a native-speaker review.
import {CODE_TTL_MINUTES} from './auth';
type Locale = 'en' | 'fr' | 'ar';
const words = {
  en: {subject: (c: string) => `Your Plentovo code: ${c}`, hello: 'Your sign-in code is', valid: `It works for ${CODE_TTL_MINUTES} minutes, once.`, ignore: 'If you did not ask for this, you can ignore this email. Nobody can sign in without the code.'},
  fr: {subject: (c: string) => `Votre code Plentovo : ${c}`, hello: 'Votre code de connexion est', valid: `Il est valable ${CODE_TTL_MINUTES} minutes, une seule fois.`, ignore: 'Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail. Personne ne peut se connecter sans le code.'},
  ar: {subject: (c: string) => `رمزك في Plentovo: ${c}`, hello: 'رمز تسجيل الدخول الخاص بك هو', valid: `صالح لمدة ${CODE_TTL_MINUTES} دقائق ولمرة واحدة.`, ignore: 'إذا لم تطلب هذا الرمز فتجاهل هذه الرسالة. لا يمكن لأحد تسجيل الدخول دون الرمز.'},
} as const;
export function codeEmail(locale: Locale, code: string) {
  const w = words[locale], rtl = locale === 'ar';
  return {subject: w.subject(code), html: `<div dir="${rtl ? 'rtl' : 'ltr'}" style="font-family:Arial,sans-serif;font-size:15px;color:#171B20;max-width:480px;text-align:${rtl ? 'right' : 'left'};"><p style="margin:0 0 12px;font-weight:bold;color:#DA292B;font-size:18px;">Plentovo</p><p style="margin:0 0 8px;">${w.hello}</p><p dir="ltr" style="margin:0 0 12px;font-size:32px;font-weight:bold;letter-spacing:6px;">${code}</p><p style="margin:0 0 12px;">${w.valid}</p><p style="margin:0;font-size:12px;color:#8a8a8a;">${w.ignore}</p></div>`};
}
