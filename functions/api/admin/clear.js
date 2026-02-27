export async function onRequestPost(context) {
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

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const type = String(payload.type || "");
  const prefix = type === "contact" ? "contact:" : type === "camp" ? "camp:" : "";
  if (!prefix) {
    return json({ error: "Invalid type" }, 400);
  }

  const list = await env.ROBOREACH_KV.list({ prefix, limit: 1000 });
  await Promise.all(list.keys.map((entry) => env.ROBOREACH_KV.delete(entry.name)));

  return json({ ok: true });
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
