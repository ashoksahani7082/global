export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const update = req.body;

    if (update?.chat_join_request) {
      const request = update.chat_join_request;

      console.log("Telegram join request received", {
        user_id: request.from?.id,
        username: request.from?.username || null,
        chat_id: request.chat?.id,
        invite_link: request.invite_link?.invite_link || null,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return res.status(500).json({ ok: false });
  }
}
