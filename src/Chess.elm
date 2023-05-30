module Chess exposing (Board, ColoredPiece, FieldLocation, MateKind(..), MoveDiff, MoveExtraOutcome(..), PieceColor(..), PieceKind(..), applyMove, applyMoveDiff, at, boardStartingPositionDefault, locationEquals, mateKind, moveDiff, pieceColorOpponent, pieceValidMovesFrom, validMovesFrom)

import ArraySized exposing (ArraySized)
import Linear exposing (Direction(..))
import List.Extra
import N exposing (Exactly, In, N, N0, N7, N8, On, n0, n2, n3, n4, n5, n6, n7, n8)


type PieceKind
    = Pawn
    | Knight
    | Bishop
    | Rook
    | Queen
    | King


type PieceColor
    = Black
    | White


type alias FieldLocation =
    { row : N (In (On N0) (On N7)), column : N (In (On N0) (On N7)) }


type alias ColoredPiece =
    { color : PieceColor, piece : PieceKind }


type alias Board =
    ArraySized
        (ArraySized
            { -- stored for optimization purposes
              location : FieldLocation
            , content : Maybe ColoredPiece
            }
            (Exactly (On N8))
        )
        (Exactly (On N8))


boardStartingPositionDefault : Board
boardStartingPositionDefault =
    ArraySized.empty
        |> ArraySized.push
            (ArraySized.l8 Rook Knight Bishop Queen King Bishop Knight Rook
                |> ArraySized.map (\piece -> Just { color = White, piece = piece })
            )
        |> ArraySized.push
            (ArraySized.repeat (Just { color = White, piece = Pawn }) n8)
        |> ArraySized.push (ArraySized.repeat Nothing n8)
        |> ArraySized.push (ArraySized.repeat Nothing n8)
        |> ArraySized.push (ArraySized.repeat Nothing n8)
        |> ArraySized.push (ArraySized.repeat Nothing n8)
        |> ArraySized.push
            (ArraySized.repeat (Just { color = Black, piece = Pawn }) n8)
        |> ArraySized.push
            (ArraySized.l8 Rook Knight Bishop Queen King Bishop Knight Rook
                |> ArraySized.map (\piece -> Just { color = Black, piece = piece })
            )
        |> ArraySized.and (ArraySized.upTo n7)
        |> ArraySized.map
            (\( rowFields, row ) ->
                rowFields
                    |> ArraySized.and (ArraySized.upTo n7)
                    |> ArraySized.map
                        (\( content, column ) ->
                            { content = content, location = { row = row, column = column } }
                        )
            )


pieceColorOpponent : PieceColor -> PieceColor
pieceColorOpponent =
    \color ->
        case color of
            Black ->
                White

            White ->
                Black


locationEquals : FieldLocation -> FieldLocation -> Bool
locationEquals a b =
    ((a.row |> N.toInt) == (b.row |> N.toInt))
        && ((a.column |> N.toInt) == (b.column |> N.toInt))


isCheck : { at : FieldLocation, for : PieceColor } -> Board -> Bool
isCheck config board =
    eyesOn { location = config.at, color = config.for |> pieceColorOpponent } board /= []


possibleMovementDiagonally : List (List { row : Int, column : Int })
possibleMovementDiagonally =
    [ List.range 1 7
        |> List.map (\i -> { row = i, column = i })
    , List.range 1 7
        |> List.map (\i -> { row = -i, column = i })
    , List.range 1 7
        |> List.map (\i -> { row = i, column = -i })
    , List.range 1 7
        |> List.map (\i -> { row = -i, column = -i })
    ]


possibleLineMovement : List (List { row : Int, column : Int })
possibleLineMovement =
    [ List.range 1 7
        |> List.map (\i -> { row = i, column = 0 })
    , List.range 1 7
        |> List.map (\i -> { row = -i, column = 0 })
    , List.range 1 7
        |> List.map (\i -> { row = 0, column = i })
    , List.range 1 7
        |> List.map (\i -> { row = 0, column = -i })
    ]


possibleLMovement : List { row : Int, column : Int }
possibleLMovement =
    [ { row = 1, column = 2 }
    , { row = -1, column = 2 }
    , { row = 1, column = -2 }
    , { row = -1, column = -2 }
    , { row = 2, column = 1 }
    , { row = -2, column = 1 }
    , { row = 2, column = -1 }
    , { row = -2, column = -1 }
    ]


possibleMovementBy1 : List { row : Int, column : Int }
possibleMovementBy1 =
    [ { row = 0, column = 1 }
    , { row = 0, column = -1 }
    , { row = 1, column = 0 }
    , { row = 1, column = 1 }
    , { row = 1, column = -1 }
    , { row = -1, column = -1 }
    , { row = -1, column = 1 }
    , { row = -1, column = 0 }
    ]


eyesOn :
    { -- target
      location : FieldLocation
    , -- who looks
      color : PieceColor
    }
    -> Board
    -> List ColoredPiece
eyesOn { location, color } board =
    -- TODO en passant
    let
        whileNotBlockingPiece : (PieceKind -> Bool) -> List { row : Int, column : Int } -> List ColoredPiece
        whileNotBlockingPiece isEyeingPieceKind =
            \movementPossibilities ->
                movementPossibilities
                    |> List.Extra.stoppableFoldl
                        (\move soFar ->
                            case move |> locationMoving of
                                Nothing ->
                                    soFar |> List.Extra.Stop

                                Just moveLocation ->
                                    case board |> at moveLocation of
                                        Nothing ->
                                            soFar |> List.Extra.Continue

                                        Just piece ->
                                            if (piece.color == color) && (piece.piece |> isEyeingPieceKind) then
                                                piece :: soFar |> List.Extra.Continue

                                            else
                                                soFar |> List.Extra.Stop
                        )
                        []

        locationMoving : { row : Int, column : Int } -> Maybe FieldLocation
        locationMoving move =
            case (location.row |> N.toInt) + move.row |> N.intIsIn ( n0, n7 ) of
                Ok row ->
                    case (location.column |> N.toInt) + move.column |> N.intIsIn ( n0, n7 ) of
                        Ok column ->
                            { row = row, column = column } |> Just

                        Err _ ->
                            Nothing

                Err _ ->
                    Nothing
    in
    (possibleLineMovement
        |> List.concatMap
            (\movement ->
                movement
                    |> whileNotBlockingPiece
                        (\pieceKind ->
                            case pieceKind of
                                Rook ->
                                    True

                                Queen ->
                                    True

                                _ ->
                                    False
                        )
            )
    )
        ++ (possibleLMovement
                |> List.filterMap
                    (\move ->
                        case move |> locationMoving of
                            Nothing ->
                                Nothing

                            Just to ->
                                case board |> at to of
                                    Nothing ->
                                        Nothing

                                    Just p ->
                                        if p == { piece = Knight, color = color } then
                                            p |> Just

                                        else
                                            Nothing
                    )
           )
        ++ (possibleMovementBy1
                |> List.filterMap
                    (\move ->
                        case move |> locationMoving of
                            Nothing ->
                                Nothing

                            Just to ->
                                case board |> at to of
                                    Nothing ->
                                        Nothing

                                    Just p ->
                                        if p == { piece = King, color = color } then
                                            p |> Just

                                        else
                                            Nothing
                    )
           )
        ++ (possibleMovementDiagonally
                |> List.concatMap
                    (\movement ->
                        movement
                            |> whileNotBlockingPiece
                                (\pieceKind ->
                                    case pieceKind of
                                        Bishop ->
                                            True

                                        Queen ->
                                            True

                                        _ ->
                                            False
                                )
                    )
           )
        ++ (let
                pawnDirection : Int
                pawnDirection =
                    case color of
                        White ->
                            -1

                        Black ->
                            1
            in
            [ 1, -1 ]
                |> List.filterMap
                    (\pawnColumn ->
                        case locationMoving { row = pawnDirection, column = pawnColumn } of
                            Nothing ->
                                Nothing

                            Just eyeingPawnLocation ->
                                case board |> at eyeingPawnLocation of
                                    Nothing ->
                                        Nothing

                                    Just p ->
                                        if p == { piece = Pawn, color = color } then
                                            p |> Just

                                        else
                                            Nothing
                    )
           )


isCheckFor : PieceColor -> Board -> Bool
isCheckFor color =
    \board ->
        case kingLocation color board of
            -- no king??
            Nothing ->
                False

            Just kingLoc ->
                isCheck { for = color, at = kingLoc } board


kingLocation : PieceColor -> Board -> Maybe FieldLocation
kingLocation kingColor board =
    board
        |> ArraySized.foldFrom Nothing
            Up
            (\boardRow soFar ->
                case soFar of
                    Just found ->
                        Just found

                    Nothing ->
                        boardRow
                            |> ArraySized.foldFrom Nothing
                                Up
                                (\field rowSoFar ->
                                    case rowSoFar of
                                        Just found ->
                                            Just found

                                        Nothing ->
                                            if field.content == Just { piece = King, color = kingColor } then
                                                field.location |> Just

                                            else
                                                Nothing
                                )
            )


validMovesFrom : FieldLocation -> Board -> List { to : FieldLocation, extra : List MoveExtraOutcome }
validMovesFrom location board =
    case board |> at location of
        Nothing ->
            validMovesDisregardingChecksFrom location board

        Just coloredPiece ->
            validMovesDisregardingChecksFrom location board
                |> List.Extra.filterNot
                    (\move ->
                        isCheckFor coloredPiece.color
                            (board |> applyMove { from = location, to = move.to, extra = move.extra })
                    )


validMovesDisregardingChecksFrom : FieldLocation -> Board -> List { to : FieldLocation, extra : List MoveExtraOutcome }
validMovesDisregardingChecksFrom location board =
    case board |> at location of
        Nothing ->
            []

        Just coloredPiece ->
            let
                whileValidMovement : List { row : Int, column : Int } -> List { to : FieldLocation, extra : List MoveExtraOutcome }
                whileValidMovement movementRay =
                    movementRay
                        |> List.Extra.stoppableFoldl
                            (\movement soFar ->
                                case movement |> movementToValidEndLocation of
                                    Nothing ->
                                        soFar |> List.Extra.Stop

                                    Just validEndLocation ->
                                        if isPieceAt validEndLocation board then
                                            (validEndLocation |> withoutExtra) :: soFar |> List.Extra.Stop

                                        else
                                            (validEndLocation |> withoutExtra) :: soFar |> List.Extra.Continue
                            )
                            []

                movementDiagonal : () -> List { to : FieldLocation, extra : List MoveExtraOutcome }
                movementDiagonal () =
                    possibleMovementDiagonally |> List.concatMap whileValidMovement

                movementLine : () -> List { to : FieldLocation, extra : List MoveExtraOutcome }
                movementLine () =
                    possibleLineMovement |> List.concatMap whileValidMovement

                isCapturableOrSwappable : FieldLocation -> Bool
                isCapturableOrSwappable loc =
                    case board |> at loc of
                        Nothing ->
                            False

                        Just coloredPieceAtLocation ->
                            -- && (coloredPieceAtLocation.piece /= King)
                            -- check isn't necessary because you can't ever end your move in check
                            True

                movementToValidEndLocation : { row : Int, column : Int } -> Maybe FieldLocation
                movementToValidEndLocation movementToCheck =
                    case (location.row |> N.toInt) + movementToCheck.row |> N.intIsIn ( n0, n7 ) of
                        Ok rowInBoard ->
                            case (location.column |> N.toInt) + movementToCheck.column |> N.intIsIn ( n0, n7 ) of
                                Ok columnInBoard ->
                                    let
                                        locationInBoard : FieldLocation
                                        locationInBoard =
                                            { row = rowInBoard, column = columnInBoard }
                                    in
                                    if
                                        not (board |> isPieceAt locationInBoard)
                                            || isCapturableOrSwappable locationInBoard
                                    then
                                        Just locationInBoard

                                    else
                                        Nothing

                                Err _ ->
                                    Nothing

                        Err _ ->
                            Nothing
            in
            case coloredPiece.piece of
                Pawn ->
                    let
                        direction : Int
                        direction =
                            case coloredPiece.color of
                                White ->
                                    1

                                Black ->
                                    -1

                        promoteExtra : FieldLocation -> List MoveExtraOutcome
                        promoteExtra to =
                            if (to.row |> N.toInt) == 0 || (to.row |> N.toInt) == 7 then
                                [ Promote ]

                            else
                                []
                    in
                    -- default capturing
                    ([ 1, -1 ]
                        |> List.filterMap
                            (\column ->
                                case { row = direction, column = column } |> movementToValidEndLocation of
                                    Nothing ->
                                        Nothing

                                    Just to ->
                                        if isCapturableOrSwappable to && ((board |> at location |> Maybe.map .piece) == Just Pawn) then
                                            { to = to
                                            , extra = promoteExtra to
                                            }
                                                |> Just

                                        else
                                            Nothing
                            )
                    )
                        ++ -- en passant capturing
                           -- TODO only if pawn to capture moved 2 last move
                           (let
                                enPassantRow : N (In (On N0) (On N7))
                                enPassantRow =
                                    case coloredPiece.color of
                                        White ->
                                            whiteEnPassantRow

                                        Black ->
                                            blackEnPassantRow
                            in
                            if (location.row |> N.toInt) /= (enPassantRow |> N.toInt) then
                                []

                            else
                                [ 1, -1 ]
                                    |> List.filterMap
                                        (\column ->
                                            case { row = 0, column = column } |> movementToValidEndLocation of
                                                Nothing ->
                                                    Nothing

                                                Just requiredCaptureLocation ->
                                                    if isCapturableOrSwappable requiredCaptureLocation && ((board |> at requiredCaptureLocation |> Maybe.map .piece) == Just Pawn) then
                                                        case { row = direction, column = column } |> movementToValidEndLocation of
                                                            Nothing ->
                                                                Nothing

                                                            Just to ->
                                                                { to = to
                                                                , extra =
                                                                    if requiredCaptureLocation |> locationEquals to then
                                                                        []

                                                                    else
                                                                        [ ExtraCapture requiredCaptureLocation ]
                                                                }
                                                                    |> Just

                                                    else
                                                        Nothing
                                        )
                           )
                        ++ -- straight moves
                           ({ row = direction, column = 0 }
                                :: (let
                                        initialRow : Int
                                        initialRow =
                                            case coloredPiece.color of
                                                Black ->
                                                    6

                                                White ->
                                                    1
                                    in
                                    if (location.row |> N.toInt) == initialRow then
                                        [ { row = direction * 2, column = 0 } ]

                                    else
                                        []
                                   )
                                |> List.Extra.stoppableFoldl
                                    (\movement soFar ->
                                        case movement |> movementToValidEndLocation of
                                            Nothing ->
                                                soFar |> List.Extra.Stop

                                            Just validEndLocation ->
                                                if isPieceAt validEndLocation board then
                                                    soFar |> List.Extra.Stop

                                                else
                                                    (validEndLocation |> withoutExtra) :: soFar |> List.Extra.Continue
                                    )
                                    []
                                |> List.map (\move -> { to = move.to, extra = promoteExtra move.to ++ move.extra })
                           )

                Bishop ->
                    movementDiagonal ()

                Knight ->
                    possibleLMovement
                        |> List.filterMap (\move -> move |> movementToValidEndLocation |> Maybe.map withoutExtra)

                Rook ->
                    movementLine ()

                Queen ->
                    movementDiagonal () ++ movementLine ()

                King ->
                    possibleMovementBy1
                        |> List.filterMap (\move -> move |> movementToValidEndLocation |> Maybe.map withoutExtra)


validMovesDisregardingChecksFromClassical : FieldLocation -> Board -> List { to : FieldLocation, extra : List MoveExtraOutcome }
validMovesDisregardingChecksFromClassical location board =
    case board |> at location of
        Nothing ->
            []

        Just coloredPiece ->
            let
                whileValidMovement : List { row : Int, column : Int } -> List { to : FieldLocation, extra : List MoveExtraOutcome }
                whileValidMovement movementRay =
                    movementRay
                        |> List.Extra.stoppableFoldl
                            (\movement soFar ->
                                case movement |> movementToValidEndLocation of
                                    Nothing ->
                                        soFar |> List.Extra.Stop

                                    Just validEndLocation ->
                                        if isPieceAt validEndLocation board then
                                            (validEndLocation |> withoutExtra) :: soFar |> List.Extra.Stop

                                        else
                                            (validEndLocation |> withoutExtra) :: soFar |> List.Extra.Continue
                            )
                            []

                movementDiagonal : () -> List { to : FieldLocation, extra : List MoveExtraOutcome }
                movementDiagonal () =
                    possibleMovementDiagonally |> List.concatMap whileValidMovement

                movementLine : () -> List { to : FieldLocation, extra : List MoveExtraOutcome }
                movementLine () =
                    possibleLineMovement |> List.concatMap whileValidMovement

                isCapturable : FieldLocation -> Bool
                isCapturable loc =
                    case board |> at loc of
                        Nothing ->
                            False

                        Just coloredPieceAtLocation ->
                            -- && (coloredPieceAtLocation.piece /= King)
                            -- check isn't necessary because you can't ever end your move in check
                            coloredPieceAtLocation.color == (coloredPiece.color |> pieceColorOpponent)

                movementToValidEndLocation : { row : Int, column : Int } -> Maybe FieldLocation
                movementToValidEndLocation movementToCheck =
                    case (location.row |> N.toInt) + movementToCheck.row |> N.intIsIn ( n0, n7 ) of
                        Ok rowInBoard ->
                            case (location.column |> N.toInt) + movementToCheck.column |> N.intIsIn ( n0, n7 ) of
                                Ok columnInBoard ->
                                    let
                                        locationInBoard : FieldLocation
                                        locationInBoard =
                                            { row = rowInBoard, column = columnInBoard }
                                    in
                                    if
                                        not (board |> isPieceAt locationInBoard)
                                            || isCapturable locationInBoard
                                    then
                                        Just locationInBoard

                                    else
                                        Nothing

                                Err _ ->
                                    Nothing

                        Err _ ->
                            Nothing
            in
            case coloredPiece.piece of
                Pawn ->
                    let
                        direction : Int
                        direction =
                            case coloredPiece.color of
                                White ->
                                    1

                                Black ->
                                    -1

                        promoteExtra : FieldLocation -> List MoveExtraOutcome
                        promoteExtra to =
                            if (to.row |> N.toInt) == 0 || (to.row |> N.toInt) == 7 then
                                [ Promote ]

                            else
                                []
                    in
                    -- default capturing
                    ([ 1, -1 ]
                        |> List.filterMap
                            (\column ->
                                case { row = direction, column = column } |> movementToValidEndLocation of
                                    Nothing ->
                                        Nothing

                                    Just to ->
                                        if isCapturable to && ((board |> at location |> Maybe.map .piece) == Just Pawn) then
                                            { to = to
                                            , extra = promoteExtra to
                                            }
                                                |> Just

                                        else
                                            Nothing
                            )
                    )
                        ++ -- en passant capturing
                           -- TODO only if pawn to capture moved 2 last move
                           (let
                                enPassantRow : N (In (On N0) (On N7))
                                enPassantRow =
                                    case coloredPiece.color of
                                        White ->
                                            whiteEnPassantRow

                                        Black ->
                                            blackEnPassantRow
                            in
                            if (location.row |> N.toInt) /= (enPassantRow |> N.toInt) then
                                []

                            else
                                [ 1, -1 ]
                                    |> List.filterMap
                                        (\column ->
                                            case { row = 0, column = column } |> movementToValidEndLocation of
                                                Nothing ->
                                                    Nothing

                                                Just requiredCaptureLocation ->
                                                    if isCapturable requiredCaptureLocation && ((board |> at requiredCaptureLocation |> Maybe.map .piece) == Just Pawn) then
                                                        case { row = direction, column = column } |> movementToValidEndLocation of
                                                            Nothing ->
                                                                Nothing

                                                            Just to ->
                                                                { to = to
                                                                , extra =
                                                                    if requiredCaptureLocation |> locationEquals to then
                                                                        []

                                                                    else
                                                                        [ ExtraCapture requiredCaptureLocation ]
                                                                }
                                                                    |> Just

                                                    else
                                                        Nothing
                                        )
                           )
                        ++ -- straight moves
                           ({ row = direction, column = 0 }
                                :: (let
                                        initialRow : Int
                                        initialRow =
                                            case coloredPiece.color of
                                                Black ->
                                                    6

                                                White ->
                                                    1
                                    in
                                    if (location.row |> N.toInt) == initialRow then
                                        [ { row = direction * 2, column = 0 } ]

                                    else
                                        []
                                   )
                                |> List.Extra.stoppableFoldl
                                    (\movement soFar ->
                                        case movement |> movementToValidEndLocation of
                                            Nothing ->
                                                soFar |> List.Extra.Stop

                                            Just validEndLocation ->
                                                if isPieceAt validEndLocation board then
                                                    soFar |> List.Extra.Stop

                                                else
                                                    (validEndLocation |> withoutExtra) :: soFar |> List.Extra.Continue
                                    )
                                    []
                                |> List.map (\move -> { to = move.to, extra = promoteExtra move.to ++ move.extra })
                           )

                Bishop ->
                    movementDiagonal ()

                Knight ->
                    possibleLMovement
                        |> List.filterMap (\move -> move |> movementToValidEndLocation |> Maybe.map withoutExtra)

                Rook ->
                    movementLine ()

                Queen ->
                    movementDiagonal () ++ movementLine ()

                King ->
                    (possibleMovementBy1
                        |> List.filterMap (\move -> move |> movementToValidEndLocation |> Maybe.map withoutExtra)
                    )
                        -- castling
                        -- TODO only if king and rook haven't moved
                        ++ (if isCheck { at = location, for = coloredPiece.color } board then
                                []

                            else
                                let
                                    castleRow : N (In (On N0) (On N7))
                                    castleRow =
                                        case coloredPiece.color of
                                            Black ->
                                                whitePromotionRow

                                            White ->
                                                blackPromotionRow
                                in
                                if location |> locationEquals { row = castleRow, column = initialKingColumn } then
                                    let
                                        castleToSide :
                                            { initialRookColumn : N (In (On N0) (On N7)), castledRookColumn : N (In (On N0) (On N7)), castledKingColumn : N (In (On N0) (On N7)) }
                                            -> Maybe { to : FieldLocation, extra : List MoveExtraOutcome }
                                        castleToSide side =
                                            let
                                                initialRookLocation : FieldLocation
                                                initialRookLocation =
                                                    { row = castleRow, column = side.initialRookColumn }
                                            in
                                            if (board |> at initialRookLocation) /= Just { color = coloredPiece.color, piece = Rook } then
                                                Nothing

                                            else
                                                let
                                                    castledKingLocation : FieldLocation
                                                    castledKingLocation =
                                                        { row = castleRow, column = side.castledKingColumn }

                                                    castledRookLocation : FieldLocation
                                                    castledRookLocation =
                                                        { row = castleRow, column = side.castledRookColumn }
                                                in
                                                if
                                                    (board |> isPieceAt castledRookLocation)
                                                        || (board |> isPieceAt castledKingLocation)
                                                then
                                                    Nothing

                                                else if board |> isCheck { for = coloredPiece.color, at = castledRookLocation } then
                                                    -- we can check for checks with the king at the previous location because
                                                    -- if the king blocks a check, it is itself in check which disallows castling
                                                    Nothing

                                                else
                                                    { to = castledKingLocation
                                                    , extra =
                                                        ExtraMove
                                                            { from = { row = castleRow, column = side.initialRookColumn }
                                                            , to = castledRookLocation
                                                            }
                                                            |> List.singleton
                                                    }
                                                        |> Just
                                    in
                                    List.filterMap castleToSide [ castleKingsideInfo, castleQueensideInfo ]

                                else
                                    []
                           )


withoutExtra : FieldLocation -> { to : FieldLocation, extra : List MoveExtraOutcome }
withoutExtra =
    \to -> { to = to, extra = [] }


whiteEnPassantRow : N (In (On N0) (On N7))
whiteEnPassantRow =
    n4 |> N.minTo n0 |> N.maxTo n7


blackEnPassantRow : N (In (On N0) (On N7))
blackEnPassantRow =
    n5 |> N.minTo n0 |> N.maxTo n7


blackPromotionRow : N (In (On N0) (On N7))
blackPromotionRow =
    n0 |> N.maxTo n7


whitePromotionRow : N (In (On N0) (On N7))
whitePromotionRow =
    n0 |> N.maxTo n7


castleQueensideInfo : { initialRookColumn : N (In (On N0) (On N7)), castledRookColumn : N (In (On N0) (On N7)), castledKingColumn : N (In (On N0) (On N7)) }
castleQueensideInfo =
    { initialRookColumn = n0 |> N.maxTo n7
    , castledRookColumn = n3 |> N.minTo n0 |> N.maxTo n7
    , castledKingColumn = n2 |> N.minTo n0 |> N.maxTo n7
    }


castleKingsideInfo : { initialRookColumn : N (In (On N0) (On N7)), castledRookColumn : N (In (On N0) (On N7)), castledKingColumn : N (In (On N0) (On N7)) }
castleKingsideInfo =
    { initialRookColumn = n7 |> N.minTo n0
    , castledRookColumn = n5 |> N.minTo n0 |> N.maxTo n7
    , castledKingColumn = n6 |> N.minTo n0 |> N.maxTo n7
    }


initialKingColumn : N (In (On N0) (On N7))
initialKingColumn =
    n4 |> N.minTo n0 |> N.maxTo n7


isPieceAt : FieldLocation -> Board -> Bool
isPieceAt location =
    \board ->
        (board |> at location) /= Nothing


applyMoveDiff : MoveDiff -> Board -> Board
applyMoveDiff moveDiff_ =
    \board ->
        List.foldl
            (\fieldDiff boardSoFar ->
                boardSoFar |> replaceAt fieldDiff.location (\() -> fieldDiff.replacement)
            )
            board
            moveDiff_


replaceAt : FieldLocation -> (() -> Maybe ColoredPiece) -> Board -> Board
replaceAt location replacement =
    \board ->
        board
            |> ArraySized.elementAlter ( Up, location.row )
                (ArraySized.elementAlter ( Up, location.column )
                    (\field -> { field | content = replacement () })
                )


at : FieldLocation -> Board -> Maybe ColoredPiece
at location =
    \board ->
        board
            |> ArraySized.element ( Up, location.row )
            |> ArraySized.element ( Up, location.column )
            |> .content


moveDiff : { from : FieldLocation, to : FieldLocation, extra : List MoveExtraOutcome } -> Board -> MoveDiff
moveDiff move board =
    let
        atOrigin =
            board |> at move.from

        atDestination =
            board |> at move.to
    in
    [ { location = move.from
      , replacement =
            case ( atOrigin, atDestination ) of
                -- moved a piece that doesn't exist??
                ( Nothing, _ ) ->
                    Nothing

                -- move without swap
                ( Just _, Nothing ) ->
                    Nothing

                ( Just movedPiece, Just destinationPiece ) ->
                    if movedPiece.color == destinationPiece.color then
                        -- swap
                        Just destinationPiece

                    else
                        -- capture
                        Nothing
      }
    , { location = move.to, replacement = atOrigin }
    ]
        ++ (move.extra
                |> List.concatMap (moveExtraToDiff move board)
           )


moveDiffClassical : { from : FieldLocation, to : FieldLocation, extra : List MoveExtraOutcome } -> Board -> MoveDiff
moveDiffClassical move board =
    [ { location = move.from, replacement = Nothing }
    , { location = move.to, replacement = board |> at move.from }
    ]
        ++ (move.extra
                |> List.concatMap (moveExtraToDiff move board)
           )


moveExtraToDiff : { move_ | from : FieldLocation, to : FieldLocation } -> Board -> MoveExtraOutcome -> MoveDiff
moveExtraToDiff move board =
    \extra ->
        case extra of
            ExtraCapture captureLocation ->
                [ { location = captureLocation, replacement = Nothing }
                ]

            ExtraMove extraMove ->
                [ { location = extraMove.from, replacement = Nothing }
                , { location = extraMove.to, replacement = board |> at extraMove.from }
                ]

            Promote ->
                case board |> at move.from of
                    -- empty field wants to promote??
                    Nothing ->
                        []

                    Just promotingPawn ->
                        [ { location = move.to
                          , replacement =
                                { piece = Queen
                                , color = promotingPawn.color
                                }
                                    |> Just
                          }
                        ]


applyMove : { from : FieldLocation, to : FieldLocation, extra : List MoveExtraOutcome } -> Board -> Board
applyMove move =
    \board ->
        board |> applyMoveDiff (moveDiff move board)


pieceValidMovesFrom : FieldLocation -> Board -> List { from : FieldLocation, to : FieldLocation, extra : List MoveExtraOutcome }
pieceValidMovesFrom location =
    \board ->
        validMovesFrom location board
            |> List.map
                (\move ->
                    { from = location, to = move.to, extra = move.extra }
                )


mateKind : { validMoves : List move_, for : PieceColor } -> Board -> Maybe MateKind
mateKind config =
    \board ->
        case config.validMoves of
            [] ->
                if board |> isCheckFor config.for then
                    Just Checkmate

                else
                    Just Stalemate

            _ :: _ ->
                Nothing


type alias MoveDiff =
    List { location : FieldLocation, replacement : Maybe ColoredPiece }


type MateKind
    = Stalemate
    | Checkmate


type MoveExtraOutcome
    = -- en passant
      ExtraCapture FieldLocation
    | -- castle
      ExtraMove { from : FieldLocation, to : FieldLocation }
    | Promote
