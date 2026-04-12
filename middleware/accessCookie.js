function parseCookies(header) {
  const out = Object.create(null);
  if (!header || typeof header !== 'string') {
    return out;
  }
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) {
      continue;
    }
    const k = part.slice(0, i).trim();
    if (!k) {
      continue;
    }
    const v = part.slice(i + 1).trim();
    try {
      out[k] = decodeURIComponent(v);
    } catch {
      out[k] = v;
    }
  }
  return out;
}

module.exports = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    next();
    return;
  }

  if (req.path === '/docs') {
    next();
    return;
  }

  const nameRaw =
    (process.env.STUDENT_ACCESS_COOKIE_NAME || 'authorization').trim() || 'authorization';
  const nameLower = nameRaw.toLowerCase();
  const expected = (process.env.STUDENT_ACCESS_COOKIE_VALUE || 'amigo').trim() || 'amigo';
  const cookies = parseCookies(req.headers.cookie);

  for (const key of Object.keys(cookies)) {
    if (key.toLowerCase() === nameLower && cookies[key] === expected) {
      next();
      return;
    }
  }

  const auth = req.headers.authorization;

  if (auth && auth.trim() === expected) {
    next();
    return;
  }

  res.status(403).json({
    message:
      'Доступ запрещён: Cookie ' +
      nameLower +
      '=' +
      expected +
      ' или заголовок Authorization: ' +
      expected,
  });
};
