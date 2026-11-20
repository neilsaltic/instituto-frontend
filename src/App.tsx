import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { CalendarPage } from "./pages/CalendarPage";
import { CoursesPage } from "./pages/CoursesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AcademicoAdminPage } from "./pages/AcademicoAdminPage";
import { LoginPage } from "./pages/LoginPage";
import { MatriculasPage } from "./pages/MatriculasPage";
import { MateriaDetailPage } from "./pages/MateriaDetailPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { PublicHomePage } from "./pages/PublicHomePage";
import { ReceptionistsPage } from "./pages/ReceptionistsPage";
import { StudentsPage } from "./pages/StudentsPage";
import { TeachersPage } from "./pages/TeachersPage";
import { TareasPage } from "./pages/TareasPage";
import { useAuthStore } from "./store/useAuthStore";
import type { Rol } from "./types/usuario";

function ProtectedLayout() {
  const token = useAuthStore((state) => state.token);
  const userStatus = useAuthStore((state) => state.usuario?.estado);

  if (!token) return <Navigate to="/login" replace />;
  if (userStatus !== "ACTIVO") {
    return <Navigate to="/login" replace state={{ accountPending: true }} />;
  }
  return <AppLayout />;
}

function PaymentsRoute() {
  const role = useAuthStore((state) => state.usuario?.rol);
  if (role !== "RECEPCIONISTA" && role !== "ADMINISTRADOR") {
    return <Navigate to="/inicio" replace />;
  }
  return <PaymentsPage />;
}

function RoleRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: Rol[];
  children: React.ReactNode;
}) {
  const role = useAuthStore((state) => state.usuario?.rol);
  if (!role || !allowedRoles.includes(role)) {
    const destination =
      role === "ESTUDIANTE"
        ? "/tareas"
        : role === "PROFESOR"
          ? "/cursos"
          : "/inicio";
    return <Navigate to={destination} replace />;
  }
  return children;
}

function DashboardRoute() {
  const role = useAuthStore((state) => state.usuario?.rol);
  if (role === "ESTUDIANTE") return <Navigate to="/tareas" replace />;
  if (role === "PROFESOR") return <Navigate to="/cursos" replace />;
  return <DashboardPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicHomePage />} />
      <Route path="/materias/:id" element={<MateriaDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/inicio" element={<DashboardRoute />} />
        <Route
          path="/estudiantes"
          element={
            <RoleRoute allowedRoles={["ADMINISTRADOR", "RECEPCIONISTA"]}>
              <StudentsPage />
            </RoleRoute>
          }
        />
        <Route path="/cursos" element={<CoursesPage />} />
        <Route
          path="/docentes"
          element={
            <RoleRoute allowedRoles={["ADMINISTRADOR"]}>
              <TeachersPage />
            </RoleRoute>
          }
        />
        <Route
          path="/recepcionistas"
          element={
            <RoleRoute allowedRoles={["ADMINISTRADOR"]}>
              <ReceptionistsPage />
            </RoleRoute>
          }
        />
        <Route path="/calendario" element={<CalendarPage />} />
        <Route
          path="/administracion-academica"
          element={
            <RoleRoute allowedRoles={["ADMINISTRADOR"]}>
              <AcademicoAdminPage />
            </RoleRoute>
          }
        />
        <Route
          path="/matriculas"
          element={
            <RoleRoute allowedRoles={["ESTUDIANTE"]}>
              <MatriculasPage />
            </RoleRoute>
          }
        />
        <Route
          path="/tareas"
          element={
            <RoleRoute allowedRoles={["ESTUDIANTE", "PROFESOR", "ADMINISTRADOR"]}>
              <TareasPage />
            </RoleRoute>
          }
        />
        <Route path="/pagos" element={<PaymentsRoute />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
