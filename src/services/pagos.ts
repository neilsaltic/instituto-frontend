import { api } from "../lib/axios";

export type ConceptoPago = "MATRICULA" | "INSCRIPCION" | "MENSUALIDAD";
export type MetodoPago = "EFECTIVO" | "TRANSFERENCIA" | "PASARELA_ONLINE";
export type EstadoPago = "PENDIENTE" | "APROBADO" | "RECHAZADO";

export interface CrearPago {
  estudianteUsuarioId: number;
  concepto: ConceptoPago;
  monto: number;
  metodo: MetodoPago;
}

export interface PagoCreado {
  id: number;
  estado?: EstadoPago;
}

export interface Pago {
  id: number;
  estudianteUsuarioId: number;
  concepto: ConceptoPago;
  monto: string | number;
  metodo: MetodoPago;
  estado: EstadoPago;
  fechaVerificacion?: string | null;
  creadoEn?: string;
  estudianteUsuario?: {
    id: number;
    nombre: string;
    apellido: string;
    email?: string;
  };
}

export interface FiltrosPagos {
  estado?: EstadoPago;
  estudiantePerfilId?: number;
}

export const pagosService = {
  getTodos: async (filtros: FiltrosPagos = {}): Promise<Pago[]> => {
    const response = await api.get("/pagos", { params: filtros });
    const data = response.data;
    if (Array.isArray(data)) return data as Pago[];
    if (data && typeof data === "object" && "data" in data) {
      const nested = (data as { data: unknown }).data;
      if (Array.isArray(nested)) return nested as Pago[];
    }
    throw new Error("La respuesta del servidor no contiene una lista de pagos válida.");
  },

  crear: async (datos: CrearPago): Promise<PagoCreado> => {
    const response = await api.post<PagoCreado>("/pagos", datos);
    return response.data;
  },
};
