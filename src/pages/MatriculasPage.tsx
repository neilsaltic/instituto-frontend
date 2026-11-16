import { CalendarDays, CheckCircle2, Clock3, RotateCcw, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeading } from "../components/ui/PageHeading";
import { mensajeError, mensajeRechazoMatricula } from "../lib/errores";
import { periodosService, type PeriodoAcademico } from "../services/academico";
import { matriculasService } from "../services/matriculas";
import { useAuthStore } from "../store/useAuthStore";

type Registro = Record<string, unknown>;
type HorarioOferta = { dia: string; inicio: string; fin: string };
type GrupoOferta = {
  id: number;
  nombre: string;
  cupoMaximo?: number;
  inscritos?: number;
  cuposDisponibles?: number;
  horarios: HorarioOferta[];
};
type MateriaOferta = {
  id: number;
  nombre: string;
  codigo?: string;
  creditos?: number;
  grupos: GrupoOferta[];
};

function registro(value: unknown): Registro | null {
  return value && typeof value === "object" ? (value as Registro) : null;
}

function numero(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function lista(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const object = registro(value);
  if (Array.isArray(object?.data)) return object.data;
  if (Array.isArray(object?.items)) return object.items;
  if (Array.isArray(object?.materias)) return object.materias;
  if (Array.isArray(object?.materiasDisponibles)) return object.materiasDisponibles;
  if (Array.isArray(object?.oferta)) return object.oferta;
  if (object?.data && typeof object.data === "object") return lista(object.data);
  return [];
}

function horariosDe(value: unknown): HorarioOferta[] {
  return lista(value).flatMap((entry) => {
    const item = registro(entry);
    if (
      typeof item?.horaInicio !== "string" ||
      typeof item.horaFin !== "string" ||
      typeof item.diaSemana !== "string"
    ) return [];
    return [{
      dia: item.diaSemana,
      inicio: item.horaInicio,
      fin: item.horaFin,
    }];
  });
}

function normalizarGrupo(value: unknown): GrupoOferta | null {
  const item = registro(value);
  const id = numero(item?.id);
  if (!id) return null;
  const capacity = registro(item?.cupo) ?? registro(item?.cupos);
  const cupo = numero(
    item?.cupoMaximo ??
      capacity?.maximo ??
      capacity?.total ??
      item?.cupo,
  );
  const libres = numero(
    item?.cuposDisponibles ??
      item?.disponibles ??
      item?.libres ??
      capacity?.disponibles,
  );
  return {
    id,
    nombre: typeof item?.nombre === "string" ? item.nombre : `Grupo ${id}`,
    cupoMaximo: cupo,
    inscritos: numero(item?.inscritos ?? item?.matriculados ?? capacity?.ocupados),
    cuposDisponibles: libres,
    horarios: horariosDe(item?.horarios ?? item?.horario),
  };
}

function normalizarOferta(value: unknown): MateriaOferta[] {
  const root = registro(value);
  const entries = lista(
    root?.materias ??
      root?.materiasDisponibles ??
      root?.oferta ??
      root?.data ??
      value,
  );
  const bySubject = new Map<number, MateriaOferta>();

  for (const entry of entries) {
    const item = registro(entry);
    if (!item) continue;

    const nestedMateria = registro(item.materia);
    const subject = nestedMateria ?? item;
    const subjectId = numero(subject.id);
    if (!subjectId) continue;

    const nestedGroups = item.grupos ?? item.gruposDisponibles;
    if (Array.isArray(nestedGroups)) {
      const groups = nestedGroups.flatMap((group) => {
        const normalized = normalizarGrupo(group);
        return normalized ? [normalized] : [];
      });
      bySubject.set(subjectId, {
        id: subjectId,
        nombre: typeof subject.nombre === "string" ? subject.nombre : `Materia ${subjectId}`,
        codigo: typeof subject.codigo === "string" ? subject.codigo : undefined,
        creditos: numero(subject.creditos),
        grupos: groups,
      });
      continue;
    }

    const group = normalizarGrupo(entry);
    if (!group || !nestedMateria) continue;
    const current = bySubject.get(subjectId) ?? {
      id: subjectId,
      nombre: typeof subject.nombre === "string" ? subject.nombre : `Materia ${subjectId}`,
      codigo: typeof subject.codigo === "string" ? subject.codigo : undefined,
      creditos: numero(subject.creditos),
      grupos: [],
    };
    current.grupos.push(group);
    bySubject.set(subjectId, current);
  }

  return Array.from(bySubject.values());
}

function textoApi(value: unknown): string | null {
  const object = registro(value);
  return typeof object?.message === "string" ? object.message : null;
}

export function MatriculasPage() {
  const usuario = useAuthStore((state) => state.usuario);
  const profileId = usuario?.perfilEstudiante?.id;
  const [materias, setMaterias] = useState<MateriaOferta[]>([]);
  const [periodoActivo, setPeriodoActivo] = useState<PeriodoAcademico | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<{ grupoId: number; mensaje: string } | null>(null);
  const [grupoEnviando, setGrupoEnviando] = useState<number | null>(null);
  const [reintento, setReintento] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([matriculasService.getOferta(), periodosService.getTodos()])
      .then(([offer, periods]) => {
        if (!active) return;
        const activePeriod = periods.find((period) => period.activo) ?? null;
        setPeriodoActivo(activePeriod);
        setMaterias(normalizarOferta(offer));
      })
      .catch((loadError: unknown) => {
        if (active) setErrorCarga(mensajeError(loadError, "No se pudo cargar la oferta académica."));
      })
      .finally(() => {
        if (active) setCargando(false);
      });
    return () => {
      active = false;
    };
  }, [reintento]);

  const matricular = async (groupId: number) => {
    setError(null);
    setExito(null);
    if (!profileId) {
      setError("Tu sesión no incluye el perfil de estudiante necesario para solicitar la matrícula. Vuelve a iniciar sesión.");
      return;
    }
    setGrupoEnviando(groupId);
    try {
      const response = await matriculasService.crear({
        estudiantePerfilId: profileId,
        grupoId: groupId,
      });
      setExito({
        grupoId: groupId,
        mensaje: textoApi(response) ?? "La matrícula fue confirmada correctamente.",
      });
    } catch (submitError) {
      setError(mensajeRechazoMatricula(submitError));
      setGrupoEnviando(null);
      return;
    }

    try {
      const [offer, periods] = await Promise.all([
        matriculasService.getOferta(),
        periodosService.getTodos(),
      ]);
      setMaterias(normalizarOferta(offer));
      setPeriodoActivo(periods.find((period) => period.activo) ?? null);
    } catch (refreshError) {
      setError(mensajeError(refreshError, "La matrícula se confirmó, pero no se pudo actualizar la oferta."));
    } finally {
      setGrupoEnviando(null);
    }
  };

  const totalGrupos = materias.reduce((total, subject) => total + subject.grupos.length, 0);
  const reintentar = () => {
    setCargando(true);
    setErrorCarga(null);
    setReintento((value) => value + 1);
  };

  return (
    <>
      <PageHeading
        eyebrow="INSCRIPCIÓN ACADÉMICA"
        title="Matrícula"
        description="Revisa la materia, los cupos y los horarios antes de enviar tu solicitud."
      />
      {periodoActivo && (
        <div className="enrollment-period" role="note">
          <CalendarDays size={16} />
          <span>Periodo activo: <strong>{periodoActivo.nombre}</strong></span>
          <span>{periodoActivo.limiteCreditos} créditos máximo</span>
        </div>
      )}
      {error && <div className="academic-feedback is-error" role="alert">{error}</div>}
      {exito && (
        <div className="academic-feedback is-success" role="status">
          <CheckCircle2 size={17} />
          {exito.mensaje}
          <span>Grupo confirmado: {materias.flatMap((subject) => subject.grupos).find((group) => group.id === exito.grupoId)?.nombre ?? exito.grupoId}</span>
        </div>
      )}
      {cargando ? (
        <div className="panel academic-panel">Cargando oferta del periodo activo...</div>
      ) : errorCarga ? (
        <div className="panel academic-panel academic-load-error" role="alert">
          <p>{errorCarga}</p>
          <button className="button button-outline" onClick={reintentar}><RotateCcw size={14} /> Reintentar</button>
        </div>
      ) : materias.length === 0 || totalGrupos === 0 ? (
        <div className="panel academic-panel academic-empty">No hay grupos disponibles para matricular en este momento.</div>
      ) : (
        <div className="enrollment-offer">
          {materias.map((subject) => (
            <section className="panel enrollment-subject" key={subject.id}>
              <header className="enrollment-subject-heading">
                <div>
                  {subject.codigo && <span className="eyebrow">{subject.codigo}</span>}
                  <h2>{subject.nombre}</h2>
                </div>
                {subject.creditos !== undefined && <span className="enrollment-credit-count">{subject.creditos} créditos</span>}
              </header>
              <div className="enrollment-group-list">
                {subject.grupos.map((group) => (
                  <article className="enrollment-group" key={group.id}>
                    <div className="enrollment-group-main">
                      <div className="enrollment-group-title">
                        <UsersRound size={17} />
                        <strong>{group.nombre}</strong>
                      </div>
                      <p>
                        {group.cuposDisponibles !== undefined
                          ? `${group.cuposDisponibles} cupos disponibles`
                          : group.cupoMaximo !== undefined
                            ? `${group.cupoMaximo} cupos en total`
                            : "Cupo informado por la API"}
                        {group.inscritos !== undefined && ` · ${group.inscritos} inscritos`}
                      </p>
                      <div className="enrollment-schedule">
                        {group.horarios.length > 0 ? group.horarios.map((slot, index) => (
                          <span key={`${slot.dia}-${slot.inicio}-${index}`}>
                            <Clock3 size={13} /> {slot.dia} · {slot.inicio}–{slot.fin}
                          </span>
                        )) : <span>Horario no informado</span>}
                      </div>
                    </div>
                    <button
                      className="button button-primary"
                      disabled={grupoEnviando !== null}
                      onClick={() => void matricular(group.id)}
                    >
                      {grupoEnviando === group.id ? "Enviando..." : "Solicitar matrícula"}
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
