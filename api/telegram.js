async function redisCommand(command) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error("Redis environment variables are not configured");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(command)
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || "Redis command failed");
  }

  return data.result;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const update = req.body;

    if (update?.chat_join_request) {
      const request = update.chat_join_request;
      const inviteLink = request.invite_link?.invite_link || null;

      let attribution = null;

      if (inviteLink) {
        const raw = await redisCommand(["GET", `invite:${inviteLink}`]);
        if (raw) {
          try {
            attribution = JSON.parse(raw);
          } catch {
            attribution = null;
          }
        }
      }

      const subscriber = {
        telegram_user_id: request.from?.id || null,
        telegram_username: request.from?.username || null,
        chat_id: request.chat?.id || null,
        join_request_at: request.date
          ? new Date(request.date * 1000).toISOString()
          : new Date().toISOString(),
        invite_link: inviteLink,
        source: attribution?.source || null,
        campaign: attribution?.campaign || null,
        medium: attribution?.medium || null,
        content: attribution?.content || null,
        term: attribution?.term || null,
        click_id: attribution?.click_id || null
      };

      const recordId = `${Date.now()}_${request.from?.id || "unknown"}`;

      await redisCommand([
        "SET",
        `subscriber:${recordId}`,
        JSON.stringify(subscriber),
        "EX",
        60 * 60 * 24 * 90
      ]);

      console.log("Telegram join request saved", {
        user_id: subscriber.telegram_user_id,
        username: subscriber.telegram_username,
        source: subscriber.source,
        campaign: subscriber.campaign,
        click_id: subscriber.click_id
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return res.status(500).json({ ok: false });
  }
}
