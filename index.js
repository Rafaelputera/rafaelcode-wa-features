const runtime = require("./features/runtime");
const menu = require("./features/menu");
const ping = require("./features/ping");
const botInfo = require("./features/bot-info");
const owner = require("./features/owner");
const ai = require("./features/ai");
const backup = require("./features/backup");
const dbstats = require("./features/dbstats");
const settings = require("./features/settings");
const sticker = require("./features/sticker");
const toImage = require("./features/to-image");
const checkId = require("./features/check-id");
const groupTools = require("./features/group-tools");
const antiLink = require("./features/anti-link");
const autoPresence = require("./features/auto-presence");
const welcomeGoodbye = require("./features/welcome-goodbye");
const moderation = require("./features/moderation");
const broadcast = require("./features/broadcast");
const profile = require("./features/profile");
const users = require("./features/users");
const upch = require("./features/upch");

const features = [
    runtime,
    menu,
    ping,
    botInfo,
    owner,
    ai,
    settings,
    sticker,
    toImage,
    checkId,
    groupTools,
    antiLink,
    autoPresence,
    welcomeGoodbye,
    moderation,
    broadcast,
    profile,
    users,
    upch,
    backup,
    dbstats,
];

function createFeatures() {
    return features.map((feature) => ({
        ...feature,
        commands: [...feature.commands],
    }));
}

module.exports = {
    createFeatures,
    features,
};
