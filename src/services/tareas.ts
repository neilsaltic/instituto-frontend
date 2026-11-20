import { api } from "../lib/axios";

export interface CrearTarea {
  grupoId: number;
  titulo: string;
  descripcion: string;
  fechaLimite: string;
}

export interface EntregarTarea {
  tareaId: number;
  contenidoTexto?: string;
  archivoUrl?: string;
  archivo?: File;
}

export const tareasService = {
  getMisTareas: async (): Promise<unknown> => {
    const response = await api.get("/tareas/mis-tareas");
    return response.data;
  },

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

  getPadronGrupo: async (grupoId: number, tareaId: number): Promise<unknown> => {
    const response = await api.get(`/tareas/grupo/${grupoId}/estudiantes`, {
      params: { tareaId },
    });
    return response.data;
  },

  entregar: async (datos: EntregarTarea): Promise<unknown> => {
    const formData = new FormData();
    formData.append("tareaId", String(datos.tareaId));
    if (datos.contenidoTexto) formData.append("contenidoTexto", datos.contenidoTexto);
    if (datos.archivoUrl) formData.append("archivoUrl", datos.archivoUrl);
    if (datos.archivo) formData.append("archivo", datos.archivo);
    const response = await api.post("/tareas/entregar", formData);
    return response.data;
  },

  calificar: async (entregaId: number, calificacion: number): Promise<void> => {
    await api.patch(`/tareas/entregas/${entregaId}/calificar`, { calificacion });
  },
};
