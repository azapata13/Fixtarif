"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type PendingSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  pendingLabel: string;
};

export function PendingSubmitButton({ children, className, pendingLabel, ...props }: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  const { disabled, type, ...buttonProps } = props;

  return (
    <button {...buttonProps} className={className} disabled={pending || disabled} type={type ?? "submit"}>
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>{pendingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
