const THUMBNAIL_URL = "https://athars.space/uploads/aaf383d3.png";

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const parts = [];

    if (days) parts.push(`${days} hari`);
    if (hours) parts.push(`${hours} jam`);
    if (minutes) parts.push(`${minutes} menit`);
    if (!parts.length) parts.push(`${secs} detik`);

    return parts.join(" ");
}

function formatMemory(bytes) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function createSlug(value) {
    return String(value || "lainnya")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function groupByCategory(features, isCreator) {
    const visibleFeatures = features.filter((feature) => isCreator || !feature.ownerOnly);

    return visibleFeatures.reduce((groups, feature) => {
        const category = feature.category || "Lainnya";
        groups[category] = groups[category] || [];
        groups[category].push(feature);
        return groups;
    }, {});
}

function getMenuCategories(features, isCreator) {
    const grouped = groupByCategory(features, isCreator);
    const categories = Object.entries(grouped).map(([name, categoryFeatures]) => ({
        name,
        slug: createSlug(name),
        features: categoryFeatures,
    }));

    if (isCreator) {
        categories.push({
            name: "Owner Core",
            slug: "owner-core",
            features: [
                {
                    name: "reload-features",
                    commands: ["reloadfeatures"],
                    description: "Memuat ulang fitur tanpa restart bot.",
                },
                {
                    name: "update-features",
                    commands: ["update"],
                    description: "Update package fitur dari bot utama.",
                },
            ],
        });
    }

    return categories;
}

function findCategory(categories, query) {
    const slug = createSlug(query);
    return categories.find((category) => category.slug === slug);
}

function createCategorySections(categories, prefix) {
    return [
        {
            title: "Daftar Kategori Fitur",
            rows: categories.map((category) => ({
                title: `${category.name} Menu`,
                rowId: `${prefix}menu ${category.slug}`,
                description: `${category.features.length} fitur tersedia`,
            })),
        },
    ];
}

function createInitialCaption({ config, prefix, features, isCreator }) {
    const memory = process.memoryUsage();
    const owners = (config.ownerNumbers || []).map((number) => `wa.me/${number}`).join("\n") || "-";
    const visibleFeatures = features.filter((feature) => isCreator || !feature.ownerOnly);

    return [
        `*${config.botName}*`,
        "",
        "*Info Owner*",
        owners,
        "",
        "*Info Bot*",
        `Nama: ${config.botName}`,
        `Prefix: ${prefix}`,
        `Total fitur: ${visibleFeatures.length}`,
        "",
        "*Info Server Bot*",
        `Runtime: ${formatUptime(process.uptime())}`,
        `Memory: ${formatMemory(memory.rss)}`,
        `Platform: ${process.platform}`,
        `Node.js: ${process.version}`,
        "",
        "Pilih kategori fitur melalui tombol list di bawah.",
    ].join("\n");
}

function createCategoryCaption({ category, prefix, config }) {
    const commands = category.features
        .map((feature, index) => {
            const commandList = feature.commands.map((command) => `${prefix}${command}`).join(" / ");
            const description = feature.description ? `\n   ${feature.description}` : "";
            return `${index + 1}. ${commandList}${description}`;
        })
        .join("\n\n");

    return [
        `*${config.botName}*`,
        `*${category.name} Menu*`,
        "",
        commands || "Belum ada fitur pada kategori ini.",
        "",
        "Pilih kategori lain melalui tombol list di bawah.",
    ].join("\n");
}

async function sendListMenu({ Rafael, m, caption, sections, config }) {
    const payload = {
        text: caption,
        title: config.botName,
        footer: "Nayaara-Bot Menu",
        buttonText: "List Menu",
        sections,
        contextInfo: {
            externalAdReply: {
                title: config.botName,
                body: "WhatsApp Bot",
                thumbnailUrl: THUMBNAIL_URL,
                sourceUrl: THUMBNAIL_URL,
                mediaType: 1,
                renderLargerThumbnail: true,
            },
        },
    };

    try {
        await Rafael.sendMessage(m.chat, payload, { quoted: m });
    } catch (error) {
        const fallbackRows = sections
            .flatMap((section) => section.rows || [])
            .map((row, index) => `${index + 1}. ${row.title}\n   Ketik: ${row.rowId}`)
            .join("\n");

        await Rafael.sendMessage(m.chat, {
            image: { url: THUMBNAIL_URL },
            caption: [caption, "", "*List Menu*", fallbackRows].join("\n"),
        }, { quoted: m });
    }
}

module.exports = {
    name: "menu",
    commands: ["menu", "help"],
    category: "Info",
    description: "Menampilkan semua command yang tersedia.",
    async execute({ Rafael, m, features, prefix, config, isCreator, args }) {
        const categories = getMenuCategories(features, isCreator);
        const sections = createCategorySections(categories, prefix);
        const requestedCategory = args[0] ? findCategory(categories, args[0]) : null;
        const caption = requestedCategory
            ? createCategoryCaption({ category: requestedCategory, prefix, config })
            : createInitialCaption({ config, prefix, features, isCreator });

        if (args[0] && !requestedCategory) {
            await m.reply("Kategori menu tidak ditemukan. Silakan pilih dari list menu.");
        }

        await sendListMenu({
            Rafael,
            m,
            caption,
            sections,
            config,
        });
    },
};
