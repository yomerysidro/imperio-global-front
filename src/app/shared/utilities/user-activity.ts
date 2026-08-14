/**
 * Regla visual única para el estado de una membresía.
 *
 * Cuando el backend entrega una fecha de vencimiento, esa fecha tiene prioridad.
 * En respuestas antiguas que solo incluyen la fecha del pago, la membresía se
 * considera vigente durante el mes del pago y hasta el día 2 del mes siguiente.
 */
export function isUserMembershipActive(
  user: any,
  point?: any,
  paymentOrder?: any,
  now: Date = new Date()
): boolean {
  if (!user && !point && !paymentOrder) return false;

  const name = user?.name || user?.user?.name || user?.user_point?.name;
  if (
    !!user?.is_admin ||
    !!user?.admin ||
    name?.trim().toLowerCase() === 'corporativo'
  ) {
    return true;
  }

  const payments = [
    user?.payment_active,
    user?.payment,
    point?.payment_active,
    point?.payment,
    paymentOrder
  ].filter(Boolean);

  // No se debe tomar el primer pago sin más: `payment` puede ser antiguo o
  // rechazado mientras `payment_active` contiene la membresía vigente.
  const paidPayments = payments.filter(payment => Number(payment?.state) === 2);

  for (const payment of paidPayments) {
    const expirationValue =
      payment?.expires_at ??
      payment?.expired_at ??
      payment?.expiration_date ??
      payment?.end_date ??
      payment?.fecha_vencimiento ??
      payment?.valid_until;

    if (expirationValue) {
      const expiration = new Date(expirationValue);
      if (!Number.isNaN(expiration.getTime()) && now.getTime() <= expiration.getTime()) {
        return true;
      }
      // Una fecha explícita vencida nunca debe quedar activa por un flag genérico.
      continue;
    }

    const paymentDateValue = payment?.created_at ?? payment?.updated_at ?? payment?.paid_at;
    if (!paymentDateValue) continue;

    const paymentDate = new Date(paymentDateValue);
    if (Number.isNaN(paymentDate.getTime()) || paymentDate.getTime() > now.getTime()) continue;

    const isCurrentMonth =
      paymentDate.getMonth() === now.getMonth() &&
      paymentDate.getFullYear() === now.getFullYear();

    const previousMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const previousYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const isGracePeriod =
      paymentDate.getMonth() === previousMonth &&
      paymentDate.getFullYear() === previousYear &&
      now.getDate() <= 2;

    if (isCurrentMonth || isGracePeriod) return true;
  }

  // Compatibilidad con respuestas resumidas que no incluyen las fechas del pago.
  const hasDatedPaidPayment = paidPayments.some(payment =>
    payment?.created_at || payment?.updated_at || payment?.paid_at ||
    payment?.expires_at || payment?.expired_at || payment?.expiration_date ||
    payment?.end_date || payment?.fecha_vencimiento || payment?.valid_until
  );

  if (!hasDatedPaidPayment) {
    return !!user?.active || user?.estado_visual?.toUpperCase() === 'ACTIVO';
  }

  return false;
}
