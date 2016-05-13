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
            it('should calculate a value', ()=> {
                // A needs B,C
                // B needs D
                // C needs D and E
                // D needs nothing
                // E needs nothing

                let d = 11;
                let e = 23;
                const funcA = (B, C) => {
                    return B * C;
                };

                const funcB = (D) => {
                    return D * 2;
                };

                const funcC = (E, D) => {
                    return E + D;
                };

                const funcD = function () {
                    return d;
                };

                const funcE = function () {
                    return e;
                };

                container.set('A', funcA);
                container.set('B', funcB);
                container.set('C', funcC);
                container.set('D', funcD);
                container.set('E', funcE);

                const result = container.call('A');
                expect(result).to.be.equal((d * 2) * (e + d));
            });
        });
    });
});