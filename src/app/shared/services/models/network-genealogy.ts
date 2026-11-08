import { UserModel } from './user.interface';
function count(v: unknown): number | null {
 if ((typeof v !== 'number' && typeof v !== 'string') || String(v).trim() === '') return null;
 const n = Number(v); return Number.isSafeInteger(n) && n >= 0 ? n : null;
}
export function mapGenealogy(response: any, uuid: string): UserModel {
 if (response?.success === false) throw new Error(response.message || 'Lectura rechazada');
 const d = response?.data ?? response, u = d?.user ?? d;
 if (!u?.uuid || u.uuid !== uuid) throw new Error('El UUID del detalle no corresponde al socio seleccionado.');
 const a = count(d.descendants_count), b = count(d.descendant_count);
 if (a !== null && b !== null && a !== b) throw new Error('Inconsistencia de contrato: descendants_count y descendant_count son diferentes.');
 return { ...u, sponsor: d.sponsor ?? null, current_sponsor_code: d.sponsor?.uuid ?? null,
 level: d.level ?? null, directos: count(d.direct_children_total), descendantsCount: a ?? b,
 routeAscending: d.route_ascending ?? [], genealogyVerified: true };
}
