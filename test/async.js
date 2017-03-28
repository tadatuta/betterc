'use strict';

const path = require('path');
const test = require('ava');
const mock = require('mock-fs');
const rc = require('../');
const osHomedir = require('os-homedir')();

const initialCwd = process.cwd();

test.afterEach(() => {
    mock.restore();
    process.chdir(initialCwd);
});

test('should return empty config if no config found', async t => {
    mock({});

    const actual = await rc();
    const expected = [{}];

    t.deepEqual(actual, expected);
});

test('should return config defaults', async t => {
    mock({});

    const expected = [{ test: 1 }];
    const actual = await rc({ defaults: { test: 1 } });

    t.deepEqual(actual, expected);
});

test('should find configs in home dir', async t => {
    const mockOpts = {};

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

    const actual = await rc();

    t.deepEqual(actual, expected);
});

test('should find configs with custom name in home dir', async t => {
    const mockOpts = {};

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

    const actual = await rc({ name: 'bla' });
    // const actual = { name: 'bla' };

    t.deepEqual(actual, expected);
});

test('should find config by argv', async t => {
    mock({
        '/test/.bemrc': '{"test": 1}'
    });

    process.argv.push('--config=/test/.bemrc');

    const actual = await rc();
    const expected = [{}, { test: 1, __source: '/test/.bemrc' }];

    t.deepEqual(actual, expected);

    process.argv.pop();
});

test('should find config by argv passed via opts', async t => {
    mock({
        '/test/.bemrc': '{"test": 1}'
    });

    const expected = [{}, { test: 1, __source: '/test/.bemrc' }];

    const actual = await rc({
        argv: { config: '/test/.bemrc' }
    });

    t.deepEqual(actual, expected);
});

test('should find config by ENV', async t => {
    mock({
        '/test/.bemrc': '{"test": 1}'
    });

    process.env.bem_config = '/test/.bemrc';

    const actual = await rc();
    const expected = [
        {},
        { test: 1, __source: '/test/.bemrc' },
        { config: '/test/.bemrc' }
    ];

    t.deepEqual(actual, expected);

    delete process.env.bem_config;
});

test('should use config field passed via ENV', async t => {
    mock({});

    process.env.bem_test = 1;

    const actual = await rc();
    const expected = [{}, { test: '1' }];

    t.deepEqual(actual, expected);

    delete process.env.bem_test;
});

test('should find config by ENV with different name', async t => {
    const name = 'ololo';

    mock({
        '/test/.bemrc': '{"test": 1}'
    });

    process.env[name + '_test'] = 1;
    process.env[name + '_something__subtest'] = 1;

    const actual = await rc({
        name: name
    });
    const expected = [{}, { test: '1', something: { subtest: '1' } }];

    t.deepEqual(actual, expected);

    delete process.env[name + '_test'];
    delete process.env[name + '_something__subtest'];
});

test('should find config in current folder', async t => {
    mock({
        '.bemrc': '{"test": 1}'
    });

    const actual = await rc();
    const expected = [{}, { test: 1, __source: path.join(process.cwd(), '.bemrc') }];

    t.deepEqual(actual, expected);
});

test('should find config with custom name in current folder', async t => {
    mock({
        '.ololorc': '{"test": 1}'
    });

    const actual = await rc({ name: 'ololo' });
    const expected = [{}, { test: 1, __source: path.join(process.cwd(), '.ololorc') }];

    t.deepEqual(actual, expected);
});

test('should find configs in different folders', async t => {
    mock({
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

    const actual = await rc();
    const expected = [
        {},
        { test: 3, __source: path.resolve(initialCwd, 'grandparent', '.bemrc') },
        { test: 2, __source: path.resolve(initialCwd, 'grandparent', 'parent', '.bemrc') },
        { test: 1, __source: path.resolve(initialCwd, 'grandparent', 'parent', 'cwd', '.bemrc') }
    ];

    t.deepEqual(actual, expected);
});

test('should find configs in custom cwd', async t => {
    mock({
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

    const actual = await rc({ cwd: path.resolve('grandparent', 'parent', 'cwd') });
    const expected = [
        {},
        { test: 3, __source: path.resolve(initialCwd, 'grandparent', '.bemrc') },
        { test: 2, __source: path.resolve(initialCwd, 'grandparent', 'parent', '.bemrc') },
        { test: 1, __source: path.resolve(initialCwd, 'grandparent', 'parent', 'cwd', '.bemrc') }
    ];

    t.deepEqual(actual, expected);
});

test('should use .bemrc from /', async t => {
    mock({
        '/.bemrc': '{"test": "root"}',
    });

    const actual = await rc();
    const expected = [
        {},
        { test: 'root', __source: path.join('/', '.bemrc') },
    ];

    t.deepEqual(actual, expected);
});

test('should traverse to fsRoot', async t => {
    mock({
        '/.bemrc': '{"test": "root"}',
        '.bemrc': '{"test": 1}'
    });

    const actual = await rc({ fsRoot: initialCwd });
    const expected = [
        {},
        { test: 1, __source: path.resolve(initialCwd, '.bemrc') },
    ];

    t.deepEqual(actual, expected);
});

test('should use fsHome', async t => {
    const mockOpts = {
        home: {
            '.bemrc': '{"test": 1}'
        }
    };

    mockOpts[path.join(osHomedir, '.bemrc')] = '{"test": "home"}';

    mock(mockOpts);

    const actual = await rc({ fsHome: path.join(initialCwd, 'home'), fsRoot: initialCwd });
    const expected = [
        {},
        { test: 1, __source: path.resolve(initialCwd, 'home', '.bemrc') },
    ];

    t.deepEqual(actual, expected);
});

test('should filter same configs in proper order', async t => {
    const mockOpts = {
        '/.bemrc': '{"test": "root"}',
    };

    const source = path.join(osHomedir, '.bemrc');

    mockOpts[source] = '{"test": 1}'; // ~/.bemrc

    mock(mockOpts);

    const actual = await rc();
    const expected = [{}, { test: 'root', __source: '/.bemrc' }, { test: 1, __source: source }];

    t.deepEqual(actual, expected);
});

test('should find different types of configs', async t => {
    const mockOpts = {
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

    const actual = await rc({ defaults: { test: 'default' } });

    t.deepEqual(actual, expected);

    delete process.env.bem_test;
    delete process.env.bem_config;
    process.argv.pop();
});

test('should find different types of configs', async t => {
    const mockOpts = {
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
        { test: 'top most extention' }
    ];

    const actual = await rc({
        defaults: { test: 'default' },
        extendBy: { test: 'top most extention' }
    });

    t.deepEqual(actual, expected);

    delete process.env.bem_test;
    delete process.env.bem_config;
    process.argv.pop();
});
