/**
 * CelebracionAprobado.tsx — Pantalla de celebración al aprobar un examen
 *
 * Se muestra por encima del resultado cuando el vendedor aprueba.
 * Animación de confetti + mensaje motivador + desaparece sola en 3 segundos.
 */

'use client';

import { useEffect, useState } from 'react';

interface CelebracionAprobadoProps {
  nota: number;
  moduloTitulo: string;
  siguienteDesbloqueado: boolean;
  onComplete: () => void;
}

// Mensajes motivadores aleatorios estilo "Jugando en Primera Liga"
const MENSAJES = [
  '¡Eso es jugar en primera liga!',
  '¡Un paso más hacia la cima!',
  '¡El equipo Martínez está orgulloso!',
  '¡Así se hace, campeón!',
  '¡Conocimiento que se convierte en ventas!',
  '¡Seguí así, imparable!',
];

// Partículas de confetti
const COLORES_CONFETTI = [
  '#111827', '#3B82F6', '#10B981',
  '#F59E0B', '#EF4444', '#8B5CF6',
];

interface Particula {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
}

export function CelebracionAprobado({
  nota,
  moduloTitulo,
  siguienteDesbloqueado,
  onComplete,
}: CelebracionAprobadoProps) {
  const [visible, setVisible] = useState(true);
  const [saliendo, setSaliendo] = useState(false);
  const [particulas] = useState<Particula[]>(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORES_CONFETTI[Math.floor(Math.random() * COLORES_CONFETTI.length)],
      size: Math.random() * 8 + 4,
      delay: Math.random() * 0.8,
      duration: Math.random() * 1.5 + 1.5,
    }))
  );

  const mensaje = MENSAJES[Math.floor(Math.random() * MENSAJES.length)];

  useEffect(() => {
    // Empezar a salir a los 2.5 segundos
    const timerSalir = setTimeout(() => setSaliendo(true), 2500);
    // Completar a los 3.2 segundos
    const timerComplete = setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 3200);

    return () => {
      clearTimeout(timerSalir);
      clearTimeout(timerComplete);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-700 ${
        saliendo ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={() => {
        setSaliendo(true);
        setTimeout(() => { setVisible(false); onComplete(); }, 700);
      }}
    >
      {/* Confetti */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {particulas.map((p) => (
          <div
            key={p.id}
            className="absolute top-0 rounded-sm"
            style={{
              left: `${p.x}%`,
              width: `${p.size}px`,
              height: `${p.size * 1.5}px`,
              backgroundColor: p.color,
              animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>

      {/* Card central */}
      <div
        className={`bg-white rounded-3xl p-8 mx-6 max-w-sm w-full text-center shadow-2xl transition-transform duration-700 ${
          saliendo ? 'scale-90' : 'scale-100'
        }`}
        style={{
          animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        }}
      >
        {/* Emoji de trofeo animado */}
        <div
          className="text-6xl mb-4 inline-block"
          style={{ animation: 'bounce 0.6s ease infinite alternate' }}
        >
          🏆
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-1">
          ¡Aprobaste!
        </h1>

        <p className="text-4xl font-black text-green-600 mb-2">
          {nota.toFixed(1)}%
        </p>

        <p className="text-sm font-semibold text-gray-700 mb-1">
          {moduloTitulo}
        </p>

        <p className="text-sm text-gray-500 mb-4 italic">
          "{mensaje}"
        </p>

        {siguienteDesbloqueado && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 mb-4">
            <p className="text-sm text-blue-700 font-semibold">
              🔓 ¡Nuevo módulo desbloqueado!
            </p>
          </div>
        )}

        <p className="text-xs text-gray-400">
          Tocá para continuar
        </p>
      </div>

      {/* Estilos de animación */}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-10px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes popIn {
          0%   { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes bounce {
          0%   { transform: translateY(0px);  }
          100% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
