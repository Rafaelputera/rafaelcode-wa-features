const ALLOWED_PREFIX = /^[°zZ#$@*+,.?=''():√%!¢£¥€π¤ΠΦ_&><`™©®Δ^βα~¦|/\\©^-]$/;

module.exports = {
    name: "settings",
    commands: ["setprefix"],
    category: "Owner",
    description: "Mengubah prefix command bot.",
    ownerOnly: true,
    async execute({ m, db, args, config }) {
        const nextPrefix = String(args[0] || "").trim();

        if (!nextPrefix) {
            await m.reply(`Gunakan: ${config.defaultPrefix}setprefix <prefix>\nContoh: ${config.defaultPrefix}setprefix !`);
            return;
        }

        if (!ALLOWED_PREFIX.test(nextPrefix)) {
            await m.reply("Prefix harus 1 karakter simbol, misalnya . ! # /");
            return;
        }

        db.data.settings = db.data.settings || {};
        db.data.settings.prefix = nextPrefix;
        await db.save();

        await m.reply(`Prefix bot berhasil diganti menjadi: ${nextPrefix}`);
    },
};
