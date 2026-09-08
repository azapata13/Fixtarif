"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type GoogleSignInLinkProps = {
  children: ReactNode;
  href: string;
  pendingLabel: string;
};

export function GoogleSignInLink({ children, href, pendingLabel }: GoogleSignInLinkProps) {
  const [pending, setPending] = useState(false);

  return (
    <a className="secondary-button inline-flex w-full items-center justify-center gap-3" href={href} onClick={() => setPending(true)}>
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>{pendingLabel}</span>
        </>
      ) : (
        children
      )}
    </a>
  );
}
