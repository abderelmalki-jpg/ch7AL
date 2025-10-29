import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Logo } from "@/components/logo";

export function Header() {
  const avatarImage = PlaceHolderImages.find(
    (img) => img.id === "user-avatar-1"
  );
  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo className="h-8" />
          <span className="font-headline text-xl font-bold text-primary">
            Souk Price
          </span>
        </Link>
        <Link href="/profile">
          <Avatar className="h-9 w-9 border-2 border-primary">
            <AvatarImage
              src={avatarImage?.imageUrl}
              alt="User Avatar"
              data-ai-hint={avatarImage?.imageHint}
            />
            <AvatarFallback>SP</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
