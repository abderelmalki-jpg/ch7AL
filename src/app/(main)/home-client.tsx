'use client';

import { useState, useEffect } from 'react';

export function HomeClient() {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 18) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);

  if (!greeting) {
    return <span>Welcome!</span>
  }

  return <span>{greeting}, Fatima!</span>;
}
