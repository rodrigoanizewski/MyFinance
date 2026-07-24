interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "danger" | "warning" | "info";
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: "bg-zinc-800 text-zinc-300",
  success: "bg-emerald-900/50 text-emerald-400",
  danger: "bg-red-900/50 text-red-400",
  warning: "bg-amber-900/50 text-amber-400",
  info: "bg-blue-900/50 text-blue-400",
};

export default function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
