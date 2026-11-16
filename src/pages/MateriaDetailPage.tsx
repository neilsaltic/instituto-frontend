import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { matriculasService } from "../services/matriculas";
import { materiasService } from "../services/materias";
import type { MateriaDetalle } from "../services/materias";
import { usuariosService } from "../services/usuarios";
import type { UsuarioDirectorio } from "../services/usuarios";
import { useAuthStore } from "../store/useAuthStore";
import { mensajeError, mensajeRechazoMatricula } from "../lib/errores";

const formatPrice = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  maximumFractionDigits: 2,
});

export function MateriaDetailPage() {
  const { id } = useParams();
  const materiaId = Number(id);
  const validId = Number.isSafeInteger(materiaId) && materiaId > 0;
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const usuario = useAuthStore((state) => state.usuario);
  const isReceptionist =
    Boolean(token) &&
    usuario?.rol === "RECEPCIONISTA" &&
    usuario.estado === "ACTIVO";
  const [materia, setMateria] = useState<MateriaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [studentsRetry, setStudentsRetry] = useState(0);
  const [students, setStudents] = useState<UsuarioDirectorio[]>([]);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [enrollingGroup, setEnrollingGroup] = useState<number | null>(null);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState<{
    studentId: number;
    groupId: number;
  } | null>(null);

  useEffect(() => {
    if (!validId) return;
    let active = true;
    materiasService
      .getDetalle(materiaId)
      .then((data) => {
        if (active) setMateria(data);
      })
      .catch((error: unknown) => {
        console.error("Error al cargar el detalle de la materia:", error);
        if (active) setLoadError(mensajeError(error, "No se pudo cargar la materia."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [materiaId, retry, validId]);

  useEffect(() => {
    if (!isReceptionist || !token) return;
    let active = true;
    usuariosService
      .getEstudiantes()
      .then((data) => {
        if (active) {
          setStudents(data);
          setStudentsError(null);
        }
      })
      .catch((error: unknown) => {
        console.error("Error al cargar estudiantes para matrícula:", error);
        if (active) {
          setStudentsError(
            mensajeError(error, "No se pudo cargar la lista de estudiantes."),
          );
        }
      })
      .finally(() => {
        if (active) setStudentsLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [isReceptionist, studentsRetry, token]);

  const handleEnroll = async (groupId: number) => {
    setEnrollmentError(null);
    if (!isReceptionist) {
      setEnrollmentError("Solo recepción puede realizar matrículas. Acércate al instituto.");
      return;
    }

    const student = activeStudents.find(
      (item) => item.id === Number(selectedStudentId),
    );
    if (!student?.perfilEstudiante) {
      setEnrollmentError("Selecciona un estudiante activo con perfil académico.");
      return;
    }

    setEnrollingGroup(groupId);
    try {
      await matriculasService.crear({
        estudiantePerfilId: student.perfilEstudiante.id,
        grupoId: groupId,
      });
      setEnrollmentSuccess({ studentId: student.id, groupId });
    } catch (error) {
      console.error("Error al matricular al estudiante:", error);
      setEnrollmentError(mensajeRechazoMatricula(error));
    } finally {
      setEnrollingGroup(null);
    }
  };

  if (!validId) {
    return (
      <main className="not-found">
        <span className="not-found-code">404</span>
        <h1>Materia no encontrada</h1>
        <Link className="button button-primary" to="/">
          <ArrowLeft size={16} /> Volver al catálogo
        </Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="public-home">
        <div className="public-feedback" role="status">Cargando detalle de la materia...</div>
      </main>
    );
  }

  if (loadError || !materia) {
    return (
      <main className="public-home">
        <div className="public-detail-feedback" role="alert">
          <p>{loadError || "No se encontró esta materia."}</p>
          <button
            className="button button-outline"
            onClick={() => {
              setLoading(true);
              setLoadError(null);
              setRetry((value) => value + 1);
            }}
          >
            Reintentar
          </button>
          <Link className="public-text-link" to="/">Volver al catálogo</Link>
        </div>
      </main>
    );
  }

  const returnToMateria = `${location.pathname}${location.search}`;
  const activeStudents = students.filter(
    (student) =>
      student.estado === "ACTIVO" &&
      student.perfilEstudiante !== null &&
      student.perfilEstudiante !== undefined,
  );
  const studentsLoading = isReceptionist && !studentsLoaded;

  return (
    <main className="public-home">
      <header className="public-header">
        <Link className="public-brand" to="/" aria-label="Volver al inicio">
          <span className="public-brand-mark"><GraduationCap size={21} /></span>
          <span className="brand-name">
            The Anglo American Institute<span>+</span>
            <small>INSTITUTO ACADÉMICO</small>
          </span>
        </Link>
        <Link className="button button-outline public-login" to={token ? "/inicio" : "/login"} state={{ from: returnToMateria }}>
          {token ? "Panel administrativo" : "Iniciar sesión"}
          <ArrowRight size={15} />
        </Link>
      </header>

      <div className="public-detail-wrap">
        <Link className="public-detail-back" to="/">
          <ArrowLeft size={15} /> Volver a materias
        </Link>
        <section className="public-detail-hero">
          <div className="public-detail-main">
            <span className="public-kicker">{materia.codigo} · OFERTA ACADÉMICA</span>
            <h1>{materia.nombre}</h1>
            <p>
              Conoce los grupos disponibles, sus docentes y los costos de esta
              materia antes de solicitar tu matrícula en recepción.
            </p>
            <div className="public-detail-stats">
              <span><BookOpen size={16} /> {materia.creditos} créditos</span>
              <span><UsersRound size={16} /> {materia.grupos.length} {materia.grupos.length === 1 ? "grupo" : "grupos"}</span>
            </div>
          </div>
          <aside className="public-price-card">
            <span className="public-subject-category">INVERSIÓN ACADÉMICA</span>
            <div><span>Inscripción</span><strong>{formatPrice.format(Number(materia.costoInscripcion))}</strong></div>
            <div><span>Mensualidad</span><strong>{formatPrice.format(Number(materia.costoMensualidad))}</strong></div>
            <small>Los pagos se gestionan con recepción del instituto.</small>
          </aside>
        </section>

        <section className="public-detail-groups">
          <div className="public-detail-section-heading">
            <div>
              <span className="public-kicker">
                {isReceptionist ? "MATRÍCULA EN RECEPCIÓN" : "GRUPOS DISPONIBLES"}
              </span>
              <h2>Grupos y docentes</h2>
            </div>
            <span>{materia.grupos.length} disponibles</span>
          </div>

          {isReceptionist ? (
            <div className="public-enrollment-controls">
              <label htmlFor="enrollment-student">Estudiante para matricular</label>
              {studentsLoading ? (
                <p className="public-enrollment-hint">Cargando estudiantes...</p>
              ) : studentsError ? (
                <div className="public-enrollment-message is-error" role="alert">
                  <span>{studentsError}</span>
                  <button
                    className="button button-outline"
                    onClick={() => {
                      setStudentsLoaded(false);
                      setStudentsError(null);
                      setStudentsRetry((value) => value + 1);
                    }}
                  >
                    Reintentar
                  </button>
                </div>
              ) : activeStudents.length > 0 ? (
                <>
                  <select
                    id="enrollment-student"
                    value={selectedStudentId}
                    onChange={(event) => {
                      setSelectedStudentId(event.target.value);
                      setEnrollmentError(null);
                      setEnrollmentSuccess(null);
                    }}
                  >
                    <option value="">Selecciona un estudiante activo</option>
                    {activeStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.nombre} {student.apellido} · {student.perfilEstudiante?.codigoMatricula}
                      </option>
                    ))}
                  </select>
                  <p className="public-enrollment-hint">
                    Solo aparecen estudiantes ACTIVOS. Primero registra y aprueba el pago para activar una cuenta pendiente.
                  </p>
                </>
              ) : (
                <p className="public-enrollment-hint" role="status">
                  No hay estudiantes activos disponibles. Registra el pago en recepción y espera a que el backend active la cuenta antes de matricular.
                </p>
              )}
            </div>
          ) : (
            <div className="public-enrollment-message is-info" role="note">
              La matrícula la realiza exclusivamente recepción. Si tu cuenta aún está pendiente,
              primero debes completar el pago y esperar a que el instituto la active.
            </div>
          )}
          {enrollmentError && <p className="public-enrollment-message is-error" role="alert">{enrollmentError}</p>}
          {enrollmentSuccess && (
            <div className="public-enrollment-message is-success" role="status">
              <CheckCircle2 size={18} />
              <span>
                Matrícula registrada para{" "}
                {students.find((student) => student.id === enrollmentSuccess.studentId)?.nombre}
                {" "}en el grupo{" "}
                {materia.grupos.find((group) => group.id === enrollmentSuccess.groupId)?.nombre}.
              </span>
            </div>
          )}

          {materia.grupos.length === 0 ? (
            <div className="public-feedback">Esta materia no tiene grupos disponibles por el momento.</div>
          ) : (
            <div className="public-group-grid">
              {materia.grupos.map((group) => {
                const teacher = group.profesor?.usuario;
                const teacherName = teacher
                  ? `${teacher.nombre} ${teacher.apellido}`
                  : "Docente por confirmar";

                return (
                  <article className="public-group-card" key={group.id}>
                    <span className="public-group-icon"><UsersRound size={19} /></span>
                    <div className="public-group-copy">
                      <span className="public-subject-category">GRUPO DISPONIBLE</span>
                      <h3>{group.nombre}</h3>
                      <p><GraduationCap size={15} /> {teacherName}</p>
                    </div>
                    {isReceptionist && (
                      <button
                        className="button button-primary"
                        disabled={
                          enrollingGroup !== null ||
                          !selectedStudentId ||
                          studentsLoading ||
                          activeStudents.length === 0 ||
                          (enrollmentSuccess?.studentId === Number(selectedStudentId) &&
                            enrollmentSuccess.groupId === group.id)
                        }
                        onClick={() => void handleEnroll(group.id)}
                      >
                        {enrollingGroup === group.id
                          ? "Matriculando..."
                          : enrollmentSuccess?.studentId === Number(selectedStudentId) &&
                              enrollmentSuccess.groupId === group.id
                            ? "Matrícula registrada"
                            : "Matricular estudiante"}
                        {enrollingGroup !== group.id && <ArrowRight size={15} />}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
      <footer className="public-footer">
        <Link to="/">The Anglo American Institute+</Link>
        <span>© Aula+ · Educación para el futuro</span>
        {!token && <Link to="/login" state={{ from: returnToMateria }}>Iniciar sesión</Link>}
      </footer>
    </main>
  );
}
