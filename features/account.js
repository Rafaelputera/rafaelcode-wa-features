const CAPTCHA_TTL_MS = 5 * 60 * 1000;
const CAPTCHA_ATTEMPTS = 3;

function getJimp() {
    return require("jimp");
}

function createCode(length = 5) {
    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let code = "";

    for (let i = 0; i < length; i += 1) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }

    return code;
}

function parseRegistration(text = "") {
    const [nameRaw, ageRaw] = String(text).split(",");
    const name = String(nameRaw || "").trim().replace(/\s+/g, " ");
    const age = Number(String(ageRaw || "").replace(/[^0-9]/g, ""));

    if (!name || name.length < 2) {
        throw new Error("Nama minimal 2 karakter.");
    }

    if (!Number.isInteger(age) || age < 5 || age > 120) {
        throw new Error("Umur harus angka valid.");
    }

    return { name, age };
}

function getPendingStore(db) {
    db.data.verification = db.data.verification || {};
    return db.data.verification;
}

function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getPremiumText(db, user) {
    if (!db.isPremium(user)) return "Tidak aktif";
    if (!user.premiumUntil) return "Aktif permanen";
    return `Aktif sampai ${formatDate(user.premiumUntil)}`;
}

async function createCaptchaImage(code) {
    const Jimp = getJimp();
    const width = 720;
    const height = 320;
    const image = await new Promise((resolve, reject) => {
        new Jimp(width, height, "#f5f7fb", (error, canvas) => {
            if (error) reject(error);
            else resolve(canvas);
        });
    });

    const titleFont = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const codeFont = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
    const smallFont = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);

    for (let i = 0; i < 1400; i += 1) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        const shade = 130 + Math.floor(Math.random() * 90);
        image.setPixelColor(Jimp.rgbaToInt(shade, shade, shade, 80), x, y);
    }

    image.print(titleFont, 0, 34, {
        text: "Kode Verifikasi",
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    }, width);

    image.print(codeFont, 0, 120, {
        text: code,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    }, width);

    image.print(smallFont, 0, 250, {
        text: "Ketik kode ini di chat untuk menyelesaikan pendaftaran.",
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    }, width);

    return image.getBufferAsync(Jimp.MIME_PNG);
}

async function sendCaptcha({ Rafael, m, db, sender, text, prefix }) {
    let registration;

    try {
        registration = parseRegistration(text);
    } catch (error) {
        await m.reply([
            "Format pendaftaran belum benar.",
            `Gunakan: ${prefix}daftar nama,umur`,
            "Contoh: .daftar Rafael Putra,18",
            "",
            `Catatan: ${error.message}`,
        ].join("\n"));
        return;
    }

    const user = db.ensureUser(sender);
    if (user.registered) {
        await m.reply("Kamu sudah terdaftar. Ketik .me untuk melihat profil.");
        return;
    }

    const code = createCode();
    const expiresAt = Date.now() + CAPTCHA_TTL_MS;
    const store = getPendingStore(db);

    store[sender] = {
        ...registration,
        code,
        attempts: CAPTCHA_ATTEMPTS,
        expiresAt,
        createdAt: new Date().toISOString(),
    };

    await db.save();

    try {
        const captcha = await createCaptchaImage(code);
        await Rafael.sendMessage(m.chat, {
            image: captcha,
            caption: [
                "Captcha pendaftaran berhasil dibuat.",
                "Ketik kode pada gambar tanpa prefix.",
                `Masa berlaku: ${Math.floor(CAPTCHA_TTL_MS / 60000)} menit.`,
            ].join("\n"),
        }, { quoted: m });
    } catch (error) {
        await m.reply([
            "Captcha berhasil dibuat, tetapi gambar gagal dikirim.",
            `Kode kamu: ${code}`,
            "Ketik kode itu tanpa prefix.",
        ].join("\n"));
    }
}

async function verifyCaptcha(context, codeInput) {
    const { m, db, sender } = context;
    const store = getPendingStore(db);
    const pending = store[sender];

    if (!pending) return false;

    const code = String(codeInput || "").trim().toUpperCase();
    if (!code) return false;

    if (Date.now() > pending.expiresAt) {
        delete store[sender];
        await db.save();
        await m.reply("Captcha sudah kedaluwarsa. Silakan daftar ulang dengan .daftar nama,umur.");
        return true;
    }

    if (code !== pending.code) {
        pending.attempts -= 1;

        if (pending.attempts <= 0) {
            delete store[sender];
            await db.save();
            await m.reply("Kode captcha salah 3 kali. Silakan daftar ulang dengan .daftar nama,umur.");
            return true;
        }

        await db.save();
        await m.reply(`Kode captcha salah. Sisa percobaan: ${pending.attempts}`);
        return true;
    }

    const user = db.ensureUser(sender, {
        name: pending.name,
        number: sender.split("@")[0],
    });

    user.name = pending.name;
    user.displayName = pending.name;
    user.age = pending.age;
    user.registered = true;
    user.registeredAt = new Date().toISOString();
    user.lastSeen = new Date().toISOString();
    delete store[sender];

    await db.save();
    await m.reply([
        "Pendaftaran berhasil.",
        `Nama: ${user.displayName}`,
        `Umur: ${user.age}`,
        `Level: ${user.level}`,
        `Limit hari ini: ${user.limit.remaining}/${user.limit.daily}`,
    ].join("\n"));
    return true;
}

function createProfileText(db, user, sender) {
    db.resetDailyLimit(user);

    return [
        "*Profil User*",
        `Nama: ${user.displayName || user.name || "-"}`,
        `Nomor: ${sender.split("@")[0]}`,
        `Status daftar: ${user.registered ? "Terverifikasi" : "Belum daftar"}`,
        `Umur: ${user.age || "-"}`,
        `Level: ${user.level}`,
        `EXP: ${user.exp}/${db.getLevelTarget(user.level)}`,
        `Role: ${user.role || "User"}`,
        `Premium: ${getPremiumText(db, user)}`,
        `Limit: ${user.limit.remaining}/${user.limit.daily}`,
        `Total command: ${user.commandCount || 0}`,
        `Terdaftar: ${formatDate(user.registeredAt)}`,
    ].join("\n");
}

module.exports = {
    name: "account",
    commands: ["daftar", "register", "verify", "me", "profileku", "limit", "premium"],
    category: "User",
    description: "Pendaftaran, captcha, profil, limit, level, dan premium user.",
    async execute(context) {
        const { m, db, sender, command, text, prefix } = context;

        if (command === "daftar" || command === "register") {
            await sendCaptcha(context);
            return;
        }

        if (command === "verify") {
            if (!(await verifyCaptcha(context, text))) {
                await m.reply("Tidak ada captcha aktif. Ketik .daftar nama,umur dulu.");
            }
            return;
        }

        const user = db.ensureUser(sender);

        if (command === "me" || command === "profileku") {
            await m.reply(createProfileText(db, user, sender));
            return;
        }

        if (command === "premium") {
            await m.reply(`Status premium kamu: ${getPremiumText(db, user)}`);
            return;
        }

        db.resetDailyLimit(user);
        await m.reply([
            "*Limit Harian*",
            `Sisa: ${user.limit.remaining}/${user.limit.daily}`,
            `Premium: ${getPremiumText(db, user)}`,
            "",
            `Daftar dulu jika belum: ${prefix}daftar nama,umur`,
        ].join("\n"));
    },
    async onMessage(context) {
        if (context.isCmd) return;
        await verifyCaptcha(context, context.body);
    },
};
