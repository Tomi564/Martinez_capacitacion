-- Actualización de contacto de cliente (edición desde atenciones) + limpieza de mails inválidos.

ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS clientes_email_check;
ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS check_email;
ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS clientes_email_format_check;

UPDATE public.clientes
SET email = regexp_replace(email, '\.\.+', '.', 'g')
WHERE email IS NOT NULL AND email LIKE '%..%';

CREATE OR REPLACE FUNCTION public.actualizar_cliente_contacto(
  p_cliente_id uuid,
  p_nombre text,
  p_apellido text,
  p_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.clientes
  SET
    nombre = COALESCE(NULLIF(btrim(p_nombre), ''), nombre),
    apellido = COALESCE(NULLIF(btrim(p_apellido), ''), apellido),
    email = CASE
      WHEN NULLIF(btrim(p_email), '') IS NOT NULL THEN btrim(p_email)
      ELSE email
    END,
    updated_at = now()
  WHERE id = p_cliente_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'cliente_no_encontrado' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.actualizar_cliente_contacto(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.actualizar_cliente_contacto(uuid, text, text, text) TO service_role;
