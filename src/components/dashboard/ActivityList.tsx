import { ArrowUpRight, BookOpen, CircleCheck, UserPlus } from 'lucide-react'

const activities = [
  { title: 'Nuevo estudiante registrado', detail: 'Sofía Ramírez · Ingeniería', time: 'Hace 12 min', type: 'student' },
  { title: 'Inscripción completada', detail: 'Desarrollo web avanzado', time: 'Hace 48 min', type: 'course' },
  { title: 'Pago de matrícula recibido', detail: 'Mateo Fernández · 2025-II', time: 'Hace 2 horas', type: 'payment' },
  { title: 'Nuevo curso publicado', detail: 'Diseño de interfaces', time: 'Hace 4 horas', type: 'course' },
]

export function ActivityList() {
  return (
    <section className="panel activity-panel">
      <div className="panel-header">
        <div><h2>Actividad reciente</h2><p>Lo que sucede en tu institución</p></div>
        <button className="text-button">Ver todo <ArrowUpRight size={14} /></button>
      </div>
      <div className="activity-list">
        {activities.map((item) => (
          <div className="activity-item" key={item.title}>
            <span className={`activity-icon activity-${item.type}`}>
              {item.type === 'student' ? <UserPlus size={16} /> : item.type === 'course' ? <BookOpen size={16} /> : <CircleCheck size={16} />}
            </span>
            <div className="activity-copy"><strong>{item.title}</strong><span>{item.detail}</span></div>
            <time>{item.time}</time>
          </div>
        ))}
      </div>
    </section>
  )
}
