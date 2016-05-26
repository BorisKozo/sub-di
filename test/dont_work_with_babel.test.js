const IocContainer = require('./../src/container');
const expect = require('chai').expect;
const sinon = require('sinon');

describe('Container', ()=> {
    let container;
    beforeEach(()=> {
        container = new IocContainer();
    });


    describe('get', () => {

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

                const result = container.get('A');
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

                const result = container.get('A');
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

                const result = container.get('A');
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

                const result = container.get('A', true);
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

                const result = container.get('A');
                expect(result).to.be.equal(840);
            });
        });
    });




});