import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href="#" className="block group">
      <Card className="overflow-hidden transition-all group-hover:shadow-lg group-hover:-translate-y-1 h-full">
        <div className="aspect-square relative">
          <Image
            src={product.imageUrl}
            alt={product.name}
            data-ai-hint={product.imageHint}
            fill
            className="object-cover"
          />
        </div>
        <CardContent className="p-3">
          <h3 className="font-semibold text-sm truncate">{product.name}</h3>
          <p className="text-xs text-muted-foreground">{product.brand}</p>
          <div className="flex justify-between items-end mt-2">
            <Badge variant="secondary">{product.category}</Badge>
            <p className="font-bold text-primary">{product.price.toFixed(2)} DH</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
