const IocContainer = require('./../src/container');
const expect = require('chai').expect;
const sinon = require('sinon');

describe('Container', ()=> {
    let container;
    beforeEach(()=> {
        container = new IocContainer();
    });

    describe('set', ()=> {
        describe('Simple use', ()=> {
            it('should add a valid getter', ()=> {
                const func = function () {
                };
                container.set('hello', func);
                expect(container._items.size).to.be.equal(1);
                expect(container._items.get('hello')).to.be.ok;
                expect(container._items.get('hello').getter).to.be.equal(func);
            });

            it('should add a valid getter with dependencies', ()=> {
                const func = function (foo, bar) {
                    foo.bar = bar;
                };
                container.set('hello', func);
                expect(container._items.size).to.be.equal(1);
                expect(container._items.get('hello')).to.be.ok;
                expect(container._items.get('hello').options).to.be.ok;
                expect(container._items.get('hello').options.dependencies).to.be.eql(['foo', 'bar']);
            });

            it('should add a valid getter with getter dependencies', ()=> {
                const func = function (foo, bar) {
                    foo.bar = bar;
                };
                func['@dependencies'] = ['baz', 'bad'];
                container.set('hello', func);
                expect(container._items.size).to.be.equal(1);
                expect(container._items.get('hello')).to.be.ok;
                expect(container._items.get('hello').options).to.be.ok;
                expect(container._items.get('hello').options.dependencies).to.be.eql(['baz', 'bad']);
            });

            it('should add a valid getter with external dependencies', ()=> {
                const options = {};
                const func = function (foo, bar) {
                    foo.bar = bar;
                };
                options.dependencies = ['baz', 'bad'];
                container.set('hello', func, options);
                expect(container._items.size).to.be.equal(1);
                expect(container._items.get('hello')).to.be.ok;
                expect(container._items.get('hello').options).to.be.ok;
                expect(container._items.get('hello').options.dependencies).to.be.eql(['baz', 'bad']);
            });

            it('should add a valid getter with force', ()=> {
                const func = function () {
                };
                container.set('hello', func);
                const func2 = function () {

                };
                container.set('hello', func2, {force: true});
                expect(container._items.size).to.be.equal(1);
                expect(container._items.get('hello')).to.be.ok;
                expect(container._items.get('hello').getter).to.be.equal(func2);
            });

        });

        describe('Errors', () => {
            it('should throw if the name was not a string', ()=> {
                expect(function () {
                    container.set({}, ()=> {
                    });
                }).to.throw('name must be a string');
            });

            it('should throw if the getter was not a function', ()=> {
                expect(function () {
                    container.set('my item', {});
                }).to.throw('getter must be a function');
            });

            it('should throw if two getters with the same name are registered', ()=> {
                expect(function () {
                    container.set('my item', ()=> {
                    });
                    container.set('my item', ()=> {
                    });
                }).to.throw('an item with the given name');
            });
        });
    });

    describe('call', () => {
        describe('No dependency', ()=> {
            it('should call a simple getter', () => {
                const obj = {
                    foo: 'bar'
                };
                const func = function () {
                    return obj;
                };
                const funcSpy = sinon.spy(func);
                container.set('A', func);
                const result = container.call('A');
                expect(result).to.be.equal(obj);
                //expect(funcSpy.calledOnce).to.be.true;
            });

            it('should call a simple getter and get a new object', () => {
                let i = 0;
                const func = ()=> {
                    return i;
                };
                container.set('A', func);
                let result = container.call('A');
                expect(result).to.be.equal(0);
                i++;
                result = container.call('A');
                expect(result).to.be.equal(1);
            });

            it('should call a simple getter singleton and get the same object', () => {
                let i = 0;
                const func = ()=> {
                    return i;
                };
                const options = {
                    isSingleton: true
                };

                container.set('A', func, options);
                let result = container.call('A');
                expect(result).to.be.equal(0);
                i++;
                result = container.call('A');
                expect(result).to.be.equal(0);
            });

            it('should call a simple getter singleton and get the same object (alternative)', () => {
                let i = 0;
                const func = ()=> {
                    return i;
                };

                func['@isSingleton'] = true;

                container.set('A', func);
                let result = container.call('A');
                expect(result).to.be.equal(0);
                i++;
                result = container.call('A');
                expect(result).to.be.equal(0);
            });
        });

        describe('One dependency', () => {
            it('should call a simple getter', ()=> {
                const funcA = function () {
                    return 10;
                };
                const funcB = function (A) {
                    return A * 3;
                };
                container.set('B', funcB);
                container.set('A', funcA);
                const result = container.call('B');
                expect(result).to.be.equal(30);
            });

            it('should call a simple singleton getter', ()=> {
                let number = 5;
                const funcA = function () {
                    return number;
                };
                funcA['@isSingleton'] = true;
                const funcB = function (A) {
                    return A * 3;
                };
                container.set('B', funcB);
                container.set('A', funcA);
                container.call('B');
                number = 10;
                const result = container.call('B');
                expect(result).to.be.equal(15);
            });

            it('should call a simple singleton getter (reversed)', ()=> {
                let number = 5;
                const funcA = function () {
                    return number;
                };
                const funcB = function (A) {
                    return A * 3;
                };
                funcB['@isSingleton'] = true;

                container.set('A', funcA);
                container.set('B', funcB);
                container.call('B');
                number = 10;
                const result = container.call('B');
                expect(result).to.be.equal(15);
            });
        });

        describe('Multiple dependencies', () => {
            let funcA;
            let funcB;
            let funcC;
            let funcD;
            let funcE;
            let d;
            let e;

            beforeEach(()=> {
                // A needs B,C
                // B needs D
                // C needs D and E
                // D needs nothing
                // E needs nothing

                d = 11;
                e = 23;
                funcA = (B, C) => {
                    return B * C;
                };

                funcB = (D) => {
                    return D * 2;
                };

                funcC = (E, D) => {
                    return E + D;
                };

                funcD = function () {
                    return d;
                };

                funcE = function () {
                    return e;
                };
            });
            it('should calculate a value', ()=> {
                container.set('A', funcA);
                container.set('B', funcB);
                container.set('C', funcC);
                container.set('D', funcD);
                container.set('E', funcE);

                const result = container.call('A');
                expect(result).to.be.equal((d * 2) * (e + d));
            });

            it('should calculate value with progressive D', () => {
                funcD = function () {
                    d += 1;
                    return d;
                };

                container.set('A', funcA);
                container.set('B', funcB);
                container.set('C', funcC);
                container.set('D', funcD);
                container.set('E', funcE);

                const result = container.call('A');
                expect(result).to.be.equal(1170);
            });

            it('should calculate value with static D', () => {
                funcD = function () {
                    d += 1;
                    return d;
                };

                container.set('A', funcA);
                container.set('B', funcB);
                container.set('C', funcC);
                container.set('D', funcD, {reuse: true});
                container.set('E', funcE);

                const result = container.call('A');
                expect(result).to.be.equal(840);
            });

            it('should calculate value with static D (alternative)', () => {
                funcD = function () {
                    d += 1;
                    return d;
                };

                container.set('A', funcA);
                container.set('B', funcB);
                container.set('C', funcC);
                container.set('D', funcD);
                container.set('E', funcE);

                const result = container.call('A', true);
                expect(result).to.be.equal(840);
            });

            it('should calculate value with singleton D', () => {
                funcD = function () {
                    d += 1;
                    return d;
                };

                container.set('A', funcA);
                container.set('B', funcB);
                container.set('C', funcC);
                container.set('D', funcD, {isSingleton: true});
                container.set('E', funcE);

                const result = container.call('A');
                expect(result).to.be.equal(840);
            });
        });

        describe('Errors', () => {
            it('should throw if trying to call non existing name', ()=> {
                expect(function () {
                    container.call('B');
                }).to.throw('an item with the given name');
            });

            it('should throw if a non existing dependency is used', ()=> {
                container.set('A', function (B) {

                });
                expect(function () {
                    container.call('A');
                }).to.throw('an item with the given name');
            });

            it('should throw if cyclic dependency is found', ()=> {
                container.set('A', function (B) {

                });
                container.set('B', function (A) {

                });
                expect(function () {
                    container.call('A');
                }).to.throw('Cyclic dependency');

            });
        });

    });

    describe('setFunction', ()=> {
        describe('Simple use', ()=> {
            it('should add a valid getter', ()=> {
                function hello() {
                }

                container.setFunction(hello);
                expect(container._items.size).to.be.equal(1);
                expect(container._items.get('hello')).to.be.ok;
                expect(container._items.get('hello').getter).to.be.equal(hello);
            });

            it('should add a valid getter with external dependencies', ()=> {
                const options = {};

                function hello(foo, bar) {
                    foo.bar = bar;
                }

                options.dependencies = ['baz', 'bad'];
                container.setFunction(hello, options);
                expect(container._items.size).to.be.equal(1);
                expect(container._items.get('hello')).to.be.ok;
                expect(container._items.get('hello').options).to.be.ok;
                expect(container._items.get('hello').options.dependencies).to.be.eql(['baz', 'bad']);
            });
        });

        describe('Errors', () => {

            it('should throw if the getter was not a function', ()=> {
                expect(function () {
                    container.setFunction({});
                }).to.throw('getter must be a function');
            });

            it('should throw if getter has no name', ()=> {
                expect(function () {
                    container.setFunction(()=> {
                    });
                }).to.throw('function name must be set');
            });
        });
    });

    describe('setNodeModules', ()=> {
        describe('Simple use', ()=> {
            it('should add a node module', ()=> {
                container.setNodeModules('lodash');
                const _ = container.call('lodash');
                const lodash = require('lodash');
                expect(_).to.be.equal(lodash);
            });

            it('should add several node modules', ()=> {
                container.setNodeModules(['lodash', 'mocha']);
                const lodash = container.call('lodash');
                const mocha = container.call('mocha');
                expect(lodash).to.be.ok;
                expect(mocha).to.be.ok;
            });
        });

        describe('Errors', () => {

            it('should call a callback if there is an error', (done)=> {
                container.setNodeModules('daasdasdadad', function (err) {
                    expect(err).to.be.ok;
                    done();
                });
            });

            it('should call a callback if there is an error but add others', ()=> {
                container.setNodeModules(['daasdasdadad', 'lodash'], function (err) {
                    expect(err).to.be.ok;
                });
                const lodash = container.call('lodash');
                expect(lodash).to.be.ok;
            });
        });
    });
});