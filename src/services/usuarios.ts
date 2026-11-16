import { api } from "../lib/axios";
import type { Usuario } from "../types/usuario";

export interface UsuarioDirectorio extends Usuario {
  apellido: string;
}

export interface CrearEstudiante {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  ci: string;
  fechaNacimiento: string;
  telefono?: string;
  estado?: string;
  nombreTutor?: string;
  telefonoTutor?: string;
}

export interface CrearProfesor {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  ci: string;
  fechaNacimiento: string;
  telefono?: string;
  estado?: string;
  especialidad: string;
  fechaContratacion?: string;
}

export type CrearRecepcionista = Omit<CrearEstudiante, "nombreTutor" | "telefonoTutor">;

function listarUsuarios(data: unknown): UsuarioDirectorio[] {
  if (Array.isArray(data)) return data as UsuarioDirectorio[];
  if (data && typeof data === "object" && "data" in data) {
    const nested = (data as { data: unknown }).data;
    if (Array.isArray(nested)) return nested as UsuarioDirectorio[];
  }
  throw new Error("La respuesta del servidor no contiene una lista de usuarios válida.");
}

export const usuariosService = {
  getEstudiantes: async (): Promise<UsuarioDirectorio[]> => {
    const response = await api.get("/usuarios/estudiantes");
    return listarUsuarios(response.data);
  },

  crearEstudiante: async (datos: CrearEstudiante): Promise<UsuarioDirectorio> => {
    const response = await api.post<UsuarioDirectorio>("/usuarios/estudiantes", datos);
    return response.data;
  },

  getProfesores: async (): Promise<UsuarioDirectorio[]> => {
    const response = await api.get("/usuarios/profesores");
    return listarUsuarios(response.data);
  },

  crearProfesor: async (datos: CrearProfesor): Promise<UsuarioDirectorio> => {
    const response = await api.post<UsuarioDirectorio>("/usuarios/profesores", datos);
    return response.data;
  },

  getRecepcionistas: async (): Promise<UsuarioDirectorio[]> => {
    const response = await api.get("/usuarios/Recepcionista");
    return listarUsuarios(response.data);
  },

  crearRecepcionista: async (datos: CrearRecepcionista): Promise<UsuarioDirectorio> => {
    const response = await api.post<UsuarioDirectorio>("/usuarios/Recepcionista", datos);
    return response.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/usuarios/${id}`);
  },
};
