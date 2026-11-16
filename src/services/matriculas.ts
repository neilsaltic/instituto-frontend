import { api } from "../lib/axios";

export interface CrearMatricula {
  estudiantePerfilId: number;
  grupoId: number;
}

export const matriculasService = {
  crear: async (datos: CrearMatricula): Promise<unknown> => {
    const response = await api.post("/matriculas", datos);
    return response.data;
  },

  getOferta: async (): Promise<unknown> => {
    const response = await api.get("/matriculas/oferta");
    return response.data;
  },

  getMisMaterias: async (): Promise<unknown> => {
    const response = await api.get("/matriculas/mis-materias");
    return response.data;
  },
};
