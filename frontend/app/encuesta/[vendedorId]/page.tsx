/**
 * encuesta/[vendedorId]/page.tsx — Encuesta pública para el cliente
 *
 * Esta página NO requiere login.
 * El cliente llega acá escaneando el QR del vendedor.
 *
 * Flujo:
 *  1. Carga datos básicos del vendedor (nombre, calificación promedio)
 *  2. Cliente selecciona estrellas (1-5)
 *  3. Cliente escribe comentario opcional
 *  4. Envía → pantalla de agradecimiento
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import Image from 'next/image';

interface VendedorPublico {
  nombre: string;
  apellido: string;
  promedio: number;
  totalCalificaciones: number;
}

type EstadoEncuesta = 'cargando' | 'respondiendo' | 'enviando' | 'gracias' | 'error';

export default function EncuestaPage() {
  const params = useParams();
  const codigo = params.vendedorId as string;

  const [estado, setEstado] = useState<EstadoEncuesta>('cargando');
  const [vendedor, setVendedor] = useState<VendedorPublico | null>(null);
  const [estrellasVendedor, setEstrellasVendedor] = useState<number>(0);
  const [estrellasEmpresa, setEstrellasEmpresa] = useState<number>(0);
  const [comentario, setComentario] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [contacto, setContacto] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [participanteYaRegistrado, setParticipanteYaRegistrado] = useState(false);

  useEffect(() => {
    const fetchVendedor = async () => {
      try {
        const res = await apiClient.get<VendedorPublico>(
          `/qr/encuesta/${codigo}`
        );
        setVendedor(res);
        setEstado('respondiendo');
      } catch {
        setEstado('error');
        setErrorMsg('El código QR no es válido o expiró.');
      }
    };

    fetchVendedor();
  }, [codigo]);

  const handleSubmit = async () => {
    if (estrellasVendedor === 0 || estrellasEmpresa === 0) return;

    setEstado('enviando');
    try {
      const res = await apiClient.post<{ participanteYaRegistrado?: boolean }>(`/qr/calificar/${codigo}`, {
        estrellasVendedor,
        estrellasEmpresa,
        comentario: comentario.trim() || null,
        nombre: nombre.trim() || undefined,
        apellido: apellido.trim() || undefined,
        dni: dni.trim() || undefined,
        contacto: contacto.trim() || undefined,
      });
      setParticipanteYaRegistrado(!!res.participanteYaRegistrado);
      setEstado('gracias');
    } catch {
      setEstado('respondiendo');
      setErrorMsg('Error al enviar la calificación. Intentá de nuevo.');
    }
  };

  const labelEstrellas: Record<number, string> = {
    1: 'Muy malo',
    2: 'Malo',
    3: 'Regular',
    4: 'Bueno',
    5: '¡Excelente!',
  };

  // ─── CARGANDO ──────────────────────────────────────
  if (estado === 'cargando') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Cargando encuesta...</p>
        </div>
      </div>
    );
  }

  // ─── ERROR ─────────────────────────────────────────
  if (estado === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="max-w-sm w-full text-center">
          <Image src="/icons/martinez-logo.svg" alt="Martínez Neumáticos" width={72} height={72} className="mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            QR inválido
          </h1>
          <p className="text-sm text-gray-500">{errorMsg}</p>
        </div>
      </div>
    );
  }

  // ─── GRACIAS ───────────────────────────────────────
  if (estado === 'gracias') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="max-w-sm w-full text-center flex flex-col gap-4">
          <Image src="/icons/martinez-logo.svg" alt="Martínez Neumáticos" width={80} height={80} className="mx-auto" />

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              ¡Muchas gracias!
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              Gracias por ayudarnos a mejorar en Martínez Neumáticos.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 text-left">
            <p className="text-sm font-semibold text-gray-900">Tu valoración del vendedor: {estrellasVendedor}/5</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">Tu valoración de Martínez: {estrellasEmpresa}/5</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
            <p className="text-sm font-semibold text-amber-800">
              {participanteYaRegistrado ? '🎁 Ya estabas registrado en el sorteo' : '🎁 ¡Ya estás participando!'}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {participanteYaRegistrado
                ? 'Mantenemos tu participación vigente para el próximo sorteo mensual.'
                : 'Tu calificación te inscribió automáticamente en el sorteo mensual de Martínez Neumáticos.'}
            </p>
          </div>

          <p className="text-sm text-gray-400">
            Podés cerrar esta página
          </p>
        </div>
      </div>
    );
  }

  // ─── ENCUESTA ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="bg-[#111111] text-white px-6 pt-10 pb-6 border-b-4 border-[#C8102E]">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Image src="/icons/martinez-logo.svg" alt="Martínez Neumáticos" width={44} height={44} />
            <div>
              <p className="text-xs text-gray-300 uppercase tracking-wide">Encuesta oficial</p>
              <p className="text-sm font-bold">Martínez Neumáticos</p>
            </div>
          </div>

          <p className="text-gray-300 text-sm mb-1">Te atendió</p>
          <h1 className="text-2xl font-bold text-white">
            {vendedor?.nombre} {vendedor?.apellido}
          </h1>

          {/* Calificación actual */}
          {vendedor && vendedor.totalCalificaciones > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-sm ${
                      star <= Math.round(vendedor.promedio)
                        ? 'text-amber-400'
                        : 'text-gray-600'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-gray-400 text-xs">
                {vendedor.promedio.toFixed(1)} · {vendedor.totalCalificaciones}{' '}
                {vendedor.totalCalificaciones === 1
                  ? 'calificación'
                  : 'calificaciones'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Formulario */}
      <div className="flex-1 px-6 py-8 bg-[#FAFAFA]">
        <div className="max-w-sm mx-auto flex flex-col gap-6">

          {/* Error */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{errorMsg}</p>
            </div>
          )}

          <StarsBlock
            title={`Tu experiencia con ${vendedor?.nombre || 'el vendedor'}`}
            value={estrellasVendedor}
            onChange={setEstrellasVendedor}
            labels={labelEstrellas}
          />

          <StarsBlock
            title="Tu experiencia en Martínez Neumáticos"
            value={estrellasEmpresa}
            onChange={setEstrellasEmpresa}
            labels={labelEstrellas}
          />

          {/* Comentario opcional */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Comentario{' '}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Contanos tu experiencia..."
              rows={3}
              maxLength={300}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C8102E] resize-none"
            />
            <p className="text-xs text-gray-400 text-right mt-1">
              {comentario.length}/300
            </p>
          </div>

          {/* Datos para el sorteo */}
          <div className="flex flex-col gap-3 bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🎁</span>
              <p className="text-sm font-bold text-gray-900">
                Completá tus datos para participar del sorteo mensual
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Juan"
                  className="h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Apellido</label>
                <input
                  type="text"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  placeholder="García"
                  className="h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">DNI</label>
              <input
                type="text"
                inputMode="numeric"
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                placeholder="12345678"
                maxLength={8}
                className="h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Teléfono o email</label>
              <input
                type="text"
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                placeholder="3874123456 / juan@gmail.com"
                className="h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              />
            </div>
            <p className="text-xs text-gray-400">
              Opcional — solo se usa para contactarte si ganás
            </p>
          </div>

          {/* Botón enviar */}
          <button
            onClick={handleSubmit}
            disabled={estrellasVendedor === 0 || estrellasEmpresa === 0 || estado === 'enviando'}
            className="w-full py-4 bg-[#C8102E] text-white font-bold rounded-2xl disabled:opacity-40 active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            {estado === 'enviando' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar valoración'
            )}
          </button>

          <p className="text-xs text-center text-gray-400">
            Tus datos son confidenciales y no serán compartidos
          </p>

        </div>
      </div>

    </div>
  );
}

function StarsBlock({
  title,
  value,
  onChange,
  labels,
}: {
  title: string;
  value: number;
  onChange: (n: number) => void;
  labels: Record<number, string>;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-sm font-semibold text-gray-900 mb-3">{title}</p>
      <div className="flex justify-center gap-2 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="text-5xl leading-none active:scale-110 transition-transform"
            aria-label={`Valorar ${star} estrellas`}
          >
            <span className={star <= (hover || value) ? 'text-[#F5C400]' : 'text-gray-200'}>
              ★
            </span>
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-gray-500 h-4">
        {(hover || value) ? labels[hover || value] : ''}
      </p>
    </div>
  );
}