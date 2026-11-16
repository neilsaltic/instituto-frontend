export interface DocenteCurso {
  id: number;
  username: string;
  nombre: string;
  apellido: string;
  fotoUrl?: string | null;
}

export interface Curso {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  creditos: number;
  cupo: number;
  inscritos: number;
  disponibles: number;
  docente: DocenteCurso | null; // <-- Aquí está la clave
  horario?: string;
  categoria?: string;
}
