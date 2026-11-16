import { useState } from 'react'
import { ArrowRight, BookOpen, GraduationCap, Plus, UserRoundCheck, UsersRound } from 'lucide-react'
import { ActivityList } from '../components/dashboard/ActivityList'
import { EnrollmentChart } from '../components/dashboard/EnrollmentChart'
import { StatCard } from '../components/dashboard/StatCard'
import { UpcomingClasses } from '../components/dashboard/UpcomingClasses'
import { PageHeading } from '../components/ui/PageHeading'
import { formatDate, getGreeting } from '../lib/format'

export function DashboardPage() {
  const [today] = useState(() => new Date())
  return (
    <>
      <PageHeading eyebrow={formatDate(today).toUpperCase()} title={`${getGreeting()}, Andrea 👋`} description="Aquí tienes un resumen de lo que sucede en tu institución." action={<button className="button button-primary"><Plus size={16} /> Nuevo registro</button>} />
      <div className="stats-grid">
        <StatCard label="Estudiantes activos" value="2,840" change="12.8%" detail="vs. período anterior" icon={UsersRound} tone="rose" />
        <StatCard label="Docentes" value="148" change="4.3%" detail="vs. período anterior" icon={GraduationCap} tone="blue" />
        <StatCard label="Cursos activos" value="64" change="8.2%" detail="vs. período anterior" icon={BookOpen} tone="amber" />
        <StatCard label="Asistencia promedio" value="94.6%" change="2.1%" detail="vs. período anterior" icon={UserRoundCheck} tone="green" />
      </div>
      <div className="dashboard-main-grid">
        <EnrollmentChart />
        <UpcomingClasses />
      </div>
      <div className="dashboard-lower-grid">
        <ActivityList />
        <section className="panel program-panel">
          <div className="panel-header"><div><h2>Programas académicos</h2><p>Estudiantes por facultad</p></div><button className="text-button">Ver reporte <ArrowRight size={14} /></button></div>
          <div className="program-list">
            {[['Ingeniería', '840', 82, 'rose'], ['Administración', '620', 64, 'blue'], ['Ciencias de la salud', '512', 52, 'green'], ['Diseño y comunicación', '428', 43, 'amber']].map(([name, count, value, color]) => (
              <div className="program-row" key={name}><div><strong>{name}</strong><span>{count} estudiantes</span></div><div className="progress-track"><span className={`progress-${color}`} style={{ width: `${value}%` }} /></div><b>{value}%</b></div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
