import { Link } from "@tanstack/react-router";
import { User } from "lucide-react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function AuthChip() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="size-8 shrink-0 animate-pulse rounded-full bg-ink/10" />;
  }
  if (user?.isDevFallback) return null;
  if (user) {
    return (
      <div className="max-w-[6.5rem] shrink-0 overflow-hidden text-ink [&_button]:text-[10px] [&_button]:text-gold">
        <UserButton />
      </div>
    );
  }
  return (
    <Link
      to="/login"
      aria-label="Prijava"
      className="flex size-8 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-gold/15 text-gold"
    >
      <User className="size-3.5" />
    </Link>
  );
}
