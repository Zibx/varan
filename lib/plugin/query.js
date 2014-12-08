/*
Group test:

console.log(

zStore({
    data: [
        {id: 0, groupKey:0},
        {id: 1, groupKey:1},
        {id: 2, groupKey:0},
        {id: 3, groupKey:1},
        {id: 4, groupKey:0},
        {id: 5, groupKey:1}
    ],
    index: ['id','groupKey']
})
    .selector('SQL')('select * order by `groupKey` asc group by `groupKey`')
    .query()
    .getData()
    .map( function( el ){
        var ending = [];
        JS.each( el, function( k, v ){
            ending.push(k+': '+v)
        });
        return (new Array(el.__level + 1)).join('\t') + el.id + '\t\t' + ending.join('\t')

    })
    .join('\n')

);*/
/* Author:  Kubota Ivan
 * Date:    26.03.12
 * Time:    18:13
 * Class:
 */
(function( zStore ){
    zStore.plugin({
        type: 'query',
        name: 'full',
        create: function( dataUnit ){
            var unit = this.dataUnit = dataUnit;
            var _self = this;
            return function( query ){ // here query is not an SQL, it's already parsed query with polish notation
                _self.queryUnit = query;
                return _self;
            };
        },
        tokens: {
            switcher: {
                '>'  : '<=',
                '<=' : '>',
                '=<' : '>',
                '>=' : '<',
                '=>' : '<',
                '<'  : '>='
            }
        },
        everything: function(){
            var out = [], i, _i;
            for( i = 0, _i = this.dataUnit.data.length; i < _i; i++ )
                out.push( i );

            return out;
        },
        group: function( data, groupBy, use_data, dataLength ){
            var nowGroupBy = groupBy[ 0 ];
            var out = [];
            var subGroup = [];
            var i, _i;

            var shortHand = use_data[ nowGroupBy ];

            var groupName;
            var last = shortHand[ data[ 0 ] ];
            for( i = 0, _i = data.length; i < _i; i++ ){
                groupName = shortHand[ data[ i ] ];
                if( last !== groupName ){
                    out.push( {
                        name: last,
                        data: subGroup
                    } );
                    subGroup = [];

                    last = groupName;
                }
                subGroup.push( data[ i ] );
            }
            out.push( {
                name: last,
                data: subGroup
            } );
            var groupNext = groupBy.slice().splice( 1 );
            _i = out.length;
            dataLength += _i;

            //var rowCount = data.length + _i;
            var rowCount = 0;
            for( i = 0; i < _i; i++ ){
                out[ i ].length = out[ i ].data.length;
                out[ i ].rows = out[ i ].length + 1;
                if( groupNext.length > 0 ){
                    var subRecursion = this.group( out[ i ].data, groupNext, use_data, dataLength );
                    dataLength += subRecursion.length;
                    subRecursion = subRecursion.data;
                    out[ i ].data = subRecursion.data;
                    out[ i ].rows += subRecursion.rows + subRecursion.length;
                }
            }
            return { data: { data: out, length: _i, rows: rowCount}, length: dataLength };
        },
        tree: function( data, tree, _data, _hash ){
            var out = {};
            var subGroups = {},subGroup;
            var i, _i, j;

            var shortHand = _data[ tree[ 0 ] ] || [];
            var idHash = _hash[ tree[1] ];
            var shortHandId = _data[ tree[ 1 ] ] || [];
            var outcome, id;

            for( i = 0, _i = data.length; i < _i; i++ ){
                outcome = shortHand[ data[i] ];
                id = shortHandId[ data[i] ];
                if( subGroups[ outcome ] == null ){
                    out[ outcome ] = 1;
                    subGroups[ outcome ] = { __id: idHash[ outcome ] && idHash[ outcome ][0], data: [] };
                }
                if( subGroups[ id ] == null ){
                    subGroups[ id ] = { __id: data[i], data: [] };
                }
                subGroups[ outcome ].data.push( subGroups[ id ] );
            }
            //                    console.dir(subGroups)
            for( i = 0, _i = data.length; i < _i; i++ ){
                outcome = shortHand[ data[i] ];
                id = shortHandId[ data[i] ];
                delete out[ id ];
            }
            for( i in subGroups ) if( subGroups.hasOwnProperty(i) ){

                subGroup = subGroups[ i ];
                var subGroupData = subGroup.data, length = subGroupData.length,
                    subGroupDataJ;
                subGroup.length = length;
                subGroup.rows = length + 1;
                for( j = length - 1; j >= 0; j--){
                    subGroupDataJ = subGroupData[j];
                    length = subGroupDataJ.data.length;

                    if( subGroupDataJ.data.length === 0 ){
                        subGroupData[j] = subGroupDataJ.__id;
                    }
                }
            }
            //debugger;
            /*if( subGroups[null] )
                j = null;
            else if( subGroups[ void 0 ] )
                j = void 0;
            else*/

            var result = { data: [], length: 0, rows: 0 };
            for( i in out )
                if( out.hasOwnProperty(i) ){
                    result.data = result.data.concat( subGroups[i].data );
                    result.length += subGroups[i].length;
                    //result.rows += subGroups[j].rows;
                }

            return {data: result};
        },
        query: function(){
            var data = false;
            var i, _i, j, _j, j1, k, _k, k1,m , name, from,
                hashName, sortedHashName, hashNameOfSortedHashNameJ,d,
                tmpArr, el,el1,el2,t1,t2, o1,o2,buff, everything = false,
                out,subOut,
                intersect = js.util.Math.intersect,
                union = js.util.Math.union,
                diff = js.util.Math.diff,
                queryUnit = this.queryUnit,
                dataUnit = this.dataUnit,
                unitData = dataUnit.data,
                _data = unitData.data,
                _hash = unitData.hash,
                l = unitData.length,
                _sortedHash = unitData.sortedHash,
                tokens = this.tokens,
                switcher = tokens.switcher,
                concat = Array.prototype.concat;

            if( queryUnit.where !== void 0 ){

                var dataset = [];
                for( i = 0, _i = queryUnit.where.length; i < _i; i++ ){
                    el = queryUnit.where[ i ];
                    if( el[0] < 2 ){
                        dataset.push( el );
                    }else{
                        if( el[ 1 ] !== 'not' ){
                            el2 = dataset.pop();
                            el1 = dataset.pop();
                            if( el[ 1 ] !== 'and' && el[ 1 ] !== 'or' ){
                                t1 = _data[el1[1]] !== void 0;//type of first el (colName[true] or param[false])
                                o1 = el1[0] === 0 && !t1 ? parseFloat( el1[1] ): el1[ 1 ];
                                t2 = _data[el2[1]] !== void 0;
                                o2 = el2[0] === 0 && !t1 ? parseFloat( el2[1] ): el2[ 1 ];
                                if( t2 && !t1 ){
                                    buff = t1; t1 = t2; t2 = buff; //switch
                                    buff = o1; o1 = o2; o2 = buff; //switch
                                    if( switcher[ el[ 1 ] ] !== void 0 )
                                        el[ 1 ] = switcher[ el[ 1 ] ];
                                }
                            }
                        }else{
                            el1 = dataset.pop();
                        }
                        out = [];
                        switch( el[ 1 ] ){
                            case '=': case '==': case '===':

                                if( t1 && !t2 ){
                                    out = _hash[ o1 ][ o2 ];
                                }else if( t1 && t2 ){

                                    for( j in _hash[ o1 ] ){
                                        for( k in _hash[ o2 ] ){
                                            if( j == k ){
                                                subOut = intersect( _hash[ o1 ][ j ], _hash[ o2 ][ k ] );
                                                out = out.concat( subOut );
                                            }
                                        }
                                    }
                                }else{
                                    if( o1 == o2 ){
                                        if( everything === false )
                                            everything = this.everything();
                                        out = everything.splice(0);
                                    }
                                }

                                break;
                            case 'like':

                                if( t1 && !t2 ){
                                    o2 = (o2 || '').toLowerCase();
                                    for( j in _hash[ o1 ] ){
                                        if( j.toLowerCase().indexOf( o2 ) !== -1 )
                                            out = out.concat( _hash[ o1 ][ j ] );
                                    }
                                }

                                break;
                            case '>':

                                if( t1 && !t2 ){

                                    from = JS.findIndexBefore( _sortedHash[ o1 ], o2 );
                                    if( _sortedHash[ o1 ][ from ] <= o2 )
                                        from++;

                                    for( j = from, _j = _sortedHash[ o1 ].length; j < _j; j++ ){
                                        out = out.concat( _hash[ o1 ][ _sortedHash[ o1 ][ j ] ] );
                                    }
                                }/*else if( t1 && t2 ){ // where n1 > n2

                                }else{
                                    if( o1 > o2 ){
                                        if( everything === false )
                                            everything = this.everything();
                                        out = everything.splice(0);
                                    }
                                 }*/
                                break;
                            case '>=': case '=>':
                                if( t1 && !t2 ){
                                    from = JS.findIndexBefore( _sortedHash[ o1 ], o2 );
                                    if( _sortedHash[ o1 ][ from ] < o2 )
                                        from++;
                                    for( j = from, _j = _sortedHash[ o1 ].length; j < _j; j++ ){
                                        out = out.concat( _hash[ o1 ][ _sortedHash[ o1 ][ j ] ] );
                                    }
                                }/*else if( t1 && t2 ){ // where n1 >= n2

                                }else{
                                    if( o1 >= o2 ){
                                        if( everything === false )
                                            everything = this.everything();
                                        out = everything.splice(0);
                                    }
                                }*/
                                break;
                            case '<':
                                if( t1 && !t2 ){
                                    from = JS.findIndexBefore( _sortedHash[ o1 ], o2 );
                                    if( _sortedHash[ o1 ][ from ] >= o2 )
                                        from--;

                                    for( j = 0, _j = from + 1; j < _j; j++ ){
                                        out = out.concat( _hash[ o1 ][ _sortedHash[ o1 ][ j ] ] );
                                    }
                                }/*else if( t1 && t2 ){ // where n1 < n2

                                }else{
                                    if( o1 < o2 ){
                                        if( everything === false )
                                            everything = this.everything();
                                        out = everything.splice(0);
                                    }
                                }*/
                                break;
                            case '<=': case '=<':
                                if( t1 && !t2 ){
                                    from = JS.findIndexBefore( _sortedHash[ o1 ], o2 );
                                    if( _sortedHash[ o1 ][ from ] > o2 )
                                        from--;

                                    for( j = 0, _j = from + 1; j < _j; j++ ){
                                        out = out.concat( _hash[ o1 ][ _sortedHash[ o1 ][ j ] ] );
                                    }
                                }/*else if( t1 && t2 ){ // where n1 <= n2

                                }else{
                                    if( o1 <= o2 ){
                                        if( everything === false )
                                            everything = this.everything();
                                        out = everything.splice(0);
                                    }
                                }*/
                                break;
                            case 'not':
                                if( everything === false )
                                    everything = this.everything();
                                out = diff( everything, el1[ 1 ] );

                                break;
                            case 'and':
                                out = intersect( el1[ 1 ], el2[ 1 ] );

                                break;
                            case 'or':
                                out = union( el1[ 1 ], el2[ 1 ] );

                                break;
                        }
                        if( out === void 0 )
                            out = [];
                        dataset.push( [ 3, out ] );
                    }
                }
                if( data === false ){
                    data = dataset.pop()[1];
                }
            }else{
                data = this.everything();
            }


            var use_hash = {};
            var use_sortedHash = {};
            var use_data = {};
            if( queryUnit.order !== void 0 && ( data === false || data.length > 0 ) ){
                //console.log(queryUnit.order);

                for( i = queryUnit.order.length; i-- > 0; ){
                    name = queryUnit.order[ i ][ 1 ];
                    use_data[ name ] = _data[ name ];
                    use_hash[ name ] = _hash[ name ];
                    use_sortedHash[ name ] = _sortedHash[ name ];
                }
                if( queryUnit.group !== void 0 ){
                    for( i = queryUnit.group.length; i-- > 0; ){
                        name = queryUnit.group[ i ];
                        /*if( groupFunctions[ _groupTypes[ name ] ] !== void 0 ){ bad old implementation
                            use_hash[ name ] = _groupHash[ name ];
                            use_sortedHash[ name ] = _groupSortedHash[ name ];
                            use_data[ name ] = _groupData[ name ];
                        }else{*/
                            use_data[ name ] = _data[ name ];
                        //}

                    }
                }

                for( i = queryUnit.order.length; i-- > 0; ){
                    //console.log(queryUnit.order[ i ])
                    name = queryUnit.order[ i ][ 1 ];
                    sortedHashName = use_sortedHash[ name ]; // sorted hash name


                    if( sortedHashName !== void 0 ){
                        hashName = use_hash[ name ]; // hash Name
                        if( data === false ){
                            data = [];
                            if( queryUnit.order[ i ][ 0 ] === 1 ){
                                for( j = 0, j1 = sortedHashName.length; j < j1; j++ ){
                                    hashNameOfSortedHashNameJ = hashName[ sortedHashName[j] ];//sorry for this shitty names here, but they would be too long in normal way
                                    // this means `hash name from sorted hash name from j`
                                    for( k = 0, k1 = hashNameOfSortedHashNameJ.length; k < k1; k++ ){
                                        data.push( hashNameOfSortedHashNameJ[ k ] );
                                    }
                                }
                            }else{
                                for( j = sortedHashName.length; j-- > 0; ){
                                    hashNameOfSortedHashNameJ = hashName[ sortedHashName[j] ];//sorry for this shitty names here, but they would be too long in normal way
                                    for( k = hashNameOfSortedHashNameJ.length; k-- > 0; ){
                                        data.push( hashNameOfSortedHashNameJ[ k ] );
                                    }
                                }
                            }
                        }else{
                            d = use_data[ name ];
                            tmpArr = [];
                            for( j = 0, m = sortedHashName.length; j < m; j++ )
                                tmpArr[ j ] = [];

                            if( queryUnit.order[ i ][ 0 ] === 1 ){
                                for( j = 0, j1 = data.length; j < j1; j++ ){
                                    k = data[ j ];
                                    tmpArr[ sortedHashName.indexOf( d[ k ] ) ].push( k );
                                }
                            }else{
                                m--;
                                for( j = 0, j1 = data.length; j < j1; j++ ){
                                    k = data[ j ];
                                    tmpArr[ m - sortedHashName.indexOf( d[ k ] ) ].push( k );
                                }
                            }
                            data = concat.apply([], tmpArr );

                        }
                    }
                }
            }

            var dataLength = data === false ? 0 : data.length;


            if( queryUnit.group !== void 0 && dataLength > 0 && queryUnit.tree !== void 0 && dataLength > 0 ){
                var result = this.group( data, queryUnit.group, use_data, dataLength );

                data = result.data;
                dataLength = result.length;

                var unroll = [], item, itemData;
                unroll.push({item: data, data: data.data});
                while( unroll.length > 0 ){
                    item = unroll.shift();
                    itemData = item.data;
                    if( itemData ){
                        if( itemData[0].data ){
                            unroll = [].concat(itemData).concat(unroll);
                        }else{
                            item.data = this.tree( itemData, queryUnit.tree, _data, _hash ).data;
                        }
                    }else{
                        item.item.data = this.tree( itemData, queryUnit.tree, _data, _hash ).data;
                    }
                }
                //data

            }else{

                if( queryUnit.tree !== void 0 && dataLength > 0 ){
                    var result = this.tree( data, queryUnit.tree, _data, _hash );
                    data = result.data;
                }

                if( queryUnit.group !== void 0 && dataLength > 0 ){
                    var result = this.group( data, queryUnit.group, use_data, dataLength );

                    data = result.data;
                    dataLength = result.length;
                }

            }
            var tmpSelect = [],
                notSelect = {__level: 1};
            for( i = 0, _i = queryUnit.select.length; i < _i; i++ ){
                if( queryUnit.select[i][0] === '*' ){
                    for( j in _data )
                        if( _data.hasOwnProperty( j ) )
                            !notSelect[j] && tmpSelect.push( [ j, j ] );

                }else{
                    tmpSelect.push( queryUnit.select[i] );
                }
            }

            return (function( incomingData, select, dataLength, _data, isGroups, groupNames, treeNames, collapse ){
                var isArray = JS.isArray;
                var data;
                var collapseID;
                var groups = {};
                var idMeter = -1;
                var collapsed = {};
                var concat = Array.prototype.concat;
                if( groupNames === void 0 )
                    groupNames = treeNames;
                var flatternData = function( data, level ){
                    if( level === 0 ){
                        collapseID = -1;
                    }

                    var out = [];
                    var nextLevel = level + 1;

                    var nodeData = data.data;
                    nodeData.data && (nodeData = nodeData.data);
                    var j, _j;

                    for( j = 0, _j = nodeData.length; j < _j; j++ ){
                        if( nodeData[ j ] === void 0 || nodeData[ j ].rows === void 0 ){
                            out.push( [ 0, nodeData[ j ], level ] );
                            idMeter ++;
                        }else{
                            collapseID++;
                            idMeter++;
                            out.push( [ 1, {
                                field: groupNames[ level ],
                                __id: nodeData[ j ].__id,
                                __groupID: collapseID,
                                item: nodeData[ j ].name,
                                length: nodeData[ j ].length,
                                __level: level
                            } ] );

                            var thisCollapseID = collapseID;
                            if( groups[ collapseID ] === void 0 ){
                                groups[ collapseID ] = {
                                    collapsed: false,
                                    rows: nodeData[ j ].rows - 1,
                                    data: [],
                                    start: idMeter
                                };
                            }
                            out = out.concat( flatternData( nodeData[ j ], nextLevel ) );

                            groups[ thisCollapseID ].end = idMeter;
                        }

                    }

                    return out;
                };
                if( !isGroups )
                    data = incomingData;
                else if( dataLength > 0 )
                    data = flatternData( incomingData, 0 );
                else
                    data = [];
                //console.log(groups);
                var out = {
                    getData: function(){// [from, to]
                        var i, j, dataI, tmp, dataI1;

                        var out = [];
                        if( data.length === 0 )
                            return out;

                        var from = arguments[0] === void 0 ? 0 : parseInt( arguments[0] );
                        if( from < 0 )
                            from = data.length + from;

                        var to = arguments[1] === void 0 ? data.length - 1 : parseInt( arguments[1] );
                        if( to < 0 )
                            to = data.length + to;

                        var selectLength = select.length;
                        var line;
                        if( isGroups ){
                            if( from < to ){
                                to++;
                                for( i = from; i < to; i++ ){
                                    dataI = data[ i ];
                                    if( dataI[ 0 ] == 0 ){
                                        dataI1 = dataI[ 1 ];
                                        line = { __id: dataI1, __line: i };
                                        for( j = 0; j < selectLength; j++ ){
                                            line[ select[ j ][ 1 ] ] = _data[ select[ j ][ 0 ] ][ dataI1 ];
                                        }
                                        line.__level = dataI[2];
                                        out.push( line );
                                    }else{
                                        tmp = dataI[ 1 ];
                                        dataI1 = tmp.__id;
                                        tmp.collapsed = groups[ tmp.__groupID ].collapsed;
                                        tmp.__line = i;

                                        for( j = 0; j < selectLength; j++ ){
                                            tmp[ select[ j ][ 1 ] ] = _data[ select[ j ][ 0 ] ][ dataI1 ];
                                        }

                                        out.push( tmp );
                                    }
                                }
                            } else {
                                to--;
                                for( i = from; i > to; i-- ){
                                    dataI = data[ i ];
                                    if( dataI[ 0 ] == 0 ){
                                        dataI1 = dataI[ 1 ];
                                        line = { __id: dataI1 };
                                        line.__level = dataI[ 2 ];

                                    }else{
                                        dataI1 = dataI[ 1 ].__id;
                                        line = dataI[ 1 ];
                                        line.collapsed = groups[ line.__groupID ].collapsed;
                                    }
                                    for( j = 0; j < selectLength; j++ ){
                                        line[ select[ j ][ 1 ] ] = _data[ select[ j ][ 0 ] ][ dataI1 ];
                                    }
                                    line.__line = i;
                                    out.push( line );
                                }
                            }
                        }else{
                            if( from < to ){
                                to++;
                                for( i = from; i < to; i++ ){
                                    dataI = data[ i ];
                                    line = { __id: dataI, __line: i };
                                    for( j = 0; j < selectLength; j++ ){
                                        line[ select[ j ][ 1 ] ] = _data[ select[ j ][ 0 ] ][ dataI ];
                                    }
                                    out.push( line );
                                }
                            } else {
                                to--;
                                for( i = from; i > to; i-- ){
                                    dataI = data[ i ];
                                    line = { __id: dataI, __line: i };
                                    for( j = 0; j < selectLength; j++ ){
                                        line[ select[ j ][ 1 ] ] = _data[ select[ j ][ 0 ] ][ dataI ];
                                    }
                                    out.push( line );
                                }
                            }
                        }
                        for( i = 0, _i = out.length; i < _i; i++ ){
                            for( j in out[ i ] ){
                                if( out[i][j] === null ){
                                    out[i][j] = void 0;
                                }
                            }
                        }
                        return out;
                        //console.log(data,from,to,this);
                    },
                    indexes: data,
                    length: dataLength
                };

                if( isGroups ){
                    out.collapse = function( node ){
                        node = node.toString();
                        if( !groups[ node ].collapsed ){
                            groups[ node ].collapsed = true;
                            var start, end;
                            start = groups[ node ].start;
                            end = groups[ node ].end;
                            var tmpStart = start;
                            var tmpEnd = end;

                            for( var i in collapsed ){
                                if( i !== node ){
                                    var cEnd = collapsed[ i ].end;
                                    var cStart = collapsed[ i ].start;

                                    var div = cEnd - cStart;
                                    if( cStart < tmpStart && cEnd < tmpEnd && !collapsed[ i ].overclose ){
                                        start -= div;
                                        end -= div;
                                    }else if( cStart > tmpStart && cEnd <= tmpEnd  && !collapsed[ i ].overclose ){
                                        end -= div;
                                        collapsed[ i ].overclose = true;
                                        if( groups[ node ].closedChildren === void 0 )
                                            groups[ node ].closedChildren = [];
                                        groups[ node ].closedChildren.push( i );
                                    }
                                }
                            }

                            groups[ node ].data = data.splice( start + 1, end - start );
                            this.length -= end - start;
                            collapsed[ node ] = ( groups[ node ] );
                        }
                        return this;
                    };
                    out.expand = function( node ){
                        node = node.toString();
                        if( groups[ node ].collapsed ){
                            groups[ node ].collapsed = false;
                            var start, end;
                            start = groups[ node ].start;
                            end = groups[ node ].end;
                            var tmpStart = start;
                            var tmpEnd = end;
                            for( var i in collapsed ){
                                if( i !== node ){
                                    var cEnd = collapsed[ i ].end;
                                    var cStart = collapsed[ i ].start;
                                    var div = cEnd - cStart;
                                    if( cStart < tmpStart && cEnd < tmpEnd && !collapsed[ i ].overclose ){
                                        start -= div;
                                        end -= div;
                                    }
                                }
                            }


                            var closedChildren = groups[ node ].closedChildren;
                            if( closedChildren !== void 0 ){
                                for( var j = 0, _j = closedChildren.length; j < _j; j++ ){
                                    collapsed[ closedChildren[ j ] ].overclose = false;
                                }
                                groups[ node ].closedChildren = [];
                            }

                            data = concat.call(data.slice(0,start + 1), groups[ node ].data, data.slice(start + 1));
                            this.length += groups[ node ].data.length;
                            delete( collapsed[ node ] );


                        }
                        return this;
                    };
                    out.isCollapsed = function( node ){
                        return groups[ node ].collapsed;
                    };
                    if( collapse ){
                        collapse = JS.arrayToObj(collapse);
                        data
                            .filter(function( el ){ return el[ 0 ] === 1; })
                            .filter(function( el ){ return collapse[ el[ 1 ].__id ]; })
                            .map(function( el ){ return el[ 1 ].__groupID; })
                            .forEach( out.collapse );
                    }
                }
                return out;
            })(
                data,
                tmpSelect,
                dataLength,
                _data,
                queryUnit.group !== void 0 || queryUnit.tree !== void 0,
                queryUnit.group, queryUnit.tree,
                queryUnit.collapse
            );//data;
            //console.log(data);
        }
    });
})( zStore );