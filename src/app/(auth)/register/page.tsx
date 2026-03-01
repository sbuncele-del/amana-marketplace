import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = {
  title: "Create Account — Amana",
  description: "Join Africa's trusted cross-border marketplace",
};

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
