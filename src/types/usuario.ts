// Roles que maneja la API
export type Rol = "ADMINISTRADOR" | "RECEPCIONISTA" | "PROFESOR" | "ESTUDIANTE";

export interface PerfilEstudiante {
  id: number;
  usuarioId: number;
  codigoMatricula?: string;
  nombreTutor?: string;
  telefonoTutor?: string;
}

export interface PerfilProfesor {
  id: number;
  usuarioId: number;
}

export interface Usuario {
  id: number;
  nombre: string;
  apellido?: string;
  email: string;
  ci?: string;
  fechaNacimiento?: string;
  telefono?: string | null;
  rol: Rol;
  estado: string;
  especialidad?: string;
  fechaContratacion?: string;
  perfilEstudiante?: PerfilEstudiante | null;
  perfilProfesor?: PerfilProfesor | null;
}

export interface PerfilUsuario extends Usuario {
  apellido: string;
  perfilEstudiante: PerfilEstudiante | null;
}
