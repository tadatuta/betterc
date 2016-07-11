'use strict';

module.exports = function getEnv(prefix, env) {
    env || (env = process.env);

    var obj = {},
        prefixLength = prefix.length;

    Object.keys(env)
        .filter(function(key) { return key.indexOf(prefix) === 0; })
        .forEach(function(key) {
            var keypath = key.substring(prefixLength).split('__');

            // Trim empty strings from keypath array
            var _emptyStringIndex;
            while ((_emptyStringIndex = keypath.indexOf('')) > -1) {
                keypath.splice(_emptyStringIndex, 1);
            }

            var cursor = obj;

            keypath.forEach(function _buildSubObj(_subkey, idx) {
                // (check for _subkey first so we ignore empty strings)
                // (check for cursor to avoid assignment to primitive objects)
                if (!_subkey || typeof cursor !== 'object') { return; }

                // If this is the last key, just stuff the value in there
                // Assigns actual value from env variable to final key
                // (unless it's just an empty string- in that case use the last valid key)
                if (idx === keypath.length - 1) {
                    cursor[_subkey] = env[key];
                }

                // Build sub-object if nothing already exists at the keypath
                if (typeof cursor[_subkey] === 'undefined') {
                    cursor[_subkey] = {};
                }

                // Increment cursor used to track the object at the current depth
                cursor = cursor[_subkey];
            });
        });

    return obj;
}
