'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionType = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionResultEvent = {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionResultList = {
  length: number;
  [index: number]: { isFinal: boolean; [key: number]: { transcript: string } };
};

type SpeechRecognitionErrorEvent = { error: string };

export function useSpeechInput() {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionType }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionType }).webkitSpeechRecognition;
    setIsSupported(!!SR);
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        /* noop */
      }
      recognitionRef.current = null;
    };
  }, []);

  const stopDictation = useCallback(() => {
    const r = recognitionRef.current;
    if (r) {
      try {
        r.stop();
      } catch {
        /* noop */
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startDictation = useCallback(
    (onText: (text: string) => void) => {
      const W = window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionType;
        webkitSpeechRecognition?: new () => SpeechRecognitionType;
      };
      const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
      if (!SR) return;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* noop */
        }
        recognitionRef.current = null;
      }

      const recognition = new SR();
      recognitionRef.current = recognition;
      recognition.lang = 'es-AR';
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.maxAlternatives = 1;
      setIsListening(true);

      recognition.onresult = (event: SpeechRecognitionResultEvent) => {
        let chunk = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            chunk += res[0]?.transcript ?? '';
          }
        }
        const t = chunk.trim();
        if (t) onText(t);
      };

      recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
        if (e.error === 'aborted') return;
        recognitionRef.current = null;
        setIsListening(false);
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        setIsListening(false);
      };

      try {
        recognition.start();
      } catch {
        recognitionRef.current = null;
        setIsListening(false);
      }
    },
    []
  );

  return {
    isSupported,
    isListening,
    startDictation,
    stopDictation,
  };
}
