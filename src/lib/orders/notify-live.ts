import 'server-only';
import {sendMail} from '@/lib/mail/send';
import {transaction} from '@/lib/experience/store';
import {feesFrom, notifyPaidOrder, recipientsFrom, type NotifyResult, type Queryable} from './notify';

/** The call a verified payment handler makes after it has marked the order PAID. */
export function notifyPaidOrderLive(orderId: string, opts: {force?: boolean; actor?: string | null} = {}): Promise<NotifyResult> {
  return notifyPaidOrder(orderId, opts, {
    transaction: work => transaction(client => work(client as unknown as Queryable)),
    send: mail => sendMail({...mail, tags: {type: 'fulfilment-alert'}}),
    recipients: recipientsFrom(process.env.ORDER_ALERT_EMAIL),
    fees: feesFrom(process.env),
  });
}
