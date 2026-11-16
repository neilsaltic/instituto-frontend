const data = [
  { month: 'Ene', value: 44 }, { month: 'Feb', value: 58 }, { month: 'Mar', value: 49 },
  { month: 'Abr', value: 68 }, { month: 'May', value: 57 }, { month: 'Jun', value: 76 },
  { month: 'Jul', value: 63 }, { month: 'Ago', value: 88 }, { month: 'Sep', value: 72 },
  { month: 'Oct', value: 82 }, { month: 'Nov', value: 68 }, { month: 'Dic', value: 94 },
]

export function EnrollmentChart() {
  const points = data.map((item, index) => `${42 + index * 58},${204 - item.value * 1.65}`).join(' ')
  const areaPoints = `42,204 ${points} 680,204`
  return (
    <section className="panel enrollment-panel">
      <div className="panel-header">
        <div><h2>Inscripciones</h2><p>Alumnos inscritos durante el año</p></div>
        <button className="select-button">Este año <span>⌄</span></button>
      </div>
      <div className="chart-legend"><span /><strong>Estudiantes</strong><span className="legend-total">+18.6% <small>vs. año anterior</small></span></div>
      <div className="chart-container">
        <div className="chart-y-labels"><span>800</span><span>600</span><span>400</span><span>200</span><span>0</span></div>
        <svg className="enrollment-chart" viewBox="0 0 700 220" preserveAspectRatio="none" role="img" aria-label="Gráfico de inscripciones mensuales en aumento">
          <defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#8f294c" stopOpacity=".17" /><stop offset="100%" stopColor="#8f294c" stopOpacity="0" /></linearGradient></defs>
          {[40, 81, 122, 163, 204].map((y) => <line key={y} x1="42" x2="680" y1={y} y2={y} className="chart-gridline" />)}
          <polygon points={areaPoints} fill="url(#chartFill)" />
          <polyline points={points} fill="none" stroke="#8f294c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {data.map((item, index) => <circle key={item.month} cx={42 + index * 58} cy={204 - item.value * 1.65} r="3" className="chart-dot" />)}
        </svg>
        <div className="chart-x-labels">{data.map((item) => <span key={item.month}>{item.month}</span>)}</div>
      </div>
    </section>
  )
}
