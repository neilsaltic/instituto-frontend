import { api } from "../lib/axios";
import type { PerfilUsuario, Usuario } from "../types/usuario";

export interface LoginDatos {
  email: string;
  password: string;
}

export interface RegistroDatos {
  nombre: string;
  apellido: string;
  ci: string;
  email: string;
  password: string;
  fechaNacimiento: string; // Formato "YYYY-MM-DD"
  telefono?: string;
}
export interface Sesion {
  accessToken: string;
  tipo: string;
  usuario: Usuario;
}

export const authService = {
  // Iniciar sesión
  login: async (datos: LoginDatos): Promise<Sesion> => {
    const respuesta = await api.post<Sesion>("/auth/login", datos);
    return respuesta.data;
  },

  // Public registration always creates a student with a pending account.
  register: async (datos: RegistroDatos): Promise<Usuario> => {
    const { telefono, ...datosRequeridos } = datos;
    const respuesta = await api.post<Usuario>("/auth/register", {
      ...datosRequeridos,
      ...(telefono?.trim() ? { telefono: telefono.trim() } : {}),
      rol: "ESTUDIANTE",
    });
    return respuesta.data;
  },

  getProfile: async (): Promise<PerfilUsuario> => {
    const respuesta = await api.get<PerfilUsuario>("/auth/profile");
    return respuesta.data;
  },
};
