'use strict';
/**
 * Created by: Zibx
 * Date: 22.01.12
 * Time: 19:54
 */
var Z = require('z-lib-core' ),
    math = require('z-lib-math');
module.exports = (function(){
    var storeList = {},
        util = {
        trim: String.trim === undefined ? //THIS TRIM FUNCTION IS FROM jQuery
            function( text ){ // Otherwise use our own trimming functionality
                return text == null ?
                    '' :
                    text.toString().replace( /^\s+/, '' ).replace( /\s+$/, '' );
            }
            :
            String.trim,
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
        },
		apply: function( el1, el2 ){
			var i;
			for( i in el2 )
				el1[ i ] = el2[ i ];
		},
		isArray: function( obj ){
			return Object.prototype.toString.call( obj ) === '[object Array]';
		},
		emptyFunction: function(){ },
        lazyMixin: function( classes, obj ){ // mix to object ( not prototype )
            var i, _i;
            if( !this.isArray( classes ) ){
                classes = [ classes ];
            }
            for( i = 0, _i = classes.length; i < _i; i++ ){
                this.apply( obj, classes[ i ].toPrototype );
            }
            for( i = 0, _i = classes.length; i < _i; i++ ){
                classes[ i ].init.call( obj );
            }
        },
		mixin: function( classes, constructor ){
			if( !this.isArray( classes ) ){
				classes = [ classes ];
			}
			var obj = function(){
				for( var i = 0, _i = classes.length; i < _i; i++ ){
					classes[ i ].init.call( this );
				}
				constructor.apply( this, arguments );
			};
			for( var i = 0, _i = classes.length; i < _i; i++ ){
				this.apply( obj.prototype, classes[ i ].toPrototype );
			}
			return obj;
		},
        classes: {
            observer: {
                init: function(){
                    this.callbacks = {};
                },
                toPrototype: {
                    on: function( name, callback ){
                        var callbacks = this.callbacks;
                        if( callbacks[ name ] === undefined )
                            callbacks[ name ] = [];
                        callbacks[ name ].push( callback );
                    },
                    fire: function( name ){
                        var callbacks = this.callbacks,
                            args = Array.prototype.slice.call( arguments, 1 );
                        if( callbacks[ name ] === undefined )
                            return false;

                        for( var i = 0, _i = callbacks[ name ].length; i < _i; i++ ){
                            callbacks[ name ][ i ].apply( this, args );
                        }

                    }
                }
            }
        }
	};

    var plugins = {};

    var zStore = function(){
        var unit, c = 0;
        if( typeof arguments[ 0 ] === 'string' || typeof arguments[ 0 ] === 'number' ){
            c++;
            unit = zStore.create( arguments[ 0 ] );
        }else{
            unit = new dataUnit();
        }
        if( arguments[ c ] !== undefined ){
            unit.load( arguments[ c ] )
        }
        return unit;
    };
    util.apply( zStore, {
            util: util,
            mixin: util.classes.observer,
            create: function( name ){
                var unit = new dataUnit( name );
                if( storeList[ name ] !== undefined )
                    this.warn( 'db `'+ name +'` already exists' );
                storeList[ name ] = unit;
                this.fire( 'newDataUnit', unit, name );

                return unit;
            },
            get: function( name ){
                return storeList[ name ];
            },
            warn: function(){
                console.warn( arguments.length === 1 ? arguments[ 0 ] : arguments );
            },
            plugin: function( obj ){

                plugins[ obj.type ] === undefined && ( plugins[ obj.type ] = {} );

                var plugin = obj.create;
                util.apply( plugin.prototype, obj );
                delete plugin.create;
                plugin.prototype.util = util;

                plugins[ obj.type ][ obj.name ] = plugin;
            }
        }
    );
    util.lazyMixin( util.classes.observer, zStore );

	var dataUnit = zStore.dataUnit = util.mixin( util.classes.observer, function( name ){
		this.clear();

        if( name !== undefined )
            this.name = name;

	} );

	util.apply( dataUnit.prototype, {
		util: util,
        plugins: plugins,
		clear: function(){
			this.data = {
				data: {},
				hash: {},
				sortedHash: {},
				length: 0,
				groupTypes: {},
                hashs: {}
			};
			return this;
		},

		load: function( obj ){
			var data, index = [], i, _i, j, _j, line, c, _data = {}, isArray = Z.isArray, columns;
			if( !isArray( obj ) ){
				data = obj.data;
				index = obj.index;

				if( index !== undefined && !isArray( index ) )
                    index = [ index ];
			}else{
				data = obj;
			}
			this.clear();
			if( obj.columns !== undefined && ( data.length > 0 && isArray(data[0]) ) ){
                columns = obj.columns;
				for( i = 0, _i = columns.length; i < _i; i++ )
					_data[ columns[ i ] ] = [];

				for( j = 0, _j = data.length; j < _j; j++ ){
					line = data[ j ];
					for( i = 0, _i = columns.length; i < _i; i++ ){
						_data[ columns[ i ] ][ j ] = line[ i ];
					}
				}

			}else{
                columns = obj.columns;
                if( columns )
                    for( i = 0, _i = columns.length; i < _i; i++ )
                        _data[ columns[ i ] ] = [];

                for( j = 0, _j = data.length; j < _j; j++ ){
					line = data[ j ];
					for( i in line ){
						if( _data[ i ] === undefined ) // focking shit, this is faster than try-catch and faster than inline (&&) if
							_data[ i ] = [];
						_data[ i ][ j ] = line[ i ];
					}
				}
			}
			this.data.data = _data;

			if( obj.sorters !== undefined ){

				for( i in obj.sorters )
                    if( obj.sorters.hasOwnProperty( i ) )
                        this.setType( i, obj.sorters[ i ] );

			}
			this.data.length = _j;

			if( index !== undefined ){
                if( !isArray(index) ){
                    for( j in index )
                        if( index.hasOwnProperty(j) ){
                            this.addGroup( {field: j, fn: index[j]} )
                        }
                }else{
                    for( j = 0, _j = index.length; j < _j; j++ ){
                        this.addGroup( index[j] )
                    }
                }
			}
			this.fire( 'load' );
            return this;
		},
		setType: function( name, type ){
			this.data.groupTypes[ name ] = type;
		},
		sortFunctions: {
            'text': function( a, b ){
                if (a === null || a === void 0) return 1;
                if (b === null || b === void 0) return -1;
                return a > b ? 1 : a < b ? -1 : 0;
            },
			'number': function( a, b ){
				return a - b;
			},
			'date': function (a, b) {
			    return +a - +b;
			},
            'TextCaseInsensetive': (function(){
                var toLowerCase = String.prototype.toLowerCase;
                return function(a,b){
                    var lowerA = a && toLowerCase.call(a), lowerB = b && toLowerCase.call(b);
                    if (lowerA === null || lowerA === void 0) return 1;
                    if (lowerB === null || lowerB === void 0) return -1;
                    return lowerA > lowerB ? 1 : lowerA < lowerB ? -1 : 0;
                };
            })(),
            'SMART_DATE': function (a, b)
            {
                return js.util.Calendar.compareHumanDate(a, b);
            }
		},
		sortHash: function( name ){
			var _sortedHash = this.data.sortedHash;
			var _groupTypes = this.data.groupTypes;
            var groupType = _groupTypes[name];

            if (this.sortFunctions[groupType] === undefined) {
                _sortedHash[name].sort();
            } else {
                _sortedHash[name].sort(this.sortFunctions[groupType]);
            }

		},
		removeFromHash: function( id, dontReorder ){
			var hashName,
				hashNameData,
				data = this.data,
				_hash = data.hash,
				_data = data.data,
				_sortedHash = data.sortedHash,
				i, _i,
				name, key;
			for( name in _hash ){
				hashName = _hash[ name ];

				var arr = hashName[ _data[ name ][ id ] ];
				if( arr !== undefined ){
					if( arr.length === 1 ){
						_sortedHash[ name ].splice( _sortedHash[ name ].indexOf( _data[ name ][ id ] ), 1 );
						delete hashName[ _data[ name ][ id ] ];
					}else
						arr.splice( arr.indexOf( id ), 1 );
				}
            }

            if( dontReorder !== true )
                for( name in _hash ){
                    for( key in hashName ){
                        hashNameData = hashName[ key ];
                        for( i = 0, _i = hashNameData.length; i < _i; i++ )
                            if( hashNameData[ i ] > id )
                                hashNameData[ i ]--;

                    }
                }
		},
		addToHash: function( id ){
			var name,
				data = this.data,
				_hash = data.hash,
                _hashs = data.hashs,
				_data = data.data,
				_sortedHash = data.sortedHash,
                field,
                hash,

                currentHash;

			for( name in _hash ){
                field = _hashs[name].field;

				if( _hash[ name ][ _data[ field ][ id ] ] === void 0 ){
					_sortedHash[ name ].push( _data[ field ][ id ] );
					this.sortHash( name ); //TODO make custom insert sort (array is already sorted)
					_hash[ name ][ _data[ name ][ id ] ] = [ id ];
				}else{
                    ( currentHash = _hash[ name ][ _data[ field ][ id ] ] ).push( id );
                    currentHash.sort( this.sortFunctions.number );
                }
			}
			this.fire( 'addToHash', id );
		},
        remakeHash: function(){
            var _hash = this.data.hash, i;
            for( i in _hash ){
                this.addGroup( i, true );
            }
        },
		addGroup: function( cfg, nullify ){
			var data = this.data,
				_data = data.data,
				_hash = data.hash,
                _hashs = data.hashs,
				_sortedHash = data.sortedHash,
                _groupTypes = data.groupTypes,
				_length = data.length,
                fn,
				i, _i, d, el, field, name;
            console.dir(cfg);
            if( typeof cfg === 'object' ){
                if( typeof cfg.data === 'object' ){
                    el = cfg.data;
                    for( i in el )
                        if( el.hasOwnProperty(i) ){
                            this.addGroup( {
                                name: el +':'+ i,
                                fn: el[i],
                                field: el
                            }, nullify );
                        }
                }else{

                    fn = cfg.fn;
                    field = cfg.field;
                    name = cfg.name;
                    _hashs[name] = cfg;
                    if( _hash[ name ] === void 0 || nullify ){
                        if( typeof fn !== 'function' ){
                            console.log(fn);
                            if( this.sortFunctions[fn] ){
                                _groupTypes[ name ] = this.sortFunctions[fn];
                            }else{
                                throw 'Unknown index type: '+ fn;
                            }
                        }else{
                            _groupTypes[ name ] = fn;
                        }

                        _hash[ field ] = _hash[ name ] = {};
                        _sortedHash[ name ] = [];

                        d = _data[ field ];
                        //if( d ){
                            for( i = 0, _i = _length; i < _i; i++ ){
                                el = d[ i ];
                                if( _hash[ name ][ el ] === void 0 ){
                                    _hash[ name ][ el ] = [];
                                    _sortedHash[ name ].push( el );
                                }
                                _hash[ name ][ el ].push( i );
                            }
                        //}else{
                            //_hash[ name ] = {undefined: []};
                        //}
                        this.sortHash( name );
                        //}
                    }
                    this.fire( 'addGroup', name );

                }
            }else{
                this.addGroup({name: cfg+':text', fn: 'text', field: cfg},nullify);
            }
		},
		removeByID: function( id ){
			var i,
				_data = this.data.data;
			this.removeFromHash( id );
			for( i in _data ){
				_data[ i ].splice( id, 1 );
			}
			this.data.length--;
		},
		updateByID: function( id, incomeData ){
			var i,
				changed = false,
				_data = this.data.data;

            this.removeFromHash( id, true );
			for( i in incomeData ){
                if( _data[ i ] ){
                    if( _data[ i ][id] != incomeData[ i ] ){
                        changed = true;
                        _data[ i ][id] = incomeData[ i ];
                    }
                }
			}
            this.addToHash( id );
			this.fire( 'update', [id] );

			/*if( changed )
			 _self.fire( 'changed', [id] );*/
		},
        getPropByID: function( prop, id ){
            return this.data.data[prop][id];
        },
		getByID: function( id ){
			var i, _data = this.data.data;
			var out = {};
			for( i in _data ){
				out[ i ] = _data[i][id];
			}
			return out;
		},
        findIDs: function( incomeData ){
            var intersects = [],
                i, _i, out = [],
                _hash = this.data.hash,
                intersect = math.intersect;
            
            for( i in incomeData ) if( incomeData.hasOwnProperty( i ) ){
                if( _hash[ i ] === void 0 ){ // TODO don't make hash when name isn't existed or option 'without hash' ?
                    this.addGroup( i );
                }
                if( _hash[ i ][ incomeData[ i ] ] != void 0 ){
                    intersects.push( _hash[ i ][ incomeData[ i ] ] );
                }
                //_data[ i ][id] = data[ i ];
            }
            _i = intersects.length;
            if( _i > 0 ){
                var intersection = intersects[ 0 ];

                if( _i > 1 ){
                    for( i = 1; i < _i; i++ ){
                        intersection = intersect( intersection, intersects[i] );
                    }
                }
                return intersection.length > 0 ? intersection : false;
            }
            return false;

        },
        update: function( find, replace ){
            var intersection = this.findIDs( find ),
                i, _i;
            if( intersection ){
                for( i = 0, _i = intersection.length; i < _i; i++ ){
                    this.updateByID( intersection[ i ], replace );
                }
                return i;
            }
            return false;
        },
        simpleFind: function( key, val ){
            var find = {};
            find[ key ] = val;
            return this.find( find );
        },
		find: function( incomeData ){
			var intersection = this.findIDs( incomeData ),
				i, _i, out = [];
			if( intersection ){
				for( i = 0, _i = intersection.length; i < _i; i++ ){
					out.push( this.getByID( intersection[ i ] ) );
				}
                return out;
			}
			return false;
		},
		clean: function (el) {
		    delete el.__id;
		    delete el.__line;
		    //delete el.__selected; maybe we want to set selection. it's not a really SYSTEM field, it's grid cheat
		},
		push: function (incomeData) {
		    this.clean(incomeData);
			var i,
				data = this.data,
				_length = data.length,
				_data = data.data;

			for( i in incomeData ){
				if( _data[ i ] === undefined ) // focking shit, this is faster than try-catch and faster than inline (&&) if
					_data[ i ] = [];
				_data[ i ][ _length ] = incomeData[ i ];
			}
			this.addToHash( _length );
			data.length++;
			this.fire( 'push' );
		},
		insert: function (incomeData, after) {
		    this.clean(incomeData);
			var i,
				data = this.data,
				_data = data.data,
				_length = data.length,
			    undefined = void 0;
			if( after === undefined || after === _length || after === null )
				this.push( incomeData );
			else{
			    this.clean(incomeData);
				after++;
				for( i in _data )
					if( _data[ i ] === undefined ){
						_data[ i ] = [];
						_data[ i ][ _length ] = undefined;
					}

				for( i in _data ){
					_data[ i ].splice( after, 0, undefined );
				}

				for (i in incomeData) {
				    if (_data[i] === undefined)
				        _data[i] = [];
					_data[ i ][ after ] = incomeData[ i ];
				}
                data.length++;
				this.remakeHash( );
			}
		},
        each: function( callback ){
            var i,
                data = this.data,
                _length = data.length,
                record;

            for( i = 0; i < _length; i++ ){
                record = this.getByID( i );
                callback.call( this, record , i );
            }
        },
        selector: function( type ){
            return new this.plugins.selector[ type ]( this );
        },
        query: function( type ){
            return new this.plugins.query[ type ]( this );
        },
        is: function( field ){ return zStore( this.simpleFind( field, true ) ); },
        isNot: function( field ){ return zStore( this.simpleFind( field, false ) ); }

	} );


	return zStore;

})();