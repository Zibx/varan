(function( zStore ){

    var defaultConfig = {
            select: [['*', '*']]
        }, JS = window.JS,
        API = function( dataUnit ){
            this._config = JS.apply( {}, defaultConfig );
            this._dataUnit = dataUnit;
        };
    API.prototype = {
        getColumns: function(){
            var out = {};
            JS.each( this._config.select, function(el){
                out[ el[0] ] = el[1];
            });
            return out;
        },
        column: function(){
            var columns = JS.allArgumentsToArray(arguments),
                i, _i, el, select = [],
                selectPush = function( key, val ){
                    select.push( [key, val] );
                };

            if( !columns.length )
                return this.getColumns();


            for( i = 0, _i = columns.length; i < _i; i++ ){
                el = columns[i];
                if( JS.getNormalizedType(el) === 'Object' ){
                    JS.each( el, selectPush );
                }else{
                    select.push( [el, el] );
                }
            }
            this._config.select = select;
            return this;
        },
        addColumn: function() {
            var columns = JS.allArgumentsToArray(arguments),
                i, _i, el, select = this._config.select,
                selectPush = function( key, val ){
                    select.push( [key, val] );
                };

            if( !columns.length ) // what the hell
                return this;

            if( select.length === 1 && select[0][0] === '*' )
                select.pop();

            for( i = 0, _i = columns.length; i < _i; i++ ){
                el = columns[i];
                if( JS.getNormalizedType(el) === 'Object' ){
                    JS.each( el, selectPush );
                }else{
                    select.push( [el, el] );
                }
            }

            return this;
        },
        removeColumn: function() {
            var columns = JS.allArgumentsToArray(arguments),
                i, _i, j, _j, el, select = this._config.select;

            for( j = 0, _j = columns.length; j < _j; j++ ){
                el = columns[j];
                for( i = 0, _i = select.length; i < _i; i++ ){
                    if( select[i][0] === el ){
                        select.splice(i,1);
                        i--;
                        _i--;
                    }
                }
            }
            return this;
        },
        query: function(){
            return this._dataUnit.query('full')( this._config ).query();
        }
    };
    zStore.plugin({
        type: 'selector',
        name: 'API',
        create: function( dataUnit ){
            return new API( dataUnit );
        }
    });
})( zStore );