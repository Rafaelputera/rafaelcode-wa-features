function normalizeJid(value = "") {
    const digits = String(value || "").replace(/[^0-9]/g, "");
    return digits ? `${digits}@s.whatsapp.net` : "";
}

function getStores(db) {
    db.data.settings = db.data.settings || {};
    db.data.settings.mutedGroups = db.data.settings.mutedGroups || {};
    db.data.settings.bannedUsers = db.data.settings.bannedUsers || {};
    return db.data.settings;
}

async function isAdminOrOwner(context) {
    if (context.isCreator) return true;
    if (!context.isGroup) return false;

    const metadata = await context.Rafael.groupMetadata(context.m.chat).catch(() => null);
    const admins = (metadata?.participants || [])
        .filter((item) => item.admin === "admin" || item.admin === "superadmin")
        .map((item) => item.id);

    return admins.includes(context.sender);
}

function getTargetJid(m, args) {
    if (m.quoted?.sender) return m.quoted.sender;
    if (m.mentionedJid?.[0]) return m.mentionedJid[0];
    return normalizeJid(args[0]);
}

async function handleMute(context) {
    const { m, db, args } = context;

    if (!context.isGroup) {
        await m.reply("Mute hanya bisa dipakai di grup.");
        return;
    }

    if (!(await isAdminOrOwner(context))) {
        await m.reply("Mute hanya bisa diatur admin grup atau owner bot.");
        return;
    }

    const mode = String(args[0] || "").toLowerCase();
    const stores = getStores(db);

    if (!["on", "off", "status"].includes(mode)) {
        await m.reply("Gunakan: .mute on / off / status");
        return;
    }

    if (mode === "status") {
        await m.reply(`Mute grup ini: ${stores.mutedGroups[m.chat] ? "ON" : "OFF"}`);
        return;
    }

    stores.mutedGroups[m.chat] = mode === "on";
    await db.save();
    await m.reply(`Mute grup berhasil ${stores.mutedGroups[m.chat] ? "diaktifkan" : "dimatikan"}.`);
}

async function handleBan(context, banned) {
    const { m, db, args, command } = context;

    if (!context.isCreator) {
        await m.reply("Ban/unban hanya untuk owner bot.");
        return;
    }

    const target = getTargetJid(m, args);
    if (!target) {
        await m.reply(`Reply/tag/ketik nomor target untuk command .${command}`);
        return;
    }

    const stores = getStores(db);

    if (banned) {
        stores.bannedUsers[target] = {
            jid: target,
            by: context.sender,
            at: new Date().toISOString(),
        };
    } else {
        delete stores.bannedUsers[target];
    }

    await db.save();
    await m.reply(`${target} berhasil ${banned ? "diban" : "diunban"}.`);
}

module.exports = {
    name: "moderation",
    commands: ["mute", "ban", "unban"],
    category: "Moderasi",
    description: "Mute grup serta ban/unban user dari penggunaan bot.",
    async execute(context) {
        if (context.command === "mute") {
            await handleMute(context);
            return;
        }

        await handleBan(context, context.command === "ban");
    },
};
