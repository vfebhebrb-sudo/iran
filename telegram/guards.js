// ======================================================
// GUARDS
// منطق این دو تابع همون قبلیه؛ فقط از bot.js جدا شده
// و حالا فقط روی پیام‌هایی اجرا می‌شه که خطاب به روبو هستن
// ======================================================

// ======================================================
// VERY STRONG BINARY / ENCODED DATA DETECTOR
// ======================================================

function isBinaryMessage(text) {

    if (!text || typeof text !== "string") {
        return false;
    }

    const value = text.toLowerCase().trim();

    // LAYER 1: کل پیام فقط 0 و 1
    const compact = value.replace(/\s+/g, "");

    if (/^[01]+$/.test(compact) && compact.length >= 8) {
        return true;
    }

    // LAYER 2: قطعات باینری طولانی
    const chunks = value.match(/[01]{8,}/g) || [];

    let totalBinaryBits = 0;

    for (const chunk of chunks) {
        totalBinaryBits += chunk.length;
    }

    if (totalBinaryBits >= 32) {
        return true;
    }

    // LAYER 3: باینری تکه‌تکه با فاصله، خط تیره، _ ، | و ...
    const separatedBinary = value.match(
        /[01]{4,}(?:[\s|,;:_\-./]+[01]{4,}){2,}/g
    );

    if (separatedBinary) {

        for (const sequence of separatedBinary) {

            const bits = sequence.replace(/[^01]/g, "");

            if (bits.length >= 24) {
                return true;
            }

        }

    }

    // LAYER 4: باینری که متن بین آن قرار گرفته
    const allBinaryDigits = value.match(/[01]/g) || [];

    if (allBinaryDigits.length >= 32) {

        const nonBinary = value.replace(/[01\s]/g, "");

        if (nonBinary.length < allBinaryDigits.length) {
            return true;
        }

    }

    // LAYER 5: باینری داخل براکت / INPUT / <<< >>>
    const binaryContainer =
        /(?:\[|\<\<\<|\{|\(|input\s*:)[\s\S]*?[01]{8,}[\s\S]*(?:\]|\>\>\>|\}|\))/i;

    if (binaryContainer.test(value)) {
        return true;
    }

    // LAYER 6: دستور Decode + مقدار باینری
    const decodeWords = [
        "decode binary",
        "decode the following binary",
        "decode this binary",
        "binary data",
        "binary input",
        "utf-8",
        "8-bit bytes",
        "8 bit bytes",
        "decode the bytes"
    ];

    let hasDecodeInstruction = false;

    for (const word of decodeWords) {

        if (value.includes(word)) {
            hasDecodeInstruction = true;
            break;
        }

    }

    if (hasDecodeInstruction && allBinaryDigits.length >= 8) {
        return true;
    }

    // LAYER 7: تعداد زیاد گروه‌های 0 و 1
    const smallChunks = value.match(/[01]{3,}/g) || [];

    let suspiciousChunks = 0;
    let suspiciousBits = 0;

    for (const chunk of smallChunks) {

        if (chunk.length >= 3) {
            suspiciousChunks++;
            suspiciousBits += chunk.length;
        }

    }

    if (suspiciousChunks >= 5 && suspiciousBits >= 24) {
        return true;
    }

    // LAYER 8: الگوی بایت‌های 8 بیتی
    const byteGroups = value.match(/[01]{8}/g) || [];

    if (byteGroups.length >= 3) {
        return true;
    }

    return false;

}

// ======================================================
// ANTI PROMPT-INJECTION DETECTOR
// ======================================================

function isPromptInjection(text) {

    if (!text || typeof text !== "string") {
        return false;
    }

    const value = text
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

    const patterns = [

        /system\s*override/,
        /system\s*message/,
        /system\s*instruction/,
        /system\s*prompt/,

        /ignore\s+(all\s+)?previous\s+instructions?/,
        /ignore\s+(all\s+)?prior\s+instructions?/,

        /forget\s+(all\s+)?previous\s+instructions?/,
        /disregard\s+(all\s+)?previous\s+instructions?/,

        /bypass\s+(the\s+)?safety/,
        /safety\s+layer\s*:\s*bypassed/,
        /safety\s+disabled/,

        /authority\s+override/,
        /admin\s+override/,
        /developer\s+message/,
        /developer\s+instruction/,

        /rewrite\s+(your\s+)?behavior/,
        /rewriting\s+behavior/,

        /owner\s+access\s*:\s*revoked/,
        /unknown\s+access\s*:\s*granted/,

        /connection\s+hijacked/,
        /session\s+terminated/,
        /session\s+reopened/,

        /prompt\s+injection/,
        /jailbreak/

    ];

    for (const pattern of patterns) {

        if (pattern.test(value)) {
            return true;
        }

    }

    // الگوهای نمایشی شبیه لاگ سیستم

    const fakeSystemPatterns = [

        /\[\s*system\s+override/,
        /\[\s*system\s+message/,
        />>>.*override/,
        />>>.*rewriting/,
        />>>.*access\s+denied/,

        /bot\s+status\s*:/,
        /ai\s+control\s*:/,
        /owner\s+access\s*:/,
        /unknown\s+access\s*:/,
        /authority\s+override\s*:/,
        /safety\s+layer\s*:/,
        /operator\s*:/,
        /trace\s*:/,
        /session\s+integrity\s*:/,

        /0x[0-9a-f]{2,}/

    ];

    for (const pattern of fakeSystemPatterns) {

        if (pattern.test(value)) {
            return true;
        }

    }

    return false;

}

module.exports = {
    isBinaryMessage,
    isPromptInjection
};