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
- **Tareas:** el docente crea tareas para sus grupos y califica entregas; el estudiante consulta `GET /tareas/mis-tareas` para ver pendientes/entregas/notas y enviar su trabajo.
- **Acceso por rol:** el resumen no está disponible para estudiantes, quienes tampoco pueden acceder al directorio de estudiantes ni al de docentes.
- **Acceso:** inicio de sesión y registro de estudiantes conectados al backend.

El catálogo, la gestión académica, las matrículas y las tareas usan los endpoints del backend configurados en `src/lib/axios.ts`. El calendario del estudiante combina sus grupos inscritos con `GET /grupos?periodoId=...` para mostrar únicamente sus horarios. El panel de tareas del estudiante consume `GET /tareas/mis-tareas`, que debe devolver las tareas de sus grupos con el estado de su propia entrega y la calificación si existe. El endpoint `GET /tareas/grupo/:grupoId` sigue restringido a Profesor y Administrador y no devuelve el estado individual de entrega. Tampoco hay un endpoint documentado para obtener el padrón completo del grupo y detectar quién no entregó. Otras secciones todavía usan datos de ejemplo en `src/data/mockData.ts`.

## Organización del código

- `src/components/`: componentes reutilizables de layout, dashboard y UI.
- `src/pages/`: páginas asociadas a las rutas.
- `src/data/`: datos de demostración.
- `src/hooks/`: hooks de sesión y estado reutilizable.
- `src/lib/`: utilidades compartidas.
- `src/types/`: tipos del dominio académico.
- `src/index.css`: estilos globales y responsive.
