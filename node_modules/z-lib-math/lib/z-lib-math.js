/**
 * Created by Ivan on 11/23/2014.
 */
module.exports = {
    // not guaranteed order
    unique: function( arr ){
        var i, c, hash = {}, out = [];
        for( i = 0, c = arr.length; i < c; i++ )
            hash[ arr[ i ] ] = true;

        c = 0;

        for( i in hash )
            ( hash.hasOwnProperty( i ) ) && ( out[ c++ ] = i );

        return out;
    },
    intersect: function( a, b ){
        var hash = {},
            out = [],
            i, _i;
        for( i = 0, _i = a.length; i < _i; i++ ){
            hash[ a[ i ] ] = true;
        }
        for( i = 0, _i = b.length; i < _i; i++ ){
            if( hash[ b[ i ] ] !== undefined )
                out.push( b[ i ] );
        }
        return out;
    },
    intersection: function(){
        var args = Array.prototype.slice.call( arguments ),
            a = args[0],
            b = args.slice(1),
            hash = {},
            newHash,
            out = [],
            i, _i,
            undefined;
        for( i = 0, _i = a.length; i < _i; i++ ){
            hash[ a[ i ] ] = true;
        }
        for( i = b.length - 1; i; ){
            newHash = {};
            a = b[--i];

            for( _i = a.length ; _i;)
                if( hash[ a[ --_i ] ] !== undefined )
                    newHash[ a[ _i ] ] = true;


            hash = newHash;
        }

        a = b[b.length - 1];

        b = 0;
        for( i = 0, _i = a.length; i < _i; i++ ){
            if( hash[ a[ i ] ] !== undefined )
                out[b++] = a[ i ];
        }

        return out;
    },
    union: function( a, b ){
        var hash = {},
            out = a.slice(),
            i, _i;
        for( i = 0, _i = a.length; i < _i; i++ ){
            hash[ a[ i ] ] = true;
        }
        for( i = 0, _i = b.length; i < _i; i++ ){
            if( hash[ b[ i ] ] === undefined )
                out.push( b[ i ] );
        }
        return out;
    },
    diff: function( b, a ){
        var hash = {},
            out = [],
            i, _i;
        for( i = 0, _i = a.length; i < _i; i++ ){
            hash[ a[ i ] ] = true;
        }
        for( i = 0, _i = b.length; i < _i; i++ ){
            if( hash[ b[ i ] ] === undefined )
                out.push( b[ i ] );
        }
        return out;
    }
};