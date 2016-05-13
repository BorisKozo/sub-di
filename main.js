'use strict';

const _ = require('lodash');
const namespaces = new Map();
const IocContainer = require('./src/container');


const subDi = function (namespace) {
    if (_.isNil(namespace)) {
        namespace = '';
    }

    if (!namespaces.has(namespace)) {
        namespaces.set(namespace, new IocContainer());
    }

    return namespaces.get(namespace);
};

var globalSymbol = Symbol.for('global.sub-di.singleton');
var globalSymbols = Object.getOwnPropertySymbols(global);
var symbolExists = (globalSymbols.indexOf(globalSymbol) > -1);

if (!symbolExists) {
    global[globalSymbol] = subDi;
}

module.exports = global[subdivisionSymbol];