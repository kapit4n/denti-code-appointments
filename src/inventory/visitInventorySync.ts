/**
 * Syncs material usage on performed actions with clinic-provider inventory (per consultory).
 * Uses CLINIC_PROVIDER_BASE_URL (direct to the Nest app, not through the gateway).
 */

function inventorySyncEnabled(): boolean {
  return process.env.INVENTORY_SYNC_ENABLED !== 'false' && Boolean(process.env.CLINIC_PROVIDER_BASE_URL?.trim());
}

function consultoryId(): number {
  const raw = process.env.INVENTORY_CONSULTORY_ID ?? '1';
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function baseUrl(): string {
  return (process.env.CLINIC_PROVIDER_BASE_URL ?? '').replace(/\/$/, '');
}

export function parseFacilityCodesFromPerformedAction(
  facilitiesUsedJson: string | null | undefined,
): string[] {
  if (!facilitiesUsedJson) return [];
  try {
    const v = JSON.parse(facilitiesUsedJson) as unknown;
    if (!Array.isArray(v)) return [];
    const strings = v.filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean);
    return [...new Set(strings)];
  } catch {
    return [];
  }
}

/**
 * Net stock change per catalog code: positive = return to consultory, negative = consume.
 * old/new quantities apply to every listed material code on that line.
 */
export function computeVisitInventoryDeltas(
  oldCodes: string[],
  oldQty: number,
  newCodes: string[],
  newQty: number,
): { facilityCode: string; delta: number }[] {
  const oq = Math.max(0, Math.floor(oldQty));
  const nq = Math.max(0, Math.floor(newQty));
  const m = new Map<string, number>();
  for (const c of oldCodes) {
    m.set(c, (m.get(c) ?? 0) + oq);
  }
  for (const c of newCodes) {
    m.set(c, (m.get(c) ?? 0) - nq);
  }
  return [...m.entries()]
    .filter(([, d]) => d !== 0)
    .map(([facilityCode, delta]) => ({ facilityCode, delta }));
}

export async function postApplyCodeDeltas(
  deltas: { facilityCode: string; delta: number }[],
  note?: string,
): Promise<void> {
  if (!inventorySyncEnabled() || deltas.length === 0) return;

  const url = `${baseUrl()}/api/v1/inventory/apply-code-deltas`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      consultoryId: consultoryId(),
      deltas,
      note: note?.slice(0, 500),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(
      `Inventory sync failed (${res.status}): ${text || res.statusText}`,
    ) as Error & { statusCode?: number };
    err.statusCode = res.status === 400 || res.status === 404 ? res.status : 409;
    throw err;
  }
}
