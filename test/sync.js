'use strict';

const path = require('path');
const test = require('ava');
const mock = require('mock-fs');
const mockFsHelper = require(path.join(__dirname, 'lib', 'mock-fs-helper'));
const rc = require('../').sync;
const nodeModules = mockFsHelper.duplicateFSInMemory(path.resolve('..', 'node_modules'));
const osHomedir = require('os-homedir')();

const initialCwd = process.cwd();

test.afterEach(() => {
    mock.restore();
    process.chdir(initialCwd);
});

test('should return empty config if no config found', t => {
    mock({
        node_modules: nodeModules
    });

    t.deepEqual(rc(), [{}]);
});

test('should return config defaults', t => {
    mock({
        node_modules: nodeModules
    });

    t.deepEqual(rc({ defaults: { test: 1 } }), [{ test: 1 }]);
});

test('should find configs in home dir', t => {
    const mockOpts = {
        node_modules: nodeModules
    };

    const sources = [
        ['.config', 'bem', 'config'], // ~/.config/bem/config
        ['.bem', 'config'],           // ~/.bem/config
        ['.bemrc']                    // ~/.bemrc
    ];

    sources.forEach((pathToConf, idx) => {
        mockOpts[path.join(osHomedir, ...pathToConf)] = `{"test": ${idx}}`;
    });

    mock(mockOpts);

    const expected = [{}].concat(sources.map((source, idx) => ({
        test: idx,
        __source: path.join(osHomedir, ...source)
    })));

    const actual = rc();

    t.deepEqual(expected, actual);
});

test('should find configs with custom name in home dir', t => {
    const mockOpts = {
        node_modules: nodeModules
    };

    const sources = [
        ['.config', 'bla', 'config'], // ~/.config/bla/config
        ['.bla', 'config'], // ~/.bla/config
        ['.blarc']          // ~/.blarc
    ];

    sources.forEach((pathToConf, idx) => {
        mockOpts[path.join(osHomedir, ...pathToConf)] = `{"test": ${idx}}`;
    });

    mock(mockOpts);

    const expected = [{}].concat(sources.map((source, idx) => ({
        test: idx,
        __source: path.join(osHomedir, ...source)
    })));

    const actual = rc({ name: 'bla' });

    t.deepEqual(actual, expected);
});

test('should find config by argv', t => {
    mock({
        node_modules: nodeModules,
        '/test/.bemrc': '{"test": 1}'
    });

    process.argv.push('--config=/test/.bemrc');

    t.deepEqual(rc(), [{}, { test: 1, __source: '/test/.bemrc' }]);

    process.argv.pop();
});

test('should find config by argv passed via opts', t => {
    mock({
        node_modules: nodeModules,
        '/test/.bemrc': '{"test": 1}'
    });

    const expected = [{}, { test: 1, __source: '/test/.bemrc' }];

    const actual = rc({
        argv: { config: '/test/.bemrc' }
    });

    t.deepEqual(actual, expected);
});

test('should find config by ENV', t => {
    mock({
        node_modules: nodeModules,
        '/test/.bemrc': '{"test": 1}'
    });

    process.env.bem_config = '/test/.bemrc';

    t.deepEqual(rc(), [
        {},
        { test: 1, __source: '/test/.bemrc' },
        { config: '/test/.bemrc' }
    ]);

    delete process.env.bem_config;
});

test('should use config field passed via ENV', t => {
    mock({
        node_modules: nodeModules,
    });

    process.env.bem_test = 1;

    t.deepEqual(rc(), [{}, { test: '1' }]);

    delete process.env.bem_test;
});

test('should find config by ENV with different name', t => {
    const name = 'ololo';

    mock({
        node_modules: nodeModules,
        '/test/.bemrc': '{"test": 1}'
    });

    process.env[name + '_test'] = 1;
    process.env[name + '_something__subtest'] = 1;

    t.deepEqual(rc({
        name: name
    }), [{}, { test: '1', something: { subtest: '1' } }]);

    delete process.env[name + '_test'];
    delete process.env[name + '_something__subtest'];
});

test('should find config in current folder', t => {
    mock({
        node_modules: nodeModules,
        '.bemrc': '{"test": 1}'
    });

    t.deepEqual(rc(), [{}, { test: 1, __source: path.join(process.cwd(), '.bemrc') }]);
});

test('should find config with custom name in current folder', t => {
    mock({
        node_modules: nodeModules,
        '.ololorc': '{"test": 1}'
    });

    t.deepEqual(rc({ name: 'ololo' }), [{}, { test: 1, __source: path.join(process.cwd(), '.ololorc') }]);
});

test('should find configs in different folders', t => {
    mock({
        node_modules: nodeModules,
        grandparent: {
            parent: {
                cwd: {
                    '.bemrc': '{"test": 1}'
                },
                '.bemrc': '{"test": 2}'
            },
            '.bemrc': '{"test": 3}'
        }
    });

    process.chdir(path.join('grandparent', 'parent', 'cwd'));

    t.deepEqual(rc(), [
        {},
        { test: 3, __source: path.resolve(initialCwd, 'grandparent', '.bemrc') },
        { test: 2, __source: path.resolve(initialCwd, 'grandparent', 'parent', '.bemrc') },
        { test: 1, __source: path.resolve(initialCwd, 'grandparent', 'parent', 'cwd', '.bemrc') }
    ]);
});

test('should find configs in custom cwd', t => {
    mock({
        node_modules: nodeModules,
        grandparent: {
            parent: {
                cwd: {
                    '.bemrc': '{"test": 1}'
                },
                '.bemrc': '{"test": 2}'
            },
            '.bemrc': '{"test": 3}'
        }
    });

    t.deepEqual(rc({ cwd: path.resolve('grandparent', 'parent', 'cwd') }), [
        {},
        { test: 3, __source: path.resolve(initialCwd, 'grandparent', '.bemrc') },
        { test: 2, __source: path.resolve(initialCwd, 'grandparent', 'parent', '.bemrc') },
        { test: 1, __source: path.resolve(initialCwd, 'grandparent', 'parent', 'cwd', '.bemrc') }
    ]);
});

test('should use .bemrc from /', t => {
    mock({
        node_modules: nodeModules,
        '/.bemrc': '{"test": "root"}',
    });

    t.deepEqual(rc(), [
        {},
        { test: 'root', __source: path.join('/', '.bemrc') },
    ]);
});

test('should traverse to fsRoot', t => {
    mock({
        node_modules: nodeModules,
        '/.bemrc': '{"test": "root"}',
        '.bemrc': '{"test": 1}'
    });

    t.deepEqual(rc({ fsRoot: initialCwd }), [
        {},
        { test: 1, __source: path.resolve(initialCwd, '.bemrc') },
    ]);
});

test('should use fsHome', t => {
    const mockOpts = {
        node_modules: nodeModules,
        home: {
            '.bemrc': '{"test": 1}'
        }
    };

    mockOpts[path.join(osHomedir, '.bemrc')] = '{"test": "home"}';

    mock(mockOpts);

    t.deepEqual(rc({ fsHome: path.join(initialCwd, 'home'), fsRoot: initialCwd }), [
        {},
        { test: 1, __source: path.resolve(initialCwd, 'home', '.bemrc') },
    ]);
});

test('should filter same configs in proper order', t => {
    const mockOpts = {
        '/.bemrc': '{"test": "root"}',
        node_modules: nodeModules
    };

    const source = path.join(osHomedir, '.bemrc');

    mockOpts[source] = '{"test": 1}'; // ~/.bemrc

    mock(mockOpts);

    const expected = [{}, { test: 'root', __source: '/.bemrc' }, { test: 1, __source: source }];

    const actual = rc();

    t.deepEqual(expected, actual);
});

test('should find different types of configs', t => {
    const mockOpts = {
        node_modules: nodeModules,
        '/.bemrc': '{"test": "root"}',
        '/argv/.bemrc': '{"test": "argv"}',
        '/env/config/.bemrc': '{"test": "env"}',
        grandparent: {
            parent: {
                cwd: {
                    '.bemrc': '{"test": 1}'
                },
                '.bemrc': '{"test": 2}'
            },
            '.bemrc': '{"test": 3}'
        }
    };

    mockOpts[path.join(osHomedir, '.bemrc')] = '{"test": "home"}';

    mock(mockOpts);

    process.chdir(path.join('grandparent', 'parent', 'cwd'));

    process.env.bem_test = 4;
    process.env.bem_config = '/env/config/.bemrc';
    process.argv.push('--config=/argv/.bemrc');

    const expected = [
        { test: 'default' },
        { test: 'root', __source: path.resolve('/', '.bemrc') },
        { test: 'home', __source: path.join(osHomedir, '.bemrc') },
        { test: 3, __source: path.resolve(initialCwd, 'grandparent', '.bemrc') },
        { test: 2, __source: path.resolve(initialCwd, 'grandparent', 'parent', '.bemrc') },
        { test: 1, __source: path.resolve(initialCwd, 'grandparent', 'parent', 'cwd', '.bemrc') },
        { test: 'env', __source: path.resolve('/', 'env', 'config', '.bemrc') },
        { test: 'argv', __source: path.resolve('/', 'argv', '.bemrc') },
        { test: '4', config: '/env/config/.bemrc' },
    ];

    const actual = rc({ defaults: { test: 'default' } });

    t.deepEqual(actual, expected);

    delete process.env.bem_test;
    delete process.env.bem_config;
    process.argv.pop();
});
