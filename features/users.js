function formatUser(jid, data, index) {
    const name = data.name || "Tanpa nama";
    const count = data.commandCount || 0;
    return `${index + 1}. ${name} (${jid.split("@")[0]}) - ${count} command`;
}

async function handleListUser({ m, db, args }) {
    const page = Math.max(Number(args[0]) || 1, 1);
    const perPage = 20;
    const entries = Object.entries(db.data.users || {});
    const totalPages = Math.max(Math.ceil(entries.length / perPage), 1);
    const start = (page - 1) * perPage;
    const rows = entries.slice(start, start + perPage);

    if (rows.length === 0) {
        await m.reply("Belum ada user tersimpan.");
        return;
    }

    await m.reply([
        `*List User* (${page}/${totalPages})`,
        "",
        rows.map(([jid, data], index) => formatUser(jid, data, start + index)).join("\n"),
        "",
        `Gunakan .listuser ${page + 1} untuk halaman berikutnya.`,
    ].join("\n"));
}

async function handleClearDb({ m, db, args }) {
    const mode = String(args[0] || "").toLowerCase();
    const confirm = String(args[1] || "").toLowerCase();

    if (!["logs", "users", "all"].includes(mode)) {
        await m.reply("Gunakan: .cleardb logs / users confirm / all confirm");
        return;
    }

    if (["users", "all"].includes(mode) && confirm !== "confirm") {
        await m.reply(`Ketik .cleardb ${mode} confirm untuk konfirmasi.`);
        return;
    }

    if (mode === "logs") {
        db.data.logs = [];
    } else if (mode === "users") {
        db.data.users = {};
    } else {
        db.data.users = {};
        db.data.logs = [];
    }

    await db.save();
    await m.reply(`Database bagian ${mode} berhasil dibersihkan.`);
}

module.exports = {
    name: "users",
    commands: ["listuser", "cleardb"],
    category: "Owner",
    description: "Melihat user tersimpan dan membersihkan database.",
    ownerOnly: true,
    async execute(context) {
        if (context.command === "listuser") {
            await handleListUser(context);
            return;
        }

        await handleClearDb(context);
    },
};
