function formatRuntime(seconds) {
    const total = Number(seconds) || 0;
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const remainingSeconds = Math.floor(total % 60);

    return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
}

module.exports = {
    name: "runtime",
    commands: ["runtime"],
    category: "Info",
    description: "Menampilkan lama bot aktif.",
    async execute({ m }) {
        await m.reply(`Bot uptime: ${formatRuntime(process.uptime())}`);
    },
};
