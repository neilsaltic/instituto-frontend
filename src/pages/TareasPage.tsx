import { useEffect, useState } from "react";
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
  grupoId?: number;
  grupoNombre?: string;
  materiaNombre?: string;
  estadoEntrega: "PENDIENTE" | "ENTREGADA" | "CALIFICADA";
  calificacion?: number;
};
type GrupoEstudiante = {
  id: number;
  nombre: string;
  materiaNombre: string;
  periodoNombre?: string;
  profesorNombre?: string;
  horarios: { diaSemana: string; horaInicio: string; horaFin: string }[];
};
type Entrega = {
  id: number;
  estudiante: string;
  contenidoTexto?: string;
  archivoUrl?: string;
  calificacion?: number;
};
type EstudianteTarea = {
  estudiantePerfilId: number;
  estudiante: string;
  estado: "NO_ENTREGADA" | "PENDIENTE_DE_REVISION" | "CALIFICADA";
  entrega: Entrega | null;
};

const MAX_ARCHIVO_ENTREGA = 10 * 1024 * 1024;
const EXTENSIONES_ENTREGA = [".pdf", ".doc", ".docx", ".txt"];

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
  if (Array.isArray(item?.grupos)) return item.grupos;
  if (Array.isArray(item?.matriculas)) return item.matriculas;
  if (Array.isArray(item?.materias)) return item.materias;
  if (Array.isArray(item?.tareas)) return item.tareas;
  if (Array.isArray(item?.entregas)) return item.entregas;
  if (item?.grupo && item?.detalleInscripcionId !== undefined) return [value];
  if (item?.id !== undefined) return [value];
  return [];
}

function normalizarTarea(value: unknown, group?: GrupoEstudiante): Tarea | null {
  const item = registro(value);
  const task = registro(item?.tarea) ?? item;
  const id = numero(task?.id) ?? numero(item?.tareaId);
  if (!id) return null;
  const taskGroup =
    registro(task?.grupo) ??
    registro(item?.grupo) ??
    registro(task?.grupoDetalle);
  const subject = registro(taskGroup?.materia);
  const delivery =
    registro(item?.entrega) ??
    registro(item?.miEntrega) ??
    registro(task?.entrega) ??
    registro(task?.miEntrega);
  const gradeValue = delivery?.calificacion ?? item?.calificacion ?? task?.calificacion;
  const grade = gradeValue === null || gradeValue === undefined
    ? Number.NaN
    : Number(gradeValue);
  const rawStatus = [
    delivery?.estadoCalificacion,
    delivery?.estadoEntrega,
    delivery?.estado,
    item?.estadoCalificacion,
    item?.estadoEntrega,
    item?.estado,
    task?.estadoEntrega,
  ].find((status): status is string => typeof status === "string");
  const normalizedStatus = rawStatus?.toUpperCase() ?? "";
  const estadoEntrega = Number.isFinite(grade) || normalizedStatus.includes("CALIFIC")
    ? "CALIFICADA"
    : normalizedStatus.includes("PENDIENT") ||
        normalizedStatus.includes("SIN_ENTREGA") ||
        normalizedStatus.includes("NO_ENTREGA")
      ? "PENDIENTE"
      : normalizedStatus.includes("ENTREG") ||
          normalizedStatus.includes("ENVIAD") ||
          delivery ||
          item?.entregaId
      ? "ENTREGADA"
      : "PENDIENTE";
  return {
    id,
    titulo: typeof task?.titulo === "string" ? task.titulo : `Tarea ${id}`,
    descripcion: typeof task?.descripcion === "string" ? task.descripcion : "",
    fechaLimite: typeof task?.fechaLimite === "string" ? task.fechaLimite : "",
    grupoId: numero(task?.grupoId) ?? numero(taskGroup?.id) ?? group?.id,
    grupoNombre: typeof taskGroup?.nombre === "string" ? taskGroup.nombre : group?.nombre,
    materiaNombre: typeof subject?.nombre === "string" ? subject.nombre : group?.materiaNombre,
    estadoEntrega,
    calificacion: Number.isFinite(grade) ? grade : undefined,
  };
}

function normalizarTareas(value: unknown, group?: GrupoEstudiante): Tarea[] {
  return lista(value).flatMap((entry) => {
    const item = registro(entry);
    if (!item) return [];
    const nestedGroup = registro(item.grupo) ?? registro(item.grupoDetalle);
    const groupSource = nestedGroup ?? (Array.isArray(item.tareas) ? item : null);
    const groupId = numero(groupSource?.id) ?? numero(item.grupoId);
    const groupMatter = registro(groupSource?.materia);
    const taskGroup = groupSource && groupId
      ? {
          id: groupId,
          nombre: typeof groupSource.nombre === "string" ? groupSource.nombre : `Grupo ${groupId}`,
          materiaNombre: typeof groupMatter?.nombre === "string"
            ? groupMatter.nombre
            : "Materia",
          horarios: [],
        }
      : group;

    if (Array.isArray(item.tareas)) {
      return item.tareas.flatMap((task) => normalizarTareas(task, taskGroup));
    }
    if (typeof item.titulo !== "string" && !registro(item.tarea)) return [];
    const task = normalizarTarea(entry, taskGroup);
    return task ? [task] : [];
  });
}

function normalizarGruposEstudiante(value: unknown): GrupoEstudiante[] {
  return lista(value).flatMap((entry) => {
    const enrollment = registro(entry);
    const group = registro(enrollment?.grupo);
    const groupId = numero(group?.id);
    if (!group || !groupId) return [];

    const subject = registro(enrollment?.materia);
    const period = registro(enrollment?.periodo);
    const teacher = registro(group.profesor);
    const teacherUser = registro(teacher?.usuario);
    const schedule = lista(group.horarios).flatMap((entry) => {
      const item = registro(entry);
      if (
        typeof item?.diaSemana !== "string" ||
        typeof item.horaInicio !== "string" ||
        typeof item.horaFin !== "string"
      ) return [];
      return [{
        diaSemana: item.diaSemana,
        horaInicio: item.horaInicio,
        horaFin: item.horaFin,
      }];
    });

    return [{
      id: groupId,
      nombre: typeof group.nombre === "string" ? group.nombre : `Grupo ${groupId}`,
      materiaNombre: typeof subject?.nombre === "string" ? subject.nombre : "Materia",
      periodoNombre: typeof period?.nombre === "string" ? period.nombre : undefined,
      profesorNombre: [teacherUser?.nombre, teacherUser?.apellido]
        .filter((name): name is string => typeof name === "string" && name.length > 0)
        .join(" ") || undefined,
      horarios: schedule,
    }];
  });
}

function normalizarEntrega(value: unknown): Entrega | null {
  const item = registro(value);
  const id = numero(item?.id);
  if (!item || !id) return null;
  const student =
    registro(item.estudiante) ??
    registro(item.alumno) ??
    registro(item.estudiantePerfil);
  const user = registro(student?.usuario) ?? student;
  const name = [user?.nombre, user?.apellido]
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join(" ");
  const grade =
    item.calificacion === null || item.calificacion === undefined
      ? Number.NaN
      : Number(item.calificacion);
  const studentId = numero(student?.id) ?? numero(item.estudiantePerfilId);
  return {
    id,
    estudiante: name || `Estudiante ${studentId ?? ""}`.trim(),
    contenidoTexto: typeof item.contenidoTexto === "string" ? item.contenidoTexto : undefined,
    archivoUrl: typeof item.archivoUrl === "string" ? item.archivoUrl : undefined,
    calificacion: Number.isFinite(grade) ? grade : undefined,
  };
}

function normalizarPadron(value: unknown): EstudianteTarea[] {
  const root = registro(value);
  const payload = registro(root?.data) ?? root;
  return lista(payload?.estudiantes).flatMap((entry) => {
    const item = registro(entry);
    const studentId = numero(item?.estudiantePerfilId);
    if (!item || !studentId) return [];

    const user = registro(item.usuario);
    const deliveryValue = item.entrega;
    const delivery = deliveryValue ? normalizarEntrega(deliveryValue) : null;
    const rawStatus = typeof item.estado === "string" ? item.estado.toUpperCase() : "";
    const estado = rawStatus === "CALIFICADA" || delivery?.calificacion !== undefined
      ? "CALIFICADA"
      : rawStatus === "PENDIENTE_DE_REVISION" || delivery
        ? "PENDIENTE_DE_REVISION"
        : "NO_ENTREGADA";
    const name = [user?.nombre, user?.apellido]
      .filter((part): part is string => typeof part === "string" && part.length > 0)
      .join(" ");

    return [{
      estudiantePerfilId: studentId,
      estudiante: name || `Estudiante ${studentId}`,
      estado,
      entrega: delivery,
    }];
  });
}

function fecha(value: string): string {
  if (!value) return "Sin fecha límite";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

function StudentTasks() {
  const [grupos, setGrupos] = useState<GrupoEstudiante[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [grupoId, setGrupoId] = useState("");
  const [tareaId, setTareaId] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const grupoSeleccionado = grupos.find((group) => group.id === Number(grupoId));
  const tareasDelGrupo = tareas.filter((task) => task.grupoId === Number(grupoId));
  const tareaSeleccionada = tareasDelGrupo.find((task) => task.id === tareaId);
  const pendientes = tareasDelGrupo.filter((task) => task.estadoEntrega === "PENDIENTE").length;

  useEffect(() => {
    let active = true;
    Promise.all([
      gruposService.getMisGruposEstudiante(),
      tareasService.getMisTareas(),
    ])
      .then(([groupResponse, taskResponse]) => {
        if (active) {
          const enrolledGroups = normalizarGruposEstudiante(groupResponse);
          setGrupos(enrolledGroups);
          setGrupoId((current) =>
            enrolledGroups.some((group) => String(group.id) === current)
              ? current
              : String(enrolledGroups[0]?.id ?? ""),
          );
          const fallbackGroup = enrolledGroups.length === 1 ? enrolledGroups[0] : undefined;
          setTareas(normalizarTareas(taskResponse, fallbackGroup).sort((first, second) =>
            first.fechaLimite.localeCompare(second.fechaLimite)));
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(mensajeError(
            loadError,
            "No se pudieron cargar tus grupos y tareas.",
          ));
        }
      })
      .finally(() => {
        if (active) setCargando(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!content.trim() && !fileUrl.trim() && !archivo) {
      setError("Escribe una respuesta, agrega un enlace o adjunta un archivo antes de enviar.");
      return;
    }
    if (!tareaSeleccionada) {
      setError("Selecciona una tarea pendiente de tu grupo antes de enviar tu entrega.");
      return;
    }
    if (tareaSeleccionada.estadoEntrega !== "PENDIENTE") {
      setError("Esta tarea ya tiene una entrega registrada.");
      return;
    }

    setSubmitting(true);
    try {
      await tareasService.entregar({
        tareaId: tareaSeleccionada.id,
        contenidoTexto: content.trim() || undefined,
        archivoUrl: fileUrl.trim() || undefined,
        archivo: archivo ?? undefined,
      });
      setSuccess("Tu entrega fue enviada correctamente.");
      setContent("");
      setFileUrl("");
      setArchivo(null);
      setFileInputKey((key) => key + 1);
      setTareas((current) => current.map((task) =>
        task.id === tareaSeleccionada.id ? { ...task, estadoEntrega: "ENTREGADA" } : task,
      ));
      try {
        const response = await tareasService.getMisTareas();
        const fallbackGroup = grupos.length === 1 ? grupos[0] : undefined;
        setTareas(normalizarTareas(response, fallbackGroup).sort((first, second) =>
          first.fechaLimite.localeCompare(second.fechaLimite)));
      } catch (refreshError) {
        setError(mensajeError(refreshError, "La entrega se envió, pero no se pudo actualizar su estado."));
      }
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
        title="Mis grupos y tareas"
        description="Consulta tus grupos inscritos, revisa las actividades y entrega tu trabajo."
      />
      {error && (
        <div className="academic-feedback is-error" role="alert">
          {error}
          <button className="button button-outline" onClick={() => {
            setCargando(true);
            setError(null);
            setTareas([]);
            setRetry((value) => value + 1);
          }}><RotateCcw size={14} /> Reintentar</button>
        </div>
      )}
      {success && <div className="academic-feedback is-success" role="status"><CheckCircle2 size={16} />{success}</div>}
      {cargando ? (
        <div className="panel academic-panel">Cargando tus grupos y tareas...</div>
      ) : grupos.length === 0 ? (
        <div className="panel academic-panel"><p>No tienes grupos inscritos disponibles.</p></div>
      ) : (
        <div className="task-student-layout">
          <div className="task-teacher-column">
          <section className="panel task-panel">
            <div className="academic-section-heading">
              <div><h2>Mis grupos</h2><p>Selecciona un grupo para consultar sus tareas.</p></div>
            </div>
            <div className="academic-record-list">
              {grupos.map((group) => (
                <button
                  className={`task-record ${Number(grupoId) === group.id ? "is-selected" : ""}`}
                  key={group.id}
                  type="button"
                  onClick={() => {
                    setGrupoId(String(group.id));
                    setTareaId(null);
                    setContent("");
                    setFileUrl("");
                    setArchivo(null);
                    setFileInputKey((key) => key + 1);
                    setError(null);
                  }}
                >
                  <span className="task-record-icon"><ClipboardList size={16} /></span>
                  <span className="task-record-copy">
                    <strong>{group.materiaNombre} · {group.nombre}</strong>
                    <small>{group.periodoNombre ?? "Periodo sin especificar"}</small>
                    {group.profesorNombre && <small>Docente: {group.profesorNombre}</small>}
                    {group.horarios.length > 0 && (
                      <small>{group.horarios.map((schedule) =>
                        `${schedule.diaSemana} ${schedule.horaInicio}-${schedule.horaFin}`,
                      ).join(" · ")}</small>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className="panel task-panel">
            <div className="academic-section-heading">
              <div>
                <h2>Tareas del grupo</h2>
                <p>{grupoSeleccionado ? `${grupoSeleccionado.materiaNombre} · ${grupoSeleccionado.nombre}` : "Selecciona un grupo"}</p>
              </div>
              {grupoSeleccionado && <span>{pendientes} pendientes · {tareasDelGrupo.length} en total</span>}
            </div>
            {tareasDelGrupo.length === 0 ? (
              <p className="academic-empty">Este grupo todavía no tiene tareas asignadas.</p>
            ) : (
              <div className="academic-record-list">
                {tareasDelGrupo.map((task) => (
                  <button
                    className={`task-record ${tareaId === task.id ? "is-selected" : ""}`}
                    key={task.id}
                    type="button"
                    onClick={() => {
                      setTareaId(task.id);
                      setContent("");
                      setFileUrl("");
                      setArchivo(null);
                      setFileInputKey((key) => key + 1);
                      setError(null);
                      setSuccess(null);
                    }}
                  >
                    <span className="task-record-icon"><ClipboardList size={16} /></span>
                    <span className="task-record-copy">
                      <strong>{task.titulo}</strong>
                      <small>Vence: {fecha(task.fechaLimite)}</small>
                      <small>
                        Estado: {task.estadoEntrega === "PENDIENTE" ? "Pendiente" : task.estadoEntrega === "ENTREGADA" ? "Entregada" : "Calificada"}
                        {task.calificacion !== undefined ? ` · Nota: ${task.calificacion}` : ""}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
          </div>
          <section className="panel task-panel">
            <div className="academic-section-heading">
              <div><h2>Detalle y entrega</h2><p>{tareaSeleccionada?.titulo ?? "Selecciona una tarea"}</p></div>
            </div>
            {!tareaSeleccionada ? (
              <p className="academic-empty">Selecciona una tarea para ver sus instrucciones y enviar tu trabajo.</p>
            ) : (
              <>
                <p>{tareaSeleccionada.descripcion}</p>
                <p className="academic-empty">
                  Vence: {fecha(tareaSeleccionada.fechaLimite)} · Estado: {tareaSeleccionada.estadoEntrega === "PENDIENTE" ? "Pendiente" : tareaSeleccionada.estadoEntrega === "ENTREGADA" ? "Entregada, pendiente de calificación" : "Calificada"}
                  {tareaSeleccionada.calificacion !== undefined ? ` · Nota: ${tareaSeleccionada.calificacion}` : ""}
                </p>
                {tareaSeleccionada.estadoEntrega === "PENDIENTE" ? (
                  <form className="academic-form" onSubmit={(event) => void submit(event)}>
                    <label>Respuesta o comentario<textarea value={content} onChange={(event) => setContent(event.target.value)} rows={4} /></label>
                    <label>Adjuntar documento
                      <input
                        key={fileInputKey}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                        onChange={(event) => {
                          const selectedFile = event.currentTarget.files?.[0] ?? null;
                          if (selectedFile && selectedFile.size > MAX_ARCHIVO_ENTREGA) {
                            setArchivo(null);
                            setFileInputKey((key) => key + 1);
                            setError("El archivo supera el límite de 10 MB.");
                            return;
                          }
                          if (
                            selectedFile &&
                            !EXTENSIONES_ENTREGA.some((extension) =>
                              selectedFile.name.toLowerCase().endsWith(extension),
                            )
                          ) {
                            setArchivo(null);
                            setFileInputKey((key) => key + 1);
                            setError("Solo puedes adjuntar archivos PDF, Word (.doc/.docx) o TXT.");
                            return;
                          }
                          setArchivo(selectedFile);
                          setError(null);
                        }}
                      />
                      <small>PDF, Word (.doc/.docx) o TXT. Máximo 10 MB.</small>
                      {archivo && <small>Archivo seleccionado: {archivo.name}</small>}
                    </label>
                    <label>Enlace alternativo<input type="url" value={fileUrl} onChange={(event) => setFileUrl(event.target.value)} placeholder="https://..." /></label>
                    <button className="button button-primary" disabled={submitting}><Send size={14} />{submitting ? "Enviando..." : "Enviar entrega"}</button>
                  </form>
                ) : (
                  <p className="academic-empty">
                    {tareaSeleccionada.estadoEntrega === "CALIFICADA"
                      ? "Tu docente ya calificó esta entrega."
                      : "Tu entrega fue enviada y está pendiente de calificación."}
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}

function GroupTasks({ administrator = false }: { administrator?: boolean }) {
  const role = useAuthStore((state) => state.usuario?.rol);
  const [grupos, setGrupos] = useState<GrupoAcademico[]>([]);
  const [grupoId, setGrupoId] = useState("");
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [tareaId, setTareaId] = useState<number | null>(null);
  const [padron, setPadron] = useState<EstudianteTarea[]>([]);
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

  const gruposAsignados = grupos;
  const pendientesRevision = padron.filter((student) => student.estado === "PENDIENTE_DE_REVISION").length;
  const noEntregadas = padron.filter((student) => student.estado === "NO_ENTREGADA").length;
  const calificadas = padron.filter((student) => student.estado === "CALIFICADA").length;

  useEffect(() => {
    let active = true;
    (administrator ? gruposService.getTodos() : gruposService.getMisGrupos())
      .then((items) => {
        if (!active) return;
        setGrupos(items);
        if (items[0]) {
          setCargandoTareas(true);
          setGrupoId(String(items[0].id));
        }
      })
      .catch((loadError: unknown) => {
        if (active) setError(mensajeError(loadError, "No se pudieron cargar los grupos."));
      })
      .finally(() => {
        if (active) setCargandoGrupos(false);
      });
    return () => {
      active = false;
    };
  }, [retry, administrator]);

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
        setPadron([]);
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
    const selectedGroupId = numero(grupoId);
    if (!selectedGroupId) {
      setError("Selecciona un grupo para consultar las entregas.");
      return;
    }
    setTareaId(selectedTaskId);
    setError(null);
    setSuccess(null);
    setCargandoEntregas(true);
    try {
      const response = await tareasService.getPadronGrupo(selectedGroupId, selectedTaskId);
      const students = normalizarPadron(response);
      setPadron(students);
      setNotas(Object.fromEntries(students.flatMap((student) => student.entrega ? [[
        student.entrega.id,
        student.entrega.calificacion === undefined ? "" : String(student.entrega.calificacion),
      ]] : [])));
    } catch (loadError) {
      setPadron([]);
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
    setPadron([]);
  };

  const selectedGroup = gruposAsignados.find((group) => group.id === Number(grupoId));

  return (
    <>
      <PageHeading
        eyebrow={administrator ? "ADMINISTRACIÓN ACADÉMICA" : "GESTIÓN DOCENTE"}
        title={administrator ? "Seguimiento de tareas" : "Tareas y calificaciones"}
        description={administrator
          ? "Consulta el estado de entrega y calificación de los estudiantes por grupo."
          : "Publica actividades para tus grupos, revisa las entregas y califica el trabajo recibido."}
      />
      {error && <div className="academic-feedback is-error" role="alert">{error}</div>}
      {success && <div className="academic-feedback is-success" role="status"><CheckCircle2 size={16} />{success}</div>}
      {cargandoGrupos ? (
        <div className="panel academic-panel">Cargando grupos asignados...</div>
      ) : gruposAsignados.length === 0 ? (
        <div className="panel academic-panel academic-load-error">
          <p>{administrator ? "No hay grupos disponibles para consultar." : "No se encontraron grupos asignados a tu perfil docente."}</p>
          <button className="button button-outline" onClick={reintentar}><RotateCcw size={14} /> Reintentar</button>
        </div>
      ) : (
        <div className="task-teacher-layout">
          <div className="task-teacher-column">
            <section className="panel task-panel">
              <div className="academic-section-heading">
                <div><h2>Grupos</h2><p>Selecciona un grupo para consultar sus tareas.</p></div>
              </div>
              <label className="task-group-select">Grupo
                <select required value={grupoId} onChange={(event) => cambiarGrupo(event.target.value)}>
                  {gruposAsignados.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.materia?.nombre ?? "Materia"} · {group.nombre}
                    </option>
                  ))}
                </select>
              </label>
            </section>
            {role === "PROFESOR" && <section className="panel task-panel">
              <div className="academic-section-heading">
                <div><h2>Crear tarea</h2><p>La tarea se publicará para todos los estudiantes del grupo.</p></div>
              </div>
              <form className="academic-form" onSubmit={(event) => void crearTarea(event)}>
                <label>Título<input required value={titulo} onChange={(event) => setTitulo(event.target.value)} /></label>
                <label>Instrucciones<textarea required rows={4} value={descripcion} onChange={(event) => setDescripcion(event.target.value)} /></label>
                <label>Fecha límite<input required type="datetime-local" value={fechaLimite} onChange={(event) => setFechaLimite(event.target.value)} /></label>
                <button className="button button-primary" disabled={guardando}><Save size={14} />{guardando ? "Publicando..." : "Publicar tarea"}</button>
              </form>
            </section>}
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
              <div>
                <h2>Entregas y calificaciones</h2>
                <p>{tareaId
                  ? `${padron.length} estudiantes · ${noEntregadas} sin entregar · ${pendientesRevision} por calificar · ${calificadas} calificadas`
                  : "Selecciona una tarea"}</p>
              </div>
            </div>
            {tareaId === null ? (
              <p className="academic-empty">Selecciona una tarea para revisar las entregas recibidas.</p>
            ) : cargandoEntregas ? (
              <p className="academic-empty">Cargando entregas...</p>
            ) : padron.length === 0 ? (
              <p className="academic-empty">No hay estudiantes inscritos en este grupo para el periodo de la tarea.</p>
            ) : (
              <div className="task-delivery-list">
                {padron.map((student) => (
                  <article className="task-delivery" key={student.estudiantePerfilId}>
                    <div className="task-delivery-student">
                      <strong>{student.estudiante}</strong>
                      <span className={`task-status is-${student.estado.toLowerCase().replaceAll("_", "-")}`}>
                        {student.estado === "NO_ENTREGADA"
                          ? "No entregada"
                          : student.estado === "PENDIENTE_DE_REVISION"
                            ? "Pendiente de calificar"
                            : "Calificada"}
                      </span>
                      {student.entrega?.contenidoTexto && <p>{student.entrega.contenidoTexto}</p>}
                      {student.entrega?.archivoUrl && (
                        <a href={student.entrega.archivoUrl} target="_blank" rel="noreferrer">
                          Abrir o descargar documento entregado
                        </a>
                      )}
                      {student.estado === "CALIFICADA" && student.entrega?.calificacion !== undefined &&
                        <p>Nota: {student.entrega.calificacion}</p>}
                    </div>
                    {role === "PROFESOR" && student.entrega && (
                      <form className="task-grade-form" onSubmit={(event) => void calificar(event, student.entrega!.id)}>
                        <label>Nota (0–100)<input required min="0" max="100" step="0.01" type="number" value={notas[student.entrega.id] ?? ""} onChange={(event) => setNotas((current) => ({ ...current, [student.entrega!.id]: event.target.value }))} /></label>
                        <button className="button button-primary" disabled={entregaGuardando !== null}><Save size={13} />{entregaGuardando === student.entrega.id ? "Guardando..." : student.entrega.calificacion === undefined ? "Calificar" : "Actualizar nota"}</button>
                      </form>
                    )}
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
  if (role === "PROFESOR") return <GroupTasks />;
  if (role === "ADMINISTRADOR") return <GroupTasks administrator />;
  return <StudentTasks />;
}
