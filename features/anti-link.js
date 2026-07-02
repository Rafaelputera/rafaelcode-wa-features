const LINK_REGEX = /(?:https?:\/\/)?(?:chat\.whatsapp\.com|whatsapp\.com\/channel)\/[A-Za-z0-9_-]+/i;

function getAntiLinkStore(db) {
    db.data.settings = db.data.settings || {};
    db.data.settings.antiLink = db.data.settings.antiLink || {};
    return db.data.settings.antiLink;
}

async function getAdmins(Rafael, chat) {
    const metadata = await Rafael.groupMetadata(chat);
    return (metadata.participants || [])
        .filter((item) => item.admin === "admin" || item.admin === "superadmin")
        .map((item) => item.id);
}

async function canManageAntiLink(context) {
    if (context.isCreator) return true;
    if (!context.isGroup) return false;

    const admins = await getAdmins(context.Rafael, context.m.chat);
    return admins.includes(context.sender);
}

module.exports = {
    name: "anti-link",
    commands: ["antilink"],
    category: "Group",
    description: "Menghapus pesan berisi link WhatsApp di grup.",
    async execute(context) {
        const { m, db, args } = context;

        if (!context.isGroup) {
            await m.reply("Anti link hanya bisa dipakai di grup.");
            return;
        }

        if (!(await canManageAntiLink(context))) {
            await m.reply("Fitur ini hanya untuk admin grup atau owner bot.");
            return;
        }

        const mode = String(args[0] || "").toLowerCase();
        const store = getAntiLinkStore(db);

        if (!["on", "off", "status"].includes(mode)) {
            await m.reply("Gunakan: .antilink on / off / status");
            return;
        }

        if (mode === "status") {
            await m.reply(`Anti link grup ini: ${store[m.chat] ? "ON" : "OFF"}`);
            return;
        }

        store[m.chat] = mode === "on";
        await db.save();
        await m.reply(`Anti link berhasil ${store[m.chat] ? "diaktifkan" : "dimatikan"}.`);
    },
    async onMessage(context) {
        const { Rafael, m, db, body, sender, botJid } = context;

        if (!context.isGroup || m.fromMe) return;

        const store = getAntiLinkStore(db);
        if (!store[m.chat]) return;
        if (!LINK_REGEX.test(body || "")) return;

        const admins = await getAdmins(Rafael, m.chat).catch(() => []);
        if (context.isCreator || admins.includes(sender)) return;

        if (!admins.includes(botJid)) {
            await m.reply("Terdeteksi link WhatsApp, tapi bot belum admin jadi tidak bisa hapus pesan.").catch(() => {});
            return;
        }

        await Rafael.sendMessage(m.chat, { delete: m.key }).catch(() => {});
        await Rafael.sendMessage(m.chat, {
            text: `Link WhatsApp dihapus.\n@${sender.split("@")[0]}, jangan kirim link grup/channel di sini.`,
            mentions: [sender],
        }).catch(() => {});
    },
};
