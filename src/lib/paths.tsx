import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AppLink({
  path,
  className,
  onClick,
  children,
}: {
  path: string;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const m = path.match(/^\/(hld|lld|examples|playgrounds|fde|java|python)\/([^/]+)$/);
  if (m) {
    const to = `/${m[1]}/$slug` as
      | "/hld/$slug"
      | "/lld/$slug"
      | "/examples/$slug"
      | "/playgrounds/$slug"
      | "/fde/$slug"
      | "/java/$slug"
      | "/python/$slug";
    return (
      <Link to={to} params={{ slug: m[2] }} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <Link to={path} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
