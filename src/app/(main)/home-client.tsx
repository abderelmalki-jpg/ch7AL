'use client';

import { useState, useEffect } from 'react';

export function HomeClient() {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Bonjour');
    } else if (hour < 18) {
      setGreeting('Bon après-midi');
    } else {
      setGreeting('Bonsoir');
    }
  }, []);

  if (!greeting) {
    return <span>Bienvenue !</span>
  }

  return <span>{greeting}, Fatima !</span>;
}
