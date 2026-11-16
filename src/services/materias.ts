import { api } from "../lib/axios";
import type { CrearMateria } from "./academico";

export interface Materia {
  id: number;
  codigo: string;
  nombre: string;
  creditos: number;
  costoInscripcion: string | number;
  costoMensualidad: string | number;
  _count?: {
    grupos: number;
  };
}

export interface GrupoMateria {
  id: number;
  nombre: string;
  profesor: {
    usuario: {
      nombre: string;
      apellido: string;
    };
  } | null;
}

export interface MateriaDetalle extends Materia {
  grupos: GrupoMateria[];
}

export const materiasService = {
  getTodas: async (): Promise<Materia[]> => {
    const response = await api.get("/materias");
    const data = response.data;
    if (data && typeof data === "object" && Array.isArray(data.data)) {
      return data.data;
    }
    return Array.isArray(data) ? data : [];
  },

  getDetalle: async (id: number): Promise<MateriaDetalle> => {
    const response = await api.get<MateriaDetalle>(`/materias/${id}`);
    return response.data;
  },

  crear: async (datos: CrearMateria): Promise<void> => {
    await api.post("/materias", datos);
  },

  actualizar: async (id: number, datos: Partial<CrearMateria>): Promise<void> => {
    await api.patch(`/materias/${id}`, datos);
  },

  getProfesores: async (materiaId: number): Promise<unknown> => {
    const response = await api.get(`/materias/${materiaId}/profesores`);
    return response.data;
  },
};
