function normalizeJid(value = "") {
    const digits = String(value).replace(/[^0-9]/g, "");
    return digits ? `${digits}@s.whatsapp.net` : "";
}

async function getGroupState(Rafael, m, sender, botJid) {
    const metadata = await Rafael.groupMetadata(m.chat);
    const participants = metadata.participants || [];
    const participantMap = new Map(participants.map((item) => [item.id, item]));
    const admins = participants
        .filter((item) => item.admin === "admin" || item.admin === "superadmin")
        .map((item) => item.id);

    return {
        metadata,
        participants,
        admins,
        isAdmin: admins.includes(sender),
        isBotAdmin: admins.includes(botJid),
        participantMap,
    };
}

function getTargets(m, args, participantMap) {
    const targets = new Set();

    for (const jid of m.mentionedJid || []) {
        if (participantMap.has(jid)) targets.add(jid);
    }

    if (m.quoted?.sender && participantMap.has(m.quoted.sender)) {
        targets.add(m.quoted.sender);
    }

    for (const arg of args || []) {
        const jid = normalizeJid(arg);
        if (participantMap.has(jid)) targets.add(jid);
    }

    return [...targets];
}

function ensureGroup(context) {
    if (!context.isGroup) {
        throw new Error("Command ini hanya bisa dipakai di grup.");
    }
}

function ensureAdmin(context, groupState) {
    if (!context.isCreator && !groupState.isAdmin) {
        throw new Error("Command ini hanya untuk admin grup atau owner bot.");
    }
}

function ensureBotAdmin(groupState) {
    if (!groupState.isBotAdmin) {
        throw new Error("Bot harus menjadi admin grup dulu.");
    }
}

module.exports = {
    name: "group-tools",
    commands: ["tagall", "hidetag", "kick", "promote", "demote"],
    category: "Group",
    description: "Tools admin grup: tagall, hidetag, kick, promote, dan demote.",
    async execute(context) {
        const { Rafael, m, command, text, args, sender, botJid } = context;

        try {
            ensureGroup(context);
            const groupState = await getGroupState(Rafael, m, sender, botJid);
            ensureAdmin(context, groupState);

            if (command === "tagall") {
                const mentions = groupState.participants.map((item) => item.id);
                const memberList = mentions.map((jid, index) => `${index + 1}. @${jid.split("@")[0]}`).join("\n");
                await Rafael.sendMessage(m.chat, {
                    text: [text || "Tag all member", "", memberList].join("\n"),
                    mentions,
                }, { quoted: m });
                return;
            }

            if (command === "hidetag") {
                const mentions = groupState.participants.map((item) => item.id);
                await Rafael.sendMessage(m.chat, {
                    text: text || "",
                    mentions,
                }, { quoted: m });
                return;
            }

            ensureBotAdmin(groupState);
            const targets = getTargets(m, args, groupState.participantMap);

            if (targets.length === 0) {
                await m.reply(`Reply/tag/ketik nomor target untuk command .${command}`);
                return;
            }

            const actionMap = {
                kick: "remove",
                promote: "promote",
                demote: "demote",
            };

            await Rafael.groupParticipantsUpdate(m.chat, targets, actionMap[command]);
            await m.reply(`${command} berhasil untuk ${targets.length} member.`);
        } catch (error) {
            await m.reply(error.message || "Gagal menjalankan group tools.");
        }
    },
};
