const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const MAX_VIDEO_DURATION = 6;
const MAX_INPUT_SIZE = 15 * 1024 * 1024;

function getMime(message) {
    return String(message?.mimetype || message?.msg?.mimetype || "");
}

function getExtension(mime) {
    if (mime.includes("png")) return "png";
    if (mime.includes("webp")) return "webp";
    if (mime.includes("gif")) return "gif";
    if (mime.includes("video")) return "mp4";
    return "jpg";
}

function getTargetMessage(m) {
    if (m.quoted && (m.quoted.download || getMime(m.quoted))) {
        return m.quoted;
    }

    return m;
}

function downloadTarget(target) {
    if (typeof target.download === "function") {
        return target.download();
    }

    throw new Error("Kirim atau reply gambar/video yang ingin dijadikan sticker.");
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
                reject(new Error("ffmpeg belum terpasang di server."));
                return;
            }

            reject(error);
        });

        ffmpeg.on("close", (code) => {
            if (code === 0) {
                resolve();
                return;
            }

            reject(new Error(stderr.trim() || `ffmpeg gagal dengan kode ${code}.`));
        });
    });
}

async function convertToSticker(buffer, mime) {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new Error("Media tidak valid atau gagal diunduh.");
    }

    if (buffer.length > MAX_INPUT_SIZE) {
        throw new Error("Ukuran media terlalu besar. Maksimal 15 MB.");
    }

    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "sticker-"));
    const inputPath = path.join(tempDir, `input.${getExtension(mime)}`);
    const outputPath = path.join(tempDir, "sticker.webp");

    try {
        await fs.promises.writeFile(inputPath, buffer);

        if (mime.includes("webp")) {
            return buffer;
        }

        const videoArgs = mime.startsWith("video/") || mime.includes("gif")
            ? ["-t", String(MAX_VIDEO_DURATION)]
            : [];

        await runFfmpeg([
            "-y",
            "-i", inputPath,
            ...videoArgs,
            "-vf", "fps=15,scale=512:512:force_original_aspect_ratio=decrease:flags=lanczos,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,setsar=1",
            "-vcodec", "libwebp",
            "-lossless", "0",
            "-q:v", mime.startsWith("video/") || mime.includes("gif") ? "70" : "80",
            "-compression_level", "6",
            "-loop", "0",
            "-preset", mime.startsWith("video/") || mime.includes("gif") ? "default" : "picture",
            "-an",
            "-vsync", "0",
            outputPath,
        ]);

        return fs.promises.readFile(outputPath);
    } finally {
        await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
}

module.exports = {
    name: "sticker",
    commands: ["sticker", "stiker", "s"],
    category: "Tools",
    description: "Membuat sticker dari gambar atau video pendek.",
    async execute({ Rafael, m }) {
        const target = getTargetMessage(m);
        const mime = getMime(target);

        if (!/image|video|webp|gif/i.test(mime)) {
            await m.reply("Kirim/reply gambar atau video pendek dengan command .sticker / .stiker / .s");
            return;
        }

        try {
            await m.reply("Sedang membuat sticker...");
            const mediaBuffer = await downloadTarget(target);
            const stickerBuffer = await convertToSticker(mediaBuffer, mime);

            await Rafael.sendMessage(m.chat, {
                sticker: stickerBuffer,
            }, { quoted: m });
        } catch (error) {
            console.error("Sticker error:", error);
            await m.reply(`Gagal membuat sticker: ${error.message}`);
        }
    },
};
