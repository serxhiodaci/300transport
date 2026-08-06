// Cloudflare Pages Function — POST /api/apply
// Handles the driver application form, including the CDL photo, and emails it via
// Resend (https://resend.com). Requires Pages project environment variables:
// RESEND_API_KEY, NOTIFY_TO (and optionally NOTIFY_FROM).

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const formData = await request.formData();

    // Honeypot — real users never fill this in, bots usually do.
    if (formData.get("hp_field")) {
      return jsonResponse({ ok: true });
    }

    const name = (formData.get("name") || "").toString().trim();
    const phone = (formData.get("phone") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim();
    const zip = (formData.get("zip") || "").toString().trim();

    if (!name || !phone || !email || !zip) {
      return jsonResponse({ ok: false, error: "Please fill in all required fields." }, 400);
    }

    const cdlFile = formData.get("cdlPhoto");
    if (!(cdlFile instanceof File) || cdlFile.size === 0) {
      return jsonResponse({ ok: false, error: "Please attach a photo of your CDL." }, 400);
    }
    if (cdlFile.size > MAX_FILE_BYTES) {
      return jsonResponse({ ok: false, error: "That file is too large — 8MB max." }, 400);
    }
    if (!ALLOWED_FILE_TYPES.includes(cdlFile.type)) {
      return jsonResponse({ ok: false, error: "Please attach a JPG, PNG, or PDF file." }, 400);
    }

    const cdl = formData.get("cdl") || "n/a";
    const experience = formData.get("experience") || "n/a";
    const trailer = formData.get("trailer") || "n/a";
    const truck = formData.get("truck") || "n/a";
    const smsConsent = formData.get("smsConsent") ? "Yes" : "No";

    const text = [
      "New driver application from 300transport.com",
      "",
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Email: ${email}`,
      `Zip: ${zip}`,
      `Valid CDL-A: ${cdl}`,
      `Experience: ${experience}`,
      `Trailer preference: ${trailer}`,
      `Truck preference: ${truck}`,
      `SMS consent given: ${smsConsent}`,
      "",
      "CDL photo attached to this email.",
    ].join("\n");

    const attachmentContent = await fileToBase64(cdlFile);

    await sendEmail(env, {
      subject: `New driver application — ${name}`,
      text,
      replyTo: email,
      attachments: [{ filename: cdlFile.name || "cdl-photo", content: attachmentContent }],
    });

    return jsonResponse({ ok: true });
  } catch (err) {
    console.error("apply.js error:", err instanceof Error ? err.message : err);
    return jsonResponse({ ok: false, error: "Something went wrong. Please try again." }, 500);
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function fileToBase64(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function sendEmail(env, { subject, text, replyTo, attachments }) {
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
      attachments: attachments || [],
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend error: ${res.status} ${await res.text()}`);
  }
}
