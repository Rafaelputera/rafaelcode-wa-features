function getQuotedText(m) {
    return String(m.quoted?.text || m.quoted?.caption || "").trim();
}

module.exports = {
    name: "broadcast",
    commands: ["broadcast", "bc"],
    category: "Owner",
    description: "Mengirim broadcast ke semua user yang tersimpan.",
    ownerOnly: true,
    async execute({ Rafael, m, db, text }) {
        const message = String(text || "").trim() || getQuotedText(m);

        if (!message) {
            await m.reply("Gunakan: .broadcast pesan\nBisa juga reply pesan lalu ketik .broadcast");
            return;
        }

        const users = Object.keys(db.data.users || {})
            .filter((jid) => jid.endsWith("@s.whatsapp.net"));

        if (users.length === 0) {
            await m.reply("Belum ada user tersimpan untuk broadcast.");
            return;
        }

        await m.reply(`Mengirim broadcast ke ${users.length} user...`);

        let success = 0;
        let failed = 0;

        for (const jid of users) {
            try {
                await Rafael.sendMessage(jid, {
                    text: `*Broadcast ${db.data.settings?.prefix || "."}*\n\n${message}`,
                });
                success += 1;
                await new Promise((resolve) => setTimeout(resolve, 800));
            } catch (error) {
                failed += 1;
            }
        }

        await m.reply(`Broadcast selesai.\nBerhasil: ${success}\nGagal: ${failed}`);
    },
};
