/**
 * Regla visual única para la vigencia mensual del usuario.
 * La propiedad histórica del pack no determina si el usuario está activo.
 */
export function isUserMembershipActive(
  user: any,
  point?: any,
  paymentOrder?: any,
  now: Date = new Date()
): boolean {
  const resolvedUser = user?.user || user?.user_point || user;

  if (
    resolvedUser?.active === true ||
    resolvedUser?.active_product === true ||
    resolvedUser?.active_service === true
  ) return true;

  const categories = resolvedUser?.packs_by_category;
  if (
    categories?.product?.active === true ||
    categories?.service?.active === true
  ) {
    return true;
  }

  const payment =
    resolvedUser?.payment ??
    resolvedUser?.payment_active ??
    point?.payment ??
    point?.payment_active ??
    paymentOrder;

  if (Number(payment?.state) === 2 && payment?.expires_at) {
    const expirationTime = new Date(payment.expires_at).getTime();
    return !Number.isNaN(expirationTime) && expirationTime >= now.getTime();
  }

  return false;
}
