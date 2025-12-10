
import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-16 w-16 overflow-hidden", className)}>
      <Image
        src="https://res.cloudinary.com/db2ljqpdt/image/upload/v1760802070/image2_devrs5.png"
        alt="Ch7al Logo"
        fill
        className="object-contain"
        priority
      />
    </div>
  );
}
