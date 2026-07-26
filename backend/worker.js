/*
  worker.js — the tiny "middleman" server for the Reader feature.

  What it does, in plain terms:
   - The phone sends it a photo (as text/base64) with a request to "read".
   - This server adds the SECRET API key (which the phone must never hold),
     forwards the photo to Claude (an AI that can see images), gets the text
     back, and returns it to the phone.

  Why a server at all? The API key is like a password that bills your account.
  If we put it in the phone's web page, anyone could steal it. Keeping it here,
  on the server, is the safe way.

  This runs on Cloudflare Workers (a free place to host tiny servers).
  See README.md in this folder for click-by-click deploy steps.

  The secret key is provided by Cloudflare as `env.ANTHROPIC_API_KEY` — it is
  NOT written in this file, so this code is safe to keep in the repository.
*/

export default {
  async fetch(request, env) {
    // Browsers require these "CORS" headers to allow the phone's web page,
    // which lives on a different address, to talk to this server.
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // The browser sends a preflight "OPTIONS" check first — answer it.
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }
    if (request.method !== "POST") {
      return json({ error: "Please use POST." }, 405, cors);
    }

    try {
      const { image, mode } = await request.json();
      if (!image) return json({ error: "No image was sent." }, 400, cors);

      // The instruction we give the AI. "read" = read text as-is;
      // "translate" = read foreign text and translate to English.
      const prompt =
        mode === "translate"
          ? "Read all the text in this image and translate it into English. " +
            "Reply with ONLY the translation, no descriptions or commentary. " +
            "If there is no readable text, reply exactly: No text found."
          : "Read all the text in this image out loud, in natural reading order. " +
            "Reply with ONLY the text itself, no descriptions or commentary. " +
            "If there is no readable text, reply exactly: No text found.";

      // Call Claude's Messages API with the photo attached.
      const apiResp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY, // the secret, added here only
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-opus-5",
          max_tokens: 2048,
          // "low" effort keeps reading fast and cheap — good for simple text.
          output_config: { effort: "low" },
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: { type: "base64", media_type: "image/jpeg", data: image },
                },
                { type: "text", text: prompt },
              ],
            },
          ],
        }),
      });

      if (!apiResp.ok) {
        const detail = await apiResp.text();
        console.error("AI error:", apiResp.status, detail);
        return json({ error: "The AI service returned an error." }, 502, cors);
      }

      // Pull the plain text out of the AI's reply.
      const data = await apiResp.json();
      const text = (data.content || [])
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join(" ")
        .trim();

      return json({ text }, 200, cors);
    } catch (err) {
      console.error("Worker error:", err);
      return json({ error: "Something went wrong on the server." }, 500, cors);
    }
  },
};

// A small helper to send a JSON reply with the right headers.
function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...cors },
  });
}
