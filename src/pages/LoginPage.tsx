import {
  BookOpen,
  GraduationCap,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { authService } from "../services/auth";
import type { RegistroDatos } from "../services/auth";
import { mensajeError } from "../lib/errores";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const accesstoken = useAuthStore((s) => s.token);
  const estadoUsuario = useAuthStore((s) => s.usuario?.estado);
  const iniciarSesion = useAuthStore((s) => s.iniciarSesion);
  const cerrarSesion = useAuthStore((s) => s.cerrarSesion);
  const returnPath =
    typeof location.state === "object" &&
    location.state !== null &&
    "from" in location.state &&
    typeof location.state.from === "string" &&
    location.state.from.startsWith("/") &&
    !location.state.from.startsWith("//")
      ? location.state.from
      : "/inicio";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modo, setModo] = useState<"login" | "registro">("login");
  const accountPending =
    typeof location.state === "object" &&
    location.state !== null &&
    "accountPending" in location.state &&
    location.state.accountPending === true;
  const [error, setError] = useState<string | null>(
    accountPending
      ? "Tu cuenta está pendiente de activación. Completa el pago en recepción y espera a que el estado cambie a ACTIVO."
      : null,
  );
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [datosRegistro, setDatosRegistro] = useState<RegistroDatos>({
    nombre: "",
    apellido: "",
    ci: "",
    email: "",
    password: "",
    fechaNacimiento: "",
    telefono: "",
  });
  // en caso de que ya haya una sesion, redireccionamos a INICIO
  useEffect(() => {
    if (accesstoken && estadoUsuario !== "ACTIVO") cerrarSesion();
  }, [accesstoken, estadoUsuario, cerrarSesion]);

  if (accesstoken && estadoUsuario === "ACTIVO") {
    return <Navigate to={returnPath} replace />;
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault(); // Evita que la página se recargue sola
    setError(null);
    setEnviando(true);

    try {
      const sesion = await authService.login({ email, password });

      if (sesion.usuario.estado !== "ACTIVO") {
        setError(
          "Tu cuenta aún está pendiente de activación. Realiza el pago correspondiente en recepción; cuando tu estado sea ACTIVO podrás iniciar sesión.",
        );
        return;
      }
      if (!sesion.accessToken) {
        setError("El servidor no autorizó el acceso a esta cuenta.");
        return;
      }

      iniciarSesion(sesion.accessToken, sesion.usuario);
      navigate(returnPath, { replace: true });
    } catch (err) {
      setError(mensajeError(err, "Datos incorrectos"));
    } finally {
      setEnviando(false);
    }
  };

  const handleRegister = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setRegistroExitoso(false);
    setEnviando(true);

    try {
      await authService.register(datosRegistro);
      setRegistroExitoso(true);
      setDatosRegistro({
        nombre: "",
        apellido: "",
        ci: "",
        email: "",
        password: "",
        fechaNacimiento: "",
        telefono: "",
      });
    } catch (registerError) {
      setError(mensajeError(registerError, "No se pudo completar el registro."));
    } finally {
      setEnviando(false);
    }
  };

  const cambiarModo = (nuevoModo: "login" | "registro") => {
    setModo(nuevoModo);
    setError(null);
    setRegistroExitoso(false);
  };
  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand">
          <span className="brand-mark">
            <GraduationCap size={22} />
          </span>
          <span className="brand-name">
            The Anglo American Institute<span>+</span>
            <small>GESTIÓN ACADÉMICA</small>
          </span>
        </div>
        <div className="login-message">
          <span className="login-overline">TU CAMPUS, EN UN SOLO LUGAR</span>
          <h1>
            La educación
            <br />
            que transforma
            <br />
            <em>comienza aquí.</em>
          </h1>
          <p>
            Una plataforma para conectar personas, impulsar ideas y construir el
            futuro.
          </p>
          <div className="login-illustration">
            <div className="illustration-orbit orbit-one" />
            <div className="illustration-orbit orbit-two" />
            <span className="illustration-cap">
              <GraduationCap size={78} strokeWidth={1.2} />
            </span>
            <span className="float-card float-card-one">
              <BookOpen size={17} /> Aprende a tu ritmo
            </span>
            <span className="float-card float-card-two">
              <span className="float-dot" /> Todo en orden
            </span>
          </div>
        </div>
        <div className="login-brand-footer">
          <span>© 2025 Aula+ · Educación para el futuro</span>
          <span>Privacidad&nbsp;&nbsp; · &nbsp;&nbsp;Ayuda</span>
        </div>
      </section>
      <section className="login-form-panel">
        <div className="login-form-wrap">
          <Link className="login-back-home" to="/">
            ← Volver al sitio
          </Link>
          <div className="login-mobile-brand">
            <span className="brand-mark">
              <GraduationCap size={22} />
            </span>
            <span className="brand-name">
              aula<span>+</span>
            </span>
          </div>
          <span className="eyebrow">
            {modo === "login" ? "ACCESO A TU CUENTA" : "REGISTRO DE ESTUDIANTE"}
          </span>
          <h2>{modo === "login" ? "Bienvenida de nuevo" : "Crea tu cuenta"}</h2>
          <p className="login-subtitle">
            {modo === "login"
              ? "Ingresa tus credenciales para acceder a tu espacio."
              : "El registro público es únicamente para estudiantes. La cuenta se activa después de completar el pago en recepción."}
          </p>
          {modo === "login" && (
            <p className="login-activation-note">
              Las cuentas nuevas permanecen PENDIENTES hasta que recepción registre el pago
              y el instituto confirme su activación.
            </p>
          )}
          {modo === "login" ? (
            <form onSubmit={handleSubmit} className="login-form">
              <label htmlFor="email">Correo electrónico</label>
              <div className="input-with-icon">
                <Mail size={17} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu@correo.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="password-label">
                <label htmlFor="password">Contraseña</label>
                <button type="button" className="forgot-button">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="input-with-icon">
                <LockKeyhole size={17} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  required
                />
              </div>
              <label className="remember-check">
                <input type="checkbox" />{" "}
                <span>Recordarme en este dispositivo</span>
              </label>
              {error && (
                <div className="login-error" role="alert">
                  {error}
                </div>
              )}
              <button
                className="button button-primary login-submit"
                type="submit"
                disabled={enviando}
              >
                {enviando ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="login-form registration-form">
              <label htmlFor="register-name">Nombre</label>
              <div className="input-with-icon">
                <UserRound size={17} />
                <input
                  id="register-name"
                  autoComplete="given-name"
                  value={datosRegistro.nombre}
                  onChange={(event) => setDatosRegistro({ ...datosRegistro, nombre: event.target.value })}
                  placeholder="Tu nombre"
                  required
                />
              </div>
              <label htmlFor="register-lastname">Apellido</label>
              <div className="input-with-icon">
                <UserRound size={17} />
                <input
                  id="register-lastname"
                  autoComplete="family-name"
                  value={datosRegistro.apellido}
                  onChange={(event) => setDatosRegistro({ ...datosRegistro, apellido: event.target.value })}
                  placeholder="Tu apellido"
                  required
                />
              </div>
              <label htmlFor="register-ci">Cédula de identidad</label>
              <div className="input-with-icon">
                <input
                  id="register-ci"
                  value={datosRegistro.ci}
                  onChange={(event) => setDatosRegistro({ ...datosRegistro, ci: event.target.value })}
                  placeholder="Número de documento"
                  autoComplete="off"
                  required
                />
              </div>
              <label htmlFor="register-birthdate">Fecha de nacimiento</label>
              <div className="input-with-icon">
                <input
                  id="register-birthdate"
                  type="date"
                  value={datosRegistro.fechaNacimiento}
                  onChange={(event) => setDatosRegistro({ ...datosRegistro, fechaNacimiento: event.target.value })}
                  required
                />
              </div>
              <label htmlFor="register-phone">Teléfono <span>(opcional)</span></label>
              <div className="input-with-icon">
                <input
                  id="register-phone"
                  type="tel"
                  value={datosRegistro.telefono}
                  onChange={(event) => setDatosRegistro({ ...datosRegistro, telefono: event.target.value })}
                  placeholder="Número de teléfono"
                  autoComplete="tel"
                />
              </div>
              <label htmlFor="register-email">Correo electrónico</label>
              <div className="input-with-icon">
                <Mail size={17} />
                <input
                  id="register-email"
                  type="email"
                  value={datosRegistro.email}
                  onChange={(event) => setDatosRegistro({ ...datosRegistro, email: event.target.value })}
                  placeholder="tu@correo.com"
                  autoComplete="email"
                  required
                />
              </div>
              <label htmlFor="register-password">Contraseña</label>
              <div className="input-with-icon">
                <LockKeyhole size={17} />
                <input
                  id="register-password"
                  type="password"
                  value={datosRegistro.password}
                  onChange={(event) => setDatosRegistro({ ...datosRegistro, password: event.target.value })}
                  placeholder="Crea una contraseña"
                  autoComplete="new-password"
                  required
                />
              </div>
              {error && <div className="login-error" role="alert">{error}</div>}
              {registroExitoso && (
                <div className="login-registration-success" role="status">
                  Tu registro de estudiante fue recibido. Tu cuenta queda PENDIENTE
                  y no podrás iniciar sesión hasta completar el pago en recepción
                  y que el instituto la active.
                </div>
              )}
              <button
                className="button button-primary login-submit"
                type="submit"
                disabled={enviando}
              >
                {enviando ? "Registrando..." : "Registrarme como estudiante"}
              </button>
            </form>
          )}
          <button
            type="button"
            className="login-mode-toggle"
            onClick={() => cambiarModo(modo === "login" ? "registro" : "login")}
          >
            {modo === "login"
              ? "¿Eres nuevo estudiante? Crear cuenta"
              : "¿Ya tienes cuenta? Iniciar sesión"}
          </button>
          <div className="login-help">
            ¿Necesitas ayuda?{" "}
            <a href="mailto:soporte@academia.edu">Contacta con soporte</a>
          </div>
        </div>
        <span className="login-footer-mobile">
          © 2025 Aula+ · Todos los derechos reservados
        </span>
      </section>
    </main>
  );
}
