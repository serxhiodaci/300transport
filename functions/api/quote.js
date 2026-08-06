// Cloudflare Pages Function — POST /api/quote
// Handles the "Quote a shipment" form and emails it via Resend (https://resend.com).
// Requires Pages project environment variables: RESEND_API_KEY, NOTIFY_TO (and optionally NOTIFY_FROM).

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const formData = await request.formData();

    // Honeypot — real users never fill this in, bots usually do.
    if (formData.get("hp_field")) {
      return jsonResponse({ ok: true });
    }

    const name = (formData.get("name") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim();
    const phone = (formData.get("phone") || "").toString().trim();

    if (!name || !email || !phone) {
      return jsonResponse({ ok: false, error: "Please fill in your name, email, and phone." }, 400);
    }

    const originCity = formData.get("originCity") || "";
    const originState = formData.get("originState") || "";
    const originZip = formData.get("originZip") || "";
    const destCity = formData.get("destCity") || "";
    const destState = formData.get("destState") || "";
    const destZip = formData.get("destZip") || "";
    const commodity = formData.get("commodity") || "";

    const text = [
      "New shipment quote request from 300transport.com",
      "",
      `Origin: ${originCity}, ${originState} ${originZip}`,
      `Destination: ${destCity}, ${destState} ${destZip}`,
      `Commodity: ${commodity}`,
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
    ].join("\n");

    await sendEmail(env, {
      subject: `New quote request — ${originCity || "?"} to ${destCity || "?"}`,
      text,
      replyTo: email,
    });

    return jsonResponse({ ok: true });
  } catch (err) {
    console.error("quote.js error:", err instanceof Error ? err.message : err);
    return jsonResponse({ ok: false, error: "Something went wrong. Please try again." }, 500);
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function sendEmail(env, { subject, text, replyTo }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.NOTIFY_FROM || "300 Transport Website <onboarding@resend.dev>",
      to: (env.NOTIFY_TO || "").split(",").map((s) => s.trim()).filter(Boolean),
      reply_to: replyTo,
      subject,
      text,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend error: ${res.status} ${await res.text()}`);
  }
}
