export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.ROBOREACH_KV) {
    return json({ error: "KV binding missing" }, 500);
  }

  const token = getCookie(request.headers.get("Cookie") || "", "admin_session");
  if (!token) {
    return json({ error: "Unauthorized" }, 401);
  }

  const session = await env.ROBOREACH_KV.get(`session:${token}`);
  if (!session) {
    return json({ error: "Unauthorized" }, 401);
  }

  const contact = await readByPrefix(env.ROBOREACH_KV, "contact:");
  const camp = await readByPrefix(env.ROBOREACH_KV, "camp:");

  return json({ contact, camp });
}

async function readByPrefix(kv, prefix) {
  const list = await kv.list({ prefix, limit: 1000 });
  const records = await Promise.all(
    list.keys.map(async (entry) => {
      const raw = await kv.get(entry.name);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })
  );

  return records
    .filter(Boolean)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

function getCookie(cookieHeader, name) {
  const parts = cookieHeader.split(";").map((item) => item.trim());
  for (const part of parts) {
    const [k, v] = part.split("=");
    if (k === name) return v || "";
  }
  return "";
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });
}
