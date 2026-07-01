const fs = require("fs");
const os = require("os");
const path = require("path");
const util = require("util");

function getArchiver() {
    try {
        return require("archiver");
    } catch (error) {
        throw new Error("Dependency archiver belum terpasang. Jalankan npm install di package feature.");
    }
}

async function createBackupArchive(rootDir = process.cwd(), outputPath = path.join(os.tmpdir(), `backup-${Date.now()}.zip`)) {
    const archiver = getArchiver();
    const excludedNames = new Set(["session", "node_modules", "package-lock.json", "database"]);
    const outputFullPath = path.resolve(outputPath);

    const shouldSkip = (entryName, fullPath) => {
        if (!entryName || entryName.startsWith(".")) return true;
        if (excludedNames.has(entryName)) return true;
        return path.resolve(fullPath) === outputFullPath;
    };

    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputPath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        output.on("close", () => resolve(outputPath));
        output.on("error", reject);
        archive.on("error", reject);
        archive.pipe(output);

        async function addDirectory(sourceDir, archiveRoot = "") {
            const entries = await fs.promises.readdir(sourceDir, { withFileTypes: true });

            for (const entry of entries) {
                const sourcePath = path.join(sourceDir, entry.name);
                const archivePath = archiveRoot ? path.join(archiveRoot, entry.name) : entry.name;

                if (shouldSkip(entry.name, sourcePath)) continue;

                if (entry.isDirectory()) {
                    await addDirectory(sourcePath, archivePath);
                } else if (entry.isFile()) {
                    archive.file(sourcePath, { name: archivePath });
                }
            }
        }

        addDirectory(rootDir)
            .then(() => archive.finalize())
            .catch(reject);
    });
}

module.exports = {
    name: "backup",
    commands: ["backup"],
    category: "Owner",
    description: "Mengirim arsip backup source bot.",
    ownerOnly: true,
    async execute({ Rafael, m }) {
        let archivePath;
        await m.reply("Sedang membuat backup bot...");

        try {
            archivePath = await createBackupArchive();
            await Rafael.sendMessage(m.chat, {
                document: { url: archivePath },
                mimetype: "application/zip",
                fileName: path.basename(archivePath),
                caption: "Backup bot utama",
            }, { quoted: m });
            await m.reply("Backup selesai.");
        } catch (error) {
            console.error(error);
            await m.reply(`Gagal membuat backup: ${util.format(error)}`);
        } finally {
            if (archivePath) {
                fs.promises.unlink(archivePath).catch(() => {});
            }
        }
    },
};
