export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.ROBOREACH_KV) {
    return json({ error: "KV binding missing" }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const expected = String(env.ADMIN_PASSCODE || "5329");
  const provided = String(payload.passcode || "");

  if (provided !== expected) {
    return json({ error: "Unauthorized" }, 401);
  }

  const token = crypto.randomUUID();
  await env.ROBOREACH_KV.put(`session:${token}`, "1", { expirationTtl: 60 * 60 * 12 });

  return json(
    { ok: true },
    200,
    {
      "Set-Cookie": `admin_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`
    }
  );
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
