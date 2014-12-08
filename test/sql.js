/**
 * Created by Ivan on 11/24/2014.
 */

var vows = require('vows'),
    assert = require('assert');

var varan = require('../lib/store' ),
    something = 'apple,goose,exit,face,orange,bed,surname,cup,tail,server'.split(',');

vows.describe('define classes').addBatch({
    'sql': {
        topic: function(){
            var s1 = varan.create('s1');
            var arr = [];
            something.forEach( function( el,i ){
                arr.push({
                    name: el,
                    num: i,
                    age: (i+1)*10%25,
                    birth: new Date(2010, i,1,0,0,0,0)
                });
            });
            s1.load({
               data: arr,
               index: {
                   'num': 'number',
                   'age': 'number',
                   'birth': {
                       date: 'date',
                       random: function(){
                           return Math.floor(Math.random()*3 - 1);
                       }
                   }
               }
            });
            this.callback(s1);
            return s1;
        },
        'select?': function( store ){
            store.selector('SQL')('SELECT *' ).query().getData();
            assert( topic.data.length === something.length );

        }
    }
} ).exportTo( module );