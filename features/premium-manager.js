function normalizeJid(value = "") {
    const digits = String(value || "").replace(/[^0-9]/g, "");
    return digits ? `${digits}@s.whatsapp.net` : "";
}

function getTargetJid(m, args) {
    if (m.quoted?.sender) return m.quoted.sender;
    if (m.mentionedJid?.[0]) return m.mentionedJid[0];
    return normalizeJid(args[0]);
}

function getNumberArg(args, index, fallback = 0) {
    const value = Number(args[index]);
    return Number.isFinite(value) ? value : fallback;
}

function getValueIndex(m) {
    return m.quoted?.sender ? 0 : 1;
}

function formatDate(value) {
    if (!value) return "permanen";
    return new Date(value).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

async function setPremium(context) {
    const { m, db, args, command } = context;
    const target = getTargetJid(m, args);

    if (!target) {
        await m.reply(`Gunakan: .${command} nomor hari\nContoh: .${command} 628xxx 30`);
        return;
    }

    const days = getNumberArg(args, getValueIndex(m), 0);
    const user = db.ensureUser(target);

    user.premium = true;
    user.premiumUntil = days > 0
        ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
        : null;

    await db.save();
    await m.reply([
        "Premium berhasil diaktifkan.",
        `User: ${target}`,
        `Berlaku: ${formatDate(user.premiumUntil)}`,
    ].join("\n"));
}

async function deletePremium({ m, db, args }) {
    const target = getTargetJid(m, args);

    if (!target) {
        await m.reply("Gunakan: .delpremium nomor");
        return;
    }

    const user = db.ensureUser(target);
    user.premium = false;
    user.premiumUntil = null;

    await db.save();
    await m.reply(`Premium ${target} berhasil dinonaktifkan.`);
}

async function updateLimit(context, mode) {
    const { m, db, args, command } = context;
    const target = getTargetJid(m, args);

    if (!target) {
        await m.reply(`Gunakan: .${command} nomor jumlah`);
        return;
    }

    const amount = getNumberArg(args, getValueIndex(m), NaN);

    if (!Number.isFinite(amount) || amount < 0) {
        await m.reply("Jumlah limit harus angka 0 atau lebih.");
        return;
    }

    const user = db.ensureUser(target);
    db.resetDailyLimit(user);

    if (mode === "set") {
        user.limit.daily = amount;
        user.limit.remaining = amount;
    } else if (mode === "add") {
        user.limit.remaining += amount;
    } else {
        user.limit.remaining = user.limit.daily;
    }

    await db.save();
    await m.reply([
        "Limit berhasil diperbarui.",
        `User: ${target}`,
        `Limit: ${user.limit.remaining}/${user.limit.daily}`,
    ].join("\n"));
}

module.exports = {
    name: "premium-manager",
    commands: ["setpremium", "addpremium", "delpremium", "setlimit", "addlimit", "resetlimit"],
    category: "Owner",
    description: "Mengatur premium dan limit user.",
    ownerOnly: true,
    async execute(context) {
        if (context.command === "setpremium" || context.command === "addpremium") {
            await setPremium(context);
            return;
        }

        if (context.command === "delpremium") {
            await deletePremium(context);
            return;
        }

        if (context.command === "setlimit") {
            await updateLimit(context, "set");
            return;
        }

        if (context.command === "addlimit") {
            await updateLimit(context, "add");
            return;
        }

        await updateLimit(context, "reset");
    },
};
