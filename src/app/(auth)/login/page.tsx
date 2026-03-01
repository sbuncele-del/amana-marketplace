import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign In — Amana",
  description: "Sign in to your Amana account",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
