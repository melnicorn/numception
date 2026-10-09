// The Pages base path is read here and nowhere else (it is also what Playwright serves under).

/** Normalises `BASE_PATH` (e.g. `numception` or `/numception/`) to `/numception/`; defaults to `/`. */
export function basePath(raw: string | undefined = process.env.BASE_PATH): string {
  const trimmed = (raw ?? '').trim().replace(/^\/+|\/+$/g, '');
  return trimmed === '' ? '/' : `/${trimmed}/`;
}
