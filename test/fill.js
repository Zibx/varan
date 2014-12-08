/**
 * Created by Ivan on 10/20/2014.
 */

var vows = require('vows'),
    assert = require('assert');

var varan = require('../lib/store' ),
    something = 'apple,goose,exit,face,orange,bed,surname,cup,tail,server'.split(',');

vows.describe('define classes').addBatch({
    'fill': {
        topic: function(){
            var s1 = varan.create('s1');
            this.callback(s1);
        },
        'is data pushed?': function( store, topic ){
            var i;
            for( i = 0; i < 300; i++ )
                store.push( {o:'r',b:'i',t:0, j: i } );
            for( i = 0; i < 300; i++ )
                assert.deepEqual(store.getByID(i), {o:'r',b:'i',t:0, j: i});
        },
        'is it cleared?': function( store, topic ){
            store.clear();
            store.push({test:1});
            assert(store.data.length === 1);
            store.push({test:2});
            store.clear();
            assert(store.data.length === 0);
        },
        'is index made?': function( store, topic ){
            store.clear();
            var i;
            for( i = 0; i < 10; i++ ){
                store.push({
                    id: i,
                    name: something[ i ]
                });
            }
            store.addGroup('name');
            for( i = 0; i < 10; i++ ){
                store.push({
                    id: i,
                    name: something[ i ]
                });
            }
            for( i = 0; i < 10; i++ ){
                store.find( { name: something[i] } ).forEach( function( el ){
                    assert(el.id === i);
                })
            }
        },
        'is it updatable?': function( store, topic ){
            store.clear();
            for( var i = 0; i < 20; i++ )
                store.push( {o:'r', b:'i', t: i * 2, j: i } );

            store.addGroup('t')

            for( var i = 0; i < 10; i++ ){

                assert( (store.update({t:i*2},{t:-i}) === 1 ),'update');
                assert.deepEqual( store.getByID(i), {o:'r', b:'i', t: -i, j: i } );
            }
        },
        'insert': function( store, topic ){


            var c = (Math.random()*20+10)|0;

            store.clear();
            for( var i = 0; i < c; i++ )
                store.push( {o:'r', b:'i', t: i * 2, j: i } );


            for( var i = c-1; i > -1; i-- ){
                store.insert( store.getByID(i), i );
            }

            assert( store.data.length === c*2 );




            for( var i = 0; i < 10; i++ ){
                assert.deepEqual(store.getByID(i*2), {o:'r', b:'i', t: i * 2, j: i });
                assert.deepEqual(store.getByID(i*2 + 1), {o:'r', b:'i', t: i * 2, j: i });
            }
        }
    }
} ).exportTo(module);
