export type MemoryPageState<Cursor> = {
  cursor?: Cursor;
  hasMore: boolean;
  paged: boolean;
};

export function resetMemoryPage<Cursor>(): MemoryPageState<Cursor> {
  return { cursor: undefined, hasMore: false, paged: false };
}

export function applyMemoryHead<Cursor>(
  current: MemoryPageState<Cursor>,
  cursor: Cursor | undefined,
  hasMore: boolean
): MemoryPageState<Cursor> {
  return current.paged ? current : { cursor, hasMore, paged: false };
}

export function beginMemoryPage<Cursor>(
  current: MemoryPageState<Cursor>
): MemoryPageState<Cursor> {
  return { ...current, paged: true };
}

export function applyMemoryTail<Cursor>(
  current: MemoryPageState<Cursor>,
  cursor: Cursor | undefined,
  hasMore: boolean
): MemoryPageState<Cursor> {
  return { cursor, hasMore, paged: true };
}

export function mergeMemoryRows<Row extends { id: string }>(
  current: Row[],
  incoming: Row[]
): Row[] {
  const incomingIds = new Set(incoming.map((row) => row.id));
  return [...incoming, ...current.filter((row) => !incomingIds.has(row.id))];
}

export function appendMemoryRows<Row extends { id: string }>(
  current: Row[],
  incoming: Row[]
): Row[] {
  const known = new Set(current.map((row) => row.id));
  return [...current, ...incoming.filter((row) => !known.has(row.id))];
}
