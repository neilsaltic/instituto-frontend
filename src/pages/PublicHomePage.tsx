import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  GraduationCap,
  Heart,
  Lightbulb,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { materiasService } from "../services/materias";
import type { Materia } from "../services/materias";

const subjectColors = ["rose", "blue", "amber", "green", "purple", "pink"];

export function PublicHomePage() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadMaterias = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setMaterias(await materiasService.getTodas());
    } catch (loadError) {
      console.error("Error al cargar las materias:", loadError);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    materiasService
      .getTodas()
      .then((data) => {
        if (active) setMaterias(data);
      })
      .catch((loadError: unknown) => {
        console.error("Error al cargar las materias:", loadError);
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="public-home">
      <header className="public-header">
        <Link className="public-brand" to="/" aria-label="Aula+, inicio">
          <span className="public-brand-mark">
            <GraduationCap size={21} />
          </span>
          <span className="brand-name">
            The Anglo American Institute<span>+</span>
            <small>INSTITUTO ACADÉMICO</small>
          </span>
        </Link>
        <nav className="public-nav" aria-label="Navegación principal">
          <a href="#materias">Materias</a>
          <a href="#nosotros">Nosotros</a>
          <a href="#comunidad">Comunidad</a>
        </nav>
        <Link className="button button-outline public-login" to="/login">
          Iniciar sesión <ArrowUpRight size={15} />
        </Link>
      </header>

      <section className="public-hero">
        <div className="public-hero-copy">
          <span className="public-kicker">
            <Sparkles size={14} /> APRENDE. CRECE. TRANSFORMA.
          </span>
          <h1>
            Tu futuro empieza
            <br />
            con una <em>buena idea.</em>
          </h1>
          <p>
            Un espacio para descubrir lo que te apasiona, desarrollar nuevas
            habilidades y convertir tus metas en caminos posibles.
          </p>
          <div className="public-hero-actions">
            <a className="button button-primary" href="#materias">
              Explorar materias <ArrowRight size={16} />
            </a>
            <a className="public-text-link" href="#nosotros">
              Conoce Aula+ <ArrowDown size={14} />
            </a>
          </div>
          <div className="public-hero-note">
            <span className="public-note-avatars" aria-hidden="true">
              <i>+</i>
              <i>A</i>
              <i>+</i>
            </span>
            <span>
              <strong>Aprendizaje con propósito</strong>
              <small>Una comunidad que avanza contigo</small>
            </span>
          </div>
        </div>
        <div className="public-hero-visual">
          <img
            className="public-hero-photo"
            src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1100&q=85"
            alt="Comunidad educativa participando en una charla"
          />
          <div className="public-photo-caption">
            <span className="public-caption-icon">
              <BookOpen size={17} />
            </span>
            <span>
              <strong>Aprender abre caminos</strong>
              <small>El próximo puede ser el tuyo</small>
            </span>
            <ArrowUpRight size={17} />
          </div>
          <div className="public-floating-card">
            <span className="public-floating-icon">
              <Heart size={17} />
            </span>
            <span>
              <strong>Crece a tu manera</strong>
              <small>Con acompañamiento cercano</small>
            </span>
          </div>
          <span className="public-visual-stamp">
            <GraduationCap size={25} />
            <small>
              EDUCACIÓN
              <br />
              QUE INSPIRA
            </small>
          </span>
        </div>
        <span className="public-hero-orb" aria-hidden="true" />
      </section>

      <section className="public-values" aria-label="Nuestra comunidad">
        <div>
          <span className="value-icon value-icon-rose">
            <Lightbulb size={19} />
          </span>
          <span>
            <strong>Ideas que se vuelven realidad</strong>
            <small>Conocimiento para hacer, crear y proponer.</small>
          </span>
        </div>
        <div>
          <span className="value-icon value-icon-green">
            <UsersRound size={19} />
          </span>
          <span>
            <strong>Aprendizaje en comunidad</strong>
            <small>Personas que comparten metas y se impulsan.</small>
          </span>
        </div>
        <div>
          <span className="value-icon value-icon-amber">
            <GraduationCap size={19} />
          </span>
          <span>
            <strong>Tu siguiente paso</strong>
            <small>Formación para abrir nuevas oportunidades.</small>
          </span>
        </div>
      </section>

      <section className="public-section public-subjects" id="materias">
        <div className="public-section-heading">
          <div>
            <span className="public-kicker">UNA OFERTA PARA DESCUBRIR</span>
            <h2>Materias para llevar tus ideas más lejos.</h2>
            <p>
              Explora parte de la oferta académica del instituto y encuentra
              dónde comienza tu próximo desafío.
            </p>
          </div>
          <span className="public-section-mark">
            <BookOpen size={24} />
          </span>
        </div>

        {loading ? (
          <div className="public-feedback" role="status">
            <LoaderCircle className="public-spinner" size={22} />
            <span>Cargando materias del instituto...</span>
          </div>
        ) : error ? (
          <div className="public-feedback public-feedback-error" role="alert">
            <span>No pudimos cargar las materias desde el servidor.</span>
            <button
              className="button button-outline"
              onClick={() => void loadMaterias()}
            >
              <RotateCcw size={15} /> Reintentar
            </button>
          </div>
        ) : materias.length === 0 ? (
          <div className="public-feedback">
            Las materias estarán disponibles próximamente.
          </div>
        ) : (
          <>
            <div className="public-subject-grid">
              {materias.slice(0, 6).map((materia, index) => (
                <Link
                  className="public-subject-card"
                  key={materia.id}
                  to={`/materias/${materia.id}`}
                >
                  <div
                    className={`public-subject-art subject-art-${subjectColors[index % subjectColors.length]}`}
                  >
                    <span>
                      <BookOpen size={19} />
                    </span>
                    <small>{materia.codigo}</small>
                    <i aria-hidden="true" />
                  </div>
                  <div className="public-subject-content">
                    <span className="public-subject-category">Asignatura</span>
                    <h3>{materia.nombre}</h3>
                    <p>Consulta grupos, docentes y opciones de pago.</p>
                    <div className="public-subject-meta">
                      <span>
                        <Check size={14} /> {materia.creditos} créditos
                      </span>
                      <span>
                        {materia._count?.grupos ?? 0}{" "}
                        {materia._count?.grupos === 1 ? "grupo" : "grupos"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {materias.length > 6 && (
              <p className="public-course-count">
                Mostrando 6 de {materias.length} materias disponibles.
              </p>
            )}
          </>
        )}
      </section>

      <section className="public-about" id="nosotros">
        <div className="public-about-image">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=85"
            alt="Estudiantes colaborando en un espacio de estudio"
            loading="lazy"
          />
          <span className="public-about-badge">
            <span>+</span> Aprendemos juntos
          </span>
        </div>
        <div className="public-about-copy">
          <span className="public-kicker">MÁS QUE UN LUGAR PARA ESTUDIAR</span>
          <h2>Una educación que te ayuda a mirar hacia adelante.</h2>
          <p>
            En Aula+ creemos que cada persona tiene el potencial de construir
            algo significativo. Por eso promovemos una formación práctica,
            cercana y conectada con los retos de hoy.
          </p>
          <div className="public-mission">
            <span className="public-mission-icon">
              <Lightbulb size={18} />
            </span>
            <span>
              <strong>Nuestra visión</strong>
              <small>
                Ser una comunidad educativa que inspira a aprender durante toda
                la vida y a transformar positivamente nuestro entorno.
              </small>
            </span>
          </div>
          <Link className="public-text-link" to="/login">
            Accede a tu espacio <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <section className="public-community" id="comunidad">
        <div className="community-icon">
          <UsersRound size={21} />
        </div>
        <div>
          <span className="public-kicker">
            TU PRÓXIMO CAPÍTULO COMIENZA AQUÍ
          </span>
          <h2>Las grandes ideas crecen cuando se comparten.</h2>
          <p>
            Conoce nuestras materias y encuentra el camino que conecta con tus
            metas.
          </p>
        </div>
        <Link className="button button-primary" to="/login">
          Ingresar al instituto <ArrowRight size={16} />
        </Link>
        <span className="community-decoration" aria-hidden="true" />
      </section>

      <footer className="public-footer">
        <Link className="public-brand" to="/" aria-label="Aula+, inicio">
          <span className="public-brand-mark">
            <GraduationCap size={20} />
          </span>
          <span className="brand-name">
            The Anglo American Institute <span>+</span>
          </span>
        </Link>
        <span>© The Anglo American Institute · Educación para el futuro</span>
        <Link to="/login">Portal administrativo</Link>
      </footer>
    </main>
  );
}
