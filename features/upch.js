const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const CHANNEL_LINK_REGEX = /^https:\/\/whatsapp\.com\/channel\/([a-zA-Z0-9_-]+)/i;

function getMime(message) {
    return String(message?.mimetype || message?.msg?.mimetype || "");
}

function getTargetMessage(m) {
    if (m.quoted && (m.quoted.download || getMime(m.quoted))) {
        return m.quoted;
    }

    return m;
}

function getAudioExtension(mime) {
    if (/mpeg|mp3/i.test(mime)) return "mp3";
    if (/mp4|m4a/i.test(mime)) return "m4a";
    if (/wav/i.test(mime)) return "wav";
    if (/ogg|opus/i.test(mime)) return "ogg";
    if (/aac/i.test(mime)) return "aac";
    return "bin";
}

function downloadTarget(target) {
    if (typeof target.download === "function") {
        return target.download();
    }

    throw new Error("Audio tidak bisa diunduh.");
}

function runFfmpeg(args) {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn("ffmpeg", args, {
            stdio: ["ignore", "ignore", "pipe"],
        });

        let stderr = "";

        ffmpeg.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });

        ffmpeg.on("error", (error) => {
            if (error.code === "ENOENT") {
                reject(new Error("FFmpeg tidak ditemukan. Pastikan FFmpeg sudah terpasang."));
                return;
            }

            reject(error);
        });

        ffmpeg.on("close", (code) => {
            if (code === 0) {
                resolve();
                return;
            }

            reject(new Error(stderr.trim() || `FFmpeg gagal dengan kode ${code}.`));
        });
    });
}

async function convertAudioToOgg(buffer, mime) {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new Error("Audio tidak valid atau gagal diunduh.");
    }

    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "upch-"));
    const inputPath = path.join(tempDir, `input.${getAudioExtension(mime)}`);
    const outputPath = path.join(tempDir, "output.ogg");

    try {
        await fs.promises.writeFile(inputPath, buffer);
        await runFfmpeg([
            "-y",
            "-i", inputPath,
            "-vn",
            "-c:a", "libopus",
            "-b:a", "128k",
            "-vbr", "on",
            "-ar", "48000",
            "-ac", "1",
            outputPath,
        ]);

        return fs.promises.readFile(outputPath);
    } finally {
        await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
}

async function getChannelJid(Rafael, inviteCode) {
    if (typeof Rafael.newsletterMetadata !== "function") {
        throw new Error("Fungsi newsletterMetadata tidak tersedia pada Baileys yang dipakai.");
    }

    const metadata = await Rafael.newsletterMetadata("invite", inviteCode);
    if (!metadata?.id) {
        throw new Error("Metadata Channel tidak ditemukan.");
    }

    return String(metadata.id);
}

module.exports = {
    name: "upload-channel",
    commands: ["upch"],
    category: "Tools",
    description: "Upload audio sebagai voice note ke saluran WhatsApp.",
    async execute({ Rafael, m, args, prefix, command }) {
        const target = getTargetMessage(m);
        const mime = getMime(target);

        if (!/audio/i.test(mime)) {
            await m.reply([
                "Balas/kirim audio dengan perintah:",
                `${prefix + command} https://whatsapp.com/channel/xxxx`,
            ].join("\n"));
            return;
        }

        const link = String(args[0] || "").trim();
        const match = link.match(CHANNEL_LINK_REGEX);

        if (!match) {
            await m.reply([
                "Link saluran tidak valid.",
                "Contoh: https://whatsapp.com/channel/xxxx",
            ].join("\n"));
            return;
        }

        try {
            await m.reply("Sedang convert audio dan upload ke Channel...");
            const channelJid = await getChannelJid(Rafael, match[1]);
            const audioBuffer = await downloadTarget(target);
            const oggBuffer = await convertAudioToOgg(audioBuffer, mime);

            await Rafael.sendMessage(channelJid, {
                audio: oggBuffer,
                mimetype: "audio/ogg; codecs=opus",
                ptt: true,
            });

            await m.reply("Voice Note berhasil dikirim ke Channel.");
        } catch (error) {
            console.error("Error upch:", error);
            const message = /FFmpeg tidak ditemukan/i.test(error.message)
                ? "FFmpeg tidak ditemukan. Pastikan FFmpeg sudah terpasang."
                : "Terjadi kesalahan. Pastikan link valid dan bot merupakan admin Channel.";

            await m.reply(message);
        }
    },
};
