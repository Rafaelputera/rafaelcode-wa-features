function getStore(db) {
    db.data.settings = db.data.settings || {};
    db.data.settings.welcome = db.data.settings.welcome || {};
    db.data.settings.goodbye = db.data.settings.goodbye || {};
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

async function updateToggle(context, key, label) {
    const { m, db, args } = context;

    if (!context.isGroup) {
        await m.reply(`${label} hanya bisa diatur di grup.`);
        return;
    }

    if (!(await isAdminOrOwner(context))) {
        await m.reply(`${label} hanya bisa diatur admin grup atau owner bot.`);
        return;
    }

    const mode = String(args[0] || "").toLowerCase();
    const store = getStore(db);

    if (!["on", "off", "status"].includes(mode)) {
        await m.reply(`Gunakan: .${context.command} on / off / status`);
        return;
    }

    if (mode === "status") {
        await m.reply(`${label}: ${store[key][m.chat] ? "ON" : "OFF"}`);
        return;
    }

    store[key][m.chat] = mode === "on";
    await db.save();
    await m.reply(`${label} berhasil ${store[key][m.chat] ? "diaktifkan" : "dimatikan"}.`);
}

module.exports = {
    name: "welcome-goodbye",
    commands: ["welcome", "goodbye"],
    category: "Group",
    description: "Mengatur pesan welcome dan goodbye member grup.",
    async execute(context) {
        if (context.command === "welcome") {
            await updateToggle(context, "welcome", "Welcome");
            return;
        }

        await updateToggle(context, "goodbye", "Goodbye");
    },
    async onGroupParticipantsUpdate({ Rafael, update, db }) {
        const store = getStore(db);
        const chat = update.id;
        const action = update.action;

        if (action === "add" && !store.welcome[chat]) return;
        if ((action === "remove" || action === "leave") && !store.goodbye[chat]) return;
        if (!["add", "remove", "leave"].includes(action)) return;

        const metadata = await Rafael.groupMetadata(chat).catch(() => ({}));
        const groupName = metadata.subject || "grup ini";
        const participants = Array.isArray(update.participants) ? update.participants : [];

        for (const jid of participants) {
            const mention = `@${jid.split("@")[0]}`;
            const text = action === "add"
                ? `Selamat datang ${mention} di ${groupName}.`
                : `Sampai jumpa ${mention}.`;

            await Rafael.sendMessage(chat, {
                text,
                mentions: [jid],
            }).catch(() => {});
        }
    },
};
