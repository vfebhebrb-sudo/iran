
require("dotenv").config();

const https = require("https");

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("❌ GEMINI_API_KEY در فایل .env پیدا نشد.");
  console.error("📂 مسیر فعلی:", process.cwd());
  process.exit(1);
}

function request(url) {
  return new Promise((resolve, reject) => {
    https.get(
      url,
      { headers: { "x-goog-api-key": API_KEY } },
      (res) => {
        let body = "";

        res.on("data", chunk => body += chunk);

        res.on("end", () => {
          let data;

          try {
            data = JSON.parse(body);
          } catch {
            return reject(new Error("پاسخ API قابل خواندن نیست."));
          }

          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(
              new Error(
                `HTTP ${res.statusCode}: ${
                  data.error?.message || "Unknown error"
                }`
              )
            );
          }

          resolve(data);
        });
      }
    ).on("error", reject);
  });
}

async function main() {
  try {
    const allModels = [];
    let pageToken;

    do {
      const params = new URLSearchParams({ pageSize: "1000" });
      if (pageToken) params.set("pageToken", pageToken);

      const url =
        "https://generativelanguage.googleapis.com/v1beta/models?" +
        params.toString();

      const data = await request(url);

      allModels.push(...(data.models || []));
      pageToken = data.nextPageToken;
    } while (pageToken);

    const usable = allModels.filter(model =>
      (model.supportedGenerationMethods || [])
        .includes("generateContent")
    );

    console.log(`\n📦 تعداد کل مدل‌ها: ${allModels.length}`);
    console.log(`✅ مدل‌های دارای generateContent: ${usable.length}\n`);

    for (const model of usable) {
      console.log("--------------------------------");
      console.log("نام مدل:", model.name);
      console.log("عنوان:", model.displayName || "نامشخص");
      console.log(
        "روش‌ها:",
        (model.supportedGenerationMethods || []).join(", ")
      );
      console.log("حد ورودی:", model.inputTokenLimit ?? "نامشخص");
      console.log("حد خروجی:", model.outputTokenLimit ?? "نامشخص");
    }

    require("fs").writeFileSync(
      "gemini-models.json",
      JSON.stringify(usable, null, 2),
      "utf8"
    );

    console.log("\n💾 ذخیره شد: gemini-models.json");
  } catch (error) {
    console.error("\n❌ خطا:", error.message);
  }
}

main();
