
import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-16 w-16 overflow-hidden", className)}>
      <Image
        src="https://images.unsplash.com/photo-1594007759138-85517242d97f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxNT1JPQ0NBTiUyMFNIQVJElMjBMT0dPfGVufDB8fHx8MTc2NTM4MTU3OHww&ixlib=rb-4.1.0&q=80&w=1080"
        alt="Ch7al Logo"
        fill
        className="object-contain"
        priority
      />
    </div>
  );
}
