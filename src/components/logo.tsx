import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-16 w-16 overflow-hidden", className)}>
      <Image
        src="https://res.cloudinary.com/dhjwimevi/image/upload/v1761939684/ChatGPT_Image_31_oct._2025_20_40_19_m8uwly.png"
        alt="Ch7al Logo"
        fill
        className="object-contain"
      />
    </div>
  );
}
