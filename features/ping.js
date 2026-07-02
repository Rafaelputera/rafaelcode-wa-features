function formatBytes(bytes) {
    const value = Number(bytes) || 0;
    const units = ["B", "KB", "MB", "GB"];
    let size = value;
    let index = 0;

    while (size >= 1024 && index < units.length - 1) {
        size /= 1024;
        index += 1;
    }

    return `${size.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function formatRuntime(seconds) {
    const total = Math.floor(Number(seconds) || 0);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const remainingSeconds = total % 60;

    return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

module.exports = {
    name: "ping",
    commands: ["ping", "speed"],
    category: "Info",
    description: "Cek response time dan status bot.",
    async execute({ m }) {
        const start = Date.now();
        await m.reply("Pong...");
        const latency = Date.now() - start;
        const memory = process.memoryUsage();

        await m.reply([
            "*Bot Status*",
            `Latency: ${latency} ms`,
            `Uptime: ${formatRuntime(process.uptime())}`,
            `Memory: ${formatBytes(memory.rss)}`,
        ].join("\n"));
    },
};
