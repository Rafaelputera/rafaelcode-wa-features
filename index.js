const runtime = require("./features/runtime");
const menu = require("./features/menu");
const backup = require("./features/backup");
const dbstats = require("./features/dbstats");

const features = [
    runtime,
    menu,
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
