'use strict';

// based on https://www.npmjs.com/package/rc

var fs = require('fs'),
    nodeEval = require('node-eval'),
    getEnv = require('./env'),
    possibleConfigs = require('./possible-configs');

function findAllConfigs(options) {
    var realFiles = possibleConfigs(options).filter(function(file) {
        try {
            return fs.statSync(file).isFile();
        } catch (err) {
            if (err.code === 'ENOENT') { return false; }
            throw err;
        }
    });

    return realFiles.reduce(function(configs, file) {
        var parsedConfig;

        try {
            parsedConfig = require(file);
        } catch (err) {
            //
        }

        if (!parsedConfig) {
            try {
                parsedConfig = nodeEval('(' + fs.readFileSync(file, 'utf8') + ')');
            } catch (err) {
                //
            }
        }

        if (!parsedConfig) { return configs; }

        parsedConfig.__source = file;
        configs.push(parsedConfig);

        return configs;
    }, []);
}

module.exports = function(options) {
    options || (options = {});

    var name = options.name || 'bem',
        env = getEnv(name + '_'),
        configs = findAllConfigs({
            start: options.cwd || process.cwd(),
            fsRoot: options.fsRoot,
            home: options.fsHome,
            name: name,
            argv: options.argv,
            env: env
        });

    return [options.defaults || {}].concat(configs, Object.keys(env).length ? env : [], options.extendBy).filter(Boolean);
};
