import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScanLine } from "lucide-react";

export default function ScannerPage() {
  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="p-6 bg-gray-800/50 backdrop-blur-sm text-white text-center">
        <h1 className="text-2xl font-headline font-bold">Scanner de code-barres</h1>
        <p className="text-white/80">Placez le code-barres à l'intérieur du cadre</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative">
        <div className="w-full max-w-sm aspect-square relative">
            <div className="absolute inset-0 bg-black/30"></div>
            {/* Scanner frame */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[50%] rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] border-4 border-primary/50">
            </div>

             {/* Scanner line animation */}
            <div className="absolute top-1/2 left-[10%] w-[80%] h-1 bg-primary rounded-full animate-ping"></div>
        </div>
      </div>
      
      <div className="p-4 bg-card">
          <Card>
            <CardContent className="p-4 space-y-4">
                <Button className="w-full bg-primary hover:bg-primary/90">
                    <ScanLine className="mr-2 h-4 w-4" /> Démarrer le scan
                </Button>
                <Button variant="secondary" className="w-full">
                    Saisir le code-barres manuellement
                </Button>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
