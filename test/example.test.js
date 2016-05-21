const expect = require('chai').expect;

describe('example',()=>{
   it('basic example code',()=>{
       function foo(bar){
           return (bar.someData);
       }

       function bar(){
           return {
               someData: 1234
           };
       }

       const subDi = require('./../main')();
       subDi.set(foo);
       subDi.set(bar);
       const result = subDi.get('foo'); //prints 1234
       expect(result).to.be.equal(1234);
   });

    it('more complex example',() =>{
        const subDi = require('./../main')('myModule');
        const foo = function(idGenerator){
            return {
                id:idGenerator.getId()
            };
        };

        subDi.set('fooObj', foo,{
            isSingleton:true,
            dependencies:['Id Generator']
        });

        let count = 0;
        const idGenerator = function(){
            return {
                getId(){
                    return count++;
                }
            }
        };


        subDi.set('Id Generator',idGenerator);

        expect(subDi.get('fooObj').id).to.be.equal(0); //0
        expect(subDi.get('fooObj').id).to.be.equal(0); // still 0 because fooObj is a singleton and will not be created again
    });
});
