export type Market = 'ZA' | 'TN';

export const marketNames = {ZA: 'South Africa', TN: 'Tunisia'} as const;
export const queues = {
  ZA: [
    {key: 'payment', title: 'Awaiting EFT', action: 'Verify bank transfer'},
    {key: 'dispatch', title: 'Ready for fulfilment', action: 'Prepare fulfilment'},
    {key: 'delivery', title: 'Shipped', action: 'Track delivery'},
    {key: 'quote', title: 'Enquiries and quotes', action: 'Follow up with customer'},
  ],
  TN: [
    {key: 'payment', title: 'To confirm', action: 'Call customer'},
    {key: 'dispatch', title: 'Confirmed', action: 'Prepare dispatch'},
    {key: 'delivery', title: 'Dispatched', action: 'Track delivery'},
    {key: 'quote', title: 'Returned', action: 'Review return'},
  ],
} as const;

export type BackOfficeOrder = {
  id: string;
  reference: string;
  status: string;
  bucket: string | null;
  customer: string;
  location: string;
  owner: string | null;
  createdAt: string;
  subtotal: number;
  delivery: number | null;
  items: {name: string; quantity: number; unit: number | null; option?: string; sku?: string}[];
  version?: number;
  canVerify: boolean;
  canManage: boolean;
  collection: boolean;
  carrierStatus?: string;
  trackingNumber?: string;
};
export type BackOfficeReport = {
  market: Market;
  counts: Record<string, number>;
  orders: BackOfficeOrder[];
  total: number;
};
