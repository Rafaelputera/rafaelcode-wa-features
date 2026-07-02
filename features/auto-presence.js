function getPresenceSettings(db) {
    db.data.settings = db.data.settings || {};
    db.data.settings.autoPresence = db.data.settings.autoPresence || {
        read: false,
        typing: false,
    };
    return db.data.settings.autoPresence;
}

function readMode(args) {
    return String(args[0] || "").toLowerCase();
}

async function updateSetting(context, key, label) {
    const { m, db, args } = context;
    const mode = readMode(args);
    const settings = getPresenceSettings(db);

    if (!["on", "off", "status"].includes(mode)) {
        await m.reply(`Gunakan: .${context.command} on / off / status`);
        return;
    }

    if (mode === "status") {
        await m.reply(`${label}: ${settings[key] ? "ON" : "OFF"}`);
        return;
    }

    settings[key] = mode === "on";
    await db.save();
    await m.reply(`${label} berhasil ${settings[key] ? "diaktifkan" : "dimatikan"}.`);
}

module.exports = {
    name: "auto-presence",
    commands: ["autoread", "autotyping"],
    category: "Owner",
    description: "Mengatur auto read dan auto typing bot.",
    ownerOnly: true,
    async execute(context) {
        if (context.command === "autoread") {
            await updateSetting(context, "read", "Auto read");
            return;
        }

        await updateSetting(context, "typing", "Auto typing");
    },
    async onMessage({ Rafael, m, db }) {
        const settings = getPresenceSettings(db);

        if (settings.read && m.key && !m.fromMe) {
            await Rafael.readMessages([m.key]).catch(() => {});
        }

        if (settings.typing && m.chat && !m.fromMe) {
            await Rafael.sendPresenceUpdate("composing", m.chat).catch(() => {});
            setTimeout(() => {
                Rafael.sendPresenceUpdate("paused", m.chat).catch(() => {});
            }, 1500);
        }
    },
};
