import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-10 w-auto", className)}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Souk Price Logo"
    >
      <circle cx="50" cy="50" r="48" className="fill-primary" />
      <path
        d="M35 75V25H51.5C57.8333 25 61 27.6667 61 33C61 38.3333 57.8333 41 51.5 41H43"
        stroke="white"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M55 75L69 57.5"
        stroke="hsl(var(--accent))"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M69 75L55 57.5"
        stroke="hsl(var(--accent))"
        strokeWidth="10"
        strokeLinecap="round"
      />
    </svg>
  );
}
