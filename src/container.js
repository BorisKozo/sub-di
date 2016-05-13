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

    if (!this.allNames.has(name)) {
        throw new Error(`an item with the given name ${name} doesn't exist`);
    }
}

function buildGraph(name, allItems) {
    const visited = new Set();
    const stack = [name];
    const edges = [];

    while (stack.length > 0) {
        const currentName = _.last(stack);
        verifyName(currentName, allItems);
        visited.add(currentName);
        const item = allItems.get(currentName);
        _.forEach(item.dependencies, (dependency) => {
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
    const itemData = allItems.get(name);
    const args = [];
    _.forEach(itemData.options.dependencies, (dependency) => {
        if (singletones.has(dependency)) {
            args.push(singletones.get(dependency))
        } else {
            if (reuseInstances) {
                args.push(computed.get(dependency));
            } else {
                args.push(computeValue(dependency));
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

class IocContainer {
    constructor() {
        this._singletones = new Map();
        this._items = new Map();
    }


    set(name, getter, options = {}) {
        if (!_.isString(name)) {
            throw new TypeError(`name must be a string but ${typeof name} was sent`);
        }

        if (!_.isFunction(getter)) {
            throw new TypeError(`getter must be a function but ${typeof getter} was sent`)
        }

        if (this._items.has(name) && options.force !== true) {
            throw new Error(`an item with the given name ${name} already exists`);
        }

        options.dependencies = options.dependencies || getter['@dependencies'] || getParamNames(getter);

        this._items.set(name, {
            getter,
            options
        })
    }

    call(name, reuseInstances = false, thisObj = undefined) {

        if (this._singletones.has(name)) {
            return this._singletones.get(name);
        }
        const computed = new Map();
        const graph = buildGraph(name, this._items);
        const ordered = toposort().array(graph.nodes, graph.edges);

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