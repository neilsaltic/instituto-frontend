import { Bell, ChevronDown, Search } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { formatDate } from "../../lib/format";

const titles: Record<string, string> = {
  "/": "Resumen",
  "/estudiantes": "Estudiantes",
  "/cursos": "Cursos",
  "/docentes": "Docentes",
  "/calendario": "Calendario",
};

export function Topbar() {
  const location = useLocation();
  const [today] = useState(() => new Date());
  return (
    <header className="topbar">
      <div className="breadcrumbs">
        <span>Panel de control</span>
        <span className="breadcrumb-divider">/</span>
        <strong>{titles[location.pathname] ?? "Academia"}</strong>
      </div>
      <div className="topbar-actions">
        <span className="topbar-date">{formatDate(today)}</span>
        <button className="search-trigger" aria-label="Buscar">
          <Search size={16} />
          <span>Buscar</span>
          <kbd>⌘ K</kbd>
        </button>
        <button
          className="icon-button notification-button"
          aria-label="Notificaciones"
        >
          <Bell size={18} />
          <i />
        </button>
        <span className="topbar-divider" />
        <button className="topbar-user">
          <span className="topbar-avatar">AG</span>
          <ChevronDown size={15} />
        </button>
      </div>
    </header>
  );
}
