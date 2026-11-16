import { api } from "../lib/axios";

export interface PeriodoAcademico {
  id: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  limiteCreditos: number;
  activo: boolean;
}

export interface HorarioGrupo {
  id?: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
}

export interface GrupoAcademico {
  id: number;
  nombre: string;
  materiaId?: number;
  periodoId?: number;
  profesorId?: number;
  cupoMaximo: number;
  horarios: HorarioGrupo[];
  materia?: { id: number; nombre: string; codigo?: string };
  periodo?: { id: number; nombre: string };
  profesor?: {
    id?: number;
    usuario?: { id?: number; nombre?: string; apellido?: string };
  };
  inscritos?: number;
  cuposDisponibles?: number;
  disponibles?: number;
}

export interface CrearPeriodo {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  limiteCreditos: number;
  activo?: boolean;
}

export interface CrearMateria {
  codigo: string;
  nombre: string;
  creditos: number;
  costoInscripcion: number;
  costoMensualidad: number;
}

export interface CrearHorario {
  diaSemana: "LUNES" | "MARTES" | "MIERCOLES" | "JUEVES" | "VIERNES";
  horaInicio: string;
  horaFin: string;
}

export interface CrearGrupo {
  materiaId: number;
  periodoId: number;
  profesorId: number;
  nombre: string;
  cupoMaximo: number;
  horarios: CrearHorario[];
}

function listar<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "data" in data) {
    const nested = (data as { data: unknown }).data;
    if (Array.isArray(nested)) return nested as T[];
    if (nested && typeof nested === "object" && "items" in nested) {
      const items = (nested as { items: unknown }).items;
      if (Array.isArray(items)) return items as T[];
    }
  }
  return [];
}

export const periodosService = {
  getTodos: async (): Promise<PeriodoAcademico[]> => {
    const response = await api.get("/periodos");
    return listar<PeriodoAcademico>(response.data);
  },
  crear: async (datos: CrearPeriodo): Promise<void> => {
    await api.post("/periodos", datos);
  },
  actualizar: async (id: number, datos: Partial<CrearPeriodo>): Promise<void> => {
    await api.patch(`/periodos/${id}`, datos);
  },
};

export const gruposService = {
  getTodos: async (periodoId?: number): Promise<GrupoAcademico[]> => {
    const response = await api.get("/grupos", {
      params: periodoId ? { periodoId } : undefined,
    });
    return listar<GrupoAcademico>(response.data);
  },
  crear: async (datos: CrearGrupo): Promise<void> => {
    await api.post("/grupos", datos);
  },
  actualizar: async (id: number, datos: Partial<CrearGrupo>): Promise<void> => {
    await api.patch(`/grupos/${id}`, datos);
  },
};
