'use strict';

var fs = require('fs'),
    Promise = require('pinkie-promise');

function read(filename) {
    return new Promise(function(resolve, reject) {
        fs.readFile(filename, function(err, content) {
            if (err) { return reject(err); }

            resolve(content.toString());
        });
    });
}

function exists(filename) {
    return new Promise(function(resolve, reject) {
        fs.stat(filename, function(err, stat) {
            if (err) {
                return err.code === 'ENOENT' ? resolve(false) : reject(err);
            }

            resolve(stat.isFile());
        });
    });
}

module.exports = {
    read: read,
    exists: exists
};
