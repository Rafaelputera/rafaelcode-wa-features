function getTargetMessage(m) {
    if (m.quoted && (m.quoted.download || m.quoted.mimetype)) {
        return m.quoted;
    }

    return m;
}

function getMime(message) {
    return String(message?.mimetype || message?.msg?.mimetype || "");
}

async function handleSetProfilePicture({ Rafael, m, botJid }) {
    const target = getTargetMessage(m);
    const mime = getMime(target);

    if (!/image/i.test(mime) || typeof target.download !== "function") {
        await m.reply("Kirim/reply gambar dengan command .setppbot");
        return;
    }

    const image = await target.download();
    await Rafael.updateProfilePicture(botJid, image);
    await m.reply("Foto profil bot berhasil diubah.");
}

async function handleSetName({ Rafael, m, text }) {
    const name = String(text || "").trim();

    if (!name) {
        await m.reply("Gunakan: .setnamebot nama baru");
        return;
    }

    if (name.length > 25) {
        await m.reply("Nama bot terlalu panjang. Maksimal 25 karakter.");
        return;
    }

    await Rafael.updateProfileName(name);
    await m.reply(`Nama bot berhasil diubah menjadi: ${name}`);
}

module.exports = {
    name: "profile",
    commands: ["setppbot", "setnamebot"],
    category: "Owner",
    description: "Mengubah foto profil dan nama bot.",
    ownerOnly: true,
    async execute(context) {
        if (context.command === "setppbot") {
            await handleSetProfilePicture(context);
            return;
        }

        await handleSetName(context);
    },
};
