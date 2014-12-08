/**
 * Created by Zibx on 10/14/2014.
 */
'use strict';

    var applyDeep,
    toString = Object.prototype.toString,
    getType = function( obj ){
        return toString.call( obj );
    },
    slice = Array.prototype.slice,
    concat = Array.prototype.concat,
    parseFloat = this.parseFloat,
Z = {
    getProperty: function( prop ){
        return function( a ){
            return a[prop];
        }
    },
    sort: {
        number: function( a, b ){
            return a - b;
        },
        numberReverse: function( a, b ){
            return b - a;
        },
        numberByProperty: function( name ){
            return function( a, b ){
                return a[name] - b[name];
            }
        },
        stringByProperty: function( name ){
            return function( a, b ){
                var aKey = a[name], bKey = b[name];
                return aKey > bKey ? 1 : aKey < bKey ? -1 : 0;
            }
        }
    },
    /*
     Function: doAfter

     Takes lots of functions and executes them with a callback function in parameter. After all callbacks were called it executes last function

     */
    doAfter: function(){
        var i = 0,
            _i = arguments.length - 1,
            counter = _i,
            callback = arguments[_i],
            data = {};

        for( ; i < _i; i++ ){
            (function( callFn, i ){
                var fn = function(){
                    data[i] = arguments;

                    if( fn.store != null )
                        data[fn.store] = arguments;

                    if( !--counter )
                        callback( data );

                };

                callFn( fn )
            })( arguments[i], i );
        }
    },
    emptyFn: function(){
    },
    /*
     Function: apply

     Applies el2 on el1. Not recursivly

     Parameters:
     el1 - object to apply on
     el2 - applieble object

     Return:
     el1

     See also:
     <Z.applyLots> <Z.applyDeep>
     */
    apply: function( el1, el2 ){
        var i;

        for( i in el2 )
            el1[i] = el2[i];

        return el1;
    },
    toArray: function( obj ){
        return slice.call( obj );
    },
    /*
     Function: isArray
     Test is argument an Array

     Parameters:
     obj - object

     Return:
     bool - true if array, false if not

     */
    isArray: function( obj ){
        return getType( obj ) === '[object Array]';
    },

    /*
     Function: each
     Itterate Objects && Arrays.

     Object gets:
     key  - key
     value  - value

     this  - element

     Array gets:
     value  - value
     i  - index of element in array

     this  - element


     Parameters:
     el - Object || Array
     callback - function which would be called with each item

     See also:
     <eachReverse>
     */
    each: function( el, callback ){
        var i, _i, out;

        if( el === null || el === undefined )
            return false;

        if( Z.isArray( el ) ){
            for( i = 0, _i = el.length; i < _i; i++ ){
                out = callback.call( el[i], el[i], i );
                if( out !== undefined )
                    return out;
            }
        }else{
            for( i in el )
                if( el.hasOwnProperty( i ) ){
                    out = callback.call( el[i], i, el[i] );
                    if( out !== undefined )
                        return out;
                }

        }
    },
    /*
     Function: makeArray
     wraps single element with Array if not

     Parameters:
     el - Element

     Return:
     Array
     */
    makeArray: function( obj ){
        return obj !== void 0 ? ( this.isArray( obj ) ? obj : [obj] ) : [];
    }
};
Z.a2o = Z.arrayToObj;
module.exports = Z;

