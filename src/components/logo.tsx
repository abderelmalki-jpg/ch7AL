import Image from "next/image";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function Logo({ className }: { className?: string }) {
  const logoImage = PlaceHolderImages.find((img) => img.id === "logo");
  
  if (!logoImage) {
    return (
        <div className={cn("h-10 w-10 bg-primary rounded-full", className)}></div>
    );
  }

  return (
    <div className={cn("relative h-16 w-16", className)}>
        <Image
            src={logoImage.imageUrl}
            alt={logoImage.description}
            data-ai-hint={logoImage.imageHint}
            fill
            className="object-contain"
        />
    </div>
  );
}