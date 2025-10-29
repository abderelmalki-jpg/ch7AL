
'use client';

import Image from "next/image";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown, MessageSquare, MapPin } from "lucide-react";
import type { Contribution } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { MapClient } from "../map/map-client";

interface ContributionCardProps {
  contribution: Contribution;
  apiKey: string;
}

export function ContributionCard({ contribution, apiKey }: ContributionCardProps) {
  const productImage = PlaceHolderImages.find(img => img.id === 'product-1');
  const storeForMap = [{
    id: Number(contribution.id),
    name: contribution.storeName,
    position: { lat: contribution.latitude, lng: contribution.longitude }
  }];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-primary leading-tight">
                  {contribution.productName}
                </h3>
                <p className="text-sm text-accent font-medium">
                  {contribution.storeName}
                </p>
              </div>
              <p className="text-xl font-bold text-primary whitespace-nowrap">
                {contribution.price.toFixed(2)} DH
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Ajouté le {format(new Date(contribution.date), "d MMM yyyy")}
            </p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{contribution.productName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {productImage && (
            <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                <Image 
                    src={productImage.imageUrl} 
                    alt={contribution.productName} 
                    fill 
                    className="object-contain" 
                    data-ai-hint={productImage.imageHint}
                />
            </div>
          )}
          <div className="flex justify-between items-center bg-muted p-3 rounded-lg">
            <div>
              <p className="text-sm text-accent">{contribution.storeName}</p>
              <p className="text-2xl font-bold text-primary">{contribution.price.toFixed(2)} DH</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="hover:bg-green-100 hover:text-green-600">
                <ThumbsUp className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" className="hover:bg-red-100 hover:text-red-600">
                <ThumbsDown className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-muted-foreground"/>
                Localisation
              </h4>
              <div className="h-48 w-full rounded-lg overflow-hidden">
                {apiKey ? (
                    <MapClient apiKey={apiKey} stores={storeForMap} />
                ) : (
                    <div className="flex items-center justify-center h-full bg-muted/20">
                        <p className="text-sm text-muted-foreground">Clé API Google Maps manquante</p>
                    </div>
                )}
              </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-muted-foreground"/>
              Commentaires
            </h4>
            <div className="text-center text-sm text-muted-foreground py-4">
              Aucun commentaire pour le moment.
            </div>
          </div>
          
          <div className="space-y-2">
             <Textarea placeholder="Ajouter un commentaire..." />
             <Button className="w-full">Envoyer le commentaire</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
