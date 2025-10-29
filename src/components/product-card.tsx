import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";
import { ImageIcon } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href="#" className="block group">
      <Card className="overflow-hidden transition-all group-hover:shadow-lg group-hover:-translate-y-1 h-full flex flex-col">
        <div className="aspect-square relative bg-muted">
          {product.imageUrl ? (
            <Image
                src={product.imageUrl}
                alt={product.name}
                data-ai-hint={product.imageHint}
                fill
                className="object-cover"
            />
          ) : (
             <div className="flex items-center justify-center h-full">
                <ImageIcon className="w-10 h-10 text-muted-foreground/50" />
            </div>
          )}
        </div>
        <CardContent className="p-3 flex flex-col flex-grow">
          <h3 className="font-semibold text-sm truncate group-hover:whitespace-normal">{product.name}</h3>
          <p className="text-xs text-muted-foreground">{product.brand}</p>
          <div className="flex-grow"></div>
           <div className="flex justify-between items-end mt-2">
            <Badge variant="secondary">{product.category}</Badge>
            {product.price && (
                <p className="font-bold text-primary">{product.price.toFixed(2)} DH</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
