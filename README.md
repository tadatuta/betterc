# betterc

Like [rc](https://github.com/dominictarr/rc) but better ;)

Searches for configs and returns an array of all configs found.

## Installation

```
npm i betterc
```

## Usage

```js
var betterc = require('betterc');
betterc({ name: 'appname' });
betterc.sync({ name: 'appname' });
```

Given your application name (`appname`), `betterc` will look in all the obvious places for configuration:

  * the defaults object you passed in
  * `$HOME/.${appname}rc`
  * `$HOME/.${appname}/config`
  * `$HOME/.config/${appname}`
  * `$HOME/.config/${appname}/config`
  * a local `.${appname}/config` and `.${appname}rc` and all found looking in `./ ../ ../../ ../../../` etc.
  * if you passed environment variable `${appname}_config` then from that file
  * if you passed an option `--config file` then from that file
  * environment variables prefixed with `${appname}_`
    * or use "\_\_" to indicate nested properties <br/> _(e.g. `appname_foo__bar__baz` => `foo.bar.baz`)_

All config files may have or have not `json` or `js` extentions in following order:
```js
[
  `.${appname}rc`,
  `.${appname}rc.json`,
  `.${appname}rc.js`
]
```.

All configuration sources that were found will be added to result array.

## Advanced usage

```js
var betterc = require('betterc');

betterc({ // or betterc.sync for sync version
    name: 'appname',

    cwd: 'current-working-directory',
    argv: {
        config: 'path-to-config'
    },

    fsRoot: '/my-root',     // custom '/' directory, used in tests
    fsHome: '/my-home',     // custom $HOME directory, used in tests

    // initial config to be extended by all the others
    defaults: {
        foo: 'baz'
    },

    // config which will override all the others
    extendBy: {
        foo: 'will-override-baz'
    }
});
```

## Configuration file format

Configuration files (e.g. `.appnamerc`) may be in [json](http://json.org/example) or CommonJS module format:

### JSON
```js
{
  "dependsOn": "0.10.0",
  "commands": {
    "www": "./commands/www",
    "console": "./commands/repl"
  },
  "generators": {
    "options": {
      "engine": "ejs"
    },
    "modules": {
      "new": "generate-new",
      "backend": "generate-backend"
    }
  }
}
```

### CommonJS
```js
module.exports = {
  "dependsOn": "0.10.0",
  "commands": {
    "www": "./commands/www",
    "console": "./commands/repl"
  },
  "generators": {
    "options": {
      "engine": "ejs"
    },
    "modules": {
      "new": "generate-new",
      "backend": "generate-backend"
    }
  }
};
```

> Since env variables do not have a standard for types, your application needs be prepared for strings.


## License

Licensed under the MIT License.
