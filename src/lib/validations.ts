import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  country: z.string().min(2, "Please select a country"),
  role: z.enum(["BUYER", "SELLER"]),
  // Seller-specific fields
  storeName: z.string().optional(),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const productSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  price: z.number().positive("Price must be greater than 0"),
  comparePrice: z.number().positive().optional(),
  categoryId: z.string().min(1, "Category is required"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  weight: z.number().positive().optional(),
  originCountry: z.string().min(2, "Origin country is required"),
  shipsTo: z.array(z.string()).default([]),
  hsCode: z.string().optional(),
  images: z.array(z.string()).min(1, "At least one image is required"),
});

export const addressSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(5, "Phone number is required"),
  street: z.string().min(3, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(2, "Country is required"),
});

export const checkoutSchema = z.object({
  addressId: z.string().min(1, "Shipping address is required"),
  paymentMethod: z.enum(["mpesa", "mtn_momo", "card", "bank_transfer", "airtel"]),
  shippingMethod: z.enum(["dhl_express", "dhl_ecommerce", "aramex", "sendy", "self_ship"]),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
