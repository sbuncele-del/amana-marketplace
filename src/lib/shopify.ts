// Shopify Storefront API — Amana Headless Integration
// Docs: https://shopify.dev/docs/api/storefront

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || "";
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || "";
const API_VERSION = "2026-04";

// ─── Core fetch ───────────────────────────────────────────────

async function shopifyFetch<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  if (!SHOPIFY_DOMAIN || !STOREFRONT_TOKEN) {
    throw new Error("Shopify is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN.");
  }

  const response = await fetch(
    `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 60 },
    }
  );

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL: ${json.errors.map((e: { message: string }) => e.message).join(", ")}`);
  }

  return json.data as T;
}

// ─── Types ────────────────────────────────────────────────────

export interface ShopifyVariant {
  id: string;
  title: string;
  price: { amount: string; currencyCode: string };
  compareAtPrice: { amount: string; currencyCode: string } | null;
  availableForSale: boolean;
  quantityAvailable: number | null;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  images: { url: string; altText: string | null }[];
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  compareAtPriceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  variants: ShopifyVariant[];
  availableForSale: boolean;
  totalInventory: number;
  // Custom metafields (set up in Shopify admin)
  originCountry: string | null;
  shipsTo: string[];
  hsCode: string | null;
}

export interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  description: string;
  image: { url: string; altText: string | null } | null;
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  lines: CartLine[];
  totalAmount: { amount: string; currencyCode: string };
  subtotalAmount: { amount: string; currencyCode: string };
}

export interface CartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    price: { amount: string; currencyCode: string };
    product: {
      title: string;
      handle: string;
      images: { url: string }[];
    };
  };
}

// ─── Product fragments ───────────────────────────────────────

const PRODUCT_FRAGMENT = `
  fragment ProductFragment on Product {
    id
    title
    handle
    description
    descriptionHtml
    vendor
    productType
    tags
    availableForSale
    priceRange {
      minVariantPrice { amount currencyCode }
    }
    compareAtPriceRange {
      minVariantPrice { amount currencyCode }
    }
    images(first: 10) {
      edges { node { url altText } }
    }
    variants(first: 20) {
      edges {
        node {
          id
          title
          availableForSale
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
        }
      }
    }
    originCountry: metafield(namespace: "custom", key: "origin_country") { value }
    shipsTo: metafield(namespace: "custom", key: "ships_to") { value }
    hsCode: metafield(namespace: "custom", key: "hs_code") { value }
  }
`;

// ─── Helpers ─────────────────────────────────────────────────

function parseProduct(raw: RawProduct): ShopifyProduct {
  return {
    id: raw.id,
    title: raw.title,
    handle: raw.handle,
    description: raw.description,
    descriptionHtml: raw.descriptionHtml,
    vendor: raw.vendor,
    productType: raw.productType,
    tags: raw.tags,
    availableForSale: raw.availableForSale,
    totalInventory: 0,
    images: raw.images.edges.map((e: EdgeNode<{ url: string; altText: string | null }>) => e.node),
    priceRange: raw.priceRange,
    compareAtPriceRange: raw.compareAtPriceRange,
    variants: raw.variants.edges.map((e: EdgeNode<RawVariant>) => ({
      id: e.node.id,
      title: e.node.title,
      price: e.node.price,
      compareAtPrice: e.node.compareAtPrice ?? null,
      availableForSale: e.node.availableForSale,
      quantityAvailable: null,
    })),
    originCountry: raw.originCountry?.value ?? null,
    shipsTo: raw.shipsTo?.value ? JSON.parse(raw.shipsTo.value) : [],
    hsCode: raw.hsCode?.value ?? null,
  };
}

interface EdgeNode<T> { node: T }
interface RawVariant {
  id: string; title: string;
  price: { amount: string; currencyCode: string };
  compareAtPrice?: { amount: string; currencyCode: string };
  availableForSale: boolean;
}
interface RawProduct {
  id: string; title: string; handle: string; description: string; descriptionHtml: string;
  vendor: string; productType: string; tags: string[];
  availableForSale: boolean;
  images: { edges: EdgeNode<{ url: string; altText: string | null }>[] };
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  compareAtPriceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  variants: { edges: EdgeNode<RawVariant>[] };
  originCountry?: { value: string };
  shipsTo?: { value: string };
  hsCode?: { value: string };
}

// ─── Product queries ──────────────────────────────────────────

export type ProductSortKey = "RELEVANCE" | "PRICE" | "TITLE" | "CREATED_AT" | "BEST_SELLING";

export async function getProducts(options: {
  first?: number;
  query?: string;
  collection?: string;
  sortKey?: ProductSortKey;
  reverse?: boolean;
  after?: string;
}): Promise<{ products: ShopifyProduct[]; hasNextPage: boolean; endCursor: string | null }> {
  const { first = 20, query, collection, sortKey = "RELEVANCE", reverse = false, after } = options;

  if (collection) {
    // Fetch from a specific collection (category)
    const data = await shopifyFetch<{
      collection: {
        products: {
          pageInfo: { hasNextPage: boolean; endCursor: string | null };
          edges: EdgeNode<RawProduct>[];
        };
      } | null;
    }>(
      `${PRODUCT_FRAGMENT}
      query GetCollectionProducts($handle: String!, $first: Int!, $sortKey: ProductCollectionSortKeys, $reverse: Boolean, $after: String) {
        collection(handle: $handle) {
          products(first: $first, sortKey: $sortKey, reverse: $reverse, after: $after) {
            pageInfo { hasNextPage endCursor }
            edges { node { ...ProductFragment } }
          }
        }
      }`,
      { handle: collection, first, sortKey, reverse, after: after || null }
    );

    if (!data.collection) return { products: [], hasNextPage: false, endCursor: null };
    return {
      products: data.collection.products.edges.map(e => parseProduct(e.node)),
      hasNextPage: data.collection.products.pageInfo.hasNextPage,
      endCursor: data.collection.products.pageInfo.endCursor,
    };
  }

  // General product search
  const data = await shopifyFetch<{
    products: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      edges: EdgeNode<RawProduct>[];
    };
  }>(
    `${PRODUCT_FRAGMENT}
    query GetProducts($first: Int!, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean, $after: String) {
      products(first: $first, query: $query, sortKey: $sortKey, reverse: $reverse, after: $after) {
        pageInfo { hasNextPage endCursor }
        edges { node { ...ProductFragment } }
      }
    }`,
    { first, query: query || null, sortKey, reverse, after: after || null }
  );

  return {
    products: data.products.edges.map(e => parseProduct(e.node)),
    hasNextPage: data.products.pageInfo.hasNextPage,
    endCursor: data.products.pageInfo.endCursor,
  };
}

export async function getProduct(handle: string): Promise<ShopifyProduct | null> {
  const data = await shopifyFetch<{ product: RawProduct | null }>(
    `${PRODUCT_FRAGMENT}
    query GetProduct($handle: String!) {
      product(handle: $handle) { ...ProductFragment }
    }`,
    { handle }
  );
  return data.product ? parseProduct(data.product) : null;
}

export async function getCollections(): Promise<ShopifyCollection[]> {
  const data = await shopifyFetch<{
    collections: { edges: EdgeNode<{ id: string; title: string; handle: string; description: string; image: { url: string; altText: string | null } | null }>[] };
  }>(
    `query GetCollections {
      collections(first: 50) {
        edges {
          node {
            id title handle description
            image { url altText }
          }
        }
      }
    }`
  );
  return data.collections.edges.map(e => e.node);
}

// ─── Cart mutations ───────────────────────────────────────────

const CART_FRAGMENT = `
  fragment CartFragment on Cart {
    id
    checkoutUrl
    cost {
      totalAmount { amount currencyCode }
      subtotalAmount { amount currencyCode }
    }
    lines(first: 50) {
      edges {
        node {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              price { amount currencyCode }
              product {
                title
                handle
                images(first: 1) { edges { node { url } } }
              }
            }
          }
        }
      }
    }
  }
`;

function parseCart(raw: RawCart): ShopifyCart {
  return {
    id: raw.id,
    checkoutUrl: raw.checkoutUrl,
    totalAmount: raw.cost.totalAmount,
    subtotalAmount: raw.cost.subtotalAmount,
    lines: raw.lines.edges.map((e: EdgeNode<RawCartLine>) => ({
      id: e.node.id,
      quantity: e.node.quantity,
      merchandise: {
        id: e.node.merchandise.id,
        title: e.node.merchandise.title,
        price: e.node.merchandise.price,
        product: {
          title: e.node.merchandise.product.title,
          handle: e.node.merchandise.product.handle,
          images: e.node.merchandise.product.images.edges.map((img: EdgeNode<{ url: string }>) => ({ url: img.node.url })),
        },
      },
    })),
  };
}

interface RawCartLine {
  id: string; quantity: number;
  merchandise: {
    id: string; title: string;
    price: { amount: string; currencyCode: string };
    product: { title: string; handle: string; images: { edges: EdgeNode<{ url: string }>[] } };
  };
}
interface RawCart {
  id: string; checkoutUrl: string;
  cost: { totalAmount: { amount: string; currencyCode: string }; subtotalAmount: { amount: string; currencyCode: string } };
  lines: { edges: EdgeNode<RawCartLine>[] };
}

export async function createCart(
  lines: { merchandiseId: string; quantity: number }[]
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartCreate: { cart: RawCart; userErrors: { field: string[]; message: string }[] };
  }>(
    `${CART_FRAGMENT}
    mutation CartCreate($lines: [CartLineInput!]!) {
      cartCreate(input: { lines: $lines }) {
        cart { ...CartFragment }
        userErrors { field message }
      }
    }`,
    { lines }
  );

  if (data.cartCreate.userErrors.length) {
    throw new Error(data.cartCreate.userErrors.map(e => e.message).join(", "));
  }

  return parseCart(data.cartCreate.cart);
}

export async function addToCart(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[]
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartLinesAdd: { cart: RawCart; userErrors: { field: string[]; message: string }[] };
  }>(
    `${CART_FRAGMENT}
    mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { ...CartFragment }
        userErrors { field message }
      }
    }`,
    { cartId, lines }
  );

  if (data.cartLinesAdd.userErrors.length) {
    throw new Error(data.cartLinesAdd.userErrors.map(e => e.message).join(", "));
  }

  return parseCart(data.cartLinesAdd.cart);
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartLinesUpdate: { cart: RawCart; userErrors: { field: string[]; message: string }[] };
  }>(
    `${CART_FRAGMENT}
    mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart { ...CartFragment }
        userErrors { field message }
      }
    }`,
    { cartId, lines: [{ id: lineId, quantity }] }
  );

  if (data.cartLinesUpdate.userErrors.length) {
    throw new Error(data.cartLinesUpdate.userErrors.map(e => e.message).join(", "));
  }

  return parseCart(data.cartLinesUpdate.cart);
}

export async function removeCartLines(
  cartId: string,
  lineIds: string[]
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartLinesRemove: { cart: RawCart; userErrors: { field: string[]; message: string }[] };
  }>(
    `${CART_FRAGMENT}
    mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart { ...CartFragment }
        userErrors { field message }
      }
    }`,
    { cartId, lineIds }
  );

  if (data.cartLinesRemove.userErrors.length) {
    throw new Error(data.cartLinesRemove.userErrors.map(e => e.message).join(", "));
  }

  return parseCart(data.cartLinesRemove.cart);
}

export async function getCart(cartId: string): Promise<ShopifyCart | null> {
  const data = await shopifyFetch<{ cart: RawCart | null }>(
    `${CART_FRAGMENT}
    query GetCart($cartId: ID!) {
      cart(id: $cartId) { ...CartFragment }
    }`,
    { cartId }
  );
  return data.cart ? parseCart(data.cart) : null;
}

// ─── Utility ─────────────────────────────────────────────────

/**
 * Maps a Shopify product to Amana's ProductCardData shape
 * so existing UI components work without changes.
 */
export function toProductCardData(p: ShopifyProduct) {
  const price = parseFloat(p.priceRange.minVariantPrice.amount);
  const comparePrice = parseFloat(p.compareAtPriceRange.minVariantPrice.amount);

  // Derive origin country: from metafield, or from tag convention "country:Tanzania"
  const countryTag = p.tags.find(t => t.toLowerCase().startsWith("country:"));
  const originCountry = p.originCountry ?? countryTag?.split(":")[1] ?? "Africa";

  // Map productType to category slug
  const categorySlug = p.productType
    ? p.productType.toLowerCase().replace(/[\s&]+/g, "-")
    : p.tags[0] ?? "general";

  return {
    id: p.id,
    name: p.title,
    slug: p.handle,
    price,
    comparePrice: comparePrice > price ? comparePrice : null,
    currency: p.priceRange.minVariantPrice.currencyCode,
    images: p.images.map(i => i.url),
    originCountry,
    stock: p.totalInventory,
    avgRating: 0,
    reviewCount: 0,
    totalSold: 0,
    seller: {
      name: p.vendor,
      country: originCountry,
      sellerProfile: {
        storeName: p.vendor,
        storeSlug: p.vendor.toLowerCase().replace(/\s+/g, "-"),
        trustScore: 80,
        isVerified: false,
      },
    },
    category: p.productType ? { name: p.productType, slug: categorySlug } : null,
  };
}
