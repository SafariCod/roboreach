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
      parent_name: clean(payload.parent_name),
      parent_email: clean(payload.parent_email),
      parent_phone: clean(payload.parent_phone),
      student_count: clean(payload.student_count),
      grade_band: clean(payload.grade_band),
      camp_block: clean(payload.camp_block),
      camp_notes: clean(payload.camp_notes)
    }
  };

  if (!entry.data.parent_name || !entry.data.parent_email || !entry.data.student_count || !entry.data.grade_band || !entry.data.camp_block) {
    return json({ error: "Missing required fields" }, 400);
  }

  const key = `camp:${entry.timestamp}:${crypto.randomUUID()}`;
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
