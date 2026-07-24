import { PackageOpen } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <PackageOpen className="mb-3 h-10 w-10 text-zinc-600" />
      <p className="text-sm font-medium text-zinc-400">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-zinc-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
