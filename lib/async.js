'use strict';

var nodeEval = require('node-eval'),
    getEnv = require('./env'),
    fsHelpers = require('./fs-helpers'),
    possibleConfigs = require('./possible-configs'),
    Promise = require('pinkie-promise');

function findAllConfigs(options) {
    var possibleFiles = possibleConfigs(options);

    return Promise.all(possibleFiles.map(fsHelpers.exists)).then(function(exists) {
        var realFiles = possibleFiles.filter(function(file, idx) {
            return exists[idx];
        });

        return Promise.all(realFiles.map(function(file) {
            var parsedConfig;

            try {
                parsedConfig = require(file);
                parsedConfig.__source = file;

                return Promise.resolve(parsedConfig);
            } catch (err) {
                return fsHelpers.read(file).then(function(content) {
                    parsedConfig = nodeEval('(' + content + ')');

                    parsedConfig.__source = file;
                    return parsedConfig;
                });
            }
        }));
    });
}

module.exports = function(options) {
    options || (options = {});

    var name = options.name || 'bem',
        env = getEnv(name + '_');

    return findAllConfigs({
        start: options.cwd || process.cwd(),
        fsRoot: options.fsRoot,
        home: options.fsHome,
        name: name,
        argv: options.argv,
        env: env
    }).then(function(configs) {
        return [options.defaults || {}].concat(configs, Object.keys(env).length ? env : [], options.extendBy).filter(Boolean);
    });
};
