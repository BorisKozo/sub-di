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
  const subDi = require('sub-di')('myModuleName'); //subDi is an IOC container
  ````
  
#### The IOC container
  
  The API for the IOC container has two main functions. ````get```` and ````set````. 
  Use ````set```` to register your function/object/primitive and then use ````get```` to retrieve it.
  
  The ````set```` function has two overloads:
  
  Note: In all the examples I use ````get```` to retrieve the value. The value returned from ````get```` is the same
  value you get as a dependency when it is needed. For example:
  
  **Named set**
  
  ````set(name, something, options)````
  
  The _name_ argument is the name of your dependency item and it can be any string. _something_ is the thing you want
  to register. You can register either a function, or any object or primitive. If you register something which is **not** a 
  function, it becomes a singleton and therefore the same instance is returned from all calls to ````get````. In this case you 
  cannot provide any additional dependencies. For example
  
  ````
    subDi.set('myLuckyNumber',5);
    subDi.get('myLuckyNumber'); // 5
  ````

If _something_ is a function then it will be registered as an inversion of control function with dependencies.
 There are three ways to define dependencies for the function:
 
1. Via the options

    ````
        subDi.set('myFunc', (a,b) => { }, {
            dependencies:['A','B']
        });
    ````
    
2. Via the annotation
 
   ````
        function foo(a,b){}
        foo['@dependencies'] = ['A','B'];
        subDi.set('myFunc', foo); 
    ````

3. The Angular.js way (this works only if you are not using any fancy stuff like default parameters or babel transpiler)
   
    ````
        function foo(A,B){}
        subDi.set('myFunc', foo); // Dependencies ['A','B'] inferred from the function definition
    ````

If you try to set something with a name that already exists, an error will be thrown. To force the set anyway you
can use the _force_ parameter in the _options_

````
    subDi.set('myLuckyNumber',5);
    subDi.set('myLuckyNumber',10); // This will throw!
    subDi.set('myLuckyNumber',10,{force:true}); // This is OK
````

If you want to set a function as a singleton with the shorthand syntax, you may pass _isConst_ as ````true```` in the options.

````
    function foo(){};
    subDi.set('myFunc',foo,{isConst:true});
    subDi.get('myFunc'); //returns foo itself and not the result of calling foo
````


It is possible to tell sub-di that the registered function creates a singleton. In this case the function will be invoked
only once and its value stored internally. Every time the same singleton is requested the same instance is returned.

This can be done by either:

1. Setting _isSingleton_ property of _options_ to ```true```
  ````
    function foo(){
       return {}; 
    }
    subDi.set('myFunc',foo,{isSingleton:true});
    const obj1 = subDi.get('myFunc');
    const obj2 = subDi.get('myFunc'); //obj1 === obj2
  ````

2. Annotating the function with the _@isSingleton_ annotation
  ````
    function foo(){
        return {}; 
    }
    foo['@isSingleton'] = true;
    subDi.set('myFunc',foo);
    const obj1 = subDi.get('myFunc');
    const obj2 = subDi.get('myFunc'); //obj1 === obj2
  ````

You can store any primitive value or an object as a named constant and later get it as an injected dependency.
This can be done by simply setting the primitive/object with a name:

1. Just set the primitive

  ````
    subDi.set('five',5);
    subDi.get('five'); //5
  ````
  
2. Just set the object
  
  ````
    const obj = {};
    subDi.set('someObj',obj);
    subDi.get('someObj'); //returned obj
  ````

3. Set the _isConst_ option for a function 
  ````
    function myFunc(){}
    subDi.set('foo',myFunc,{
       isConst:true
    });
    subDi.get('foo'); //returns myFunc. Doesn't call it!
  ````
    
**Implied set**
  
    ````set(function, options)````
  
With this overload you don't need to specify the name but it is inferred from the provided function in the following priority:

1. You can specify the _name_ property in the options

  ````
    function foo(){}
    subDi.set(foo,{name:'myFunc'});
    subDi.get('myFunc'); //calls foo
  ````

2. You can annotate the function with the _@name_ annotation

  ````
    function foo(){}
    foo['@name'] = 'myFunc';
    subDi.set(foo);
    subDi.get('myFunc'); //calls foo
  ````

3. You can let subDi infer the name from the _name_ property of the function

  ````
    function foo(){}
    subDi.set(foo);
    subDi.get('foo'); //calls foo
  ````
  
**setModules**
  
  A syntactic sugar allows you to register a node module as a singleton with one call:
  
  ````
  subDi.setModules('loadsh'); //will require lodash and save it as a singleton
  function foo(lodash){
     console.log(lodash.version);
  }
  subDi.set(foo);
  subDi.get('foo'); //prints lodash.version
  ````
  
  Or by providing an array of modules to load
  
  ````
    subDi.setModules(['express','loadsh']); //will require lodash and save it as a singleton
    function foo(_, express){
       console.log(lodash.version);
    }
    foo['@dependencies']=['lodash','express']; 
    subDi.set(foo);
    subDi.get('foo'); //prints lodash.version
  ````

  If one of the modules fails to load it will continue loading the rest of them. You can
  get the error by providing an error callback
  
  ````
    subDi.setModules(['lodash','errorModule'],(err)=>{
      console.log(err.message); //something like "module not found"
    });
    function foo(lodash){
       console.log(lodash.version);
    }
    subDi.set(foo);
    subDi.get('foo'); //prints lodash.version, this still works
    
  ````
  
  **get**
  
  You can retrieve a dependency by calling ````get```` (it will be automatically called for you when a dependency is
  resolved).
  
  ````get(name, reuseInstances = false, thisObj = undefined)````
  
  You can use the _reuseInstances_ flag to allow the resolution mechanism create a single instance of a non singleton
  dependency during the resolution process. For example if you have modules A, B, C, and D. A depends on B and C, and both
  B and C depend on D.
  
  When getting A, if _reuseInstances_ is set to ````true```` then both B and C will get the same result from calling D 
  (i.e. D is called only once). If _reuseInstances_ is not set to ````true```` then B and C will get different instances
  of calling D.
  
  Here is an example:
  
  ````
     let count = 0;
     function a(b,c){
       return b+c;
     }
     
     function b(d){
        return d+1;
     }

     function c(d){
        return d*2;
     }
     
     function d(){
       count++;
       return count;
     }
     
     subDi.set(a);
     subDi.set(b);
     subDi.set(c);
     subDi.set(d);
     
     subDi.get('d',true); // (1+1)+(1*2) //the value of d (=== 1) is calculated only once and later passed as a dependency
  ```` 
  
### License
MIT  