function formatOwnerList(ownerNumbers) {
    return ownerNumbers
        .map((number, index) => `${index + 1}. wa.me/${String(number).replace(/[^0-9]/g, "")}`)
        .join("\n");
}

module.exports = {
    name: "owner",
    commands: ["owner", "creator"],
    category: "Info",
    description: "Menampilkan kontak owner bot.",
    async execute({ m, config }) {
        const owners = Array.isArray(config.ownerNumbers) ? config.ownerNumbers : [];

        if (owners.length === 0) {
            await m.reply("Nomor owner belum diatur.");
            return;
        }

        await m.reply([
            `*Owner ${config.botName}*`,
            "",
            formatOwnerList(owners),
        ].join("\n"));
    },
};
