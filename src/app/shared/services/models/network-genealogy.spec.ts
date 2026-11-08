import { mapGenealogy } from './network-genealogy';
describe('Genealogy contract', () => {
 const detail = (fields: any) => ({ user: { uuid: 'account', name: 'Server' }, sponsor: { uuid: 'parent', name: 'Actual sponsor' }, level: 4, direct_children_total: 2, ...fields });
 for (const fields of [{ descendants_count: 8 }, { descendant_count: 8 }, { descendants_count: 8, descendant_count: 8 }, { descendants_count: '8' }]) {
  it('normalizes ' + JSON.stringify(fields), () => expect(mapGenealogy(detail(fields), 'account').descendantsCount).toBe(8));
 }
 it('rejects conflicting aliases', () => expect(() => mapGenealogy(detail({ descendants_count: 8, descendant_count: 9 }), 'account')).toThrowError(/Inconsistencia/));
 it('keeps zero', () => expect(mapGenealogy(detail({ descendants_count: 0 }), 'account').descendantsCount).toBe(0));
 it('maps nested data and sponsor', () => { const u = mapGenealogy({ data: detail({ descendant_count: 3 }) }, 'account'); expect(u.sponsor.uuid).toBe('parent'); expect(u.directos).toBe(2); expect(u.level).toBe(4); });
 for (const value of [null, undefined, '', ' ', false, -1, 1.5, 'NaN', Infinity]) {
  it('rejects invalid count ' + String(value), () => expect(mapGenealogy(detail({ descendants_count: value }), 'account').descendantsCount).toBeNull());
 }
 it('rejects wrong identity', () => expect(() => mapGenealogy(detail({}), 'other')).toThrowError(/UUID/));
});
