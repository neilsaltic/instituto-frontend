import axios from "axios";

function textoMensaje(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value)) {
    const messages = value.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
    return messages.length > 0 ? messages.join(" ") : null;
  }
  return null;
}

export function mensajeError(error: unknown, porDefecto: string): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "No hay conexión con el servidor.";
    }

    const datos: unknown = error.response.data;
    if (datos && typeof datos === "object") {
      const cuerpo = datos as {
        details?: { mensaje?: unknown }[];
        message?: unknown;
      };
      const detalle = textoMensaje(cuerpo.details?.[0]?.mensaje);

      return detalle ?? textoMensaje(cuerpo.message) ?? porDefecto;
    }

    return porDefecto;
  }

  return porDefecto;
}

export function mensajeRechazoMatricula(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "No se pudo enviar la matrícula. Inténtalo nuevamente.";
  }

  if (!error.response) return "No hay conexión con el servidor.";

  const data: unknown = error.response.data;
  const body =
    data && typeof data === "object"
      ? (data as {
          code?: unknown;
          error?: unknown;
          message?: unknown;
          details?: { mensaje?: unknown }[];
        })
      : null;
  const message =
    textoMensaje(body?.details?.[0]?.mensaje) ??
    textoMensaje(body?.message) ??
    textoMensaje(body?.error);
  const reasonCode = typeof body?.code === "string" ? body.code : "";
  const reason = `${reasonCode} ${message ?? ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (/credito|creditos|credit limit/.test(reason)) {
    return message
      ? `Límite de créditos superado: ${message}`
      : "Límite de créditos superado para este periodo.";
  }
  if (/cupo|capacity|sin lugares|sin espacio|lleno/.test(reason)) {
    return message
      ? `Grupo sin cupo: ${message}`
      : "El grupo ya no tiene cupos disponibles.";
  }
  if (/traslape|solapamiento|conflicto de horario|horario.*(cruz|coincid|superpon)|schedule overlap/.test(reason)) {
    return message
      ? `Traslape de horario: ${message}`
      : "El horario de este grupo se traslapa con otro grupo inscrito.";
  }
  if (/cursad|inscrit|matricul|duplicad|completad|already enrolled/.test(reason)) {
    return message
      ? `Materia ya cursada en este periodo: ${message}`
      : "Ya cursaste o estás inscrito en esta materia durante este periodo.";
  }

  return message
    ? `${message} (HTTP ${error.response.status})`
    : `La API rechazó la matrícula (HTTP ${error.response.status}).`;
}
