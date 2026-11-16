import { ArrowUpRight, BookOpen, RotateCcw, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeading } from "../components/ui/PageHeading";
import { materiasService } from "../services/materias";
import type { MateriaDetalle } from "../services/materias";

const coloresCover = ["rose", "blue", "amber", "purple", "green"];
const formatPrice = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  maximumFractionDigits: 2,
});

export function CoursesPage() {
  const [materias, setMaterias] = useState<MateriaDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    materiasService
      .getTodas()
      .then((items) =>
        Promise.all(items.map((item) => materiasService.getDetalle(item.id))),
      )
      .then((details) => {
        if (active) setMaterias(details);
      })
      .catch((loadError: unknown) => {
        console.error("Error al cargar materias y docentes:", loadError);
        if (active) setError("No se pudieron cargar las materias y sus docentes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retry]);

  const visibleMaterias = useMemo(() => {
    const search = query.trim().toLowerCase();
    return materias.filter((materia) => {
      const teachers = materia.grupos
        .flatMap((group) =>
          group.profesor
            ? [`${group.profesor.usuario.nombre} ${group.profesor.usuario.apellido}`]
            : [],
        )
        .join(" ");
      return `${materia.nombre} ${materia.codigo} ${teachers}`.toLowerCase().includes(search);
    });
  }, [materias, query]);

  const totalGroups = materias.reduce((total, materia) => total + materia.grupos.length, 0);
  const totalTeachers = new Set(
    materias.flatMap((materia) =>
      materia.grupos
        .flatMap((group) =>
          group.profesor
            ? [`${group.profesor.usuario.nombre} ${group.profesor.usuario.apellido}`]
            : [],
        ),
    ),
  ).size;

  if (loading) {
    return <div className="p-12 text-center"><p className="text-lg font-medium">Cargando materias...</p></div>;
  }

  if (error) {
    return (
      <div className="p-12 text-center">
        <div className="panel" style={{ padding: "30px", maxWidth: "430px", margin: "0 auto" }}>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            className="button button-primary"
            onClick={() => {
              setLoading(true);
              setError(null);
              setRetry((value) => value + 1);
            }}
          >
            <RotateCcw size={16} /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeading
        eyebrow="OFERTA ACADÉMICA"
        title="Materias"
        description="Consulta asignaturas, docentes, grupos y costos de inscripción."
      />
      <div className="course-summary">
        <div>
          <span className="course-summary-icon rose-summary"><BookOpen size={18} /></span>
          <span>Materias disponibles<strong>{materias.length}</strong></span>
        </div>
        <div>
          <span className="course-summary-icon blue-summary"><UsersRound size={18} /></span>
          <span>Grupos disponibles<strong>{totalGroups}</strong></span>
        </div>
        <div>
          <span className="course-summary-icon amber-summary"><UsersRound size={18} /></span>
          <span>Docentes<strong>{totalTeachers}</strong></span>
        </div>
      </div>

      <div className="course-toolbar">
        <div>
          <h2>Todas las materias <span>{visibleMaterias.length}</span></h2>
          <p>Selecciona una materia para consultar grupos y solicitar matrícula en recepción.</p>
        </div>
        <label className="table-search">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar materia o docente..."
          />
        </label>
      </div>

      <div className="course-grid">
        {visibleMaterias.map((materia, index) => {
          const teacherNames = Array.from(
            new Set(
              materia.grupos
                .flatMap((group) =>
                  group.profesor
                    ? [`${group.profesor.usuario.nombre} ${group.profesor.usuario.apellido}`]
                    : [],
                ),
            ),
          );
          const color = coloresCover[index % coloresCover.length];

          return (
            <Link className="course-card" key={materia.id} to={`/materias/${materia.id}`}>
              <div className={`course-card-cover cover-${color}`}>
                <span className="course-symbol"><BookOpen size={21} /></span>
                <span className="course-code">{materia.codigo}</span>
                <span className="course-open" aria-hidden="true"><ArrowUpRight size={16} /></span>
                <div className="cover-decoration" />
              </div>
              <div className="course-card-body">
                <span className="course-category">Asignatura</span>
                <h3>{materia.nombre}</h3>
                <div className="course-teacher-list">
                  {teacherNames.length === 0 ? (
                    <span className="course-teacher"><span className="teacher-mini">?</span>Docente por asignar</span>
                  ) : (
                    materia.grupos.map((group) => {
                      const teacher = group.profesor?.usuario;
                      return (
                        <span className="course-teacher" key={group.id}>
                          <span className="teacher-mini">
                            {teacher ? `${teacher.nombre[0] ?? ""}${teacher.apellido[0] ?? ""}`.toUpperCase() : "?"}
                          </span>
                          {teacher
                            ? `${teacher.nombre} ${teacher.apellido} · ${group.nombre}`
                            : `${group.nombre} · Docente por asignar`}
                        </span>
                      );
                    })
                  )}
                </div>
                <div className="course-card-meta">
                  <span><UsersRound size={14} /> {materia.grupos.length} {materia.grupos.length === 1 ? "grupo" : "grupos"}</span>
                  <span>{materia.creditos} créditos</span>
                </div>
                <div className="course-price-row">
                  <span>Inscripción <strong>{formatPrice.format(Number(materia.costoInscripcion))}</strong></span>
                  <span>Mensualidad <strong>{formatPrice.format(Number(materia.costoMensualidad))}</strong></span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {visibleMaterias.length === 0 && (
        <div className="panel"><div className="empty-state">No se encontraron materias.</div></div>
      )}
    </>
  );
}
