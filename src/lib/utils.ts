import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function generateOrderNumber(): string {
  const chars = "0123456789";
  let result = "AMN-";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}

export function getCountryFlag(input: string): string {
  const flags: Record<string, string> = {
    KE: "🇰🇪", NG: "🇳🇬", TZ: "🇹🇿", GH: "🇬🇭", ZA: "🇿🇦",
    UG: "🇺🇬", RW: "🇷🇼", ET: "🇪🇹", CI: "🇨🇮", SN: "🇸🇳",
    CM: "🇨🇲", CD: "🇨🇩", ZM: "🇿🇲", MW: "🇲🇼", MZ: "🇲🇿",
    EG: "🇪🇬", MA: "🇲🇦", TN: "🇹🇳", DZ: "🇩🇿", BW: "🇧🇼",
  };
  // Support full country names too
  const nameToCode: Record<string, string> = {
    "kenya": "KE", "nigeria": "NG", "tanzania": "TZ", "ghana": "GH",
    "south africa": "ZA", "uganda": "UG", "rwanda": "RW", "ethiopia": "ET",
    "côte d'ivoire": "CI", "cote d'ivoire": "CI", "senegal": "SN",
    "cameroon": "CM", "dr congo": "CD", "zambia": "ZM", "malawi": "MW",
    "mozambique": "MZ", "egypt": "EG", "morocco": "MA", "tunisia": "TN",
    "algeria": "DZ", "botswana": "BW",
  };
  if (flags[input]) return flags[input];
  const code = nameToCode[input.toLowerCase()];
  return code ? flags[code] : "🌍";
}

export function getCountryName(code: string): string {
  const names: Record<string, string> = {
    KE: "Kenya", NG: "Nigeria", TZ: "Tanzania", GH: "Ghana", ZA: "South Africa",
    UG: "Uganda", RW: "Rwanda", ET: "Ethiopia", CI: "Côte d'Ivoire", SN: "Senegal",
    CM: "Cameroon", CD: "DR Congo", ZM: "Zambia", MW: "Malawi", MZ: "Mozambique",
    EG: "Egypt", MA: "Morocco", TN: "Tunisia", DZ: "Algeria", BW: "Botswana",
  };
  return names[code] || code;
}

export function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export const ESCROW_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  NOT_FUNDED: { label: "Not Funded", color: "gray" },
  FUNDED: { label: "In Escrow", color: "gold" },
  RELEASE_PENDING: { label: "Pending Release", color: "orange" },
  RELEASED: { label: "Released", color: "green" },
  REFUNDED: { label: "Refunded", color: "red" },
  FROZEN: { label: "Frozen", color: "red" },
};

export const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "gray" },
  PAID: { label: "Paid", color: "blue" },
  ESCROW_HELD: { label: "In Escrow", color: "gold" },
  SHIPPED: { label: "Shipped", color: "orange" },
  IN_TRANSIT: { label: "In Transit", color: "orange" },
  DELIVERED: { label: "Delivered", color: "blue" },
  BUYER_VERIFYING: { label: "Buyer Verifying", color: "blue" },
  COMPLETED: { label: "Completed", color: "green" },
  DISPUTED: { label: "Disputed", color: "red" },
  REFUNDED: { label: "Refunded", color: "red" },
  CANCELLED: { label: "Cancelled", color: "gray" },
};
