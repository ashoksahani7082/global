export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return res.status(500).json({ ok: false, error: "TELEGRAM_BOT_TOKEN is not configured" });
  }

  const webhookUrl = "https://global-rust.vercel.app/api/telegram";

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ["chat_join_request"]
        })
      }
    );

    const data = await response.json();

    return res.status(response.ok ? 200 : 502).json({
      ok: data.ok,
      description: data.description || null,
      webhook: webhookUrl
    });
  } catch (error) {
    console.error("Webhook setup error:", error);
    return res.status(500).json({ ok: false, error: "Webhook setup failed" });
  }
}
