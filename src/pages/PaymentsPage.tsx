import { CreditCard, LoaderCircle, RotateCcw, Search, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeading } from "../components/ui/PageHeading";
import { pagosService } from "../services/pagos";
import type { ConceptoPago, EstadoPago, MetodoPago, Pago } from "../services/pagos";
import { usuariosService } from "../services/usuarios";
import type { UsuarioDirectorio } from "../services/usuarios";
import { mensajeError } from "../lib/errores";
import { StatusBadge } from "../components/ui/StatusBadge";

const conceptos: { value: ConceptoPago; label: string }[] = [
  { value: "MATRICULA", label: "Matrícula" },
  { value: "INSCRIPCION", label: "Inscripción" },
  { value: "MENSUALIDAD", label: "Mensualidad" },
];

const metodos: { value: MetodoPago; label: string }[] = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "PASARELA_ONLINE", label: "Pasarela online" },
];

export function PaymentsPage() {
  const [students, setStudents] = useState<UsuarioDirectorio[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [studentId, setStudentId] = useState("");
  const [concept, setConcept] = useState<ConceptoPago>("INSCRIPCION");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<MetodoPago>("EFECTIVO");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [payments, setPayments] = useState<Pago[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"TODOS" | EstadoPago>("TODOS");
  const [paymentRetry, setPaymentRetry] = useState(0);
  const [paymentQuery, setPaymentQuery] = useState("");

  useEffect(() => {
    let active = true;
    usuariosService
      .getEstudiantes()
      .then((data) => {
        if (active) setStudents(data);
      })
      .catch((error: unknown) => {
        console.error("Error al cargar estudiantes para pagos:", error);
        if (active) setStudentsError(mensajeError(error, "No se pudo cargar la lista de estudiantes."));
      })
      .finally(() => {
        if (active) setLoadingStudents(false);
      });

    return () => {
      active = false;
    };
  }, [retry]);

  useEffect(() => {
    let active = true;
    pagosService
      .getTodos(paymentStatus === "TODOS" ? {} : { estado: paymentStatus })
      .then((items) => {
        if (active) setPayments(items);
      })
      .catch((loadError: unknown) => {
        if (active) setPaymentsError(mensajeError(loadError, "No se pudieron cargar los pagos."));
      })
      .finally(() => {
        if (active) setPaymentsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [paymentStatus, paymentRetry]);

  const visiblePayments = payments.filter((payment) => {
    const student = payment.estudianteUsuario;
    const search = paymentQuery.trim().toLowerCase();
    return `${student?.nombre ?? ""} ${student?.apellido ?? ""} ${student?.email ?? ""} ${payment.concepto}`
      .toLowerCase()
      .includes(search);
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccess(null);

    const parsedAmount = Number(amount);
    if (!studentId || !Number.isSafeInteger(Number(studentId)) || Number(studentId) <= 0) {
      setFormError("Selecciona un estudiante válido.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError("Ingresa un monto mayor a cero.");
      return;
    }

    setSubmitting(true);
    try {
      const payment = await pagosService.crear({
        estudianteUsuarioId: Number(studentId),
        concepto: concept,
        monto: parsedAmount,
        metodo: method,
      });
      setSuccess(
        payment.estado
          ? `Pago registrado con estado ${payment.estado}. La matrícula queda habilitada cuando el backend active la cuenta del estudiante.`
          : "Pago registrado. El backend asignará el estado y activará la cuenta cuando corresponda.",
      );
      setAmount("");
      setPaymentRetry((value) => value + 1);
    } catch (error) {
      console.error("Error al registrar el pago:", error);
      setFormError(mensajeError(error, "No se pudo registrar el pago."));
    } finally {
      setSubmitting(false);
    }
  };

  const retryStudents = () => {
    setLoadingStudents(true);
    setStudentsError(null);
    setRetry((value) => value + 1);
  };

  const retryPayments = () => {
    setPaymentsLoading(true);
    setPaymentsError(null);
    setPaymentRetry((value) => value + 1);
  };

  return (
    <>
      <PageHeading
        eyebrow="GESTIÓN DE PAGOS"
        title="Registrar un pago"
        description="Registra pagos de estudiantes. El estado del pago lo determina el backend."
      />
      <div className="payment-layout">
        <section className="panel payment-form-panel">
          <div className="payment-panel-heading">
            <span className="payment-icon"><CreditCard size={19} /></span>
            <div>
              <h2>Datos del pago</h2>
              <p>Completa la información y confirma el registro.</p>
            </div>
          </div>

          {studentsError ? (
            <div className="payment-load-error" role="alert">
              <p>{studentsError}</p>
              <button className="button button-outline" onClick={retryStudents}>
                <RotateCcw size={15} /> Reintentar
              </button>
            </div>
          ) : (
            <form className="payment-form" onSubmit={handleSubmit}>
              <label htmlFor="payment-student">Estudiante</label>
              {loadingStudents ? (
                <div className="payment-loading" role="status">
                  <LoaderCircle size={16} className="public-spinner" /> Cargando estudiantes...
                </div>
              ) : (
                <select
                  id="payment-student"
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                  required
                >
                  <option value="">Selecciona un estudiante</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.nombre} {student.apellido} · {student.estado} · {student.email}
                    </option>
                  ))}
                </select>
              )}
              {!loadingStudents && students.length === 0 && (
                <p className="payment-field-help">No hay estudiantes disponibles para registrar pagos.</p>
              )}

              <label htmlFor="payment-concept">Concepto</label>
              <select
                id="payment-concept"
                value={concept}
                onChange={(event) => setConcept(event.target.value as ConceptoPago)}
              >
                {conceptos.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              <label htmlFor="payment-amount">Monto</label>
              <input
                id="payment-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Ej.: 150"
                required
              />
              <span className="payment-field-help">El monto se ingresa manualmente.</span>

              <label htmlFor="payment-method">Método de pago</label>
              <select
                id="payment-method"
                value={method}
                onChange={(event) => setMethod(event.target.value as MetodoPago)}
              >
                {metodos.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              {formError && <p className="payment-message is-error" role="alert">{formError}</p>}
              {success && <p className="payment-message is-success" role="status">{success}</p>}

              <button
                className="button button-primary payment-submit"
                type="submit"
                disabled={submitting || loadingStudents || students.length === 0}
              >
                {submitting ? "Registrando..." : "Registrar pago"}
              </button>
            </form>
          )}
        </section>

        <aside className="payment-side-card">
          <span className="payment-side-icon"><UserRound size={19} /></span>
          <h2>Opciones disponibles</h2>
          <p>Elige uno de los conceptos y un método de pago permitidos por el sistema.</p>
          <ul>
            <li>Matrícula</li>
            <li>Inscripción</li>
            <li>Mensualidad</li>
          </ul>
          <div className="payment-status-note">
            <strong>Estado del pago</strong>
            <span>PENDIENTE, APROBADO o RECHAZADO se administra en el backend; no se selecciona al crear el pago.</span>
          </div>
        </aside>
      </div>

      <section className="panel payment-history-panel">
        <div className="payment-history-heading">
          <div>
            <h2>Pagos de estudiantes</h2>
            <p>Consulta los pagos pendientes, aprobados y rechazados.</p>
          </div>
          <div className="payment-history-controls">
            <label className="table-search"><Search size={15} /><input value={paymentQuery} onChange={(event) => setPaymentQuery(event.target.value)} placeholder="Buscar estudiante..." /></label>
            <select aria-label="Filtrar pagos por estado" value={paymentStatus} onChange={(event) => {
              setPaymentsLoading(true);
              setPaymentsError(null);
              setPaymentStatus(event.target.value as "TODOS" | EstadoPago);
            }}>
              <option value="TODOS">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="APROBADO">Aprobado</option>
              <option value="RECHAZADO">Rechazado</option>
            </select>
          </div>
        </div>
        {paymentsLoading ? (
          <div className="user-directory-feedback" role="status">Cargando pagos...</div>
        ) : paymentsError ? (
          <div className="user-directory-feedback is-error" role="alert">
            <p>{paymentsError}</p><button className="button button-outline" onClick={retryPayments}><RotateCcw size={14} /> Reintentar</button>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>ESTUDIANTE</th><th>CONCEPTO</th><th>MONTO</th><th>MÉTODO</th><th>ESTADO</th><th>VERIFICACIÓN</th></tr></thead>
              <tbody>
                {visiblePayments.map((payment) => (
                  <tr key={payment.id}>
                    <td><div className="person-cell"><UserRound size={17} /><div><strong>{payment.estudianteUsuario ? `${payment.estudianteUsuario.nombre} ${payment.estudianteUsuario.apellido}` : `Estudiante #${payment.estudianteUsuarioId}`}</strong><span>{payment.estudianteUsuario?.email ?? "—"}</span></div></div></td>
                    <td>{payment.concepto}</td>
                    <td>{new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(Number(payment.monto))}</td>
                    <td>{payment.metodo.replaceAll("_", " ")}</td>
                    <td><StatusBadge status={payment.estado} /></td>
                    <td>{payment.fechaVerificacion ? new Date(payment.fechaVerificacion).toLocaleDateString("es") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visiblePayments.length === 0 && <div className="empty-state">No hay pagos que coincidan con el filtro.</div>}
          </div>
        )}
      </section>
    </>
  );
}
