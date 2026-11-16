export type Student = {
  id: string
  name: string
  email: string
  program: string
  semester: string
  status: 'Activo' | 'Pendiente' | 'Inactivo'
  initials: string
  color: string
}

export type Course = {
  id: string
  name: string
  code: string
  teacher: string
  schedule: string
  students: number
  capacity: number
  color: string
}

export type Teacher = {
  name: string
  email: string
  department: string
  courses: number
  initials: string
  color: string
}
