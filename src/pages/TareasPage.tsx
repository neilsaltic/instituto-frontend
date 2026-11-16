import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, RotateCcw, Save, Send } from "lucide-react";
import { PageHeading } from "../components/ui/PageHeading";
import { mensajeError } from "../lib/errores";
import { gruposService, type GrupoAcademico } from "../services/academico";
import { tareasService } from "../services/tareas";
import { useAuthStore } from "../store/useAuthStore";

type Registro = Record<string, unknown>;
type Tarea = {
  id: number;
  titulo: string;
  descripcion: string;
  fechaLimite: string;
};
type Entrega = {
  id: number;
  estudiante: string;
  contenidoTexto?: string;
  archivoUrl?: string;
  calificacion?: number;
};

function registro(value: unknown): Registro | null {
  return value && typeof value === "object" ? (value as Registro) : null;
}

function numero(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function lista(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const item = registro(value);
  if (Array.isArray(item?.data)) return item.data;
  if (Array.isArray(item?.items)) return item.items;
  if (item?.data && typeof item.data === "object") return lista(item.data);
  if (Array.isArray(item?.tareas)) return item.tareas;
  if (Array.isArray(item?.entregas)) return item.entregas;
  return [];
}

function normalizarTarea(value: unknown): Tarea | null {
  const item = registro(value);
  const id = numero(item?.id);
  if (!id) return null;
  return {
    id,
    titulo: typeof item?.titulo === "string" ? item.titulo : `Tarea ${id}`,
    descripcion: typeof item?.descripcion === "string" ? item.descripcion : "",
    fechaLimite: typeof item?.fechaLimite === "string" ? item.fechaLimite : "",
  };
}

function normalizarEntrega(value: unknown): Entrega | null {
  const item = registro(value);
  const id = numero(item?.id);
  if (!item || !id) return null;
  const student = registro(item.estudiante) ?? registro(item.alumno);
  const user = registro(student?.usuario) ?? student;
  const name = [user?.nombre, user?.apellido]
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join(" ");
  const grade =
    item.calificacion === null || item.calificacion === undefined
      ? Number.NaN
      : Number(item.calificacion);
  return {
    id,
    estudiante: name || `Estudiante ${numero(student?.id) ?? ""}`.trim(),
    contenidoTexto: typeof item.contenidoTexto === "string" ? item.contenidoTexto : undefined,
    archivoUrl: typeof item.archivoUrl === "string" ? item.archivoUrl : undefined,
    calificacion: Number.isFinite(grade) ? grade : undefined,
  };
}

function fecha(value: string): string {
  if (!value) return "Sin fecha límite";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

function StudentTasks() {
  const profileId = useAuthStore((state) => state.usuario?.perfilEstudiante?.id);
  const [taskId, setTaskId] = useState("");
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!profileId) {
      setError("Tu sesión no incluye el perfil de estudiante necesario para entregar una tarea.");
      return;
    }

    setSubmitting(true);
    try {
      await tareasService.entregar({
        estudiantePerfilId: profileId,
        tareaId: Number(taskId),
        contenidoTexto: content.trim() || undefined,
        archivoUrl: fileUrl.trim() || undefined,
      });
      setSuccess("Tu entrega fue enviada correctamente.");
      setTaskId("");
      setContent("");
      setFileUrl("");
    } catch (submitError) {
      setError(mensajeError(submitError, "No se pudo enviar la entrega."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeading
        eyebrow="TRABAJO ACADÉMICO"
        title="Mis tareas"
        description="Entrega las actividades asignadas a tus grupos."
      />
      <div className="academic-feedback task-api-limitation" role="note">
        La API documenta la consulta de tareas por grupo solo para Profesor y Administrador. Por ahora no es posible mostrar aquí la lista de tareas ni el estado de calificación del estudiante.
      </div>
      {error && <div className="academic-feedback is-error" role="alert">{error}</div>}
      {success && <div className="academic-feedback is-success" role="status"><CheckCircle2 size={16} />{success}</div>}
      <section className="panel task-panel">
        <div className="academic-section-heading">
          <div><h2>Enviar una entrega</h2><p>Solicita al docente el ID de la tarea para completar esta entrega.</p></div>
        </div>
        <form className="academic-form" onSubmit={(event) => void submit(event)}>
          <label>ID de tarea<input required min="1" type="number" value={taskId} onChange={(event) => setTaskId(event.target.value)} /></label>
          <label>Respuesta o comentario<textarea value={content} onChange={(event) => setContent(event.target.value)} rows={4} /></label>
          <label>Enlace al archivo o trabajo<input type="url" value={fileUrl} onChange={(event) => setFileUrl(event.target.value)} placeholder="https://..." /></label>
          <button className="button button-primary" disabled={submitting}><Send size={14} />{submitting ? "Enviando..." : "Enviar entrega"}</button>
        </form>
      </section>
    </>
  );
}

function TeacherTasks() {
  const usuario = useAuthStore((state) => state.usuario);
  const [grupos, setGrupos] = useState<GrupoAcademico[]>([]);
  const [grupoId, setGrupoId] = useState("");
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [tareaId, setTareaId] = useState<number | null>(null);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [notas, setNotas] = useState<Record<number, string>>({});
  const [cargandoGrupos, setCargandoGrupos] = useState(true);
  const [cargandoTareas, setCargandoTareas] = useState(false);
  const [cargandoEntregas, setCargandoEntregas] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [entregaGuardando, setEntregaGuardando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  const gruposAsignados = useMemo(() => {
    const profileId = usuario?.perfilProfesor?.id;
    return grupos.filter((group) =>
      (profileId !== undefined &&
        (group.profesorId === profileId || group.profesor?.id === profileId)) ||
      group.profesor?.usuario?.id === usuario?.id,
    );
  }, [grupos, usuario?.id, usuario?.perfilProfesor?.id]);

  useEffect(() => {
    let active = true;
    gruposService.getTodos()
      .then((items) => {
        if (!active) return;
        setGrupos(items);
        const profileId = usuario?.perfilProfesor?.id;
        const assigned = items.filter((group) =>
          (profileId !== undefined &&
            (group.profesorId === profileId || group.profesor?.id === profileId)) ||
          group.profesor?.usuario?.id === usuario?.id,
        );
        if (assigned[0]) {
          setCargandoTareas(true);
          setGrupoId(String(assigned[0].id));
        }
      })
      .catch((loadError: unknown) => {
        if (active) setError(mensajeError(loadError, "No se pudieron cargar tus grupos asignados."));
      })
      .finally(() => {
        if (active) setCargandoGrupos(false);
      });
    return () => {
      active = false;
    };
  }, [retry, usuario?.id, usuario?.perfilProfesor?.id]);

  useEffect(() => {
    const selectedGroupId = numero(grupoId);
    if (!selectedGroupId) return;

    let active = true;
    tareasService.getPorGrupo(selectedGroupId)
      .then((response) => {
        if (!active) return;
        const items = lista(response).flatMap((item) => {
          const task = normalizarTarea(item);
          return task ? [task] : [];
        });
        setTareas(items);
        setTareaId(null);
        setEntregas([]);
      })
      .catch((loadError: unknown) => {
        if (active) setError(mensajeError(loadError, "No se pudieron cargar las tareas del grupo."));
      })
      .finally(() => {
        if (active) setCargandoTareas(false);
      });
    return () => {
      active = false;
    };
  }, [grupoId]);

  const crearTarea = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const selectedGroupId = numero(grupoId);
    if (!selectedGroupId) {
      setError("Selecciona uno de tus grupos asignados.");
      return;
    }
    setGuardando(true);
    try {
      await tareasService.crear({
        grupoId: selectedGroupId,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fechaLimite: new Date(fechaLimite).toISOString(),
      });
      setSuccess("Tarea creada y asignada al grupo.");
      setTitulo("");
      setDescripcion("");
      setFechaLimite("");
      try {
        const response = await tareasService.getPorGrupo(selectedGroupId);
        setTareas(lista(response).flatMap((item) => {
          const task = normalizarTarea(item);
          return task ? [task] : [];
        }));
      } catch (refreshError) {
        setError(mensajeError(refreshError, "La tarea se creó, pero no se pudo actualizar la lista."));
      }
    } catch (saveError) {
      setError(mensajeError(saveError, "No se pudo crear la tarea."));
    } finally {
      setGuardando(false);
    }
  };

  const cargarEntregas = async (selectedTaskId: number) => {
    setTareaId(selectedTaskId);
    setError(null);
    setCargandoEntregas(true);
    try {
      const response = await tareasService.getEntregas(selectedTaskId);
      const items = lista(response).flatMap((item) => {
        const delivery = normalizarEntrega(item);
        return delivery ? [delivery] : [];
      });
      setEntregas(items);
      setNotas(Object.fromEntries(items.map((item) => [
        item.id,
        item.calificacion === undefined ? "" : String(item.calificacion),
      ])));
    } catch (loadError) {
      setEntregas([]);
      setError(mensajeError(loadError, "No se pudieron cargar las entregas."));
    } finally {
      setCargandoEntregas(false);
    }
  };

  const calificar = async (event: React.FormEvent<HTMLFormElement>, deliveryId: number) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const grade = Number(notas[deliveryId]);
    if (!Number.isFinite(grade) || grade < 0 || grade > 100) {
      setError("La calificación debe estar entre 0 y 100.");
      return;
    }
    if (tareaId === null) {
      setError("Selecciona una tarea antes de calificar.");
      return;
    }

    setEntregaGuardando(deliveryId);
    try {
      await tareasService.calificar(deliveryId, grade);
      setSuccess("Calificación guardada.");
      try {
        await cargarEntregas(tareaId);
      } catch (refreshError) {
        setError(mensajeError(refreshError, "La calificación se guardó, pero no se pudo actualizar la lista."));
      }
    } catch (gradeError) {
      setError(mensajeError(gradeError, "No se pudo guardar la calificación."));
    } finally {
      setEntregaGuardando(null);
    }
  };

  const reintentar = () => {
    setCargandoGrupos(true);
    setError(null);
    setRetry((value) => value + 1);
  };

  const cambiarGrupo = (value: string) => {
    setGrupoId(value);
    setCargandoTareas(true);
    setError(null);
    setTareas([]);
    setTareaId(null);
    setEntregas([]);
  };

  const selectedGroup = gruposAsignados.find((group) => group.id === Number(grupoId));

  return (
    <>
      <PageHeading
        eyebrow="GESTIÓN DOCENTE"
        title="Tareas y calificaciones"
        description="Publica actividades para tus grupos, revisa las entregas y califica el trabajo recibido."
      />
      {error && <div className="academic-feedback is-error" role="alert">{error}</div>}
      {success && <div className="academic-feedback is-success" role="status"><CheckCircle2 size={16} />{success}</div>}
      {cargandoGrupos ? (
        <div className="panel academic-panel">Cargando grupos asignados...</div>
      ) : gruposAsignados.length === 0 ? (
        <div className="panel academic-panel academic-load-error">
          <p>No se encontraron grupos asignados a tu perfil docente.</p>
          <button className="button button-outline" onClick={reintentar}><RotateCcw size={14} /> Reintentar</button>
        </div>
      ) : (
        <div className="task-teacher-layout">
          <div className="task-teacher-column">
            <section className="panel task-panel">
              <div className="academic-section-heading">
                <div><h2>Crear tarea</h2><p>La tarea se publicará para todos los estudiantes del grupo.</p></div>
              </div>
              <form className="academic-form" onSubmit={(event) => void crearTarea(event)}>
                <label>Grupo asignado
                  <select required value={grupoId} onChange={(event) => cambiarGrupo(event.target.value)}>
                    {gruposAsignados.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.materia?.nombre ?? "Materia"} · {group.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label>Título<input required value={titulo} onChange={(event) => setTitulo(event.target.value)} /></label>
                <label>Instrucciones<textarea required rows={4} value={descripcion} onChange={(event) => setDescripcion(event.target.value)} /></label>
                <label>Fecha límite<input required type="datetime-local" value={fechaLimite} onChange={(event) => setFechaLimite(event.target.value)} /></label>
                <button className="button button-primary" disabled={guardando}><Save size={14} />{guardando ? "Publicando..." : "Publicar tarea"}</button>
              </form>
            </section>
            <section className="panel task-panel">
              <div className="academic-section-heading">
                <div><h2>Tareas del grupo</h2><p>{selectedGroup?.materia?.nombre ?? selectedGroup?.nombre ?? "Selecciona un grupo"}</p></div>
              </div>
              {cargandoTareas ? <p className="academic-empty">Cargando tareas...</p> : tareas.length === 0 ? (
                <p className="academic-empty">Este grupo todavía no tiene tareas publicadas.</p>
              ) : (
                <div className="academic-record-list">
                  {tareas.map((task) => (
                    <button className={`task-record ${tareaId === task.id ? "is-selected" : ""}`} key={task.id} onClick={() => void cargarEntregas(task.id)}>
                      <span className="task-record-icon"><ClipboardList size={16} /></span>
                      <span className="task-record-copy"><strong>{task.titulo}</strong><small>Entrega: {fecha(task.fechaLimite)}</small></span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="panel task-panel task-deliveries-panel">
            <div className="academic-section-heading">
              <div><h2>Entregas y calificaciones</h2><p>{tareaId ? `Tarea ${tareaId}` : "Selecciona una tarea"}</p></div>
            </div>
            {tareaId === null ? (
              <p className="academic-empty">Selecciona una tarea para revisar las entregas recibidas.</p>
            ) : cargandoEntregas ? (
              <p className="academic-empty">Cargando entregas...</p>
            ) : entregas.length === 0 ? (
              <p className="academic-empty">La API no devolvió entregas para esta tarea. No se puede determinar quién falta sin el padrón de estudiantes del grupo.</p>
            ) : (
              <div className="task-delivery-list">
                {entregas.map((delivery) => (
                  <article className="task-delivery" key={delivery.id}>
                    <div className="task-delivery-student">
                      <strong>{delivery.estudiante}</strong>
                      {delivery.contenidoTexto && <p>{delivery.contenidoTexto}</p>}
                      {delivery.archivoUrl && <a href={delivery.archivoUrl} target="_blank" rel="noreferrer">Abrir archivo entregado</a>}
                    </div>
                    <form className="task-grade-form" onSubmit={(event) => void calificar(event, delivery.id)}>
                      <label>Nota (0–100)<input required min="0" max="100" step="0.01" type="number" value={notas[delivery.id] ?? ""} onChange={(event) => setNotas((current) => ({ ...current, [delivery.id]: event.target.value }))} /></label>
                      <button className="button button-primary" disabled={entregaGuardando !== null}><Save size={13} />{entregaGuardando === delivery.id ? "Guardando..." : delivery.calificacion === undefined ? "Calificar" : "Actualizar nota"}</button>
                    </form>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}

export function TareasPage() {
  const role = useAuthStore((state) => state.usuario?.rol);
  return role === "PROFESOR" ? <TeacherTasks /> : <StudentTasks />;
}
