module.exports = {
    name: "dbstats",
    commands: ["dbstats"],
    category: "Owner",
    description: "Menampilkan statistik database bot.",
    ownerOnly: true,
    async execute({ m, db }) {
        const totalUsers = Object.keys(db.data.users || {}).length;
        const totalLogs = (db.data.logs || []).length;
        await m.reply(`Database aktif.\nUsers: ${totalUsers}\nLog command: ${totalLogs}`);
    },
};
