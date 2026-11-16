# Aula+ | Sistema académico

Panel administrativo de muestra para gestionar estudiantes, cursos, docentes y actividades académicas. Está construido con React, TypeScript, Vite y React Router.

## Inicio rápido

```sh
npm install
npm run dev
```

`npm run build` valida los tipos y genera la versión de producción en `dist`. `npm run lint` ejecuta Oxlint.

## Secciones

- **Resumen:** indicadores, inscripciones, actividad reciente y próximas clases.
- **Estudiantes:** búsqueda y filtros por estado.
- **Cursos:** catálogo, docentes y capacidad por curso.
- **Docentes:** listado y acceso al correo.
- **Calendario:** horario semanal de clases; el estudiante ve los horarios de sus grupos inscritos.
- **Gestión académica (Administrador):** alta y edición de periodos, materias, grupos y horarios.
- **Matrícula (Estudiante):** oferta del periodo activo, cupos y horarios; los rechazos muestran el mensaje devuelto por la API.
- **Tareas:** el docente crea tareas y califica entregas; el estudiante puede enviar una entrega usando el ID de la tarea.
- **Acceso por rol:** el resumen no está disponible para estudiantes, quienes tampoco pueden acceder al directorio de estudiantes ni al de docentes.
- **Acceso:** inicio de sesión y registro de estudiantes conectados al backend.

El catálogo, la gestión académica, las matrículas y las tareas usan los endpoints del backend configurados en `src/lib/axios.ts`. La API documenta la consulta de tareas por grupo solo para Profesor y Administrador, por lo que el estudiante todavía no puede ver la lista de tareas desde la interfaz. Tampoco hay un endpoint documentado para obtener el padrón completo del grupo y detectar quién no entregó. Otras secciones todavía usan datos de ejemplo en `src/data/mockData.ts`.

## Organización del código

- `src/components/`: componentes reutilizables de layout, dashboard y UI.
- `src/pages/`: páginas asociadas a las rutas.
- `src/data/`: datos de demostración.
- `src/hooks/`: hooks de sesión y estado reutilizable.
- `src/lib/`: utilidades compartidas.
- `src/types/`: tipos del dominio académico.
- `src/index.css`: estilos globales y responsive.
