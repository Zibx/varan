/**
 * Author:  Kubota Ivan
 * Date:    26.03.12
 * Time:    17:56
 * Class:
 */
(function( zStore ){

    zStore.plugin({
        type: 'selector',
        name: 'SQL',
        create: function( dataUnit ){
                var unit = this.dataUnit = dataUnit;
            var _self = this;
            var fN = function( SQL ){
                return unit.query('full')( _self.parseQuery( SQL ) );
            };
            fN.parseQuery = function( SQL ){
                return unit.query('full')( _self.parseQuery( SQL ) );
                //return this.parseQuery.apply( _self, arguments )
            };
            return fN;
        },
        stripSlashes: function( text ){ // from php.js
            return (text  + '').replace(/\\(.?)/g, function (tmp, token) {
                switch (token) {
                case '\\':
                    return '\\';
                case '0':
                    return '\u0000';
                case '':
                    return '';
                default:
                    return token;
                }
            });
        },
        splitByWords: js.util.Text.splitByWords,
        arrayReplace: function( text, search, replace ){
            var i, j;
            if( replace === undefined)
                for( i in search )
                    text = text.replace( i, search[ i ] );
            else
                for( i = 0, j = search.length; i < j; i++ )
                    text = text.replace( search[ i ], replace[ i ] );
            return text;
        },
        parseQuery: function( query ){
            var _self = this,
                tokens = this.tokens,
                striped = false,
                quotes = tokens.quotes,
                currentQuote = -1,
                tokenStart = 0,
                tokenList = {},
                tokenListL = 0,
                token, tokenL, i, _i, j, _j, splited, tokenName, tokenNameL, m, isQ, l, tmp, t, el,
                trim = this.util.trim,
                concat = Array.prototype.concat,
                stripSlashes = this.stripSlashes,
                splitByWords = this.splitByWords,
                arrayReplace = this.arrayReplace;
            for( i = 0, j = query.length; i < j; i++ ){
                m = query.substr( i, 1 );
                isQ = quotes.indexOf( m );
                if( isQ !== -1 && !striped ){
                    if( currentQuote === -1 ){
                        tokenStart = i;
                        currentQuote = isQ;
                    }else if( currentQuote === isQ ){
                        token = stripSlashes( query.substr( tokenStart + 1, i - tokenStart - 1 ) );
                        tokenL = token.length;
                        tokenName = '\'' + (++tokenListL) + '\'';
                        tokenNameL = tokenName.length;

                        tokenList[ tokenName ] = token;
                        query =
                        [
                            query.substr( 0, tokenStart ),
                            tokenName,
                            query.substr( i + 1 )
                        ].join( '' );
                        l = tokenNameL - tokenL - 1;
                        i += l;
                        j += l;
                        currentQuote = -1;
                    }
                }
                striped = m === '\\';
            }

            /* getting keywords. default action is first item from keywords list */

            var keywordsSplit = splitByWords( query, tokens.keywords );
            j = keywordsSplit.length;
            var item, currentKeyword = tokens.keywords[ 0 ], tasks = {};
            for( i = 0; i < j; i++ ){
                item = trim( keywordsSplit[ i ] );
                if( item !== '' ){
                    l = tokens.keywords.indexOf( item.toLowerCase() );

                    if( l === -1 ){
                        tasks[ currentKeyword ] = item;
                    }else{
                        currentKeyword = tokens.keywords[ l ];
                    }
                }
            }
            var out = {
                query:function (){
                    return _self.query( out );
                }
            };
            //console.log(tasks);
            /* select parse */
            if( tasks[ 'select' ] === undefined )
                tasks[ 'select' ] = '*';

            out.select = [ ];

            splited = tasks[ 'select' ].split( ',' );
            for( i = 0, _i = splited.length; i < _i; i++ ){
                if( splited[ i ].toLowerCase().indexOf( 'as' ) === -1 ){
                    splited[ i ] = trim( splited[ i ] );
                    el = tokenList[ splited[ i ] ];
                    if( el !== undefined )
                        splited[ i ] = el;
                    out.select.push(
                        [
                            splited[ i ],
                            splited[ i ]
                        ]
                    );
                }else{
                    splited[ i ] = splited[ i ].split( /as/i );
                    splited[ i ][ 0 ] = trim( splited[ i ][ 0 ] );
                    splited[ i ][ 1 ] = trim( splited[ i ][ 1 ] );
                    el = tokenList[ splited[ i ][ 0 ] ];
                    if( el !== undefined )
                        splited[ i ][ 0 ] = el;
                    el = tokenList[ splited[ i ][ 1 ] ];
                    if( el !== undefined )
                        splited[ i ][ 1 ] = el;
                    out.select.push(
                        [
                            splited[ i ][ 0 ],
                            splited[ i ][ 1 ]
                        ] );
                }

            }

            /* where by parse */
            if( tasks[ 'where' ] !== undefined ){
                var allTokens = concat.apply( [ ], tokens.hierarchy );//concat.apply( [], tokens.hierarchy ).join( '|' ).replace( '(','\\(' ).replace( ')','\\)' ).replace( /\\\|/g, '|' );

                var tokenHierarchyHash = {};
                for( i = 0, _i = tokens.hierarchy.length; i < _i; i++ ){
                    for( j = 0, _j = tokens.hierarchy[i].length; j < _j; j++ ){
                        tokenHierarchyHash[tokens.hierarchy[i][j]] = i;
                    }
                }
                splited = splitByWords( tasks[ 'where' ], allTokens );
                tmp = [];
                for( i = 0, _i = splited.length; i < _i; i++ ){
                    splited[ i ] = trim( splited[i] );
                    if( splited[ i ] !== '' )
                        tmp.push( splited[ i ] );
                }
                splited = tmp;
                var opArray = [ ];
                var outArray = [ ];

                for( i = 0, _i = splited.length; i < _i; i++ ){

                    var opLevel = tokenHierarchyHash[ splited[i].toLowerCase() ];
                    //console.log(opLevel,splited[i]);
                    if( opLevel !== undefined ){
                        if( opLevel === 0 ){ // braces
                            opLevel = 5 + ( splited[i] === '(' ? 1 : 0 );
                        }
                        if( opArray.length > 0 && opLevel != 6 ){

                            while( opArray.length > 0 && (
                                ( opArray[ opArray.length - 1][0] != 6 && opLevel === 5 ) ||
                                ( opArray[ opArray.length - 1][0] < opLevel && opLevel < 5 )
                                ) ){
                                var op = opArray.pop();
                                if( op[0] !== 5 && op[0] !== 6 )
                                    outArray.push(
                                        [
                                            2,
                                            op[1]
                                        ] );
                            }
                        }
                        //if( opLevel !== 0 )
                        opArray.push(
                            [
                                opLevel,
                                splited[i]
                            ] );
                    }else{
                        outArray.push(
                            [
                                0,
                                splited[i]
                            ] );
                    }
                    /*console.log('opLevel',opLevel);
                     console.log('outArray', outArray);
                     console.log('opArray' ,opArray);*/
                }
                while( opArray.length > 0 ){
                    el = opArray.pop();
                    if( el[0] < 5 )
                        outArray.push(
                            [
                                2,
                                el[ 1 ]
                            ] )
                }
                for( i = 0, _i = outArray.length; i < _i; i++ ){
                    el = tokenList[ outArray[ i ][1] ];
                    if( el !== undefined )
                        outArray[ i ] =
                        [
                            1,
                            el
                        ];
                }
                out.where = outArray;
                //query.split(new RegExp('('+tokens.keywords.join('|')+')','i'));
            }
            /* order by parse */
            if( tasks[ 'order by' ] !== undefined ){

                tmp = tasks[ 'order by' ].split( ',' );
                for( i = 0, j = tmp.length; i < j; i++ ){
                    if( out.order === undefined )
                        out.order =
                        [
                        ];

                    t = trim( tmp[ i ] ).split( ' ' );
                    out.order.push(
                        [
                            (t[1] === undefined || trim( t[1] ).toLowerCase() !== 'desc') ? 1 : -1,
                            arrayReplace( trim( t[0] ), tokenList )
                        ] );
                }
            }
            /* group by parse */
            if( tasks[ 'group by' ] !== undefined ){
                tmp = tasks[ 'group by' ].split( ',' );
                out.group = [];

                for( i = 0, j = tmp.length; i < j; i++ ){
                    out.group.push( arrayReplace( trim( tmp[i] ), tokenList ) );
                }
            }
            if( tasks[ 'collapse' ] !== void 0 ){
                out.collapse = [];
                tmp = tasks[ 'collapse' ].split( ',' );
                for( i = 0, j = tmp.length; i < j; i++ ){
                    out.collapse.push( arrayReplace( trim( tmp[i] ), tokenList ) );
                }
            }
            /* tree parse */
            if( tasks[ 'tree' ] !== undefined ){
                tmp = tasks[ 'tree' ].split( ',' );
                out.tree =
                    [
                    ];
                for( i = 0, j = tmp.length; i < j; i++ ){
                    out.tree.push( arrayReplace( trim( tmp[i] ), tokenList ) )
                }
            }

            return out;
        },
        tokens: {
            quotes:['\'','"','`'],
            hierarchy: [
                ['(',')'],
                ['!=','<>','>=','=>','<=','=<','<','>','==','===','=','in','like'],
                ['not'],
                ['and'],
                ['or']

            ],
            keywords: ['select','where','order by','group by','tree', 'update', 'set', 'collapse']
        }
    });
})( zStore );