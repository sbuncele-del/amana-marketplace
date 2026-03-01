import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "gold" | "green" | "red" | "blue" | "orange" | "gray";
  className?: string;
}

const variantStyles = {
  default: "bg-gray-100 text-gray-700",
  gold: "bg-[#D4A843]/10 text-[#B8922E]",
  green: "bg-green-50 text-green-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-blue-50 text-blue-700",
  orange: "bg-orange-50 text-orange-700",
  gray: "bg-gray-100 text-gray-500",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
