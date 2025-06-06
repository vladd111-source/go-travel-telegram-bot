import { createClient } from "@supabase/supabase-js";

// Supabase init
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const ADMIN_ID = 5625134095;

// Webhook handler
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { message } = req.body;
  if (!message || !message.text) {
    return res.status(200).send("No message content");
  }

  const chatId = message.chat.id;
  const userId = message.from.id;
  const username = message.from.username || "";
  const firstName = message.from.first_name || "";
  const text = message.text.trim();

  // 👉 /start
  if (text === "/start") {
    const { error } = await supabase.from("bot_users").insert({
      telegram_id: userId,
      username,
      first_name: firstName,
    });

    if (error) {
      console.error("❌ Supabase insert error:", error.message);
    } else {
      console.log(`✅ Пользователь зарегистрирован: ${firstName} (${username || "без username"})`);
    }

    await sendMessage(chatId, "Открыть Go Travel WebApp 🌍", {
      inline_keyboard: [[
        {
          text: "🚀 Запустить",
          web_app: { url: "https://go-travel-frontend.vercel.app" },
        },
      ]]
    });

    return res.status(200).send("start handled");
  }

  // 👉 /sendall
  if (text.startsWith("/sendall") && userId === ADMIN_ID) {
    const msg = text.replace("/sendall", "").trim();

    if (!msg) {
      await sendMessage(chatId, "⚠️ Укажи текст после /sendall");
      return res.status(200).send("no message");
    }

    const { data, error } = await supabase.from("bot_users").select("telegram_id");

    if (error) {
      console.error("❌ Supabase read error:", error.message);
      await sendMessage(chatId, "🚫 Ошибка при получении пользователей.");
      return res.status(200).send("supabase error");
    }

    if (!data?.length) {
      await sendMessage(chatId, "📭 Нет пользователей для рассылки.");
      return res.status(200).send("no users");
    }

    let success = 0;
    for (const row of data) {
      try {
        await sendMessage(row.telegram_id, msg);
        await new Promise(res => setTimeout(res, 200)); // антифлуд
        success++;
      } catch (err) {
        console.warn(`⚠️ Ошибка отправки ${row.telegram_id}:`, err.message);
      }
    }

    await sendMessage(chatId, `✅ Рассылка завершена. Успешно: ${success}`);
    return res.status(200).send("sendall done");
  }

  return res.status(200).send("ok");
}

// Отправка сообщения
async function sendMessage(chatId, text, reply_markup = null) {
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...(reply_markup && { reply_markup }),
  };

  try {
    await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("❌ Ошибка отправки сообщения:", err.message);
  }
}
