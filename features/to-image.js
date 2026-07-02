const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

function getMime(message) {
    return String(message?.mimetype || message?.msg?.mimetype || "");
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

    throw new Error("Reply sticker yang ingin dijadikan gambar.");
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

async function convertStickerToImage(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new Error("Sticker tidak valid atau gagal diunduh.");
    }

    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "toimg-"));
    const inputPath = path.join(tempDir, "sticker.webp");
    const outputPath = path.join(tempDir, "image.png");

    try {
        await fs.promises.writeFile(inputPath, buffer);
        await runFfmpeg([
            "-y",
            "-i", inputPath,
            outputPath,
        ]);

        return fs.promises.readFile(outputPath);
    } finally {
        await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
}

module.exports = {
    name: "to-image",
    commands: ["toimg", "toimage"],
    category: "Tools",
    description: "Mengubah sticker menjadi gambar PNG.",
    async execute({ Rafael, m }) {
        const target = getTargetMessage(m);
        const mime = getMime(target);

        if (!/webp|sticker/i.test(mime) && target.mtype !== "stickerMessage") {
            await m.reply("Reply sticker dengan command .toimg");
            return;
        }

        try {
            const stickerBuffer = await downloadTarget(target);
            const imageBuffer = await convertStickerToImage(stickerBuffer);

            await Rafael.sendMessage(m.chat, {
                image: imageBuffer,
                caption: "Sticker berhasil diubah menjadi gambar.",
            }, { quoted: m });
        } catch (error) {
            console.error("To image error:", error);
            await m.reply(`Gagal mengubah sticker: ${error.message}`);
        }
    },
};
