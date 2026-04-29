'use client';

import { useEffect, useState } from 'react';

type SpeechRecognitionType = any;

export function useSpeechInput() {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SR);
  }, []);

  const startDictation = (onText: (text: string) => void) => {
    const SR: SpeechRecognitionType = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = 'es-AR';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    setIsListening(true);

    recognition.onresult = (event: any) => {
      const texto = event?.results?.[0]?.[0]?.transcript?.trim() || '';
      if (texto) onText(texto);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  return {
    isSupported,
    isListening,
    startDictation,
  };
}
