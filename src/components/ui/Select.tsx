import { type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export default function Select({
  label,
  id,
  options,
  placeholder,
  className = "",
  ...props
}: SelectProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
