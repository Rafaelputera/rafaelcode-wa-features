const runtime = require("./features/runtime");
const menu = require("./features/menu");
const backup = require("./features/backup");
const dbstats = require("./features/dbstats");
const sticker = require("./features/sticker");

const features = [
    runtime,
    menu,
    sticker,
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
