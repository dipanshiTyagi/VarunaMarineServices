// config-overrides.js - provide a simple override function and keep the log message
module.exports = function override(config, env) {
    console.log("ESLint configuration conflict requires manual intervention. Please follow the instructions to bypass the check.");
    return config;
};