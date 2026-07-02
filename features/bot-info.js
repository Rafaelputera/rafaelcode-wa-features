module.exports = {
    name: "bot-info",
    commands: ["botinfo", "infobot"],
    category: "Info",
    description: "Menampilkan informasi bot.",
    async execute({ m, config, features, db, prefix }) {
        const totalUsers = Object.keys(db.data.users || {}).length;
        const totalLogs = (db.data.logs || []).length;
        const totalFeatures = Array.isArray(features) ? features.length : 0;

        await m.reply([
            `*${config.botName}*`,
            `Prefix: ${prefix}`,
            `Feature aktif: ${totalFeatures}`,
            `User tersimpan: ${totalUsers}`,
            `Log command: ${totalLogs}`,
            `Node.js: ${process.version}`,
        ].join("\n"));
    },
};
