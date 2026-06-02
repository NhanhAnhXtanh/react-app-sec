export function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function toArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

export function parseListQuery(query) {
  const pageIndex = Math.max(0, Number(query.pageIndex ?? 0) || 0);
  const pageSize = Math.max(1, Number(query.pageSize ?? 10) || 10);
  const keyword = query.keyword ? String(query.keyword) : undefined;

  const sortRaw = toArray(query.sort);
  const sorting = sortRaw
    .map((s) => {
      const [id, dir = 'asc'] = String(s).split(':');
      if (!id) return null;
      return { id, desc: dir === 'desc' };
    })
    .filter(Boolean);

  const filterRaw = toArray(query.filter);
  const filters = filterRaw
    .map((f) => {
      const str = String(f);
      const idx = str.indexOf(':');
      if (idx < 0) return null;
      return { id: str.slice(0, idx), value: str.slice(idx + 1) };
    })
    .filter(Boolean);

  return { pageIndex, pageSize, keyword, sorting, filters };
}

export function applyQuery(source, params, searchableKeys) {
  let rows = [...source];

  if (params.filters?.length) {
    for (const f of params.filters) {
      if (f.value === '' || f.value == null) continue;
      rows = rows.filter((r) => String(r[f.id] ?? '') === String(f.value));
    }
  }

  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    rows = rows.filter((r) =>
      searchableKeys.some((k) =>
        String(r[k] ?? '').toLowerCase().includes(kw),
      ),
    );
  }

  if (params.sorting?.length) {
    const ordered = [...params.sorting].reverse();
    for (const s of ordered) {
      rows.sort((a, b) => {
        const av = a[s.id];
        const bv = b[s.id];
        if (av == null && bv == null) return 0;
        if (av == null) return s.desc ? 1 : -1;
        if (bv == null) return s.desc ? -1 : 1;
        if (av < bv) return s.desc ? 1 : -1;
        if (av > bv) return s.desc ? -1 : 1;
        return 0;
      });
    }
  }

  const total = rows.length;
  const start = params.pageIndex * params.pageSize;
  const items = rows.slice(start, start + params.pageSize);
  return { items, total };
}
