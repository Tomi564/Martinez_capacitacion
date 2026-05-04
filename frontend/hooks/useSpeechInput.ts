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
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const shouldKeepListeningRef = useRef(false);
  const sessionRef = useRef(0);
  const lastInterimRef = useRef('');

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
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {
        /* noop */
      }
      recognitionRef.current = null;
      streamRef.current = null;
    };
  }, []);

  const stopDictation = useCallback(() => {
    shouldKeepListeningRef.current = false;
    sessionRef.current += 1;
    const r = recognitionRef.current;
    if (r) {
      try {
        r.stop();
      } catch {
        /* noop */
      }
      recognitionRef.current = null;
    }
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {
      /* noop */
    }
    streamRef.current = null;
    setIsListening(false);
    lastInterimRef.current = '';
  }, []);

  const startDictation = useCallback(
    async (onText: (text: string) => void) => {
      const W = window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionType;
        webkitSpeechRecognition?: new () => SpeechRecognitionType;
      };
      const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
      if (!SR) return;

      setError(null);
      shouldKeepListeningRef.current = true;
      const currentSession = sessionRef.current + 1;
      sessionRef.current = currentSession;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* noop */
        }
        recognitionRef.current = null;
      }

      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      } catch {
        shouldKeepListeningRef.current = false;
        setIsListening(false);
        setError('No se pudo acceder al micrófono. Revisá permisos del navegador y dispositivo de entrada.');
        return;
      }

      const recognition = new SR();
      recognitionRef.current = recognition;
      recognition.lang = 'es-AR';
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.maxAlternatives = 1;
      setIsListening(true);
      lastInterimRef.current = '';

      recognition.onresult = (event: SpeechRecognitionResultEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const transcript = (res[0]?.transcript ?? '').trim();
          if (!transcript) continue;

          if (res.isFinal) {
            let delta = transcript;
            if (lastInterimRef.current && transcript.startsWith(lastInterimRef.current)) {
              delta = transcript.slice(lastInterimRef.current.length).trim();
            }
            lastInterimRef.current = '';
            if (delta) onText(delta);
            continue;
          }

          let delta = transcript;
          if (lastInterimRef.current && transcript.startsWith(lastInterimRef.current)) {
            delta = transcript.slice(lastInterimRef.current.length).trim();
          }
          lastInterimRef.current = transcript;
          if (delta) onText(delta);
        }
      };

      recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
        if (sessionRef.current !== currentSession) return;
        if (e.error === 'aborted') return;
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') {
          shouldKeepListeningRef.current = false;
          setError('El navegador bloqueó el micrófono. Habilitá permisos y elegí el micrófono correcto.');
        }
        if (e.error === 'no-speech') return;
      };

      recognition.onend = () => {
        if (sessionRef.current !== currentSession) return;
        recognitionRef.current = null;
        lastInterimRef.current = '';
        if (shouldKeepListeningRef.current) {
          // En móviles a veces el reconocimiento se corta por pausas cortas.
          // Reanudamos automáticamente para mantener una sesión continua.
          window.setTimeout(() => {
            if (sessionRef.current !== currentSession || !shouldKeepListeningRef.current) return;
            try {
              recognition.start();
              recognitionRef.current = recognition;
              setIsListening(true);
            } catch {
              shouldKeepListeningRef.current = false;
              setIsListening(false);
              setError('No se pudo iniciar el dictado. Revisá permisos de micrófono en el navegador.');
            }
          }, 120);
          return;
        }
        try {
          streamRef.current?.getTracks().forEach((t) => t.stop());
        } catch {
          /* noop */
        }
        streamRef.current = null;
        setIsListening(false);
      };

      try {
        recognition.start();
      } catch {
        recognitionRef.current = null;
        setIsListening(false);
        setError('No se pudo iniciar el reconocimiento de voz en este navegador.');
      }
    },
    []
  );

  return {
    isSupported,
    isListening,
    error,
    startDictation,
    stopDictation,
  };
}
