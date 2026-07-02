module.exports = {
    name: "check-id",
    commands: ["cekid", "id"],
    category: "Tools",
    description: "Menampilkan ID chat, sender, dan quoted sender.",
    async execute({ m, sender, senderNumber }) {
        const lines = [
            "*ID Info*",
            `Chat: ${m.chat || "-"}`,
            `Sender: ${sender || "-"}`,
            `Nomor: ${senderNumber || "-"}`,
        ];

        if (m.quoted?.sender) {
            lines.push(`Quoted sender: ${m.quoted.sender}`);
        }

        await m.reply(lines.join("\n"));
    },
};
