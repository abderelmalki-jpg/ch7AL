'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { getSuggestions, type FormState } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, Loader2, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function SubmitButton({ label, loadingLabel }: { label: string; loadingLabel: string; }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        <>
          {label}
        </>
      )}
    </Button>
  );
}

export function AddProductForm() {
    const { toast } = useToast();

  const initialState: FormState = { message: '', suggestions: [] };
  const [state, formAction] = useFormState(getSuggestions, initialState);

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
        title: "Copied to clipboard!",
        description: `"${text}" has been copied.`,
    });
  }

  return (
    <form className="space-y-6">
        <div className="space-y-2">
            <Label htmlFor="product-name">Product Name</Label>
            <Input id="product-name" placeholder="e.g., Coca-Cola Can" />
        </div>
        <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" placeholder="e.g., Coca-Cola" />
        </div>
        <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" placeholder="e.g., Drinks" />
        </div>

        <Card className="bg-secondary/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-xl">
                    <Wand2 className="text-accent" /> AI Name Suggestions
                </CardTitle>
            </Header>
            <CardContent>
                <form action={formAction} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="product-description">Product Description</Label>
                        <Textarea 
                            id="product-description" 
                            name="product-description" 
                            placeholder="Describe the product to get name suggestions. For example: 'A popular carbonated soft drink, classic flavor, in a red can.'"
                        />
                         {state.errors?.productDescription && (
                            <p className="text-sm font-medium text-destructive">{state.errors.productDescription[0]}</p>
                        )}
                    </div>
                    <Button type="submit" variant="outline">
                        <Lightbulb className="mr-2 h-4 w-4"/>
                        Suggest Names
                    </Button>
                </form>
                
                {state.suggestions.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <p className="font-semibold">{state.message}</p>
                        <div className="flex flex-wrap gap-2">
                            {state.suggestions.map((name, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleCopyToClipboard(name)}
                                    className="bg-accent/20 text-accent-foreground py-1 px-3 rounded-full text-sm hover:bg-accent/40 transition-colors"
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                 {state.message && state.suggestions.length === 0 && !state.errors && (
                     <p className="mt-4 text-sm text-muted-foreground">{state.message}</p>
                 )}
            </CardContent>
        </Card>

        <SubmitButton label="Add Product" loadingLabel="Adding..." />
    </form>
  );
}
