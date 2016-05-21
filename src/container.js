'use strict';

const _ = require('lodash');
const toposort = require('toposort');

const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
const ARGUMENT_NAMES = /([^\s,]+)/g;
function getParamNames(func) {
    const fnStr = func.toString().replace(STRIP_COMMENTS, '');
    let result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if (result === null)
        result = [];
    return result;
}

function verifyName(name, allNames) {
    if (!_.isString(name)) {
        throw new TypeError(`name must be a string but ${typeof name} was sent`);
    }

    if (!allNames.has(name)) {
        throw new Error(`an item with the given name ${name} doesn't exist`);
    }
}

function buildGraph(name, allItems) {
    const visited = new Set();
    const stack = [name];
    const edges = [];


    while (stack.length > 0) {
        const currentName = stack.shift();

        verifyName(currentName, allItems);
        visited.add(currentName);
        const item = allItems.get(currentName);
        _.forEach(item.options.dependencies, (dependency) => {
            if (!visited.has(dependency)) {
                stack.push(dependency);
            }
            edges.push([currentName, dependency]);
        });
    }
    return {
        edges,
        nodes: Array.from(visited)
    };
}

function computeValue(name, allItems, computed, singletones, reuseInstances, thisObj) {
    verifyName(name, allItems);
    if (singletones.has(name)) {
        return singletones.get(name);
    }
    const itemData = allItems.get(name);
    const args = [];
    _.forEach(itemData.options.dependencies, (dependency) => {
        if (singletones.has(dependency)) {
            args.push(singletones.get(dependency))
        } else {
            if (reuseInstances || allItems.get(dependency).options.reuse === true) {
                args.push(computed.get(dependency));
            } else {
                args.push(computeValue(dependency, allItems, computed, singletones, reuseInstances, thisObj));
            }
        }
    });
    const value = itemData.getter.apply(thisObj, args);
    if (itemData.options.isSingleton === true) {
        singletones.set(name, value);
    } else {
        computed.set(name, value);
    }

    return value;
}

const clearName = Symbol('clearName');
const setInternal = Symbol('setInternal');
const setFunction = Symbol('setFunction');
const setSingletonInternal = Symbol('setSingletonInternal');

class IocContainer {

    [clearName](name, force) {
        if (this.has(name) && force !== true) {
            throw new Error(`an item with the given name ${name} already exists`);
        } else {
            this._items.delete(name);
            this._singletones.delete(name);
        }
    }

    [setInternal](name, getter, options = {}) {
        options.dependencies = options.dependencies || getter['@dependencies'] || getParamNames(getter);
        if (!_.has(options, 'isSingleton')) {
            options.isSingleton = getter['@isSingleton'];
        }

        this[clearName](name, options.force);
        this._items.set(name, {
            getter,
            options
        })
    }

    [setFunction](getter, options = {}) {
        const name = options.name || getter['@name'] || getter.name;
        if (_.isEmpty(name)) {
            throw new Error(`name must be set`);
        }

        this[setInternal](name, getter, options);
    }

    [setSingletonInternal](name, value) {
        this[clearName](name);
        this._singletones.set(name, value);
    }

    constructor() {
        this._singletones = new Map();
        this._items = new Map();
    }

    has(name) {
        return this._items.has(name) || this._singletones.has(name);
    }

    /**
     *
     * Overloads:
     * set(func, <options>) -> uses name from options or function to register
     * set(name, object, <options>) -> registers object as singleton
     * set(name, func, <options>) -> registers function
     */
    set(name, getter, options = {}) {
        if (_.isFunction(name)) {
            this[setFunction](name, getter);
            return;
        }

        options = _.clone(options);
        if (!_.isString(name)) {
            throw new TypeError(`name must be a string but ${typeof name} was sent`);
        }

        if (!_.isFunction(getter) || options.isConst === true) {
            if ((_.isObject(getter) || _.isNumber(getter) || _.isBoolean(getter) || _.isString(getter) || options.isConst === true)) {
                this[setSingletonInternal](name, getter);
                return;
            } else {
                throw new TypeError(`getter must be a function or a primitive but ${typeof getter} (${getter}) was sent`)
            }
        }

        this[setInternal](name, getter, options);
    }

    setModules(modules, errorCallback) {
        if (_.isString(modules)) {
            modules = [modules];
        }

        _.forEach(modules, (moduleName)=> {
            try {
                this[clearName](moduleName);
                this[setSingletonInternal](moduleName, require(moduleName));
            }
            catch (err) {
                if (_.isFunction(errorCallback)) {
                    errorCallback(err);
                }
            }
        });
    }

    get(name, reuseInstances = false, thisObj = undefined) {

        if (this._singletones.has(name)) {
            return this._singletones.get(name);
        }
        const computed = new Map();
        const graph = buildGraph(name, this._items);
        const ordered = toposort.array(graph.nodes, graph.edges).reverse();

        _.forEach(ordered, (itemName) => {
            computeValue(itemName, this._items, computed, this._singletones, reuseInstances, thisObj);
        });

        if (this._singletones.has(name)) {
            return this._singletones.get(name);
        }

        if (computed.has(name)) {
            return computed.get(name);
        }

        throw new Error(`Could not find dependency order for ${name}`);
    }
}


module.exports = IocContainer;