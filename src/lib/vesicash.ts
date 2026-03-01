// Vesicash Escrow Integration
// Docs: https://docs.vesicash.com

const VESICASH_API_URL = process.env.VESICASH_API_URL || "https://sandbox.api.vesicash.com";
const VESICASH_PRIVATE_KEY = process.env.VESICASH_PRIVATE_KEY || "";

interface VesicashTransaction {
  transaction_id: string;
  status: string;
  amount: number;
  currency: string;
}

async function vesicashRequest(endpoint: string, method: string, body?: unknown) {
  const response = await fetch(`${VESICASH_API_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "V-PRIVATE-KEY": VESICASH_PRIVATE_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Vesicash API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function createEscrowTransaction(params: {
  orderId: string;
  amount: number;
  currency: string;
  buyerEmail: string;
  sellerEmail: string;
  title: string;
  description: string;
  inspectionPeriodDays?: number;
}): Promise<VesicashTransaction> {
  const data = await vesicashRequest("/v2/transactions/create", "POST", {
    title: params.title,
    type: "milestone",
    description: params.description,
    parties: {
      buyer: params.buyerEmail,
      seller: params.sellerEmail,
    },
    amount: params.amount,
    currency: params.currency,
    inspection_period: (params.inspectionPeriodDays || 3) * 86400, // seconds
    reference: params.orderId,
  });

  return data.data;
}

export async function fundEscrow(transactionId: string, paymentMethod: string) {
  const data = await vesicashRequest(`/v2/transactions/${transactionId}/fund`, "POST", {
    payment_method: paymentMethod,
  });
  return data.data;
}

export async function releaseEscrow(transactionId: string) {
  const data = await vesicashRequest(`/v2/transactions/${transactionId}/release`, "POST");
  return data.data;
}

export async function refundEscrow(transactionId: string) {
  const data = await vesicashRequest(`/v2/transactions/${transactionId}/refund`, "POST");
  return data.data;
}

export async function getEscrowStatus(transactionId: string) {
  const data = await vesicashRequest(`/v2/transactions/${transactionId}`, "GET");
  return data.data;
}

export async function createDispute(transactionId: string, reason: string) {
  const data = await vesicashRequest(`/v2/transactions/${transactionId}/dispute`, "POST", {
    reason,
  });
  return data.data;
}
