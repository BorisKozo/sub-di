const expect = require('chai').expect;

describe('Main', ()=> {
    it('should get the same instance of subDi if called twice', ()=> {
        const subDi1 = require('./../main')();
        const subDi2 = require('./../main')();
        expect(subDi1 === subDi2).to.be.true;
    });

    it('should get the same instance of named subDi if called twice', ()=> {
        const subDi1 = require('./../main')('foo');
        const subDi2 = require('./../main')('foo');
        expect(subDi1 === subDi2).to.be.true;
    });

    it('should get different instances of named/unnamed subDi', ()=> {
        const subDi1 = require('./../main')('foo');
        const subDi2 = require('./../main')('bar');
        const subDi3 = require('./../main')();
        expect(subDi1 === subDi2).to.be.false;
        expect(subDi1 === subDi3).to.be.false;
        expect(subDi2 === subDi3).to.be.false;
    });
});
