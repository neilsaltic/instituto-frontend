import {
  BookOpen,
  CalendarDays,
  CreditCard,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  Settings2,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Avatar } from "../ui/Avatar";
import { useAuthStore } from "../../store/useAuthStore";

const adminLinks = [
  { label: "Resumen", to: "/inicio", icon: LayoutDashboard },
  { label: "Estudiantes", to: "/estudiantes", icon: UsersRound },
  { label: "Cursos", to: "/cursos", icon: BookOpen },
  { label: "Docentes", to: "/docentes", icon: GraduationCap },
  { label: "Recepcionistas", to: "/recepcionistas", icon: UserPlus },
  { label: "Calendario", to: "/calendario", icon: CalendarDays },
  { label: "Pagos", to: "/pagos", icon: CreditCard },
];

const teacherLinks = [
  { label: "Cursos", to: "/cursos", icon: BookOpen },
  { label: "Calendario", to: "/calendario", icon: CalendarDays },
  { label: "Tareas", to: "/tareas", icon: ClipboardList },
];

const studentLinks = [
  { label: "Cursos", to: "/cursos", icon: BookOpen },
  { label: "Calendario", to: "/calendario", icon: CalendarDays },
  { label: "Matrícula", to: "/matriculas", icon: GraduationCap },
  { label: "Tareas", to: "/tareas", icon: ClipboardList },
];

const receptionistLinks = [
  { label: "Estudiantes", to: "/estudiantes", icon: UsersRound },
  { label: "Cursos", to: "/cursos", icon: BookOpen },
  { label: "Calendario", to: "/calendario", icon: CalendarDays },
  { label: "Pagos", to: "/pagos", icon: CreditCard },
];

export function Sidebar() {
  const Navigate = useNavigate();
  const usuario = useAuthStore((state) => state.usuario);
  const cerrarSesion = useAuthStore((state) => state.cerrarSesion);

  const links =
    usuario?.rol === "ADMINISTRADOR"
      ? [
          ...adminLinks,
          { label: "Gestión académica", to: "/administracion-academica", icon: Settings2 },
        ]
      : usuario?.rol === "PROFESOR"
        ? teacherLinks
        : usuario?.rol === "ESTUDIANTE"
          ? studentLinks
            : usuario?.rol === "RECEPCIONISTA"
              ? receptionistLinks
              : [];
  const handleLogout = () => {
    cerrarSesion();
    Navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">
      <a className="brand" href="/" aria-label="Academia, inicio">
        <span className="brand-mark">
          <GraduationCap size={22} strokeWidth={2.2} />
        </span>
        <span className="brand-name">
          The Anglo American Institute<span>+</span>
          <small>GESTIÓN ACADÉMICA</small>
        </span>
      </a>
      <div className="workspace-switcher">
        <span className="workspace-avatar">U</span>
        <span className="workspace-name">
          Universidad Central<small>Campus principal</small>
        </span>
        <PanelLeftClose size={16} className="workspace-chevron" />
      </div>
      <span className="nav-section-label">MENÚ PRINCIPAL</span>
      <nav className="primary-nav" aria-label="Navegación principal">
        {links.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-help">
          <span className="help-dot" />
          <div>
            <strong>¿Necesitas ayuda?</strong>
            <span>Visita nuestro centro de soporte</span>
          </div>
          <span className="help-arrow">↗</span>
        </div>
        <div className="profile-row">
          <Avatar initials="AG" color="rose" />
          <div className="profile-info">
            <strong>{usuario?.nombre}</strong>
            <span>{usuario?.rol}</span>
          </div>
          <button
            className="icon-button logout-button"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}
