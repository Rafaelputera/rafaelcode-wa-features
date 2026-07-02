function cleanNumber(number) {
    const clean = String(number || "").replace(/[^0-9]/g, "");

    if (clean.startsWith("0")) {
        return `62${clean.slice(1)}`;
    }

    return clean;
}

function createOwnerContact(number, index, botName) {
    const clean = cleanNumber(number);
    const displayName = `${botName} Owner ${index + 1}`;

    return {
        displayName,
        vcard: [
            "BEGIN:VCARD",
            "VERSION:3.0",
            `FN:${displayName}`,
            `TEL;type=CELL;type=VOICE;waid=${clean}:+${clean}`,
            "END:VCARD",
        ].join("\n"),
    };
}

module.exports = {
    name: "owner",
    commands: ["owner", "creator"],
    category: "Info",
    description: "Menampilkan kontak owner bot.",
    async execute({ Rafael, m, config }) {
        const owners = (Array.isArray(config.ownerNumbers) ? config.ownerNumbers : [])
            .map(cleanNumber)
            .filter(Boolean);

        if (owners.length === 0) {
            await m.reply("Nomor owner belum diatur.");
            return;
        }

        await Rafael.sendMessage(m.chat, {
            contacts: {
                displayName: `${owners.length} Owner ${config.botName}`,
                contacts: owners.map((number, index) => createOwnerContact(number, index, config.botName)),
            },
        }, { quoted: m });
    },
};
