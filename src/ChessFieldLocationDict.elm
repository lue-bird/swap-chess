module ChessFieldLocationDict exposing
    ( remove, update, insert, singleton, empty
    , ChessFieldLocationDict
    , fromList, toList, values, keys
    , popMax, getMax, getMaxKey, popMin, getMin, getMinKey
    , size, get, member, isEmpty
    , partition, filter, foldr, foldl, map
    , mapFromList, mapToListConcat
    )

{-|


## Build

@docs remove, update, insert, singleton, empty


## Dictionaries

@docs ChessFieldLocationDict


## Lists

@docs fromList, toList, values, keys


## Min / Max

@docs popMax, getMax, getMaxKey, popMin, getMin, getMinKey


## Query

@docs size, get, member, isEmpty


## Transform

@docs partition, filter, foldr, foldl, map

-}

import Chess
import FastDict
import N
import Tuple


type ChessFieldLocationDict v
    = ChessFieldLocationDict (FastDict.Dict ( Int, Int ) ( Chess.FieldLocation, v ))


empty : ChessFieldLocationDict v
empty =
    ChessFieldLocationDict FastDict.empty


singleton : Chess.FieldLocation -> v -> ChessFieldLocationDict v
singleton key value =
    ChessFieldLocationDict
        (FastDict.singleton
            ( N.toInt key.row, N.toInt key.column )
            ( key, value )
        )


mapFromList : (a -> ( Chess.FieldLocation, v )) -> List a -> ChessFieldLocationDict v
mapFromList toEntry =
    \list ->
        List.foldl
            (\element soFar ->
                let
                    ( fieldLocation, value ) =
                        element |> toEntry
                in
                soFar |> insert fieldLocation value
            )
            empty
            list


insert :
    Chess.FieldLocation
    -> v
    -> ChessFieldLocationDict v
    -> ChessFieldLocationDict v
insert key value d =
    case d of
        ChessFieldLocationDict dict ->
            ChessFieldLocationDict
                (FastDict.insert
                    ( N.toInt key.row, N.toInt key.column )
                    ( key, value )
                    dict
                )


update :
    Chess.FieldLocation
    -> (Maybe v -> Maybe v)
    -> ChessFieldLocationDict v
    -> ChessFieldLocationDict v
update key f d =
    case d of
        ChessFieldLocationDict dict ->
            ChessFieldLocationDict
                (FastDict.update
                    ( N.toInt key.row, N.toInt key.column )
                    (\updateUnpack ->
                        Maybe.map
                            (Tuple.pair key)
                            (f (Maybe.map Tuple.second updateUnpack))
                    )
                    dict
                )


remove : Chess.FieldLocation -> ChessFieldLocationDict v -> ChessFieldLocationDict v
remove key d =
    case d of
        ChessFieldLocationDict dict ->
            ChessFieldLocationDict
                (FastDict.remove ( N.toInt key.row, N.toInt key.column ) dict)


isEmpty : ChessFieldLocationDict v -> Bool
isEmpty d =
    case d of
        ChessFieldLocationDict dict ->
            FastDict.isEmpty dict


member : Chess.FieldLocation -> ChessFieldLocationDict v -> Bool
member key d =
    case d of
        ChessFieldLocationDict dict ->
            FastDict.member ( N.toInt key.row, N.toInt key.column ) dict


get : Chess.FieldLocation -> ChessFieldLocationDict v -> Maybe v
get key d =
    case d of
        ChessFieldLocationDict dict ->
            Maybe.map
                Tuple.second
                (FastDict.get ( N.toInt key.row, N.toInt key.column ) dict)


size : ChessFieldLocationDict v -> Int
size d =
    case d of
        ChessFieldLocationDict dict ->
            FastDict.size dict


keys : ChessFieldLocationDict v -> List Chess.FieldLocation
keys d =
    case d of
        ChessFieldLocationDict dict ->
            List.map Tuple.first (FastDict.values dict)


values : ChessFieldLocationDict v -> List v
values d =
    case d of
        ChessFieldLocationDict dict ->
            List.map Tuple.second (FastDict.values dict)


toList : ChessFieldLocationDict v -> List ( Chess.FieldLocation, v )
toList d =
    case d of
        ChessFieldLocationDict dict ->
            FastDict.values dict


fromList : List ( Chess.FieldLocation, v ) -> ChessFieldLocationDict v
fromList l =
    ChessFieldLocationDict
        (FastDict.fromList
            (List.map
                (\e ->
                    case e of
                        ( k_1_0_1_1_1_0_0, v_1_1_0_1_1_1_0_0 ) ->
                            ( ( N.toInt k_1_0_1_1_1_0_0.row
                              , N.toInt k_1_0_1_1_1_0_0.column
                              )
                            , e
                            )
                )
                l
            )
        )


map :
    (Chess.FieldLocation -> a -> b)
    -> ChessFieldLocationDict a
    -> ChessFieldLocationDict b
map f d =
    case d of
        ChessFieldLocationDict dict ->
            ChessFieldLocationDict
                (FastDict.map
                    (\mapUnpack ->
                        \unpack ->
                            case unpack of
                                ( k_1_0_0_1_1_0_1_0_0, a_1_1_0_0_1_1_0_1_0_0 ) ->
                                    ( k_1_0_0_1_1_0_1_0_0
                                    , f
                                        k_1_0_0_1_1_0_1_0_0
                                        a_1_1_0_0_1_1_0_1_0_0
                                    )
                    )
                    dict
                )


foldl : (Chess.FieldLocation -> v -> b -> b) -> b -> ChessFieldLocationDict v -> b
foldl f b0 d =
    case d of
        ChessFieldLocationDict dict ->
            FastDict.foldl
                (\_ kv b ->
                    case kv of
                        ( k_1_0_1_0_1_0_0, v_1_1_0_1_0_1_0_0 ) ->
                            f k_1_0_1_0_1_0_0 v_1_1_0_1_0_1_0_0 b
                )
                b0
                dict


foldr : (Chess.FieldLocation -> v -> b -> b) -> b -> ChessFieldLocationDict v -> b
foldr f b0 d =
    case d of
        ChessFieldLocationDict dict ->
            FastDict.foldr
                (\_ kv b ->
                    case kv of
                        ( k_1_0_1_0_1_0_0, v_1_1_0_1_0_1_0_0 ) ->
                            f k_1_0_1_0_1_0_0 v_1_1_0_1_0_1_0_0 b
                )
                b0
                dict


filter :
    (Chess.FieldLocation -> v -> Bool)
    -> ChessFieldLocationDict v
    -> ChessFieldLocationDict v
filter f d =
    ChessFieldLocationDict
        (case d of
            ChessFieldLocationDict dict ->
                FastDict.filter
                    (\filterUnpack ->
                        \unpack ->
                            case unpack of
                                ( k_1_0_0_1_0_1_1_0_0, v_1_1_0_0_1_0_1_1_0_0 ) ->
                                    f k_1_0_0_1_0_1_1_0_0 v_1_1_0_0_1_0_1_1_0_0
                    )
                    dict
        )


mapToListConcat : (( Chess.FieldLocation, v ) -> List b) -> ChessFieldLocationDict v -> List b
mapToListConcat elementToList =
    \dict ->
        dict
            |> foldl
                (\key value soFar ->
                    soFar ++ (( key, value ) |> elementToList)
                )
                []


partition :
    (Chess.FieldLocation -> v -> Bool)
    -> ChessFieldLocationDict v
    -> ( ChessFieldLocationDict v, ChessFieldLocationDict v )
partition f d =
    case d of
        ChessFieldLocationDict dict ->
            Tuple.mapBoth
                ChessFieldLocationDict
                ChessFieldLocationDict
                (FastDict.partition
                    (\partitionUnpack ->
                        \unpack ->
                            case unpack of
                                ( k_1_0_0_1_3_0_1_0_0, v_1_1_0_0_1_3_0_1_0_0 ) ->
                                    f k_1_0_0_1_3_0_1_0_0 v_1_1_0_0_1_3_0_1_0_0
                    )
                    dict
                )


getMinKey : ChessFieldLocationDict v -> Maybe ( Int, Int )
getMinKey d =
    case d of
        ChessFieldLocationDict dict ->
            FastDict.getMinKey dict


getMin :
    ChessFieldLocationDict v
    -> Maybe ( ( Int, Int ), ( Chess.FieldLocation, v ) )
getMin d =
    case d of
        ChessFieldLocationDict dict ->
            FastDict.getMin dict


popMin :
    ChessFieldLocationDict v
    -> Maybe ( ( ( Int, Int ), ( Chess.FieldLocation, v ) ), FastDict.Dict ( Int, Int ) ( Chess.FieldLocation, v ) )
popMin d =
    case d of
        ChessFieldLocationDict dict ->
            FastDict.popMin dict


getMaxKey : ChessFieldLocationDict v -> Maybe ( Int, Int )
getMaxKey d =
    case d of
        ChessFieldLocationDict dict ->
            FastDict.getMaxKey dict


getMax :
    ChessFieldLocationDict v
    -> Maybe ( ( Int, Int ), ( Chess.FieldLocation, v ) )
getMax d =
    case d of
        ChessFieldLocationDict dict ->
            FastDict.getMax dict


popMax :
    ChessFieldLocationDict v
    -> Maybe ( ( ( Int, Int ), ( Chess.FieldLocation, v ) ), FastDict.Dict ( Int, Int ) ( Chess.FieldLocation, v ) )
popMax d =
    case d of
        ChessFieldLocationDict dict ->
            FastDict.popMax dict
