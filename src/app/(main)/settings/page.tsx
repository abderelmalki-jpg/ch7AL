
'use client';

import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { name: 'Clair', value: 'light', icon: Sun },
    { name: 'Sombre', value: 'dark', icon: Moon },
    { name: 'Système', value: 'system', icon: Monitor },
  ];

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">Paramètres</CardTitle>
          <CardDescription>Gérez les préférences de votre application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold">Thème de l'application</h3>
            <p className="text-sm text-muted-foreground">
              Choisissez comment vous souhaitez voir l'application.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-2">
              {themes.map((t) => (
                <Button
                  key={t.value}
                  variant="outline"
                  className={cn(
                    'flex flex-col h-20 justify-center gap-2 text-lg',
                    theme === t.value && 'border-primary ring-2 ring-primary'
                  )}
                  onClick={() => setTheme(t.value)}
                >
                  <t.icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{t.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
