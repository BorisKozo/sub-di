const IocContainer = require('./../src/container');
const expect = require('chai').expect;

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
});