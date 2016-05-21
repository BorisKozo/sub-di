sub-di - A tiny library for dependency injection and inversion of control in Node.js
==========================================

#### Installation

````npm install sub-di --save````

#### Basic use

````

function foo(bar){
  console.log(bar.someData);
}

function bar(){
  return {
     someData: 1234
  };
}

const subDi = require('sub-di')();
subDi.set(foo);
subDi.set(bar);
subDi.call('foo'); //prints 1234

````

#### Use with multiple files and named dependencies

**foo.js**

````
   
   module.exports = function(idGenerator){
       return {
          id:idGenerator.getId()
       };
   }
   
   module.exports['@isSingleton'] = true; 
   module.exports['@dependencies'] = ['Id Generator']
````

**id_generator.js**

````
   let count = 0;
   module.exports = function(){
      return {
         getId(){
            return count++;
         }
      }
   }
````

**main.js**

````
const subDi = require('sub-di')('myModule'); //named subDi instance
subDi.set('fooObj',require('foo.js'));
subDi.set('Id Generator',require('id_generator.js'));

console.log(subDi.call('fooObj')).id; //0
console.log(subDi.call('fooObj')).id; // still 0 because fooObj is a singleton and will not be created again

````

## Documentation

#### Requiring the module
When requiring the module via a call to ````require('sub-di')```` you get a function _func(<name>)_ which, when called
  creates an IOC container. The _name_ is an optional argument in case you need several, unrelated containers. If _name_
  is not provided than the empty string is used as a name. 
  
  **Note: You will get the same IOC container instance every time you call _func_ with the same name regardless 
  where in the code you are calling it. This is true even between different modules. If you are developing a lower level module
  it is advised to use named IOC containers with unique names for your module**
  
  Example:
  
  ````
  const subDi = require('sub-di')('myModuleName');
  ````
  
#### The IOC container
  