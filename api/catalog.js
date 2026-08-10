const API = 'https://api.github.com';

function cfg(name, fallback='') {
  return process.env[name] || fallback;
}

function authHeader() {
  const token = cfg('GITHUB_TOKEN');
  if (!token) throw new Error('GITHUB_TOKEN não está configurado na Vercel.');
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  };
}

function repoInfo() {
  const owner = cfg('GITHUB_REPO_OWNER', 'retroplaybr');
  const repo = cfg('GITHUB_REPO_NAME', 'retroplaybr.com');
  const branch = cfg('GITHUB_BRANCH', 'main');
  return { owner, repo, branch };
}

function checkAdmin(req) {
  const expected = cfg('ADMIN_PASSWORD');
  if (!expected) {
    const e = new Error('ADMIN_PASSWORD não está configurada na Vercel.');
    e.statusCode = 500;
    throw e;
  }
  const supplied = String(req.headers['x-admin-password'] || '');
  if (!supplied || supplied !== expected) {
    const e = new Error('Senha incorreta.');
    e.statusCode = 401;
    throw e;
  }
}

async function getCatalogFile() {
  const { owner, repo, branch } = repoInfo();
  const url = `${API}/repos/${owner}/${repo}/contents/catalog.json?ref=${encodeURIComponent(branch)}`;
  const r = await fetch(url, { headers: authHeader(), cache: 'no-store' });

  if (r.status === 404) {
    return { games: [], sha: null };
  }
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`GitHub catálogo HTTP ${r.status}: ${t.slice(0,300)}`);
  }
  const data = await r.json();
  const decoded = Buffer.from(String(data.content || '').replace(/\n/g,''), 'base64').toString('utf8');
  let parsed = { games: [] };
  try { parsed = JSON.parse(decoded); } catch {}
  if (!Array.isArray(parsed.games)) parsed.games = [];
  return { games: parsed.games, sha: data.sha || null };
}

async function saveCatalog(games, sha) {
  const { owner, repo, branch } = repoInfo();
  const url = `${API}/repos/${owner}/${repo}/contents/catalog.json`;

  const payload = {
    message: 'Atualiza catálogo RetroHub',
    content: Buffer.from(JSON.stringify({ games }, null, 2), 'utf8').toString('base64'),
    branch
  };
  if (sha) payload.sha = sha;

  const r = await fetch(url, {
    method: 'PUT',
    headers: authHeader(),
    body: JSON.stringify(payload)
  });

  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Não foi possível salvar no GitHub. HTTP ${r.status}: ${t.slice(0,300)}`);
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'GET') {
      const { games } = await getCatalogFile();
      return res.status(200).json({ ok: true, storage: 'github', games });
    }

    checkAdmin(req);
    const current = await getCatalogFile();

    if (req.method === 'POST') {
      const g = req.body || {};
      if (!g.name || !g.system || !g.rom) {
        return res.status(400).json({ error: 'Nome, console e link da ROM são obrigatórios.' });
      }

      let parsed;
      try { parsed = new URL(String(g.rom)); }
      catch { return res.status(400).json({ error: 'O link da ROM não é uma URL válida.' }); }

      if (!/^https?:$/.test(parsed.protocol)) {
        return res.status(400).json({ error: 'O link precisa começar com http:// ou https://.' });
      }

      const game = {
        id: String(g.id || Date.now()),
        name: String(g.name),
        system: String(g.system),
        cover: String(g.cover || ''),
        rom: String(g.rom),
        source: String(g.source || 'external'),
        createdAt: Number(g.createdAt || Date.now())
      };

      const games = current.games.filter(x => String(x.id) !== game.id);
      games.unshift(game);
      await saveCatalog(games, current.sha);
      return res.status(200).json({ ok: true, game });
    }

    if (req.method === 'DELETE') {
      const id = String((req.body && req.body.id) || req.query?.id || '');
      if (!id) return res.status(400).json({ error: 'ID obrigatório.' });

      const games = current.games.filter(x => String(x.id) !== id);
      await saveCatalog(games, current.sha);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Método não permitido.' });

  } catch (e) {
    console.error('catalog:', e);
    return res.status(e.statusCode || 500).json({ error: e.message || String(e) });
  }
}
