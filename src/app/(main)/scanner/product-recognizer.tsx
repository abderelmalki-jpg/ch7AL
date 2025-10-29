'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Camera, Zap, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { identifyProduct } from '@/ai/flows/identify-product-flow';

export function ProductRecognizer() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [productInfo, setProductInfo] = useState<{name: string, brand: string, category: string, photoDataUri: string} | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    async function getCameraPermission() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        setError("L'accès à la caméra n'est pas supporté par ce navigateur.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch (err: any) {
        console.error('Erreur accès caméra:', err);
        setHasCameraPermission(false);
        if (err.name === 'NotAllowedError') {
             setError("L'autorisation d'accès à la caméra est requise. Veuillez l'activer dans les paramètres de votre navigateur.");
        } else if (err.name === 'NotReadableError' || err.name === 'OverconstrainedError' || err.name === 'DEVICE_IN_USE') {
             setError("La caméra est déjà utilisée par une autre application. Veuillez fermer l'autre application et réessayer.");
        } else {
             setError("Une erreur inattendue est survenue lors de l'accès à la caméra.");
        }
      }
    }

    getCameraPermission();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);
    setProductInfo(null);
    setError(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if(context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const photoDataUri = canvas.toDataURL('image/jpeg');
        
        try {
            const result = await identifyProduct({ photoDataUri });
            setProductInfo({...result, photoDataUri });
        } catch (e) {
            console.error(e);
            setError("L'IA n'a pas pu identifier le produit. Réessayez.");
            toast({
                variant: "destructive",
                title: "Erreur d'identification",
                description: "Une erreur est survenue lors de l'analyse de l'image.",
            });
        }
    }
    setIsCapturing(false);
  };
  
  const handleAddPrice = () => {
    if (!productInfo) return;
    const params = new URLSearchParams({
        name: productInfo.name,
        brand: productInfo.brand,
        category: productInfo.category,
        photoDataUri: productInfo.photoDataUri
    });
    router.push(`/add-product?${params.toString()}`);
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="p-4 bg-gray-800/50 backdrop-blur-sm text-white text-center z-10">
        <h1 className="text-2xl font-headline font-bold">Analyse de Produit par IA</h1>
        <p className="text-white/80">Centrez le produit et prenez une photo claire</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative">
        <div className="w-full max-w-sm aspect-video bg-black rounded-lg overflow-hidden shadow-lg relative">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {!hasCameraPermission && (
                 <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <div className="text-center text-white p-4">
                        <Camera className="mx-auto h-12 w-12 mb-2" />
                        <p>{error || "Autorisation de la caméra requise"}</p>
                    </div>
                </div>
            )}
        </div>
      </div>
      
      <div className="p-4 bg-card z-10">
          <Card>
            <CardContent className="p-4 space-y-4">
                <Button 
                    onClick={handleCapture} 
                    disabled={!hasCameraPermission || isCapturing} 
                    className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                >
                    {isCapturing ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Analyse en cours...
                        </>
                    ) : (
                        <>
                            <Zap className="mr-2 h-5 w-5" />
                            Identifier le Produit
                        </>
                    )}
                </Button>

                {error && !isCapturing && (
                    <Alert variant="destructive">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {productInfo && (
                     <Card className="bg-secondary/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="text-accent" /> Produit Identifié
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <p><span className="font-semibold">Nom:</span> {productInfo.name}</p>
                            <p><span className="font-semibold">Marque:</span> {productInfo.brand}</p>
                            <p><span className="font-semibold">Catégorie:</span> {productInfo.category}</p>
                            <Button className="w-full mt-4" onClick={handleAddPrice}>Ajouter le prix pour ce produit</Button>
                        </CardContent>
                    </Card>
                )}
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
