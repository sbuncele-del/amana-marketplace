import {siteUrl} from "./site";
import {sendMail} from "./mail/send";

const APP_URL = siteUrl;

async function sendEmail(to: string, subject: string, html: string) {
  await sendMail({to, subject, html, tags: {type: "transactional"}});
}

// ─── Password Reset ───────────────────────────────────────────────

export async function sendPasswordResetEmail(email: string, token: string, name: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await sendEmail(
    email,
    "Reset your Plentovo password",
    `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #DA292B; font-size: 28px; margin: 0;">Plentovo</h1>
          <p style="color: #666; font-size: 14px; margin-top: 4px;">Good things. Plenty of choice.</p>
        </div>
        <h2 style="color: #171B20; font-size: 20px;">Hi ${name},</h2>
        <p style="color: #444; line-height: 1.6;">You requested to reset your password. Click the button below to create a new one. This link expires in 1 hour.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: #DA292B; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #888; font-size: 13px;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #aaa; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Plentovo. All rights reserved.</p>
      </div>
    `,
  );
}

// ─── Order Confirmation ───────────────────────────────────────────

export async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  order: {
    orderNumber: string;
    totalAmount: number;
    currency: string;
    platformFee: number;
    escrowFee: number;
    shippingCost: number;
    productName: string;
    quantity: number;
    paymentLink?: string | null;
  }
) {
  const orderUrl = `${APP_URL}/orders/${order.orderNumber}`;

  await sendEmail(
    email,
    `Order received — ${order.orderNumber}`,
    `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #DA292B; font-size: 28px; margin: 0;">Plentovo</h1>
        </div>
        <h2 style="color: #171B20;">Hi ${name},</h2>
        <p style="color: #444; line-height: 1.6;">Your order <strong>${order.orderNumber}</strong> has been received. Payment and fulfilment status are shown in your order details.</p>
        <div style="background: #FAF8F5; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #666;">Product</td><td style="text-align: right; font-weight: 600;">${order.quantity}x ${order.productName}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Shipping</td><td style="text-align: right;">${order.currency} ${order.shippingCost.toFixed(2)}</td></tr>
            <tr style="border-top: 1px solid #ddd;"><td style="padding: 10px 0; font-weight: 700;">Total</td><td style="text-align: right; font-weight: 700; color: #DA292B;">${order.currency} ${order.totalAmount.toFixed(2)}</td></tr>
          </table>
        </div>
        ${order.paymentLink ? `
        <div style="text-align: center; margin: 24px 0;">
          <a href="${order.paymentLink}" style="background: #DA292B; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Complete Payment</a>
        </div>` : ""}
        <div style="text-align: center; margin: 16px 0;">
          <a href="${orderUrl}" style="color: #DA292B; font-weight: 600; text-decoration: none;">View Order Details →</a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #aaa; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Plentovo</p>
      </div>
    `,
  );
}

// ─── Shipping Notification ────────────────────────────────────────

export async function sendShippingNotificationEmail(
  email: string,
  name: string,
  order: { orderNumber: string; trackingNumber?: string | null; storeName: string }
) {
  const orderUrl = `${APP_URL}/orders/${order.orderNumber}`;

  await sendEmail(
    email,
    `Your order ${order.orderNumber} has been shipped! 📦`,
    `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #DA292B; font-size: 28px; margin: 0;">Plentovo</h1>
        </div>
        <h2 style="color: #171B20;">Hi ${name},</h2>
        <p style="color: #444; line-height: 1.6;">Great news! <strong>${order.storeName}</strong> has shipped your order <strong>${order.orderNumber}</strong>.</p>
        ${order.trackingNumber ? `<div style="background: #FAF8F5; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;"><p style="color: #666; margin: 0 0 8px;">Tracking Number</p><p style="font-size: 20px; font-weight: 700; color: #171B20; margin: 0; font-family: monospace;">${order.trackingNumber}</p></div>` : ""}
        <p style="color: #444; line-height: 1.6;">For delivery questions or a return request, contact Plentovo. Our published returns policy explains eligibility and refund rights.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${orderUrl}" style="background: #DA292B; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Track Order</a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #aaa; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Plentovo</p>
      </div>
    `,
  );
}

// ─── Escrow Released ──────────────────────────────────────────────

export async function sendEscrowReleasedEmail(
  email: string,
  name: string,
  order: { orderNumber: string; sellerPayout: number; currency: string }
) {
  // Legacy escrow is not an approved Plentovo service.
  void email; void name; void order;
  throw new Error("Legacy escrow notifications are disabled");
}

// ─── Payment Received ─────────────────────────────────────────────

export async function sendPaymentReceivedEmail(
  email: string,
  name: string,
  order: { orderNumber: string; totalAmount: number; currency: string }
) {
  const orderUrl = `${APP_URL}/orders/${order.orderNumber}`;

  await sendEmail(
    email,
    `Payment confirmed for ${order.orderNumber} ✅`,
    `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #DA292B; font-size: 28px; margin: 0;">Plentovo</h1>
        </div>
        <h2 style="color: #171B20;">Hi ${name},</h2>
        <p style="color: #444; line-height: 1.6;">Your payment of <strong>${order.currency} ${order.totalAmount.toFixed(2)}</strong> for order <strong>${order.orderNumber}</strong> has been received.</p>
        <p style="color: #444; line-height: 1.6;">We will update your order as fulfilment progresses.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${orderUrl}" style="background: #DA292B; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">View Order</a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #aaa; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Plentovo</p>
      </div>
    `,
  );
}

// ─── New Order for Seller ─────────────────────────────────────────

export async function sendNewOrderToSellerEmail(
  email: string,
  name: string,
  order: { orderNumber: string; productName: string; quantity: number; sellerPayout: number; currency: string }
) {
  const dashboardUrl = `${APP_URL}/dashboard/orders`;

  await sendEmail(
    email,
    `New order received — ${order.orderNumber} 🎉`,
    `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #DA292B; font-size: 28px; margin: 0;">Plentovo</h1>
        </div>
        <h2 style="color: #171B20;">Hi ${name},</h2>
        <p style="color: #444; line-height: 1.6;">You have a new order!</p>
        <div style="background: #FAF8F5; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #666;">Order</td><td style="text-align: right; font-weight: 600;">${order.orderNumber}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Product</td><td style="text-align: right;">${order.quantity}x ${order.productName}</td></tr>
            <tr style="border-top: 1px solid #ddd;"><td style="padding: 10px 0; font-weight: 700;">Your Payout</td><td style="text-align: right; font-weight: 700; color: #2E7D32;">${order.currency} ${order.sellerPayout.toFixed(2)}</td></tr>
          </table>
        </div>
        <p style="color: #444; line-height: 1.6;">Check the verified payment status before arranging fulfilment.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${dashboardUrl}" style="background: #DA292B; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">View in Dashboard</a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #aaa; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Plentovo</p>
      </div>
    `,
  );
}
