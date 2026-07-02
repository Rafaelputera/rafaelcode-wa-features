const runtime = require("./features/runtime");
const menu = require("./features/menu");
const owner = require("./features/owner");
const backup = require("./features/backup");
const dbstats = require("./features/dbstats");
const sticker = require("./features/sticker");
const groupTools = require("./features/group-tools");
const antiLink = require("./features/anti-link");
const autoPresence = require("./features/auto-presence");

const features = [
    runtime,
    menu,
    owner,
    sticker,
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
