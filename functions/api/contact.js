export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.ROBOREACH_KV) {
    return json({ error: "KV binding missing" }, 500);
  }

  let payload;
  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      payload = await request.json();
    } else {
      const form = await request.formData();
      payload = Object.fromEntries(form.entries());
    }
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const entry = {
    timestamp: Date.now(),
    data: {
      name: clean(payload.name),
      email: clean(payload.email),
      organization: clean(payload.organization),
      message: clean(payload.message),
      subject: clean(payload.subject)
    }
  };

  if (!entry.data.name || !entry.data.email || !entry.data.message) {
    return json({ error: "Missing required fields" }, 400);
  }

  const key = `contact:${entry.timestamp}:${crypto.randomUUID()}`;
  await env.ROBOREACH_KV.put(key, JSON.stringify(entry));
  return json({ ok: true });
}

function clean(value) {
  return String(value || "").trim();
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
