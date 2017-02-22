'use strict';

var path = require('path'),
    uniq = require('lodash/uniq'),
    minimist = require('minimist'),
    osHomedir = require('os-homedir');

module.exports = function(options) {
    var start = options.start,
        name = options.name,
        fsRoot = options.fsRoot,
        env = options.env,
        argv = options.argv || minimist(process.argv.slice(2)), // TODO: get rid of minimist,
        possibleFiles = getConfsInHome(options.home || osHomedir(), name),
        traversedFiles = [],
        endOfLoop;

    do {
        traversedFiles.push(
            path.join(start, '.' + name + 'rc.js'),
            path.join(start, '.' + name + 'rc.json'),
            path.join(start, '.' + name + 'rc'),
            path.join(start, '.' + name, 'config.js'),
            path.join(start, '.' + name, 'config.json'),
            path.join(start, '.' + name, 'config')
        );

        start = path.dirname(start);

        if (endOfLoop) { break; }

        endOfLoop = path.dirname(start) === start;

    } while (fsRoot ? start === fsRoot : true); // root

    possibleFiles = possibleFiles.concat(traversedFiles.reverse());

    env.config && possibleFiles.push(env.config);
    argv.config && possibleFiles.push(argv.config);

    // Filter from right side
    return uniq(possibleFiles.reverse()).reverse();
};

function getConfsInHome(home, name) {
    return home && [
        [home, '.config', name, 'config'],
        [home, '.config', name],
        [home, '.' + name, 'config'],
        [home, '.' + name + 'rc']
    ]
        .reduce(function(acc, pathChunks) {
            var pathChunksJs = [].concat(pathChunks),
                pathChunksJson = [].concat(pathChunks);

            pathChunksJs[pathChunksJs.length - 1] += '.js';
            pathChunksJson[pathChunksJson.length - 1] += '.json';

            acc.push(pathChunks, pathChunksJson, pathChunksJs);
            return acc;
        }, [])
        .map(function(pathChunks) {
            return path.join.apply(path, pathChunks);
        }) || [];
}
