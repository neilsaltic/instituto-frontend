import { ArrowLeft, ArrowRight, CalendarDays, Clock3, MapPin, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PageHeading } from '../components/ui/PageHeading'
import { mensajeError } from '../lib/errores'
import { gruposService, periodosService } from '../services/academico'
import { matriculasService } from '../services/matriculas'
import { useAuthStore } from '../store/useAuthStore'

type Registro = Record<string, unknown>
type HorarioInscrito = { dia: string; inicio: string; fin: string; materia: string; grupo: string }

const diasSemana = [
  { value: 'LUNES', label: 'Lunes' },
  { value: 'MARTES', label: 'Martes' },
  { value: 'MIERCOLES', label: 'Miércoles' },
  { value: 'JUEVES', label: 'Jueves' },
  { value: 'VIERNES', label: 'Viernes' },
]

function registro(value: unknown): Registro | null {
  return value && typeof value === 'object' ? value as Registro : null
}

function lista(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  const item = registro(value)
  if (Array.isArray(item?.data)) return item.data
  if (Array.isArray(item?.items)) return item.items
  if (Array.isArray(item?.materias)) return item.materias
  if (Array.isArray(item?.matriculas)) return item.matriculas
  if (Array.isArray(item?.grupos)) return item.grupos
  if (item?.data && typeof item.data === 'object') return lista(item.data)
  if (Array.isArray(item?.horarios) && item.id !== undefined) return [value]
  return []
}

function extraerHorario(value: unknown): HorarioInscrito[] {
  return lista(value).flatMap((entry) => {
    const item = registro(entry)
    if (
      typeof item?.diaSemana !== 'string' ||
      typeof item.horaInicio !== 'string' ||
      typeof item.horaFin !== 'string'
    ) return []
    return [{
      dia: item.diaSemana.toUpperCase(),
      inicio: item.horaInicio,
      fin: item.horaFin,
      materia: '',
      grupo: '',
    }]
  })
}

function normalizarHorarioInscrito(value: unknown): HorarioInscrito[] {
  return lista(value).flatMap((entry) => {
    const enrollment = registro(entry)
    const group = registro(enrollment?.grupo) ?? registro(enrollment?.grupoDetalle) ?? enrollment
    const subject = registro(enrollment?.materia) ?? registro(group?.materia)
    const materia = typeof subject?.nombre === 'string' ? subject.nombre : 'Materia inscrita'
    const nestedGroups = group?.grupos ?? enrollment?.grupos
    if (Array.isArray(nestedGroups)) {
      return nestedGroups.flatMap((nestedGroup) => normalizarHorarioInscrito([{
        grupo: nestedGroup,
        materia: subject,
      }]))
    }
    const grupo = typeof group?.nombre === 'string' ? group.nombre : ''
    return extraerHorario(group?.horarios ?? group?.horario ?? enrollment?.horarios).map((slot) => ({
      ...slot,
      materia,
      grupo,
    }))
  })
}

function idsGruposInscritos(value: unknown): Set<number> {
  const ids = new Set<number>()
  const visitar = (entry: unknown) => {
    const item = registro(entry)
    if (!item) return
    const group = registro(item.grupo) ?? registro(item.grupoDetalle)
    if (group) {
      const id = Number(group.id)
      if (Number.isSafeInteger(id) && id > 0) ids.add(id)
      visitar(group)
    } else if (item.grupoId !== undefined) {
      const id = Number(item.grupoId)
      if (Number.isSafeInteger(id) && id > 0) ids.add(id)
    } else if (Array.isArray(item.horarios) && item.id !== undefined) {
      const id = Number(item.id)
      if (Number.isSafeInteger(id) && id > 0) ids.add(id)
    }

    for (const key of ['grupos', 'matriculas', 'materias'] as const) {
      if (Array.isArray(item[key])) item[key].forEach(visitar)
    }
  }
  lista(value).forEach(visitar)
  return ids
}

function StudentCalendar({ profesor = false }: { profesor?: boolean }) {
  const [horarios, setHorarios] = useState<HorarioInscrito[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    const cargarHorario = async () => {
      if (profesor) {
        return normalizarHorarioInscrito(await gruposService.getMisGrupos())
      }

      const data = await matriculasService.getMisMaterias()
        const enrolledGroupIds = idsGruposInscritos(data)
        if (enrolledGroupIds.size === 0) {
          return normalizarHorarioInscrito(data)
        }

        const periods = await periodosService.getTodos()
        const activePeriod = periods.find((period) => period.activo)
        const groups = await gruposService.getTodos(activePeriod?.id)
        const schedules = normalizarHorarioInscrito(
          groups.filter((group) => enrolledGroupIds.has(group.id)),
        )
        return schedules.length > 0 ? schedules : normalizarHorarioInscrito(data)
    }

    cargarHorario()
      .then((schedule) => {
        if (active) setHorarios(schedule)
      })
      .catch((loadError: unknown) => {
        if (active) setError(mensajeError(loadError, profesor
          ? 'No se pudo cargar el horario de tus grupos asignados.'
          : 'No se pudo cargar tu horario semanal.'))
      })
      .finally(() => {
        if (active) setCargando(false)
      })
    return () => {
      active = false
    }
  }, [profesor, retry])

  const reintentar = () => {
    setCargando(true)
    setError(null)
    setRetry((value) => value + 1)
  }

  return (
    <>
      <PageHeading
        eyebrow="ORGANIZACIÓN"
        title={profesor ? "Mi horario de clases" : "Mi horario"}
        description={profesor
          ? "Consulta los días y horarios de los grupos que tienes asignados."
          : "Consulta los grupos en los que estás inscrito durante la semana."}
      />
      {cargando ? (
        <div className="panel academic-panel">{profesor ? "Cargando tus grupos asignados..." : "Cargando tus grupos inscritos..."}</div>
      ) : error ? (
        <div className="panel academic-panel academic-load-error" role="alert">
          <p>{error}</p>
          <button className="button button-outline" onClick={reintentar}><RotateCcw size={14} /> Reintentar</button>
        </div>
      ) : horarios.length === 0 ? (
        <div className="panel academic-panel academic-empty">
          {profesor
            ? "Todavía no tienes grupos asignados con horario para mostrar."
            : "Todavía no tienes grupos inscritos con horario para mostrar."}
        </div>
      ) : (
        <section className="panel student-weekly-schedule" aria-label="Horario semanal">
          {diasSemana.map((day) => {
            const dayClasses = horarios
              .filter((slot) => slot.dia === day.value)
              .sort((first, second) => first.inicio.localeCompare(second.inicio))
            return (
              <div className="student-schedule-day" key={day.value}>
                <h2>{day.label}<span>{dayClasses.length}</span></h2>
                {dayClasses.length === 0 ? <p className="student-schedule-empty">Sin clases</p> : (
                  <div className="student-schedule-items">
                    {dayClasses.map((slot, index) => (
                      <article className="student-schedule-item" key={`${slot.grupo}-${slot.inicio}-${index}`}>
                        <strong>{slot.materia}</strong>
                        {slot.grupo && <span>{slot.grupo}</span>}
                        <small><Clock3 size={13} /> {slot.inicio}–{slot.fin}</small>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </section>
      )}
    </>
  )
}

const lessons = [
  { day: 0, start: 1, duration: 2, name: 'Desarrollo web avanzado', room: 'Lab. de cómputo', teacher: 'Carlos Mendoza', color: 'rose' },
  { day: 1, start: 0, duration: 2, name: 'Diseño de interfaces', room: 'Aula 204', teacher: 'Mariana López', color: 'blue' },
  { day: 2, start: 2, duration: 2, name: 'Bases de datos II', room: 'Aula 108', teacher: 'Jorge Ramírez', color: 'amber' },
  { day: 3, start: 1, duration: 2, name: 'Marketing estratégico', room: 'Aula 302', teacher: 'Laura Castillo', color: 'green' },
  { day: 4, start: 0, duration: 2, name: 'Estadística aplicada', room: 'Aula 105', teacher: 'Ricardo Flores', color: 'purple' },
  { day: 2, start: 5, duration: 2, name: 'Psicología social', room: 'Aula 212', teacher: 'Ana Beltrán', color: 'rose' },
]

export function CalendarPage() {
  const [week, setWeek] = useState(0)
  const role = useAuthStore((state) => state.usuario?.rol)
  const weekStart = new Date(2025, 2, 10 + week * 7)
  const displayedDays = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + index)
    return date
  })
  const monthLabel = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(weekStart)
  const periodLabel = `del ${displayedDays[0].getDate()} al ${displayedDays[4].getDate()}`
  if (role === 'ESTUDIANTE') return <StudentCalendar />
  if (role === 'PROFESOR') return <StudentCalendar profesor />
  return (
    <>
      <PageHeading eyebrow="ORGANIZACIÓN" title="Calendario" description="Consulta los horarios de clases y eventos académicos." action={<button className="button button-primary"><CalendarDays size={16} /> Nuevo evento</button>} />
      <section className="panel calendar-panel">
        <div className="calendar-toolbar"><div><h2 className="calendar-month">{monthLabel}</h2><span className="calendar-period">Semana {periodLabel}</span></div><div className="calendar-actions"><button className="button button-outline today-button" onClick={() => setWeek(0)}>Hoy</button><button className="icon-button calendar-arrow" onClick={() => setWeek((value) => value - 1)} aria-label="Semana anterior"><ArrowLeft size={17} /></button><button className="icon-button calendar-arrow" onClick={() => setWeek((value) => value + 1)} aria-label="Semana siguiente"><ArrowRight size={17} /></button></div></div>
        <div className="calendar-grid">
          <div className="calendar-time-column"><div className="calendar-day-head" /><div className="time-labels">{['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'].map((time) => <span key={time}>{time}</span>)}</div></div>
          {displayedDays.map((date, dayIndex) => <div className="calendar-day-column" key={date.toISOString()}><div className={`calendar-day-head ${week === 0 && dayIndex === 2 ? 'today-head' : ''}`}><span>{new Intl.DateTimeFormat('es', { weekday: 'short' }).format(date).replace('.', '')}</span><strong>{date.getDate()}</strong></div><div className="calendar-slots">{Array.from({ length: 8 }, (_, index) => <div className="calendar-slot" key={index} />)}{week === 0 && lessons.filter((lesson) => lesson.day === dayIndex).map((lesson, index) => <article key={lesson.name} className={`calendar-event event-${lesson.color}`} style={{ top: `${lesson.start * 58 + 5}px`, height: `${lesson.duration * 58 - 10}px`, left: index > 0 ? '51%' : '5%', width: index > 0 ? '44%' : '90%' }}><strong>{lesson.name}</strong><span><Clock3 size={11} />{`${String(8 + lesson.start).padStart(2, '0')}:00`} – {`${String(8 + lesson.start + lesson.duration).padStart(2, '0')}:00`}</span><small><MapPin size={11} />{lesson.room}</small></article>)}</div></div>)}
        </div>
        <div className="calendar-legend"><span><i className="legend-rose" />Ingeniería</span><span><i className="legend-blue" />Diseño</span><span><i className="legend-green" />Administración</span><span><i className="legend-amber" />Ciencias básicas</span></div>
      </section>
    </>
  )
}
