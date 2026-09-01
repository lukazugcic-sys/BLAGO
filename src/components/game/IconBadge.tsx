import { cn } from "@/lib/utils";

const SIZES = {
  xs: "size-5",
  sm: "size-6",
  md: "size-10",
  lg: "size-12",
} as const;

export function IconBadge({
  src,
  size = "lg",
  className,
}: {
  src: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span className={cn("iko", SIZES[size], className)} aria-hidden>
      <img src={src} alt="" draggable={false} />
    </span>
  );
}
