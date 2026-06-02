import express from 'express';
import cors from 'cors';
import { companies, departments } from './data.mjs';
import { applyQuery, parseListQuery, randomId } from './query.mjs';

const PORT = Number(process.env.PORT ?? 4000);

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  const stamp = new Date().toISOString().slice(11, 19);
  console.log(`[${stamp}] ${req.method} ${req.url}`);
  next();
});

function mountResource(prefix, store, searchableKeys) {
  app.get(prefix, (req, res) => {
    const params = parseListQuery(req.query);
    res.json(applyQuery(store, params, searchableKeys));
  });

  app.get(`${prefix}/:id`, (req, res) => {
    const item = store.find((x) => x.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  });

  app.post(prefix, (req, res) => {
    const id = req.body?.id || randomId();
    const item = { ...(req.body ?? {}), id };
    store.unshift(item);
    res.status(201).json(item);
  });

  app.put(`${prefix}/:id`, (req, res) => {
    const idx = store.findIndex((x) => x.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Not found' });
    store[idx] = { ...store[idx], ...(req.body ?? {}), id: req.params.id };
    res.json(store[idx]);
  });

  app.patch(`${prefix}/:id`, (req, res) => {
    const idx = store.findIndex((x) => x.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Not found' });
    store[idx] = { ...store[idx], ...(req.body ?? {}), id: req.params.id };
    res.json(store[idx]);
  });

  app.delete(`${prefix}/:id`, (req, res) => {
    const idx = store.findIndex((x) => x.id === req.params.id);
    if (idx >= 0) store.splice(idx, 1);
    res.status(204).end();
  });
}

mountResource('/api/companies', companies, ['code', 'name', 'taxCode']);
mountResource('/api/departments', departments, [
  'code',
  'name',
  'companyName',
  'managerName',
]);

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, companies: companies.length, departments: departments.length }),
);

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

app.listen(PORT, () => {
  console.log(`Mock API server listening on http://localhost:${PORT}`);
  console.log(`Try:  curl "http://localhost:${PORT}/api/companies?pageSize=3"`);
});
