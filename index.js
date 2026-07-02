const runtime = require("./features/runtime");
const menu = require("./features/menu");
const ping = require("./features/ping");
const botInfo = require("./features/bot-info");
const owner = require("./features/owner");
const ai = require("./features/ai");
const backup = require("./features/backup");
const dbstats = require("./features/dbstats");
const sticker = require("./features/sticker");
const toImage = require("./features/to-image");
const checkId = require("./features/check-id");
const groupTools = require("./features/group-tools");
const antiLink = require("./features/anti-link");
const autoPresence = require("./features/auto-presence");

const features = [
    runtime,
    menu,
    ping,
    botInfo,
    owner,
    ai,
    sticker,
    toImage,
    checkId,
    groupTools,
    antiLink,
    autoPresence,
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
