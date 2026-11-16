import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return <main className="not-found"><span className="not-found-code">404</span><h1>Página no encontrada</h1><p>Lo sentimos, no pudimos encontrar la página que buscas.</p><Link className="button button-primary" to="/"><ArrowLeft size={16} /> Volver al inicio</Link></main>
}
