import { api } from "../lib/axios";
import type { Curso } from "../types/curso";

export const cursosService = {
  getTodos: async (): Promise<Curso[]> => {
    const response = await api.get("/cursos?limit=50");
    const data = response.data;
    if (data && typeof data === "object" && Array.isArray(data.data)) {
      return data.data;
    }
    return Array.isArray(data) ? data : [];
  },
};
