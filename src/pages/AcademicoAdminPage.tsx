import { Pencil, Plus, RotateCcw, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeading } from "../components/ui/PageHeading";
import {
  gruposService,
  periodosService,
  type CrearHorario,
  type GrupoAcademico,
  type HorarioGrupo,
  type PeriodoAcademico,
} from "../services/academico";
import { materiasService } from "../services/materias";
import type { Materia } from "../services/materias";
import { mensajeError } from "../lib/errores";

type ProfesorOption = { id: number; nombre: string };
type Registro = Record<string, unknown>;
type Dia = CrearHorario["diaSemana"];

const dias: { value: Dia; label: string }[] = [
  { value: "LUNES", label: "Lunes" },
  { value: "MARTES", label: "Martes" },
  { value: "MIERCOLES", label: "Miércoles" },
  { value: "JUEVES", label: "Jueves" },
  { value: "VIERNES", label: "Viernes" },
];

const horarioInicial: CrearHorario = {
  diaSemana: "LUNES",
  horaInicio: "08:00",
  horaFin: "10:00",
};

function registro(value: unknown): Registro | null {
  return value && typeof value === "object" ? (value as Registro) : null;
}

function numero(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function lista(value: unknown): unknown[] {
  const root = registro(value);
  if (Array.isArray(value)) return value;
  if (Array.isArray(root?.data)) return root.data;
  if (Array.isArray(root?.items)) return root.items;
  return [];
}

function horariosDe(value: unknown): CrearHorario[] {
  const entries = Array.isArray(value) ? value : [];
  return entries.flatMap((entry) => {
    const item = registro(entry);
    const dia = item?.diaSemana;
    if (
      typeof dia !== "string" ||
      !dias.some((option) => option.value === dia) ||
      typeof item?.horaInicio !== "string" ||
      typeof item.horaFin !== "string"
    ) {
      return [];
    }
    return [{
      diaSemana: dia as Dia,
      horaInicio: item.horaInicio,
      horaFin: item.horaFin,
    }];
  });
}

function nombreProfesor(value: unknown): string {
  const person = registro(value);
  const user = registro(person?.usuario) ?? person;
  return [user?.nombre, user?.apellido].filter(
    (part): part is string => typeof part === "string" && part.length > 0,
  ).join(" ");
}

type DatosAcademicos = {
  periodos: PeriodoAcademico[];
  materias: Materia[];
  grupos: GrupoAcademico[];
  periodoSeleccionado?: number;
};

async function obtenerDatosAcademicos(periodoId?: number): Promise<DatosAcademicos> {
  const [periodos, materias] = await Promise.all([
    periodosService.getTodos(),
    materiasService.getTodas(),
  ]);
  const activePeriod = periodos.find((period) => period.activo) ?? periodos[0];
  const selectedPeriod =
    periodos.find((period) => period.id === periodoId) ?? activePeriod;
  const grupos = await gruposService.getTodos(selectedPeriod?.id);
  return {
    periodos,
    materias,
    grupos,
    periodoSeleccionado: selectedPeriod?.id,
  };
}

export function AcademicoAdminPage() {
  const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [grupos, setGrupos] = useState<GrupoAcademico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [periodoId, setPeriodoId] = useState<number | null>(null);
  const [periodoNombre, setPeriodoNombre] = useState("");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFin, setPeriodoFin] = useState("");
  const [limiteCreditos, setLimiteCreditos] = useState("25");
  const [periodoActivo, setPeriodoActivo] = useState(true);

  const [materiaId, setMateriaId] = useState<number | null>(null);
  const [codigo, setCodigo] = useState("");
  const [materiaNombre, setMateriaNombre] = useState("");
  const [creditos, setCreditos] = useState("1");
  const [costoInscripcion, setCostoInscripcion] = useState("0");
  const [costoMensualidad, setCostoMensualidad] = useState("0");

  const [grupoId, setGrupoId] = useState<number | null>(null);
  const [grupoMateriaId, setGrupoMateriaId] = useState("");
  const [grupoPeriodoId, setGrupoPeriodoId] = useState("");
  const [profesorId, setProfesorId] = useState("");
  const [grupoNombre, setGrupoNombre] = useState("");
  const [cupoMaximo, setCupoMaximo] = useState("30");
  const [horarios, setHorarios] = useState<CrearHorario[]>([{ ...horarioInicial }]);
  const [profesores, setProfesores] = useState<ProfesorOption[]>([]);
  const [cargandoProfesores, setCargandoProfesores] = useState(false);
  const [errorProfesores, setErrorProfesores] = useState<string | null>(null);

  const cargarDatos = async (periodoSeleccionado?: number) => {
    try {
      const datos = await obtenerDatosAcademicos(periodoSeleccionado);
      setPeriodos(datos.periodos);
      setMaterias(datos.materias);
      setGrupos(datos.grupos);
      if (!periodoSeleccionado && datos.periodoSeleccionado) {
        setGrupoPeriodoId(String(datos.periodoSeleccionado));
      }
    } catch (loadError) {
      setErrorCarga(mensajeError(loadError, "No se pudieron cargar los datos académicos."));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let active = true;
    obtenerDatosAcademicos()
      .then((datos) => {
        if (!active) return;
        setPeriodos(datos.periodos);
        setMaterias(datos.materias);
        setGrupos(datos.grupos);
        if (datos.periodoSeleccionado) {
          setGrupoPeriodoId(String(datos.periodoSeleccionado));
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setErrorCarga(mensajeError(loadError, "No se pudieron cargar los datos académicos."));
        }
      })
      .finally(() => {
        if (active) setCargando(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const selectedMateria = numero(grupoMateriaId);
    if (!selectedMateria) return;

    let active = true;
    materiasService.getProfesores(selectedMateria)
      .then((response) => {
        if (!active) return;
        const options = lista(response).flatMap((entry) => {
          const item = registro(entry);
          const profile = registro(item?.perfilProfesor);
          const id = numero(profile?.id ?? item?.id);
          const name = nombreProfesor(entry);
          return id && name ? [{ id, nombre: name }] : [];
        });
        setProfesores(options);
        if (profesorId && !options.some((teacher) => teacher.id === Number(profesorId))) {
          setProfesorId("");
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setErrorProfesores(mensajeError(loadError, "No se pudieron cargar los docentes asignados."));
        }
      })
      .finally(() => {
        if (active) setCargandoProfesores(false);
      });

    return () => {
      active = false;
    };
  }, [grupoMateriaId, profesorId]);

  const limpiarPeriodo = () => {
    setPeriodoId(null);
    setPeriodoNombre("");
    setPeriodoInicio("");
    setPeriodoFin("");
    setLimiteCreditos("25");
    setPeriodoActivo(true);
  };

  const limpiarMateria = () => {
    setMateriaId(null);
    setCodigo("");
    setMateriaNombre("");
    setCreditos("1");
    setCostoInscripcion("0");
    setCostoMensualidad("0");
  };

  const limpiarGrupo = () => {
    setGrupoId(null);
    setGrupoMateriaId("");
    setProfesorId("");
    setGrupoNombre("");
    setCupoMaximo("30");
    setHorarios([{ ...horarioInicial }]);
  };

  const guardarPeriodo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMensaje(null);
    setGuardando(true);
    const datos = {
      nombre: periodoNombre.trim(),
      fechaInicio: periodoInicio,
      fechaFin: periodoFin,
      limiteCreditos: Number(limiteCreditos),
      activo: periodoActivo,
    };
    try {
      if (periodoId) await periodosService.actualizar(periodoId, datos);
      else await periodosService.crear(datos);
      setMensaje(periodoId ? "Periodo actualizado." : "Periodo creado.");
      limpiarPeriodo();
      setCargando(true);
      setErrorCarga(null);
      await cargarDatos(Number(grupoPeriodoId));
    } catch (saveError) {
      setError(mensajeError(saveError, "No se pudo guardar el periodo."));
    } finally {
      setGuardando(false);
    }
  };

  const guardarMateria = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMensaje(null);
    setGuardando(true);
    const datos = {
      codigo: codigo.trim(),
      nombre: materiaNombre.trim(),
      creditos: Number(creditos),
      costoInscripcion: Number(costoInscripcion),
      costoMensualidad: Number(costoMensualidad),
    };
    try {
      if (materiaId) await materiasService.actualizar(materiaId, datos);
      else await materiasService.crear(datos);
      setMensaje(materiaId ? "Materia actualizada." : "Materia creada.");
      limpiarMateria();
      setCargando(true);
      setErrorCarga(null);
      await cargarDatos(Number(grupoPeriodoId));
    } catch (saveError) {
      setError(mensajeError(saveError, "No se pudo guardar la materia."));
    } finally {
      setGuardando(false);
    }
  };

  const guardarGrupo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMensaje(null);
    setGuardando(true);
    const datos = {
      materiaId: Number(grupoMateriaId),
      periodoId: Number(grupoPeriodoId),
      profesorId: Number(profesorId),
      nombre: grupoNombre.trim(),
      cupoMaximo: Number(cupoMaximo),
      horarios,
    };
    try {
      if (grupoId) await gruposService.actualizar(grupoId, datos);
      else await gruposService.crear(datos);
      setMensaje(grupoId ? "Grupo y horarios actualizados." : "Grupo y horarios creados.");
      limpiarGrupo();
      setCargando(true);
      setErrorCarga(null);
      await cargarDatos(Number(grupoPeriodoId));
    } catch (saveError) {
      setError(mensajeError(saveError, "No se pudo guardar el grupo."));
    } finally {
      setGuardando(false);
    }
  };

  const editarGrupo = (group: GrupoAcademico) => {
    const subject = registro(group.materia);
    const period = registro(group.periodo);
    const teacher = registro(group.profesor);
    setGrupoId(group.id);
    setCargandoProfesores(Boolean(numero(group.materiaId ?? subject?.id)));
    setErrorProfesores(null);
    setGrupoMateriaId(String(group.materiaId ?? subject?.id ?? ""));
    setGrupoPeriodoId(String(group.periodoId ?? period?.id ?? ""));
    setProfesorId(String(group.profesorId ?? teacher?.id ?? ""));
    setGrupoNombre(group.nombre);
    setCupoMaximo(String(group.cupoMaximo ?? 1));
    setHorarios(horariosDe(group.horarios).length ? horariosDe(group.horarios) : [{ ...horarioInicial }]);
    setError(null);
    setMensaje(null);
  };

  const handlePeriodSelection = async (value: string) => {
    setGrupoPeriodoId(value);
    setGrupos([]);
    const periodId = numero(value);
    if (!periodId) {
      setGrupos([]);
      return;
    }
    try {
      setGrupos(await gruposService.getTodos(periodId));
    } catch (loadError) {
      setError(mensajeError(loadError, "No se pudieron cargar los grupos de este periodo."));
    }
  };

  const reintentarCarga = () => {
    setCargando(true);
    setErrorCarga(null);
    void cargarDatos(Number(grupoPeriodoId));
  };

  const periodoSeleccionado = (id: number) => {
    setPeriodoId(id);
    const item = periodos.find((period) => period.id === id);
    if (!item) return;
    setPeriodoNombre(item.nombre);
    setPeriodoInicio(item.fechaInicio.slice(0, 10));
    setPeriodoFin(item.fechaFin.slice(0, 10));
    setLimiteCreditos(String(item.limiteCreditos));
    setPeriodoActivo(item.activo);
  };

  const materiaSeleccionada = (id: number) => {
    setMateriaId(id);
    const item = materias.find((subject) => subject.id === id);
    if (!item) return;
    setCodigo(item.codigo);
    setMateriaNombre(item.nombre);
    setCreditos(String(item.creditos));
    setCostoInscripcion(String(item.costoInscripcion));
    setCostoMensualidad(String(item.costoMensualidad));
  };

  return (
    <>
      <PageHeading
        eyebrow="ADMINISTRACIÓN"
        title="Gestión académica"
        description="Crea y actualiza periodos, materias, grupos y sus horarios."
      />
      {mensaje && <div className="academic-feedback is-success" role="status">{mensaje}</div>}
      {error && <div className="academic-feedback is-error" role="alert">{error}</div>}
      {errorCarga && (
        <div className="academic-feedback is-error" role="alert">
          {errorCarga}
          <button className="button button-outline" onClick={reintentarCarga}>
            <RotateCcw size={14} /> Reintentar
          </button>
        </div>
      )}
      {cargando ? (
        <div className="panel academic-panel">Cargando datos académicos...</div>
      ) : (
        <div className="academic-admin-grid">
          <section className="panel academic-panel">
            <div className="academic-section-heading">
              <div><h2>Periodos académicos</h2><p>{periodos.length} registrados</p></div>
              {periodoId && <button className="button button-outline" type="button" onClick={limpiarPeriodo}><X size={14} /> Nuevo</button>}
            </div>
            <form className="academic-form" onSubmit={(event) => void guardarPeriodo(event)}>
              <label>Nombre del periodo<input required value={periodoNombre} onChange={(event) => setPeriodoNombre(event.target.value)} placeholder="2026-I" /></label>
              <div className="academic-field-row">
                <label>Fecha de inicio<input required type="date" value={periodoInicio} onChange={(event) => setPeriodoInicio(event.target.value)} /></label>
                <label>Fecha de fin<input required type="date" value={periodoFin} onChange={(event) => setPeriodoFin(event.target.value)} /></label>
              </div>
              <label>Límite de créditos<input required min="1" type="number" value={limiteCreditos} onChange={(event) => setLimiteCreditos(event.target.value)} /></label>
              <label className="academic-checkbox"><input type="checkbox" checked={periodoActivo} onChange={(event) => setPeriodoActivo(event.target.checked)} /> Periodo activo</label>
              <button className="button button-primary" disabled={guardando}><Save size={14} />{periodoId ? "Guardar cambios" : "Crear periodo"}</button>
            </form>
            <div className="academic-record-list">
              {periodos.map((period) => (
                <article className="academic-record" key={period.id}>
                  <div><strong>{period.nombre}</strong><span>{period.fechaInicio.slice(0, 10)} — {period.fechaFin.slice(0, 10)} · {period.limiteCreditos} créditos {period.activo ? "· Activo" : ""}</span></div>
                  <button className="icon-button" aria-label={`Editar ${period.nombre}`} onClick={() => periodoSeleccionado(period.id)}><Pencil size={15} /></button>
                </article>
              ))}
              {periodos.length === 0 && <p className="academic-empty">Todavía no hay periodos.</p>}
            </div>
          </section>

          <section className="panel academic-panel">
            <div className="academic-section-heading">
              <div><h2>Materias</h2><p>{materias.length} registradas</p></div>
              {materiaId && <button className="button button-outline" type="button" onClick={limpiarMateria}><X size={14} /> Nueva</button>}
            </div>
            <form className="academic-form" onSubmit={(event) => void guardarMateria(event)}>
              <label>Código<input required value={codigo} onChange={(event) => setCodigo(event.target.value)} placeholder="MAT-101" /></label>
              <label>Nombre<input required value={materiaNombre} onChange={(event) => setMateriaNombre(event.target.value)} /></label>
              <div className="academic-field-row">
                <label>Créditos<input required min="1" type="number" value={creditos} onChange={(event) => setCreditos(event.target.value)} /></label>
                <label>Inscripción<input required min="0" step="0.01" type="number" value={costoInscripcion} onChange={(event) => setCostoInscripcion(event.target.value)} /></label>
              </div>
              <label>Mensualidad<input required min="0" step="0.01" type="number" value={costoMensualidad} onChange={(event) => setCostoMensualidad(event.target.value)} /></label>
              <button className="button button-primary" disabled={guardando}><Save size={14} />{materiaId ? "Guardar cambios" : "Crear materia"}</button>
            </form>
            <div className="academic-record-list">
              {materias.map((subject) => (
                <article className="academic-record" key={subject.id}>
                  <div><strong>{subject.codigo} · {subject.nombre}</strong><span>{subject.creditos} créditos</span></div>
                  <button className="icon-button" aria-label={`Editar ${subject.nombre}`} onClick={() => materiaSeleccionada(subject.id)}><Pencil size={15} /></button>
                </article>
              ))}
              {materias.length === 0 && <p className="academic-empty">Todavía no hay materias.</p>}
            </div>
          </section>

          <section className="panel academic-panel academic-groups-panel">
            <div className="academic-section-heading">
              <div><h2>Grupos y horarios</h2><p>{grupos.length} grupos en el periodo seleccionado</p></div>
              {grupoId && <button className="button button-outline" type="button" onClick={limpiarGrupo}><X size={14} /> Nuevo</button>}
            </div>
            <form className="academic-form academic-group-form" onSubmit={(event) => void guardarGrupo(event)}>
              <label>Periodo
                <select required value={grupoPeriodoId} onChange={(event) => void handlePeriodSelection(event.target.value)}>
                  <option value="">Selecciona un periodo</option>
                  {periodos.map((period) => <option key={period.id} value={period.id}>{period.nombre}{period.activo ? " · Activo" : ""}</option>)}
                </select>
              </label>
              <label>Materia
                <select required value={grupoMateriaId} onChange={(event) => {
                  const value = event.target.value;
                  setProfesores([]);
                  setProfesorId("");
                  setErrorProfesores(null);
                  setCargandoProfesores(Boolean(numero(value)));
                  setGrupoMateriaId(value);
                }}>
                  <option value="">Selecciona una materia</option>
                  {materias.map((subject) => <option key={subject.id} value={subject.id}>{subject.codigo} · {subject.nombre}</option>)}
                </select>
              </label>
              <label>Docente asignado
                <select required value={profesorId} onChange={(event) => setProfesorId(event.target.value)} disabled={cargandoProfesores || profesores.length === 0}>
                  <option value="">{cargandoProfesores ? "Cargando docentes..." : "Selecciona un docente asignado"}</option>
                  {profesores.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.nombre}</option>)}
                </select>
              </label>
              {errorProfesores && <p className="academic-inline-error" role="alert">{errorProfesores}</p>}
              <div className="academic-field-row">
                <label>Nombre del grupo<input required value={grupoNombre} onChange={(event) => setGrupoNombre(event.target.value)} placeholder="Grupo A" /></label>
                <label>Cupo máximo<input required min="1" type="number" value={cupoMaximo} onChange={(event) => setCupoMaximo(event.target.value)} /></label>
              </div>
              <div className="academic-schedule-heading">
                <strong>Horarios</strong>
                <button className="button button-outline" type="button" onClick={() => setHorarios((items) => [...items, { ...horarioInicial }])}><Plus size={14} /> Añadir bloque</button>
              </div>
              {horarios.map((slot, index) => (
                <div className="academic-schedule-row" key={index}>
                  <label>Día<select value={slot.diaSemana} onChange={(event) => setHorarios((items) => items.map((item, i) => i === index ? { ...item, diaSemana: event.target.value as Dia } : item))}>{dias.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}</select></label>
                  <label>Inicio<input required type="time" value={slot.horaInicio} onChange={(event) => setHorarios((items) => items.map((item, i) => i === index ? { ...item, horaInicio: event.target.value } : item))} /></label>
                  <label>Fin<input required type="time" value={slot.horaFin} onChange={(event) => setHorarios((items) => items.map((item, i) => i === index ? { ...item, horaFin: event.target.value } : item))} /></label>
                  <button className="icon-button" type="button" aria-label="Quitar horario" disabled={horarios.length === 1} onClick={() => setHorarios((items) => items.filter((_, i) => i !== index))}><X size={15} /></button>
                </div>
              ))}
              <button className="button button-primary" disabled={guardando || cargandoProfesores}><Save size={14} />{grupoId ? "Guardar grupo y horarios" : "Crear grupo y horarios"}</button>
            </form>
            <div className="academic-record-list academic-group-list">
              {grupos.map((group) => (
                <article className="academic-record academic-record-group" key={group.id}>
                  <div>
                    <strong>{group.materia?.nombre ?? materias.find((subject) => subject.id === group.materiaId)?.nombre ?? "Materia"} · {group.nombre}</strong>
                    <span>{group.cupoMaximo} cupos · {nombreProfesor(group.profesor) || "Docente sin asignar"}</span>
                    <small>{(group.horarios ?? []).map((slot: HorarioGrupo) => `${slot.diaSemana} ${slot.horaInicio}-${slot.horaFin}`).join(" · ") || "Sin horarios"}</small>
                  </div>
                  <button className="icon-button" aria-label={`Editar ${group.nombre}`} onClick={() => editarGrupo(group)}><Pencil size={15} /></button>
                </article>
              ))}
              {grupos.length === 0 && <p className="academic-empty">No hay grupos para el periodo seleccionado.</p>}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
