function groupByCategory(features, isCreator) {
    const visibleFeatures = features.filter((feature) => isCreator || !feature.ownerOnly);

    return visibleFeatures.reduce((groups, feature) => {
        const category = feature.category || "Lainnya";
        groups[category] = groups[category] || [];
        groups[category].push(feature);
        return groups;
    }, {});
}

module.exports = {
    name: "menu",
    commands: ["menu", "help"],
    category: "Info",
    description: "Menampilkan semua command yang tersedia.",
    async execute({ Rafael, m, features, prefix, config, isCreator }) {
        const grouped = groupByCategory(features, isCreator);
        const sections = Object.entries(grouped).map(([category, categoryFeatures]) => {
            const commands = categoryFeatures
                .map((feature) => `• ${feature.commands.map((command) => `${prefix}${command}`).join(" / ")}`)
                .join("\n");
            return `*${category}*\n${commands}`;
        });

        const menuText = [
            `🤖 *${config.botName}*`,
            `Prefix: ${prefix}`,
            "",
            ...sections,
        ].join("\n");

        await Rafael.sendMessage(m.chat, { text: menuText }, { quoted: m });
    },
};
