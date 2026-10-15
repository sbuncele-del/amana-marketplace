import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign In — Plentovo",
  description: "Sign in to your Plentovo account",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
