module Main exposing (main)

{-| -}

import ArraySized exposing (ArraySized)
import Audio
import Browser
import Color
import Element as Ui
import Element.Background as UiBackground
import Element.Border as UiBorder
import Element.Events as Ui
import Element.Font as UiFont
import Element.Input as UiInput
import Html
import Json.Decode
import Key
import LineSegment2d exposing (LineSegment2d)
import Linear exposing (Direction(..))
import List.Extra
import Maybe.Extra
import N exposing (Exactly, In, N, N0, N7, N8, On, n0, n1, n2, n3, n4, n5, n6, n7, n8)
import Phosphor
import Pixels exposing (Pixels, PixelsPerSecond, SquarePixels)
import PkgPorts
import Point2d exposing (Point2d)
import Process
import Quantity exposing (Quantity, Rate)
import Random
import Reaction exposing (Reaction)
import Speed exposing (MetersPerSecond, Speed)
import Svg
import Svg.Attributes as SvgA
import Task
import Time


type Event
    = AudioLoaded { piece : AudioPiece, result : Result Audio.LoadError Audio.Source }
    | FieldSelected FieldLocation
    | ComputerMoveRequested
    | InitialRandomSeedGenerated Random.Seed


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
        (ArraySized (Maybe ColoredPiece) (Exactly (On N8)))
        (Exactly (On N8))


type alias State =
    { audioPieceMove : Result Audio.LoadError Audio.Source
    , board : Board
    , selection : Maybe FieldLocation
    , computerChat : List String
    , randomSeed : Random.Seed
    }


type Effect
    = LoadAudio AudioPiece
    | RequestComputerMove
    | GenerateInitialRandomSeed


type AudioPiece
    = AudioPieceMove


main : Program () (Audio.Model Event State) (Audio.Msg Event)
main =
    Audio.documentWithAudio
        { init =
            init >> Reaction.toTuple3 interpretEffect
        , update =
            \_ event ->
                reactTo event >> Reaction.toTuple3 interpretEffect
        , subscriptions =
            \_ -> subscriptions
        , view =
            \_ -> uiDocument
        , audio = \_ -> audio
        , audioPort =
            { toJS = PkgPorts.ports.audioPortToJS
            , fromJS = PkgPorts.ports.audioPortFromJS
            }
        }


audioPieces : List AudioPiece
audioPieces =
    [ AudioPieceMove ]


init : () -> Reaction State Effect
init () =
    Reaction.to
        { audioPieceMove = Err Audio.UnknownError
        , board = boardStartingPositionDefault
        , selection = Nothing
        , computerChat = []
        , randomSeed =
            -- dummy
            Random.initialSeed 1234432
        }
        |> Reaction.effectsAdd (List.map LoadAudio audioPieces)
        |> Reaction.effectsAdd [ GenerateInitialRandomSeed ]


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


reactTo : Event -> (State -> Reaction State Effect)
reactTo event =
    case event of
        AudioLoaded audioLoaded ->
            case audioLoaded.piece of
                AudioPieceMove ->
                    \state -> Reaction.to { state | audioPieceMove = audioLoaded.result }

        FieldSelected fieldLocation ->
            \state ->
                case state.selection of
                    Nothing ->
                        case state.board |> at fieldLocation of
                            Nothing ->
                                Reaction.to state

                            Just coloredPiece ->
                                if coloredPiece.color == computerColor then
                                    Reaction.to state

                                else
                                    Reaction.to { state | selection = Just fieldLocation }

                    Just currentSelectedFieldLocation ->
                        case checkIfValidMove state.board { from = currentSelectedFieldLocation, to = fieldLocation } of
                            Nothing ->
                                Reaction.to { state | selection = Nothing }

                            Just extra ->
                                Reaction.to
                                    { state
                                        | selection = Nothing
                                        , board =
                                            state.board
                                                |> applyMove { from = currentSelectedFieldLocation, to = fieldLocation, extra = extra }
                                    }
                                    |> Reaction.effectsAdd [ RequestComputerMove ]

        ComputerMoveRequested ->
            \state ->
                let
                    computerMove =
                        state.board |> computeBestMove

                    ( generatedComputerChatMessage, newRandomSeed ) =
                        Random.step (randomComputerEvaluationChat computerMove.evaluation) state.randomSeed
                in
                Reaction.to
                    { state
                        | board =
                            state.board |> applyMove computerMove.move
                        , computerChat = state.computerChat |> (::) generatedComputerChatMessage
                        , randomSeed = newRandomSeed
                    }

        InitialRandomSeedGenerated initialRandomSeed ->
            \state -> Reaction.to { state | randomSeed = initialRandomSeed }


type MoveExtraOutcome
    = -- en passant
      ExtraCapture FieldLocation
    | -- castle
      ExtraMove { from : FieldLocation, to : FieldLocation }
    | Promote


checkIfValidMove : Board -> { from : FieldLocation, to : FieldLocation } -> Maybe (List MoveExtraOutcome)
checkIfValidMove board move =
    validMovesFrom move.from board
        |> List.Extra.find
            (\validMove -> validMove.to |> locationEquals move.to)
        |> Maybe.map (\validMove -> validMove.extra)


locationEquals : FieldLocation -> FieldLocation -> Bool
locationEquals a b =
    ((a.row |> N.toInt) == (b.row |> N.toInt))
        && ((a.column |> N.toInt) == (b.column |> N.toInt))


applyMove : { from : FieldLocation, to : FieldLocation, extra : List MoveExtraOutcome } -> Board -> Board
applyMove move =
    \board ->
        board |> applyMoveDiff (moveDiff move board)


applyMoveFrom : FieldLocation -> { to : FieldLocation, extra : List MoveExtraOutcome } -> Board -> Board
applyMoveFrom moveFrom move =
    \board ->
        board
            |> applyMove { from = moveFrom, to = move.to, extra = move.extra }


type alias MoveDiff =
    List { location : FieldLocation, replacement : Maybe ColoredPiece }


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
                (ArraySized.elementReplace ( Up, location.column ) replacement)


moveDiff : { from : FieldLocation, to : FieldLocation, extra : List MoveExtraOutcome } -> Board -> MoveDiff
moveDiff move board =
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


hasPieceAt : FieldLocation -> Board -> Bool
hasPieceAt location =
    \board ->
        (board |> at location) /= Nothing


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
                            (board |> applyMoveFrom location move)
                    )


validMovesDisregardingChecksFrom : FieldLocation -> Board -> List { to : FieldLocation, extra : List MoveExtraOutcome }
validMovesDisregardingChecksFrom location board =
    case board |> at location of
        Nothing ->
            []

        Just coloredPiece ->
            let
                withMaybeExtra maybeExtra to =
                    { to = to
                    , extra =
                        case maybeExtra of
                            Nothing ->
                                []

                            Just extra ->
                                [ extra ]
                    }

                withoutExtra to =
                    withMaybeExtra Nothing to

                mapExtra extraChange =
                    \move -> { to = move.to, extra = move.extra |> extraChange }

                movementDiagonal () =
                    possibleMovementDiagonally
                        |> List.concatMap
                            (\movementRay ->
                                movementRay
                                    |> listFilterMapWhile movementToValidEndLocation
                                    |> listTakeUntil (\l -> hasPieceAt l board)
                            )
                        |> List.map withoutExtra

                movementLine () =
                    possibleLineMovement
                        |> List.concatMap
                            (\movementRay ->
                                movementRay
                                    |> listFilterMapWhile movementToValidEndLocation
                                    |> listTakeUntil (\l -> hasPieceAt l board)
                            )
                        |> List.map withoutExtra

                isCapturable : FieldLocation -> Bool
                isCapturable loc =
                    case board |> at loc of
                        Nothing ->
                            False

                        Just coloredPieceAtLocation ->
                            (coloredPieceAtLocation.color == (coloredPiece.color |> pieceColorOpponent))
                                && (coloredPieceAtLocation.piece /= King)

                movementToValidEndLocation : { row : Int, column : Int } -> Maybe FieldLocation
                movementToValidEndLocation movementToCheck =
                    case
                        ( (location.row |> N.toInt) + movementToCheck.row |> N.intIsIn ( n0, n7 )
                        , (location.column |> N.toInt) + movementToCheck.column |> N.intIsIn ( n0, n7 )
                        )
                    of
                        ( Ok rowInBoard, Ok columnInBoard ) ->
                            let
                                locationInBoard =
                                    { row = rowInBoard, column = columnInBoard }
                            in
                            if
                                not (board |> hasPieceAt locationInBoard)
                                    || isCapturable locationInBoard
                            then
                                Just locationInBoard

                            else
                                Nothing

                        _ ->
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
                    in
                    [ -- default capturing
                      [ { movement = { row = direction, column = 1 }, requireCapture = { row = direction, column = 1 } }
                      , { movement = { row = direction, column = -1 }, requireCapture = { row = direction, column = -1 } }
                      ]
                        |> List.filterMap
                            (\move ->
                                case move.requireCapture |> movementToValidEndLocation of
                                    Nothing ->
                                        move.movement |> movementToValidEndLocation |> Maybe.map withoutExtra

                                    Just requiredCaptureLocation ->
                                        if isCapturable requiredCaptureLocation then
                                            move.movement
                                                |> movementToValidEndLocation
                                                |> Maybe.map
                                                    (\to ->
                                                        withMaybeExtra
                                                            (if requiredCaptureLocation |> locationEquals to then
                                                                Nothing

                                                             else
                                                                ExtraCapture requiredCaptureLocation |> Just
                                                            )
                                                            to
                                                    )

                                        else
                                            Nothing
                            )
                    , -- en passant capturing
                      -- TODO only if pawn to capture moved 2 last move
                      let
                        enPassantRow =
                            case coloredPiece.color of
                                White ->
                                    n4 |> N.minTo n0 |> N.maxTo n7

                                Black ->
                                    n5 |> N.minTo n0 |> N.maxTo n7
                      in
                      if (location.row |> N.toInt) /= (enPassantRow |> N.toInt) then
                        []

                      else
                        [ { movement = { row = direction, column = 1 }, requireCapture = { row = 0, column = 1 } }
                        , { movement = { row = direction, column = -1 }, requireCapture = { row = 0, column = -1 } }
                        ]
                            |> List.filterMap
                                (\move ->
                                    case move.requireCapture |> movementToValidEndLocation of
                                        Nothing ->
                                            Nothing

                                        Just requiredCaptureLocation ->
                                            if isCapturable requiredCaptureLocation && ((board |> at requiredCaptureLocation |> Maybe.map .piece) == Just Pawn) then
                                                move.movement
                                                    |> movementToValidEndLocation
                                                    |> Maybe.map
                                                        (\to ->
                                                            withMaybeExtra
                                                                (if requiredCaptureLocation |> locationEquals to then
                                                                    Nothing

                                                                 else
                                                                    ExtraCapture requiredCaptureLocation |> Just
                                                                )
                                                                to
                                                        )

                                            else
                                                Nothing
                                )
                    , -- straight moves
                      []
                        |> (let
                                initialRow : Int
                                initialRow =
                                    case coloredPiece.color of
                                        Black ->
                                            6

                                        White ->
                                            1
                            in
                            if (location.row |> N.toInt) == initialRow then
                                (::) { row = direction * 2, column = 0 }

                            else
                                identity
                           )
                        |> (::) { row = direction, column = 0 }
                        |> listFilterMapWhile (\move -> move |> movementToValidEndLocation)
                        |> List.Extra.takeWhile (\to -> not (board |> hasPieceAt to))
                        |> List.map withoutExtra
                    ]
                        |> List.concat
                        |> List.map
                            (\move ->
                                mapExtra
                                    (if (move.to.row |> N.toInt) == 0 || (move.to.row |> N.toInt) == 7 then
                                        (::) Promote

                                     else
                                        identity
                                    )
                                    move
                            )

                Bishop ->
                    movementDiagonal ()

                Knight ->
                    possibleLMovement
                        |> List.filterMap movementToValidEndLocation
                        |> List.map withoutExtra

                Rook ->
                    movementLine ()

                Queen ->
                    movementDiagonal () ++ movementLine ()

                King ->
                    (possibleMovementBy1
                        |> List.filterMap movementToValidEndLocation
                        |> List.map withoutExtra
                    )
                        -- castling
                        ++ (let
                                castleRow : N (In (On N0) (On N7))
                                castleRow =
                                    case coloredPiece.color of
                                        Black ->
                                            n7 |> N.minTo n0

                                        White ->
                                            n0 |> N.maxTo n7
                            in
                            if (location.row |> N.toInt) /= (castleRow |> N.toInt) then
                                []

                            else if (location.column |> N.toInt) /= 4 then
                                []

                            else
                                List.filterMap identity
                                    [ if
                                        (board |> at { row = castleRow, column = n7 |> N.minTo n0 })
                                            /= Just { color = coloredPiece.color, piece = Rook }
                                      then
                                        Nothing

                                      else if
                                        (board |> hasPieceAt { row = castleRow, column = n5 |> N.minTo n0 |> N.maxTo n7 })
                                            || (board |> hasPieceAt { row = castleRow, column = n6 |> N.minTo n0 |> N.maxTo n7 })
                                      then
                                        Nothing

                                      else if
                                        board
                                            |> applyMove { from = location, to = { row = castleRow, column = n5 |> N.minTo n0 |> N.maxTo n7 }, extra = [] }
                                            |> isCheckFor coloredPiece.color
                                      then
                                        Nothing

                                      else
                                        { to = { row = castleRow, column = n6 |> N.minTo n0 |> N.maxTo n7 }
                                        , extra =
                                            ExtraMove
                                                { from = { row = castleRow, column = n7 |> N.minTo n0 }
                                                , to = { row = castleRow, column = n5 |> N.minTo n0 |> N.maxTo n7 }
                                                }
                                                |> List.singleton
                                        }
                                            |> Just
                                    , if
                                        (board |> at { row = castleRow, column = n0 |> N.maxTo n7 })
                                            /= Just { color = coloredPiece.color, piece = Rook }
                                      then
                                        Nothing

                                      else if
                                        (board |> hasPieceAt { row = castleRow, column = n3 |> N.minTo n0 |> N.maxTo n7 })
                                            || (board |> hasPieceAt { row = castleRow, column = n2 |> N.minTo n0 |> N.maxTo n7 })
                                      then
                                        Nothing

                                      else if
                                        board
                                            |> applyMove { from = location, to = { row = castleRow, column = n3 |> N.minTo n0 |> N.maxTo n7 }, extra = [] }
                                            |> isCheckFor coloredPiece.color
                                      then
                                        Nothing

                                      else
                                        { to = { row = castleRow, column = n2 |> N.minTo n0 |> N.maxTo n7 }
                                        , extra =
                                            ExtraMove
                                                { from = { row = castleRow, column = n0 |> N.maxTo n7 }
                                                , to = { row = castleRow, column = n3 |> N.minTo n0 |> N.maxTo n7 }
                                                }
                                                |> List.singleton
                                        }
                                            |> Just
                                    ]
                           )


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
                                                soFar |> (::) piece |> List.Extra.Continue

                                            else
                                                soFar |> List.Extra.Stop
                        )
                        []

        locationMoving : { row : Int, column : Int } -> Maybe FieldLocation
        locationMoving move =
            case
                ( (location.row |> N.toInt) + move.row |> N.intIsIn ( n0, n7 )
                , (location.column |> N.toInt) + move.column |> N.intIsIn ( n0, n7 )
                )
            of
                ( Ok row, Ok column ) ->
                    { row = row, column = column } |> Just

                _ ->
                    Nothing
    in
    [ possibleLineMovement
        |> List.concatMap
            (whileNotBlockingPiece
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
    , possibleLMovement
        |> List.filterMap locationMoving
        |> List.filterMap
            (\loc ->
                (board |> at loc)
                    |> Maybe.andThen (justIf (\p -> p == { piece = Knight, color = color }))
            )
    , possibleMovementBy1
        |> List.filterMap locationMoving
        |> List.filterMap
            (\loc ->
                (board |> at loc)
                    |> Maybe.andThen (justIf (\p -> p == { piece = King, color = color }))
            )
    , possibleMovementDiagonally
        |> List.concatMap
            (whileNotBlockingPiece
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
    , let
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
                locationMoving { row = pawnDirection, column = pawnColumn }
                    |> Maybe.andThen
                        (\eyeingPawnLocation ->
                            board
                                |> at eyeingPawnLocation
                                |> Maybe.andThen (justIf (\p -> p.piece == Pawn && p.color == color))
                        )
            )
    ]
        |> List.concat


randomComputerEvaluationChat : Float -> Random.Generator String
randomComputerEvaluationChat evaluation =
    let
        ( chatPossibility0, chatPossibilities1Up ) =
            computerEvaluationChat evaluation
    in
    Random.map
        (\message ->
            String.fromFloat evaluation ++ " " ++ message
        )
        (Random.uniform chatPossibility0 chatPossibilities1Up)


computerEvaluationChat : Float -> ( String, List String )
computerEvaluationChat evaluation =
    if evaluation < -9 then
        ( "I swear I wasn't playing my best! Me wanna play again."
        , [ "How did i blunder this badly?!"
          , "That came outta nowhere for me. You got great strategic thinking."
          ]
        )

    else if evaluation < -6 then
        ( "This isn't how it was supposed to go..."
        , [ "Well played."
          , "Nicely done."
          , "I completely missed this idea. Nice"
          , "You got me good in this game"
          ]
        )

    else if evaluation < -4 then
        ( "Hmmm, you're better than i expected."
        , [ "You're doing great."
          , "You're on a good path. Keep at it!"
          , "Good job so far!"
          , "By this point it'll be hard to recover for me :("
          , "This is not exactly going my way :/"
          , "I'm disappointed in myself."
          , "Yikes. I'm bad"
          ]
        )

    else if evaluation < -2 then
        ( "Time to step up my game."
        , [ "You got a bit lucky i guess, I'll turn this around in no time"
          , "Don't think you're winning just yet (please)"
          , "I couldn't find great moves so far"
          , "Not bad."
          , "Nice."
          , "Good. Good."
          , "Jo"
          , "I was too focused on chatting... Imma think more"
          , "Hey!"
          ]
        )

    else if evaluation < -1 then
        ( "A few nice moves you got there. I'm not worried, yet."
        , [ "Right..."
          , "Aha..."
          , "Hmmm"
          , "You're not making this as easy as I thought"
          , "I'm not scared. Go on"
          , "I like how you play."
          , "I don't hate how you're playing..."
          , "Not bad. Do you have ideas on how to proceed?"
          , "Yep"
          , "I wouldn't say you're much better here"
          ]
        )

    else if evaluation < 0.5 then
        ( "Ok"
        , [ "Equal position... do you want to win or no?"
          , "Draw..."
          , "Boring..."
          , "ZzzzZzz"
          , "Wake me up when you make a move that does something."
          , "Not great, not terrible"
          , "..."
          , "You're definitely holding."
          ]
        )

    else if evaluation < 2 then
        ( "Comfortable position for me."
        , [ "I like where this is going"
          , "Yey"
          , "This is starting to look promising"
          , "Jo"
          , "If I get in a few more moves I might already be better"
          ]
        )

    else if evaluation < 4 then
        ( "Imma relax because you don't seem to be able to keep up with my skills."
        , [ "Am i starting to outplay you?"
          , "I believe in you! You can draw this I think."
          , "Common, you can't just let me win like this."
          , "I really like my position!"
          , "What are you gonna do? I'd say I'm already better"
          ]
        )

    else if evaluation < 6 then
        ( "You're just trash."
        , [ "I didn't expect you to be this bad."
          , "You're blundering and I'm happy. This is how it is supposed to be."
          , "You're disappointing me."
          ]
        )

    else if evaluation < 9 then
        ( "Git gud"
        , [ "Better luck next time"
          , "Prepare to lose"
          , "You should be ashamed. Ashamed."
          , "Time to clean up."
          ]
        )

    else
        ( "Go back to checkers"
        , [ "Go back to tik-tak-toe"
          , "We win deez"
          ]
        )


computerColor : PieceColor
computerColor =
    Black


pieceColorOpponent : PieceColor -> PieceColor
pieceColorOpponent =
    \color ->
        case color of
            Black ->
                White

            White ->
                Black


type MateKind
    = Stalemate
    | Checkmate


mateKindFor : PieceColor -> Board -> Maybe MateKind
mateKindFor color =
    \board ->
        let
            noValidMoves =
                piecesFor color board
                    |> List.all (\{ location } -> validMovesFrom location board |> List.isEmpty)
        in
        if noValidMoves then
            if board |> isCheckFor color then
                Just Checkmate

            else
                Just Stalemate

        else
            Nothing


piecesFor : PieceColor -> Board -> List { piece : PieceKind, location : FieldLocation }
piecesFor color =
    \board ->
        board
            |> ArraySized.and (ArraySized.upTo n7)
            |> ArraySized.toList
            |> List.concatMap
                (\( fieldRow, row ) ->
                    fieldRow
                        |> ArraySized.and (ArraySized.upTo n7)
                        |> ArraySized.toList
                        |> List.filterMap
                            (\( field, column ) ->
                                case field of
                                    Nothing ->
                                        Nothing

                                    Just coloredPiece ->
                                        if coloredPiece.color == color then
                                            { piece = coloredPiece.piece, location = { row = row, column = column } } |> Just

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
                eyesOn { location = kingLoc, color = color |> pieceColorOpponent } board /= []


kingLocation : PieceColor -> Board -> Maybe FieldLocation
kingLocation kingColor board =
    board
        |> ArraySized.and (ArraySized.upTo n7)
        |> ArraySized.foldFrom Nothing
            Up
            (\( boardRow, row ) soFar ->
                case soFar of
                    Just found ->
                        Just found

                    Nothing ->
                        boardRow
                            |> ArraySized.and (ArraySized.upTo n7)
                            |> ArraySized.foldFrom Nothing
                                Up
                                (\( fieldContent, column ) rowSoFar ->
                                    case rowSoFar of
                                        Just found ->
                                            Just found

                                        Nothing ->
                                            if fieldContent == Just { piece = King, color = kingColor } then
                                                { row = row, column = column } |> Just

                                            else
                                                Nothing
                                )
            )


computeBestMove :
    Board
    ->
        { move : { from : FieldLocation, to : FieldLocation, extra : List MoveExtraOutcome }
        , evaluation : Float
        }
computeBestMove =
    \board ->
        let
            initialEvaluation : Float
            initialEvaluation =
                case mateKindEvaluation { colorToMove = computerColor } board of
                    Just mateEvaluation ->
                        mateEvaluation

                    Nothing ->
                        boardEvaluateNowDisregardingMateKinds board
        in
        board
            |> piecesFor computerColor
            |> List.concatMap
                (\from ->
                    validMovesFrom from.location board
                        |> List.map (\move -> { from = from.location, to = move.to, extra = move.extra })
                        |> List.map
                            (\move ->
                                { move = move
                                , evaluation =
                                    deepEvaluateAfterMove
                                        { colorToMove = pieceColorOpponent computerColor
                                        , depth = 0
                                        , board = board
                                        , move = move
                                        , evaluationSoFar = initialEvaluation
                                        }
                                }
                            )
                )
            |> List.Extra.maximumBy .evaluation
            -- stalemate or checkmate
            |> Maybe.withDefault
                { move =
                    { from = { row = n5 |> N.toIn ( n0, n7 ), column = n5 |> N.toIn ( n0, n7 ) }
                    , to = { row = n6 |> N.toIn ( n0, n7 ), column = n6 |> N.toIn ( n0, n7 ) }
                    , extra = []
                    }
                , evaluation = 0
                }


deepEvaluateAfterMove :
    { colorToMove : PieceColor
    , depth : Int
    , board : Board
    , evaluationSoFar : Float
    , move : { from : FieldLocation, to : FieldLocation, extra : List MoveExtraOutcome }
    }
    -> Float
deepEvaluateAfterMove { colorToMove, depth, board, evaluationSoFar, move } =
    let
        moveDiff_ =
            moveDiff move board

        boardAfterMove =
            board |> applyMoveDiff moveDiff_
    in
    case mateKindEvaluation { colorToMove = colorToMove |> pieceColorOpponent } boardAfterMove of
        Just mateEvaluation ->
            mateEvaluation

        Nothing ->
            deepEvaluate
                { colorToMove = colorToMove
                , board = boardAfterMove
                , evaluationSoFar = evaluationSoFar + moveDiffEvaluate moveDiff_ board
                , depth = depth
                }


deepEvaluate :
    { colorToMove : PieceColor
    , depth : Int
    , board : Board
    , evaluationSoFar : Float
    }
    -> Float
deepEvaluate { colorToMove, depth, board, evaluationSoFar } =
    if depth >= 3 then
        evaluationSoFar

    else
        let
            chooseBestForColorToMove : List Float -> Maybe Float
            chooseBestForColorToMove =
                if colorToMove == computerColor then
                    List.maximum

                else
                    List.minimum
        in
        board
            |> piecesFor colorToMove
            |> List.concatMap
                (\from ->
                    validMovesFrom from.location board
                        |> List.map
                            (\move ->
                                deepEvaluateAfterMove
                                    { colorToMove = pieceColorOpponent colorToMove
                                    , move = { from = from.location, to = move.to, extra = move.extra }
                                    , depth = depth + 1
                                    , board = board
                                    , evaluationSoFar = evaluationSoFar
                                    }
                            )
                )
            |> chooseBestForColorToMove
            -- should be caught by mate kind check
            |> Maybe.withDefault 0


mateKindEvaluation : { colorToMove : PieceColor } -> Board -> Maybe Float
mateKindEvaluation { colorToMove } board =
    if colorToMove == computerColor then
        case mateKindFor computerColor board of
            Just Stalemate ->
                Just 0

            Just Checkmate ->
                Just -10000

            Nothing ->
                Nothing

    else
        case mateKindFor (computerColor |> pieceColorOpponent) board of
            Just Stalemate ->
                Just 0

            Just Checkmate ->
                Just 10000

            Nothing ->
                Nothing


boardEvaluateNowDisregardingMateKinds : Board -> Float
boardEvaluateNowDisregardingMateKinds =
    \board ->
        (piecesFor computerColor board
            |> List.map (pieceEvaluate computerColor)
            |> List.sum
        )
            - (piecesFor (computerColor |> pieceColorOpponent) board
                |> List.map (pieceEvaluate (computerColor |> pieceColorOpponent))
                |> List.sum
              )


moveDiffEvaluate : MoveDiff -> Board -> Float
moveDiffEvaluate moveDiff_ board =
    moveDiff_
        |> List.map
            (\moveDiffElement ->
                -(case board |> at moveDiffElement.location of
                    Nothing ->
                        0

                    Just pieceBefore ->
                        pieceEvaluate pieceBefore.color { piece = pieceBefore.piece, location = moveDiffElement.location }
                 )
                    + (case moveDiffElement.replacement of
                        Just pieceReplacement ->
                            pieceEvaluate pieceReplacement.color { piece = pieceReplacement.piece, location = moveDiffElement.location }

                        Nothing ->
                            0
                      )
            )
        |> List.sum


pieceEvaluate : PieceColor -> { piece : PieceKind, location : FieldLocation } -> Float
pieceEvaluate color piece =
    piece.piece
        |> pieceKindEvaluateMap
        |> (case color of
                White ->
                    ArraySized.reverse

                Black ->
                    identity
           )
        |> ArraySized.element ( Up, piece.location.row )
        |> ArraySized.element ( Up, piece.location.column )


pieceKindEvaluateMap : PieceKind -> ArraySized (ArraySized Float (Exactly (On N8))) (Exactly (On N8))
pieceKindEvaluateMap pieceKind =
    case pieceKind of
        Pawn ->
            pawnEvaluateMap

        Knight ->
            knightEvaluateMap

        Bishop ->
            bishopEvaluateMap

        Rook ->
            rookEvaluateMap

        Queen ->
            queenEvaluateMap

        King ->
            kingEvaluateMap


rookEvaluateMap : ArraySized (ArraySized Float (Exactly (On N8))) (Exactly (On N8))
rookEvaluateMap =
    ArraySized.l8
        (ArraySized.l8 1.2 1.2 1.14 1.1 1.1 1.14 1.2 1.2)
        (ArraySized.l8 1.14 1.14 1.14 1.4 1.4 1.14 1.2 1.2)
        (ArraySized.l8 1.1 1.04 1.04 1 1 1.04 1.04 1.1)
        (ArraySized.l8 1.04 1.01 1.01 1 1 1.01 1.01 1.04)
        (ArraySized.l8 1.04 1 1 0.95 0.95 1 1 1.03)
        (ArraySized.l8 1.05 1.02 1 0.99 0.99 1 1 1.06)
        (ArraySized.l8 0.76 1 0.97 0.95 0.95 0.95 0.94 0.78)
        (ArraySized.l8 0.76 1 0.97 0.95 0.95 0.95 0.94 0.78)
        |> ArraySized.map (ArraySized.map (\f -> f * 4.5))


bishopEvaluateMap : ArraySized (ArraySized Float (Exactly (On N8))) (Exactly (On N8))
bishopEvaluateMap =
    ArraySized.l8
        (ArraySized.l8 0.9 0.85 0.8 0.8 0.8 0.8 0.85 0.9)
        (ArraySized.l8 1.2 1.1 1 0.99 0.99 1 1.1 1.2)
        (ArraySized.l8 1.1 1.1 1 0.95 0.96 1 1.1 1.1)
        (ArraySized.l8 1 1.1 1 0.8 0.8 1 1.1 1)
        (ArraySized.l8 1.1 1.1 1 0.89 0.89 1 1.1 1)
        (ArraySized.l8 1.2 1.1 1 0.94 0.94 1 1.1 1.2)
        (ArraySized.l8 1.2 1.5 0.97 0.95 0.95 0.95 1.5 1.2)
        (ArraySized.l8 0.9 0.85 0.8 0.8 0.8 0.8 0.85 0.9)
        |> ArraySized.map (ArraySized.map (\f -> f * 3.16))


knightEvaluateMap : ArraySized (ArraySized Float (Exactly (On N8))) (Exactly (On N8))
knightEvaluateMap =
    ArraySized.l8
        (ArraySized.l8 0.4 0.8 0.8 0.8 0.8 0.8 0.8 0.4)
        (ArraySized.l8 0.8 0.9 1 0.99 0.99 1 0.9 0.8)
        (ArraySized.l8 0.8 1.1 1 1.12 1.2 1.7 1.1 0.8)
        (ArraySized.l8 0.8 1.1 1 1.1 1.1 1 1.1 0.8)
        (ArraySized.l8 0.8 1 1 1.1 1 1 1 0.8)
        (ArraySized.l8 0.8 1 1 1 1 1 1 0.8)
        (ArraySized.l8 0.8 0.8 0.97 0.95 0.95 0.95 0.9 0.8)
        (ArraySized.l8 0.4 0.8 0.8 0.8 0.8 0.8 0.8 0.4)
        |> ArraySized.map (ArraySized.map (\f -> f * 2.86))


queenEvaluateMap : ArraySized (ArraySized Float (Exactly (On N8))) (Exactly (On N8))
queenEvaluateMap =
    ArraySized.l8
        (ArraySized.l8 1.2 1.2 1.14 1.1 1.1 1.14 1.2 1.2)
        (ArraySized.l8 1.14 1.14 1.14 1.4 1.4 1.14 1.2 1.2)
        (ArraySized.l8 1.1 1.04 1.04 1 1 1.04 1.04 1.1)
        (ArraySized.l8 1.04 1.01 1.01 1.2 1.2 1.01 1.01 1.04)
        (ArraySized.l8 1.04 1 1 0.95 0.95 1 1 1.03)
        (ArraySized.l8 1.05 1.02 1 0.99 0.99 1 1 1.06)
        (ArraySized.l8 0.91 0.9 0.97 0.95 0.95 0.85 0.9 0.92)
        (ArraySized.l8 0.89 0.86 0.82 0.86 0.86 0.89 0.94 0.9)
        |> ArraySized.map (ArraySized.map (\f -> f * 8.6))


pawnEvaluateMap : ArraySized (ArraySized Float (Exactly (On N8))) (Exactly (On N8))
pawnEvaluateMap =
    ArraySized.l8
        (ArraySized.l8 9 9 9 9 9 9 9 9)
        (ArraySized.l8 4 4 4 4 4 4 4 4)
        (ArraySized.l8 2.4 2.4 2.4 2.4 2.4 2.4 2.4 2.4)
        (ArraySized.l8 1.2 1.4 1.4 1.4 1.4 1.4 1.4 1.2)
        (ArraySized.l8 0.9 1.24 1.2 1.22 1.22 1.2 1.24 0.9)
        (ArraySized.l8 1.12 1.12 0.98 1.06 1 0.98 1.12 1.12)
        (ArraySized.l8 0.9 0.9 0.9 0.9 0.9 0.9 0.9 0.9)
        (ArraySized.l8 0 0 0 0 0 0 0 0)
        |> ArraySized.map (ArraySized.map (\f -> f * 1.1))


kingEvaluateMap : ArraySized (ArraySized Float (Exactly (On N8))) (Exactly (On N8))
kingEvaluateMap =
    ArraySized.l8
        (ArraySized.l8 0.7 0.75 0.79 0.8 0.8 0.79 0.75 0.7)
        (ArraySized.l8 0.8 0.85 0.89 0.9 0.9 0.89 0.85 0.8)
        (ArraySized.l8 0.8 0.85 0.89 0.9 0.9 0.89 0.85 0.8)
        (ArraySized.l8 0.8 0.85 0.89 0.9 0.9 0.89 0.85 0.8)
        (ArraySized.l8 0.8 0.85 0.89 0.9 0.9 0.89 0.85 0.8)
        (ArraySized.l8 0.8 0.85 0.89 0.9 0.9 0.89 0.85 0.8)
        (ArraySized.l8 0.9 0.9 0.8 0.8 0.8 0.8 0.9 0.9)
        (ArraySized.l8 1 1 0.8 0.88 0.88 0.8 1 1)
        |> ArraySized.map (ArraySized.map (\f -> f * 3.9))


at : FieldLocation -> Board -> Maybe ColoredPiece
at location =
    ArraySized.element ( Up, location.row )
        >> ArraySized.element ( Up, location.column )


subscriptions : State -> Sub Event
subscriptions =
    \state ->
        []
            |> Sub.batch


interpretEffect : Effect -> Reaction.EffectInterpretation Event
interpretEffect =
    \effect ->
        case effect of
            LoadAudio piece ->
                Reaction.audioCommands
                    [ Audio.loadAudio
                        (\result -> AudioLoaded { result = result, piece = piece })
                        ([ "public/", piece |> audioPieceToName, ".mp3" ] |> String.concat)
                    ]

            RequestComputerMove ->
                Reaction.commands
                    [ Process.sleep 1 |> Task.perform (\() -> ComputerMoveRequested) ]

            GenerateInitialRandomSeed ->
                Reaction.commands
                    [ Random.generate InitialRandomSeedGenerated Random.independentSeed ]


audioPieceToName : AudioPiece -> String
audioPieceToName =
    \audioPiece ->
        case audioPiece of
            AudioPieceMove ->
                "move"


uiDocument : State -> Browser.Document Event
uiDocument =
    \state ->
        { title = "schach"
        , body =
            state
                |> ui
                |> Ui.layoutWith
                    { options =
                        [ Ui.focusStyle
                            { borderColor = Ui.rgb 0 1 0.4 |> Just
                            , backgroundColor = Nothing
                            , shadow = Nothing
                            }
                        ]
                    }
                    [ UiBackground.color (Ui.rgb 0 0 0) ]
                |> List.singleton
        }


ui : State -> Ui.Element Event
ui =
    \state ->
        Ui.row [ Ui.spacing 80, Ui.centerX, Ui.centerY ]
            [ boardUi state
            , state.computerChat |> computerChatUi
            ]


computerChatUi : List String -> Ui.Element event_
computerChatUi messages =
    messages
        ++ [ "Don't forget: The computer always wins"
           , "Hello there, human."
           ]
        |> List.map
            (\message ->
                Ui.paragraph
                    [ UiBackground.color (Ui.rgb 0.1 0.1 0.1)
                    , UiBorder.rounded 40
                    , Ui.width (Ui.px 400)
                    , Ui.paddingXY 27 15
                    , Ui.behindContent
                        (Ui.column
                            [ Ui.width Ui.fill
                            , Ui.height Ui.fill
                            ]
                            [ Ui.none
                                |> Ui.el
                                    [ UiBackground.color (Ui.rgb 0.1 0.1 0.1)
                                    , Ui.width (Ui.px 200)
                                    , Ui.height (Ui.fillPortion 1)
                                    ]
                            , Ui.none
                                |> Ui.el
                                    [ Ui.width (Ui.px 200)
                                    , Ui.height (Ui.fillPortion 1)
                                    ]
                            ]
                        )
                    ]
                    [ Ui.text message ]
            )
        |> Ui.column
            [ Ui.spacing 12
            , UiFont.color (Ui.rgb 1 1 1)
            , Ui.centerX
            , Ui.paddingXY 50 40
            , Ui.alignTop
            , Ui.scrollbarY
            , Ui.height (Ui.maximum 800 Ui.fill)
            ]


boardUi : { state_ | board : Board, selection : Maybe FieldLocation } -> Ui.Element Event
boardUi state =
    let
        validMoves =
            case state.selection of
                Just selectedLocation ->
                    validMovesFrom selectedLocation state.board

                Nothing ->
                    []
    in
    state.board
        |> ArraySized.and (ArraySized.upTo n7)
        |> ArraySized.reverse
        |> ArraySized.map
            (\( fieldRow, row ) ->
                fieldRow
                    |> ArraySized.and (ArraySized.upTo n7)
                    |> ArraySized.map
                        (\( field, column ) ->
                            let
                                fieldLocation : FieldLocation
                                fieldLocation =
                                    { row = row, column = column }
                            in
                            field
                                |> fieldUi state
                                    { isValidMove =
                                        validMoves
                                            |> List.any (.to >> locationEquals fieldLocation)
                                    }
                                    fieldLocation
                        )
                    |> ArraySized.toList
                    |> Ui.row []
            )
        |> ArraySized.toList
        |> Ui.column [ Ui.centerX, Ui.centerY ]


fieldUi : { state_ | selection : Maybe FieldLocation } -> { isValidMove : Bool } -> FieldLocation -> Maybe ColoredPiece -> Ui.Element Event
fieldUi state { isValidMove } fieldLocation fieldContent =
    let
        fieldColor f =
            if
                ((fieldLocation.row |> N.toInt |> remainderBy 2) == 0)
                    == ((fieldLocation.column |> N.toInt |> remainderBy 2) == 0)
            then
                f 0.8 0.35 0.12

            else
                f 0.12 0.35 0.8
    in
    Ui.el
        ([ Ui.width (Ui.px 100)
         , Ui.height (Ui.px 100)
         , UiBackground.color (fieldColor Ui.rgb)
         , Ui.centerX
         , Ui.centerY
         ]
            ++ (if Maybe.map (locationEquals fieldLocation) state.selection |> Maybe.withDefault False then
                    [ UiBackground.color (Ui.rgb 0.15 0.7 0.2) ]

                else if isValidMove then
                    [ UiBorder.innerShadow { offset = ( 0, 0 ), size = 4, color = Ui.rgba 0 0 0 0.6, blur = 32 } ]

                else
                    [ UiBorder.innerShadow
                        { offset = ( -6, -6 )
                        , size = 10
                        , blur = 20
                        , color = fieldColor (\r g b -> Ui.rgb (r * 0.9) (g * 0.9) (b * 0.9))
                        }
                    ]
               )
        )
        (UiInput.button
            []
            { onPress = FieldSelected fieldLocation |> Just
            , label =
                case fieldContent of
                    Nothing ->
                        Ui.none
                            |> Ui.el
                                [ Ui.width (Ui.px 100)
                                , Ui.height (Ui.px 100)
                                ]

                    Just coloredPiece ->
                        pieceToIcon coloredPiece.piece Phosphor.Fill
                            |> Phosphor.withSize 100
                            |> Phosphor.withSizeUnit "%"
                            |> Phosphor.toHtml
                                [ SvgA.style
                                    (case coloredPiece.color of
                                        Black ->
                                            "color:black"

                                        White ->
                                            "color:white"
                                    )
                                ]
                            |> Ui.html
                            |> Ui.el
                                [ Ui.centerX
                                , Ui.centerY
                                , Ui.padding 10
                                ]
            }
        )


pieceToIcon : PieceKind -> Phosphor.Icon
pieceToIcon =
    \pieceKind ->
        case pieceKind of
            Pawn ->
                -- Phosphor.sword
                Phosphor.triangle

            Bishop ->
                -- Phosphor.cross
                -- Phosphor.arrowsOut
                -- Phosphor.x
                Phosphor.hourglassSimple

            Knight ->
                -- Phosphor.lightning
                -- Phosphor.knife
                Phosphor.horse

            Rook ->
                -- Phosphor.arrowsOutCardinal
                -- Phosphor.plus
                Phosphor.castleTurret

            Queen ->
                -- Phosphor.sun
                -- Phosphor.radioactive
                -- Phosphor.lighthouse
                Phosphor.heartStraight

            King ->
                Phosphor.crownSimple


audio : State -> Audio.Audio
audio =
    \state -> Audio.silence



-- util


listFilterMapWhile : (a -> Maybe b) -> List a -> List b
listFilterMapWhile tryChange =
    \list ->
        case list of
            [] ->
                []

            head :: tail ->
                case tryChange head of
                    Nothing ->
                        []

                    Just changed ->
                        changed :: listFilterMapWhile tryChange tail


listTakeUntil : (a -> Bool) -> List a -> List a
listTakeUntil isEnd =
    \list ->
        case list of
            [] ->
                []

            head :: tail ->
                if isEnd head then
                    [ head ]

                else
                    head :: listTakeUntil isEnd tail


justIf : (a -> Bool) -> a -> Maybe a
justIf passes =
    \value ->
        if value |> passes then
            Just value

        else
            Nothing
