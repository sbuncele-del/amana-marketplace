import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const sanitizedEmail = email.trim().toLowerCase().slice(0, 254);

    // If Shopify Admin API token is configured, create a customer in Shopify
    const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
    const domain = process.env.SHOPIFY_STORE_DOMAIN;

    if (adminToken && domain) {
      try {
        await fetch(`https://${domain}/admin/api/2026-04/customers.json`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": adminToken,
          },
          body: JSON.stringify({
            customer: {
              email: sanitizedEmail,
              accepts_marketing: true,
              tags: "newsletter,popup-signup",
            },
          }),
        });
      } catch {
        // Don't block response if Shopify call fails
      }
    }

    // If Resend is configured, send a welcome email with discount
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || "hello@primesources.online";
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://primesources.online";

    if (resendKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: `Prime Sources <${fromEmail}>`,
            to: sanitizedEmail,
            subject: "🎉 Your 10% discount is here!",
            html: `
              <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px 24px;background:#fff;">
                <div style="background:linear-gradient(135deg,#1A1A2E,#0F3460);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
                  <h1 style="color:#D4A843;font-size:28px;margin:0 0 8px;">Welcome to Prime Sources!</h1>
                  <p style="color:rgba(255,255,255,0.7);margin:0;">Africa's #1 Online Marketplace</p>
                </div>
                <p style="color:#333;font-size:16px;">Hi there,</p>
                <p style="color:#333;font-size:15px;">Thank you for subscribing! Here is your exclusive welcome discount:</p>
                <div style="background:#FFF8E6;border:2px dashed #D4A843;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
                  <p style="color:#666;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Your Discount Code</p>
                  <p style="color:#1A1A2E;font-size:28px;font-weight:900;letter-spacing:4px;margin:0;">WELCOME10</p>
                  <p style="color:#666;font-size:13px;margin:8px 0 0;">10% off your first order</p>
                </div>
                <p style="color:#333;font-size:15px;">Use code <strong>WELCOME10</strong> at checkout for 10% off everything in our store.</p>
                <div style="text-align:center;margin:32px 0;">
                  <a href="${siteUrl}/browse" style="background:#D4A843;color:#fff;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;">Shop Now →</a>
                </div>
                <p style="color:#999;font-size:12px;text-align:center;">You received this email because you signed up at primesources.online. <a href="#" style="color:#999;">Unsubscribe</a></p>
              </div>
            `,
          }),
        });
      } catch {
        // Don't block response if email fails
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
