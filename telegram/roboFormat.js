// ======================================================
// ROBO FORMAT — مرتب و خوانا کردن پیام‌های روبو
//
//  ۱) متنِ چسبیده و بلند → پاراگراف‌های کوتاه با یه خط خالی بینشون
//  ۲) «۱) ... ۲) ... ۳) ...» که توی یه خط نوشته شده → هر مورد توی یه خط
//  ۳) کد و پرامپت (بلاک ``` ... ```) → بلاک کدِ تلگرام که با یه تپ کپی می‌شه
//  ۴) پیامِ خیلی بلند → چند پیام (بدون اینکه بلاک کد وسط خراب بشه)
//
// خروجیِ formatForTelegram یه آرایه‌ست؛ هر عضوش یه پیامه:
//   { html, plain }
//   html  = متن با فرمت HTMLِ تلگرام (parse_mode: "HTML")
//   plain = همون متن بدون تگ؛ برای وقتی که تلگرام HTML رو نپذیره
//
// هیچ وابستگی‌ای نداره و جای دیگه‌ای هم چیزی رو تغییر نمی‌ده.
// ======================================================

// تلگرام تا ۴۰۹۶ کاراکتر اجازه می‌ده؛ کمی کمتر می‌گیریم که جا برای حاشیه باشه
const LIMIT = 3800;

// تک‌خطی که از این بلندتر باشه «دیوار متن» حساب می‌شه و شکسته می‌شه
const WALL_MIN = 230;

// هدفِ طولِ هر پاراگراف وقتی دیوار متن رو می‌شکنیم
const PARAGRAPH_TARGET = 180;

// ======================================================
// کد یا پرامپت خواستن؟ (فقط یه «اشاره» به مدل؛ هیچ‌چیز رو اجباری نمی‌کنه)
// ======================================================

const CODE_WORDS = new RegExp(
    "(?:^|[^\\p{L}])(?:" +
    [
        "کد", "کدش", "کدشو", "کدها", "کدهاش", "اسکریپت", "سورس", "تابع", "کامند", "کانفیگ", "کوئری",
        "پرامپت", "پرومپت", "ترمینال", "رجکس", "اسنیپت",
        "code", "script", "prompt", "snippet", "function", "command", "query", "regex", "config",
        "sql", "json", "html", "css", "python", "javascript", "js", "bash", "node", "react", "php"
    ].join("|") +
    ")(?![\\p{L}])",
    "iu"
);

function wantsCode(text) {

    return CODE_WORDS.test(String(text || "").replace(/\u200c/g, " "));

}

// ======================================================
// HTML
// ======================================================

function escapeHtml(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

}

// زبان‌هایی که یعنی «متن ساده»؛ برای اینا اسم زبان نمی‌ذاریم
const PLAIN_LANGS = new Set(["", "text", "txt", "plain", "plaintext", "prompt", "md", "markdown"]);

function renderCode(lang, body) {

    const safeLang = String(lang || "").toLowerCase().replace(/[^a-z0-9_+#.\-]/g, "");

    if (PLAIN_LANGS.has(safeLang)) {
        return `<pre>${escapeHtml(body)}</pre>`;
    }

    return `<pre><code class="language-${safeLang}">${escapeHtml(body)}</code></pre>`;

}

// `اسم` وسط جمله → <code>؛ با تپ کپی می‌شه
function renderProse(text) {

    return escapeHtml(text).replace(/`([^`\n]{1,200})`/g, "<code>$1</code>");

}

// ======================================================
// بلاک‌های کد (``` ... ```)
// بلاک بسته‌نشده (مثلاً خروجیِ نصفه) هم تا آخر متن «کد» حساب می‌شه
// ======================================================

function parseSegments(text) {

    const segments = [];

    // اسم زبان فقط وقتی حساب می‌شه که بعدش خط جدید بیاد
    const re = /```(?:([\w+#.\-]+)[ \t]*\n|[ \t]*\n)?([\s\S]*?)(?:```|$)/g;

    let last = 0;

    let match;

    while ((match = re.exec(text)) !== null) {

        if (match.index > last) {
            segments.push({ type: "text", body: text.slice(last, match.index) });
        }

        segments.push({
            type: "code",
            lang: (match[1] || "").toLowerCase(),
            body: match[2].replace(/^\n+/, "").replace(/\s+$/, "")
        });

        last = re.lastIndex;

        if (last >= text.length) break;

    }

    if (last < text.length) {
        segments.push({ type: "text", body: text.slice(last) });
    }

    return segments;

}

// ======================================================
// مرتب کردن متنِ معمولی (غیر کد)
// ======================================================

// مورد فهرست: «۱) ...» «1. ...» «- ...» «• ...»
const LIST_ITEM = /^\s*(?:[۰-۹0-9]{1,2}\s*[)\.\-–]\s+|[-•▪●]\s+)/;

const isItem = line => LIST_ITEM.test(line);

// «... ۱) الف ۲) ب ۳) ج» که همه توی یه خط نوشته شده → هر مورد توی یه خط
// فقط وقتی هر دو «۱)» و «۲)» باشن، تا عددهای معمولی خراب نشن
function splitInlineList(text) {

    const hasFirst = /(?:^|\s)[۱1]\)\s/.test(text);

    const hasSecond = /\s[۲2]\)\s/.test(text);

    if (!hasFirst || !hasSecond) return { text, changed: false };

    const out = text.replace(/[ \t]+(?=[۰-۹0-9]{1,2}\)\s)/g, "\n");

    return { text: out, changed: out !== text };

}

// آخرین موردِ فهرست اگه بعد از اولین جمله‌اش حرفِ تازه‌ای داشت، اون حرف جدا بشه
// («... ۳) استراحت. خواب امشب مهمه.» → حرف آخر پاراگراف جدا)
function detachTail(lines) {

    let lastItem = -1;

    for (let i = 0; i < lines.length; i++) {
        if (isItem(lines[i])) lastItem = i;
    }

    if (lastItem < 0 || lastItem !== lines.length - 1) return lines;

    const line = lines[lastItem];

    const match = /[.!؟?]\s+(?=\S)/.exec(line.slice(6));

    if (!match) return lines;

    const cut = 6 + match.index + 1;

    const head = line.slice(0, cut).trim();

    const tail = line.slice(cut).trim();

    if (!tail) return lines;

    return lines.slice(0, lastItem).concat([head, "", tail]);

}

// یه تک‌خطِ خیلی بلند → پاراگراف‌های ۲ تا ۳ جمله‌ای
function paragraphize(line) {

    if (line.length <= WALL_MIN || isItem(line)) return line;

    const sentences = line.split(/(?<=[.!؟?…])\s+/).filter(Boolean);

    if (sentences.length < 2) return line;

    const paragraphs = [];

    let current = "";

    for (const sentence of sentences) {

        if (current && current.length + 1 + sentence.length > PARAGRAPH_TARGET) {
            paragraphs.push(current);
            current = sentence;
        }
        else {
            current = current ? current + " " + sentence : sentence;
        }

    }

    if (current) paragraphs.push(current);

    // آخرین پاراگرافِ خیلی کوچیک (مثل «کدوم درسه؟») به قبلی بچسبه
    if (paragraphs.length > 1 && paragraphs[paragraphs.length - 1].length < 40) {

        const tail = paragraphs.pop();

        paragraphs[paragraphs.length - 1] += " " + tail;

    }

    return paragraphs.join("\n\n");

}

// فاصله‌ی بین دو خطی که مدل فقط با یه Enter ازشون رد شده
function joinLines(a, b) {

    if (isItem(a) && isItem(b)) return "\n";

    if (isItem(b)) return /[:：]\s*$/.test(a) || a.length < 50 ? "\n" : "\n\n";

    if (isItem(a)) return "\n\n";

    return a.length >= 50 || b.length >= 50 ? "\n\n" : "\n";

}

function tidyProse(raw) {

    let text = String(raw || "")
        .replace(/\r\n?/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    if (!text) return "";

    const inline = splitInlineList(text);

    text = inline.text;

    const blocks = text.split(/\n\s*\n/);

    const out = blocks.map(block => {

        let lines = block.split("\n").map(l => l.replace(/\s+$/, "")).filter(l => l !== "");

        if (!lines.length) return "";

        if (inline.changed) lines = detachTail(lines);

        if (lines.length === 1) return paragraphize(lines[0]);

        let result = "";

        let previous = null;

        let forceBreak = false;

        for (const line of lines) {

            // detachTail یه خط خالی گذاشته؛ یعنی قبل از خط بعدی پاراگراف جدا شه
            if (line === "") {
                forceBreak = true;
                continue;
            }

            result = previous === null
                ? line
                : result + (forceBreak ? "\n\n" : joinLines(previous, line)) + line;

            previous = line;

            forceBreak = false;

        }

        return result;

    });

    return out.filter(Boolean).join("\n\n").replace(/\n{3,}/g, "\n\n").trim();

}

// ======================================================
// تکه‌تکه کردن
// ======================================================

function splitText(text, limit) {

    if (text.length <= limit) return [text];

    const out = [];

    let current = "";

    for (const paragraph of text.split("\n\n")) {

        if (paragraph.length > limit) {

            if (current) {
                out.push(current);
                current = "";
            }

            let rest = paragraph;

            while (rest.length > limit) {

                let cut = rest.lastIndexOf("\n", limit);

                if (cut < limit * 0.5) cut = rest.lastIndexOf(" ", limit);

                if (cut < limit * 0.5) cut = limit;

                out.push(rest.slice(0, cut).trim());

                rest = rest.slice(cut).trim();

            }

            current = rest;

            continue;

        }

        if (current && current.length + 2 + paragraph.length > limit) {
            out.push(current);
            current = paragraph;
        }
        else {
            current = current ? current + "\n\n" + paragraph : paragraph;
        }

    }

    if (current) out.push(current);

    return out;

}

function splitCode(body, limit) {

    if (body.length <= limit) return [body];

    const out = [];

    let buffer = [];

    let size = 0;

    const flush = () => {

        if (buffer.length) out.push(buffer.join("\n"));

        buffer = [];

        size = 0;

    };

    for (let line of body.split("\n")) {

        while (line.length > limit) {
            flush();
            out.push(line.slice(0, limit));
            line = line.slice(limit);
        }

        if (buffer.length && size + 1 + line.length > limit) flush();

        buffer.push(line);

        size += line.length + 1;

    }

    flush();

    return out;

}

// ======================================================
// MAIN
// ======================================================

function formatForTelegram(text, options = {}) {

    const limit = options.limit || LIMIT;

    const segments = parseSegments(String(text || "").replace(/\r\n?/g, "\n"));

    const pieces = [];

    for (const segment of segments) {

        if (segment.type === "code") {

            if (!segment.body.trim()) continue;

            for (const part of splitCode(segment.body, limit - 40)) {
                pieces.push({
                    code: true,
                    size: part.length,
                    html: renderCode(segment.lang, part),
                    plain: part
                });
            }

            continue;

        }

        const tidy = tidyProse(segment.body);

        if (!tidy) continue;

        for (const part of splitText(tidy, limit)) {
            pieces.push({
                code: false,
                size: part.length,
                html: renderProse(part),
                plain: part
            });
        }

    }

    // تکه‌ها رو تا جایی که سقف اجازه می‌ده توی یه پیام جمع کن
    const messages = [];

    let current = null;

    for (const piece of pieces) {

        const sep = !current ? "" : (current.lastCode || piece.code ? "\n" : "\n\n");

        if (current && current.size + sep.length + piece.size > limit) {
            messages.push(current);
            current = null;
        }

        if (!current) {
            current = { html: piece.html, plain: piece.plain, size: piece.size, lastCode: piece.code };
        }
        else {
            current.html += sep + piece.html;
            current.plain += "\n\n" + piece.plain;
            current.size += sep.length + piece.size;
            current.lastCode = piece.code;
        }

    }

    if (current) messages.push(current);

    return messages.map(m => ({ html: m.html, plain: m.plain }));

}

module.exports = {

    formatForTelegram,

    wantsCode,

    // برای تست
    tidyProse,
    parseSegments,
    escapeHtml

};