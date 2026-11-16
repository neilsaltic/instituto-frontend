import { api } from "../lib/axios";

export interface CrearTarea {
  grupoId: number;
  titulo: string;
  descripcion: string;
  fechaLimite: string;
}

export interface EntregarTarea {
  estudiantePerfilId: number;
  tareaId: number;
  contenidoTexto?: string;
  archivoUrl?: string;
}

export const tareasService = {
  crear: async (datos: CrearTarea): Promise<void> => {
    await api.post("/tareas", datos);
  },

  getPorGrupo: async (grupoId: number): Promise<unknown> => {
    const response = await api.get(`/tareas/grupo/${grupoId}`);
    return response.data;
  },

  getEntregas: async (tareaId: number): Promise<unknown> => {
    const response = await api.get(`/tareas/${tareaId}/entregas`);
    return response.data;
  },

  entregar: async (datos: EntregarTarea): Promise<unknown> => {
    const response = await api.post("/tareas/entregar", datos);
    return response.data;
  },

  calificar: async (entregaId: number, calificacion: number): Promise<void> => {
    await api.patch(`/tareas/entregas/${entregaId}/calificar`, { calificacion });
  },
};
