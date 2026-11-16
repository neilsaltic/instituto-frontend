import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";
import { Avatar } from "../components/ui/Avatar";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeading } from "../components/ui/PageHeading";
import { StatusBadge } from "../components/ui/StatusBadge";
import { mensajeError } from "../lib/errores";
import {
  usuariosService,
  type CrearEstudiante,
  type CrearProfesor,
  type CrearRecepcionista,
  type UsuarioDirectorio,
} from "../services/usuarios";
import { useAuthStore } from "../store/useAuthStore";

export type UserDirectoryKind = "estudiantes" | "profesores" | "recepcionistas";

type DatosFormulario = {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  ci: string;
  fechaNacimiento: string;
  telefono: string;
  especialidad: string;
  fechaContratacion: string;
  nombreTutor: string;
  telefonoTutor: string;
};

const formularioVacio: DatosFormulario = {
  nombre: "",
  apellido: "",
  email: "",
  password: "",
  ci: "",
  fechaNacimiento: "",
  telefono: "",
  especialidad: "",
  fechaContratacion: "",
  nombreTutor: "",
  telefonoTutor: "",
};

const textos: Record<UserDirectoryKind, { title: string; description: string }> = {
  estudiantes: {
    title: "Estudiantes",
    description: "Consulta y registra estudiantes desde el directorio académico.",
  },
  profesores: {
    title: "Docentes",
    description: "Consulta y registra profesores de la institución.",
  },
  recepcionistas: {
    title: "Recepcionistas",
    description: "Administra las cuentas del equipo de recepción.",
  },
};

function nombreCompleto(user: UsuarioDirectorio): string {
  return `${user.nombre} ${user.apellido}`.trim();
}

function iniciales(user: UsuarioDirectorio): string {
  return `${user.nombre[0] ?? ""}${user.apellido[0] ?? ""}`.toUpperCase();
}

export function UserDirectoryPage({ kind }: { kind: UserDirectoryKind }) {
  const role = useAuthStore((state) => state.usuario?.rol);
  const [users, setUsers] = useState<UsuarioDirectorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const [form, setForm] = useState<DatosFormulario>(formularioVacio);
  const isAdmin = role === "ADMINISTRADOR";
  const canCreate =
    kind === "estudiantes"
      ? role === "ADMINISTRADOR" || role === "RECEPCIONISTA"
      : isAdmin;

  useEffect(() => {
    let active = true;
    const request =
      kind === "estudiantes"
        ? usuariosService.getEstudiantes()
        : kind === "profesores"
          ? usuariosService.getProfesores()
          : usuariosService.getRecepcionistas();

    request
      .then((data) => {
        if (active) setUsers(data);
      })
      .catch((requestError: unknown) => {
        if (active) setLoadError(mensajeError(requestError, "No se pudo cargar el directorio."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [kind, retry]);

  const visibleUsers = useMemo(() => {
    const search = query.trim().toLowerCase();
    return users.filter((user) => {
      const code = user.perfilEstudiante?.codigoMatricula ?? "";
      const matchesSearch = `${nombreCompleto(user)} ${user.email} ${user.ci ?? ""} ${code}`
        .toLowerCase()
        .includes(search);
      const matchesStatus = statusFilter === "TODOS" || user.estado === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [query, statusFilter, users]);

  const updateForm = (key: keyof DatosFormulario, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const crearUsuario = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    const datosBase = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      email: form.email.trim(),
      password: form.password,
      ci: form.ci.trim(),
      fechaNacimiento: form.fechaNacimiento,
      ...(form.telefono.trim() ? { telefono: form.telefono.trim() } : {}),
    };

    try {
      if (kind === "estudiantes") {
        const datos: CrearEstudiante = {
          ...datosBase,
          ...(form.nombreTutor.trim() ? { nombreTutor: form.nombreTutor.trim() } : {}),
          ...(form.telefonoTutor.trim() ? { telefonoTutor: form.telefonoTutor.trim() } : {}),
        };
        await usuariosService.crearEstudiante(datos);
      } else if (kind === "profesores") {
        const datos: CrearProfesor = {
          ...datosBase,
          especialidad: form.especialidad.trim(),
          ...(form.fechaContratacion ? { fechaContratacion: form.fechaContratacion } : {}),
        };
        await usuariosService.crearProfesor(datos);
      } else {
        const datos: CrearRecepcionista = datosBase;
        await usuariosService.crearRecepcionista(datos);
      }

      setSuccess(`${kind === "estudiantes" ? "Estudiante" : kind === "profesores" ? "Docente" : "Recepcionista"} creado correctamente.`);
      setForm(formularioVacio);
      setShowForm(false);
      try {
        const updatedUsers =
          kind === "estudiantes"
            ? await usuariosService.getEstudiantes()
            : kind === "profesores"
              ? await usuariosService.getProfesores()
              : await usuariosService.getRecepcionistas();
        setUsers(updatedUsers);
      } catch (refreshError) {
        setError(mensajeError(refreshError, "El usuario se creó, pero no se pudo actualizar el directorio."));
      }
    } catch (requestError) {
      setError(mensajeError(requestError, "No se pudo crear el usuario."));
    } finally {
      setSaving(false);
    }
  };

  const eliminarUsuario = async (user: UsuarioDirectorio) => {
    if (!isAdmin || !window.confirm(`¿Eliminar a ${nombreCompleto(user)}?`)) return;
    setError(null);
    setSuccess(null);
    try {
      await usuariosService.eliminar(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setSuccess(`${nombreCompleto(user)} fue eliminado.`);
    } catch (deleteError) {
      setError(mensajeError(deleteError, "No se pudo eliminar el usuario."));
    }
  };

  const retryLoad = () => {
    setLoading(true);
    setLoadError(null);
    setRetry((value) => value + 1);
  };

  const heading = textos[kind];

  return (
    <>
      <PageHeading
        eyebrow={kind === "estudiantes" ? "GESTIÓN ACADÉMICA" : "ADMINISTRACIÓN"}
        title={heading.title}
        description={heading.description}
        action={canCreate ? (
          <button
            className="button button-primary"
            onClick={() => {
              setShowForm((value) => !value);
              setError(null);
              setSuccess(null);
            }}
          >
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? "Cerrar" : `Añadir ${kind === "estudiantes" ? "estudiante" : kind === "profesores" ? "docente" : "recepcionista"}`}
          </button>
        ) : undefined}
      />

      {error && <div className="academic-feedback is-error" role="alert">{error}</div>}
      {success && <div className="academic-feedback is-success" role="status">{success}</div>}
      {showForm && canCreate && (
        <section className="panel user-create-panel">
          <div className="academic-section-heading">
            <div><h2>Nuevo {kind === "estudiantes" ? "estudiante" : kind === "profesores" ? "docente" : "recepcionista"}</h2><p>Los datos se guardarán en el backend.</p></div>
          </div>
          <form className="user-create-form" onSubmit={(event) => void crearUsuario(event)}>
            <label>Nombre<input required value={form.nombre} onChange={(event) => updateForm("nombre", event.target.value)} /></label>
            <label>Apellido<input required value={form.apellido} onChange={(event) => updateForm("apellido", event.target.value)} /></label>
            <label>Cédula<input required value={form.ci} onChange={(event) => updateForm("ci", event.target.value)} /></label>
            <label>Fecha de nacimiento<input required type="date" value={form.fechaNacimiento} onChange={(event) => updateForm("fechaNacimiento", event.target.value)} /></label>
            <label>Correo electrónico<input required type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} /></label>
            <label>Contraseña<input required minLength={8} type="password" value={form.password} onChange={(event) => updateForm("password", event.target.value)} /></label>
            <label>Teléfono (opcional)<input type="tel" value={form.telefono} onChange={(event) => updateForm("telefono", event.target.value)} /></label>
            {kind === "estudiantes" && (
              <>
                <label>Tutor (opcional)<input value={form.nombreTutor} onChange={(event) => updateForm("nombreTutor", event.target.value)} /></label>
                <label>Teléfono del tutor (opcional)<input type="tel" value={form.telefonoTutor} onChange={(event) => updateForm("telefonoTutor", event.target.value)} /></label>
              </>
            )}
            {kind === "profesores" && (
              <>
                <label>Especialidad<input required value={form.especialidad} onChange={(event) => updateForm("especialidad", event.target.value)} /></label>
                <label>Fecha de contratación (opcional)<input type="date" value={form.fechaContratacion} onChange={(event) => updateForm("fechaContratacion", event.target.value)} /></label>
              </>
            )}
            <button className="button button-primary" disabled={saving}>{saving ? "Guardando..." : "Crear usuario"}</button>
          </form>
        </section>
      )}

      <section className="panel directory-panel">
        <div className="directory-toolbar">
          <div className="directory-tabs">
            {["TODOS", "ACTIVO", "PENDIENTE", "SUSPENDIDO_MORA", "INACTIVO"].map((status) => (
              <button
                key={status}
                className={`directory-tab ${statusFilter === status ? "selected" : ""}`}
                onClick={() => setStatusFilter(status)}
              >
                {status === "TODOS" ? "Todos" : status}
                {status === "TODOS" && <span>{users.length}</span>}
              </button>
            ))}
          </div>
          <div className="toolbar-actions">
            <label className="table-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, correo o CI..." /></label>
          </div>
        </div>
        {loading ? (
          <div className="user-directory-feedback" role="status">Cargando usuarios...</div>
        ) : loadError ? (
          <div className="user-directory-feedback is-error" role="alert">
            <p>{loadError}</p><button className="button button-outline" onClick={retryLoad}>Reintentar</button>
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr><th>USUARIO</th><th>CÉDULA</th>{kind === "estudiantes" && <th>CÓDIGO</th>}{kind === "profesores" && <th>ESPECIALIDAD</th>}<th>ESTADO</th>{isAdmin && <th>ACCIONES</th>}</tr></thead>
                <tbody>
                  {visibleUsers.map((user) => (
                    <tr key={user.id}>
                      <td><div className="person-cell"><Avatar initials={iniciales(user)} color="rose" /><div><strong>{nombreCompleto(user)}</strong><span>{user.email}</span></div></div></td>
                      <td className="muted-cell">{user.ci ?? "—"}</td>
                      {kind === "estudiantes" && <td>{user.perfilEstudiante?.codigoMatricula ?? "—"}</td>}
                      {kind === "profesores" && <td>{user.especialidad ?? "—"}</td>}
                      <td><StatusBadge status={user.estado} /></td>
                      {isAdmin && <td><button className="icon-button user-delete-button" aria-label={`Eliminar ${nombreCompleto(user)}`} onClick={() => void eliminarUsuario(user)}><Trash2 size={15} /></button></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
              {visibleUsers.length === 0 && <EmptyState message="No se encontraron usuarios con esos criterios." />}
            </div>
            <div className="table-footer"><span>Mostrando <strong>{visibleUsers.length}</strong> de <strong>{users.length}</strong> usuarios</span></div>
          </>
        )}
      </section>
    </>
  );
}
