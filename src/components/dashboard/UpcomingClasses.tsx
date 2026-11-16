import { ArrowRight, Clock3, MapPin } from 'lucide-react'
import { useState } from 'react'
import { formatDate } from '../../lib/format'

const classes = [
  { time: '09:00', name: 'Diseño de interfaces', teacher: 'Mariana López', room: 'Aula 204', color: 'blue' },
  { time: '10:30', name: 'Desarrollo web avanzado', teacher: 'Carlos Mendoza', room: 'Lab. de cómputo', color: 'rose' },
  { time: '12:00', name: 'Bases de datos II', teacher: 'Jorge Ramírez', room: 'Aula 108', color: 'amber' },
]

export function UpcomingClasses() {
  const [today] = useState(() => formatDate(new Date()))
  return (
    <section className="panel classes-panel">
      <div className="panel-header">
        <div><h2>Clases de hoy</h2><p>{today}</p></div>
        <button className="icon-button subtle-button" aria-label="Ver calendario"><ArrowRight size={17} /></button>
      </div>
      <div className="classes-list">
        {classes.map((item) => (
          <div className="class-item" key={item.name}>
            <div className="class-time"><strong>{item.time}</strong><span>AM</span></div>
            <span className={`class-accent accent-${item.color}`} />
            <div className="class-info"><strong>{item.name}</strong><span>{item.teacher}</span><small><MapPin size={12} />{item.room}</small></div>
          </div>
        ))}
      </div>
      <div className="class-summary"><Clock3 size={14} /><span>Tienes <strong>3 clases</strong> programadas hoy</span></div>
    </section>
  )
}
