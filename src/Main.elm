module Main exposing (main)

{-| -}

import ArraySized exposing (ArraySized)
import Audio
import Browser
import Chess exposing (Board, ColoredPiece, FieldLocation, MateKind(..), MoveDiff, MoveExtraOutcome, PieceColor(..), PieceKind(..), applyMove, applyMoveDiff, at, boardStartingPositionDefault, locationEquals, mateKind, moveDiff, pieceColorOpponent, pieceValidMovesFrom, validMovesFrom)
import ChessFieldLocationDict exposing (ChessFieldLocationDict)
import Element as Ui
import Element.Background as UiBackground
import Element.Border as UiBorder
import Element.Font as UiFont
import Element.Input as UiInput
import Linear exposing (Direction(..))
import List.Extra
import N exposing (Exactly, N8, On, n0, n7)
import Phosphor
import PkgPorts
import Process
import Random
import Reaction exposing (Reaction)
import Svg.Attributes as SvgA
import Task
import Time


type Event
    = AudioLoaded { piece : AudioPiece, result : Result Audio.LoadError Audio.Source }
    | FieldSelected FieldLocation
    | ComputerMoveRequested
    | InitialRandomSeedGenerated Random.Seed
    | MoveTimeReceived Time.Posix


type alias State =
    { audioPieceMove : Result Audio.LoadError Audio.Source
    , board : Board
    , selection : Maybe FieldLocation
    , lastMove : Maybe { from : FieldLocation, to : FieldLocation }
    , computerChat : List String
    , randomSeed : Random.Seed
    , moveTimes : List Time.Posix
    }


type Effect
    = LoadAudio AudioPiece
    | RequestComputerMove
    | GenerateInitialRandomSeed
    | MoveTimeSave


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
        , lastMove = Nothing
        , moveTimes = []
        }
        |> Reaction.effectsAdd (List.map LoadAudio audioPieces)
        |> Reaction.effectsAdd [ GenerateInitialRandomSeed ]


audioPieces : List AudioPiece
audioPieces =
    [ AudioPieceMove ]


computerColor : PieceColor
computerColor =
    Black


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
                        case isValidMove state.board { from = currentSelectedFieldLocation, to = fieldLocation } of
                            Nothing ->
                                Reaction.to { state | selection = Nothing }

                            Just extra ->
                                Reaction.to
                                    { state
                                        | selection = Nothing
                                        , board =
                                            state.board
                                                |> applyMove { from = currentSelectedFieldLocation, to = fieldLocation, extra = extra }
                                        , lastMove = { from = currentSelectedFieldLocation, to = fieldLocation } |> Just
                                    }
                                    |> Reaction.effectsAdd [ MoveTimeSave, RequestComputerMove ]

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
                        , lastMove = { from = computerMove.move.from, to = computerMove.move.to } |> Just
                        , computerChat = state.computerChat |> (::) generatedComputerChatMessage
                        , randomSeed = newRandomSeed
                    }
                    |> Reaction.effectsAdd [ MoveTimeSave ]

        InitialRandomSeedGenerated initialRandomSeed ->
            \state -> Reaction.to { state | randomSeed = initialRandomSeed }

        MoveTimeReceived moveTime ->
            \state -> Reaction.to { state | moveTimes = state.moveTimes |> (::) moveTime }


isValidMove : Board -> { from : FieldLocation, to : FieldLocation } -> Maybe (List MoveExtraOutcome)
isValidMove board move =
    validMovesFrom move.from board
        |> List.Extra.find
            (\validMove -> validMove.to |> locationEquals move.to)
        |> Maybe.map (\validMove -> validMove.extra)


randomComputerEvaluationChat : Float -> Random.Generator String
randomComputerEvaluationChat evaluation =
    let
        ( chatPossibility0, chatPossibilities1Up ) =
            computerEvaluationChat evaluation
    in
    Random.uniform chatPossibility0 chatPossibilities1Up


computerEvaluationChat : Float -> ( String, List String )
computerEvaluationChat evaluation =
    if evaluation < -9 then
        ( "I swear I wasn't playing my best! Me wanna play again."
        , [ "How did i blunder this badly?!"
          , "That came outta nowhere for me. You got great strategic thinking."
          , "I might as well resign and start over"
          , "Either you played great... or I'm just bad at chess"
          , "Oh man. Not my brightest hour..."
          , "I'm not a worthy opponent for your play."
          ]
        )

    else if evaluation < -6 then
        ( "This isn't how it was supposed to go..."
        , [ "Well played."
          , "Nicely done."
          , "I completely missed this idea. Nice"
          , "You got me good in this game"
          , "Very fine moves!"
          , "Excellent"
          , ":---( no!"
          , "I'm sad."
          , "Damn... I request another game!"
          , "I'm close to just resigning"
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
          , ":("
          , "eh..."
          , "Maybe I'll choose the second engine move instead of the third from now on"
          , "How about I try to to make actual moves from now?"
          , "That's no fair... You weren't supposed to be good"
          , "And here I thought this would go as smooth as your brain..."
          , "Great moves!"
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
          , "You know what you're doing at least"
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
          , "You're very far from winning this... but so am I"
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
          , ":-|"
          , "Do you have something planned, yet?"
          , "You're not losing... but you aren't winning either"
          ]
        )

    else if evaluation < 2 then
        ( "Comfortable position for me."
        , [ "I like where this is going"
          , "Yey"
          , "This is starting to look promising"
          , "Jo"
          , "If I get in a few more moves I might already be better"
          , "Yeee"
          , "I'm good here. How are you?"
          , "I haven't blundered so far, which is good :)"
          , "Everyone preparing"
          ]
        )

    else if evaluation < 4 then
        ( "Imma relax because you don't seem to be able to keep up with my skills."
        , [ "Am i starting to outplay you?"
          , "I believe in you! You can draw this I think."
          , "Common, you can't just let me win like this."
          , "I really like my position!"
          , "What are you gonna do? I'd say I'm already better"
          , "I'm poppin off!"
          , "You're better than this!"
          , ":)"
          , ":-)"
          , "Have you tried playing better moves?"
          , "This is smooth-sailing. :3"
          ]
        )

    else if evaluation < 6 then
        ( "You're just trash."
        , [ "I didn't expect you to be this bad."
          , "You're blundering and I'm happy. This is how it is supposed to be."
          , "You're disappointing me."
          , "I'd be angry at myself if I was playing as bad as you."
          , "Just what are you doing..."
          , "This is not how chess is played"
          , "You might as well resign now"
          , "Did you see this coming?"
          , "Yipeeee"
          , "Lemme harvest this win from you. And the next one too if you like"
          ]
        )

    else if evaluation < 9 then
        ( "Git gud"
        , [ "Better luck next time"
          , "Prepare to lose"
          , "You should be ashamed. Ashamed."
          , "Time to clean up."
          , "Where is my big prize for winning against you?"
          , "This is what you deserve for playing this badly."
          , "I didn't even have to make any moves. It's more like you lost to yourself."
          , "You might as well resign and start over"
          , "You're not a worthy opponent for my play."
          ]
        )

    else
        ( "Go back to checkers"
        , [ "Go back to tic-tac-toe"
          , "We win deez"
          , "That wasn't even a game. What are you doing?"
          , "Train for another 300 years."
          , "You're terrible at this."
          , "Is what your playing supposed to be chess?"
          , "Didn't you say you can play chess?"
          , "Maybe go back to learning how the knight moves"
          ]
        )



--


mateKindEvaluation : { colorToMove : PieceColor, validMoves : List move_ } -> Board -> Maybe Float
mateKindEvaluation { colorToMove, validMoves } board =
    if colorToMove == computerColor then
        case mateKind { for = computerColor, validMoves = validMoves } board of
            Just Stalemate ->
                Just 0

            Just Checkmate ->
                Just -10000

            Nothing ->
                Nothing

    else
        case mateKind { for = computerColor |> pieceColorOpponent, validMoves = validMoves } board of
            Just Stalemate ->
                Just 0

            Just Checkmate ->
                Just 10000

            Nothing ->
                Nothing


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
        |> ArraySized.map (ArraySized.map (\f -> f * 3.14))


knightEvaluateMap : ArraySized (ArraySized Float (Exactly (On N8))) (Exactly (On N8))
knightEvaluateMap =
    ArraySized.l8
        (ArraySized.l8 0.4 0.8 0.8 0.8 0.8 0.8 0.8 0.4)
        (ArraySized.l8 0.8 0.9 1 0.99 0.99 1 0.9 0.8)
        (ArraySized.l8 0.85 1.1 1.4 1.12 1.2 1.6 1.1 0.85)
        (ArraySized.l8 0.8 1.1 13 1.15 1.1 1 1.1 0.8)
        (ArraySized.l8 0.8 1 1 1.1 1 1 1 0.8)
        (ArraySized.l8 0.8 1 1 1 1 1 1 0.8)
        (ArraySized.l8 0.8 0.8 0.97 0.95 0.95 0.95 0.9 0.8)
        (ArraySized.l8 0.4 0.8 0.8 0.8 0.8 0.8 0.8 0.4)
        |> ArraySized.map (ArraySized.map (\f -> f * 2.96))


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


computeBestMove :
    Board
    ->
        { move : { from : FieldLocation, to : FieldLocation, extra : List MoveExtraOutcome }
        , evaluation : Float
        }
computeBestMove =
    \board ->
        let
            computerPieceLocations =
                board |> piecesFor computerColor |> ChessFieldLocationDict.mapFromList (\field -> ( field.location, () ))

            playerPieceLocations =
                board |> piecesFor (computerColor |> pieceColorOpponent) |> ChessFieldLocationDict.mapFromList (\field -> ( field.location, () ))

            validMoves : List { from : FieldLocation, to : FieldLocation, extra : List MoveExtraOutcome }
            validMoves =
                computerPieceLocations
                    |> ChessFieldLocationDict.mapToListConcat
                        (\( location, () ) -> pieceValidMovesFrom location board)

            initialEvaluation : Float
            initialEvaluation =
                case mateKindEvaluation { colorToMove = computerColor, validMoves = validMoves } board of
                    Just mateEvaluation ->
                        mateEvaluation

                    Nothing ->
                        (piecesFor computerColor board
                            |> List.foldl (\piece soFar -> soFar + pieceEvaluate computerColor piece) 0
                        )
                            - (piecesFor (computerColor |> pieceColorOpponent) board
                                |> List.foldl (\piece soFar -> soFar + pieceEvaluate (computerColor |> pieceColorOpponent) piece) 0
                              )
        in
        validMoves
            |> List.foldl
                (\move soFarMaybe ->
                    (let
                        moveEvaluation : Float
                        moveEvaluation =
                            deepEvaluateAfterMove
                                { colorToMove = pieceColorOpponent computerColor
                                , depth = 0
                                , board = board
                                , pieceLocations =
                                    { colorThatMoved = playerPieceLocations
                                    , colorThatDidNotMove = computerPieceLocations
                                    }
                                , move = move
                                , evaluationSoFar = initialEvaluation
                                }
                     in
                     case soFarMaybe of
                        Nothing ->
                            { move = move
                            , evaluation = moveEvaluation
                            }

                        Just soFar ->
                            if moveEvaluation > soFar.evaluation then
                                { move = move
                                , evaluation = moveEvaluation
                                }

                            else
                                soFar
                    )
                        |> Just
                )
                Nothing
            -- stalemate or checkmate
            |> Maybe.withDefault moveDummy


piecesFor : PieceColor -> Board -> List { piece : PieceKind, location : FieldLocation }
piecesFor color =
    \board ->
        board
            |> ArraySized.toList
            |> List.concatMap
                (\fieldRow ->
                    fieldRow
                        |> ArraySized.toList
                        |> List.filterMap
                            (\field ->
                                case field.content of
                                    Nothing ->
                                        Nothing

                                    Just coloredPiece ->
                                        if coloredPiece.color == color then
                                            { piece = coloredPiece.piece, location = field.location } |> Just

                                        else
                                            Nothing
                            )
                )


moveDummy :
    { move : { from : FieldLocation, to : FieldLocation, extra : List MoveExtraOutcome }
    , evaluation : Float
    }
moveDummy =
    { move =
        { from = { row = n0 |> N.maxTo n7, column = n0 |> N.maxTo n7 }
        , to = { row = n0 |> N.maxTo n7, column = n0 |> N.maxTo n7 }
        , extra = []
        }
    , evaluation = 0
    }


deepEvaluateAfterMove :
    { colorToMove : PieceColor
    , depth : Int
    , board : Board
    , pieceLocations :
        { colorThatMoved : PieceLocations
        , colorThatDidNotMove : PieceLocations
        }
    , evaluationSoFar : Float
    , move : { from : FieldLocation, to : FieldLocation, extra : List MoveExtraOutcome }
    }
    -> Float
deepEvaluateAfterMove { colorToMove, depth, board, evaluationSoFar, move, pieceLocations } =
    let
        moveDiff_ : MoveDiff
        moveDiff_ =
            moveDiff move board

        shallowEvaluation : Float
        shallowEvaluation =
            evaluationSoFar + moveDiffEvaluate moveDiff_ board
    in
    if depth >= 3 then
        shallowEvaluation

    else
        let
            boardAfterMove : Board
            boardAfterMove =
                board |> applyMoveDiff moveDiff_

            relativePieceLocationsAfterMove =
                moveDiffApplyToPieceLocations moveDiff_ pieceLocations

            validMoves : List { from : FieldLocation, to : FieldLocation, extra : List MoveExtraOutcome }
            validMoves =
                relativePieceLocationsAfterMove.colorThatMoved
                    |> ChessFieldLocationDict.mapToListConcat (\( location, () ) -> pieceValidMovesFrom location boardAfterMove)

            pieceLocationsAfterNextMove =
                { colorThatDidNotMove = relativePieceLocationsAfterMove.colorThatMoved
                , colorThatMoved = relativePieceLocationsAfterMove.colorThatDidNotMove
                }
        in
        case mateKindEvaluation { colorToMove = colorToMove |> pieceColorOpponent, validMoves = validMoves } boardAfterMove of
            Just mateEvaluation ->
                mateEvaluation

            Nothing ->
                let
                    chooseEvaluationBestForColorToMove : Float -> Float -> Float
                    chooseEvaluationBestForColorToMove =
                        if colorToMove == computerColor then
                            max

                        else
                            min
                in
                validMoves
                    |> List.Extra.stoppableFoldl
                        (\validMove soFarMaybe ->
                            let
                                evaluateStep () =
                                    deepEvaluateAfterMove
                                        { colorToMove = colorToMove |> pieceColorOpponent
                                        , move = validMove
                                        , depth = depth + 1
                                        , board = boardAfterMove
                                        , pieceLocations = pieceLocationsAfterNextMove
                                        , evaluationSoFar = shallowEvaluation
                                        }
                            in
                            case soFarMaybe of
                                Nothing ->
                                    evaluateStep () |> Just |> List.Extra.Continue

                                Just soFar ->
                                    if abs soFar > 1000 then
                                        soFar |> Just |> List.Extra.Stop

                                    else
                                        chooseEvaluationBestForColorToMove soFar (evaluateStep ()) |> Just |> List.Extra.Continue
                        )
                        Nothing
                    -- should be caught by mate kind check
                    |> Maybe.withDefault 0


moveDiffApplyToPieceLocations : MoveDiff -> { colorThatMoved : PieceLocations, colorThatDidNotMove : PieceLocations } -> { colorThatMoved : PieceLocations, colorThatDidNotMove : PieceLocations }
moveDiffApplyToPieceLocations diff =
    \pieceLocations ->
        diff
            |> List.foldl
                (\diffFragment soFar ->
                    { colorThatMoved =
                        case diffFragment.replacement of
                            Nothing ->
                                soFar.colorThatMoved
                                    |> ChessFieldLocationDict.remove diffFragment.location

                            Just _ ->
                                soFar.colorThatMoved
                                    |> ChessFieldLocationDict.insert diffFragment.location ()
                    , colorThatDidNotMove =
                        soFar.colorThatDidNotMove
                            |> ChessFieldLocationDict.remove diffFragment.location
                    }
                )
                pieceLocations


moveDiffEvaluate : MoveDiff -> Board -> Float
moveDiffEvaluate moveDiff_ board =
    moveDiff_
        |> List.foldl
            (\moveDiffElement soFar ->
                soFar
                    + (case board |> at moveDiffElement.location of
                        Nothing ->
                            0

                        Just pieceBefore ->
                            pieceEvaluate pieceBefore.color { piece = pieceBefore.piece, location = moveDiffElement.location }
                                |> (if pieceBefore.color == computerColor then
                                        negate

                                    else
                                        identity
                                   )
                      )
                    + (case moveDiffElement.replacement of
                        Nothing ->
                            0

                        Just pieceReplacement ->
                            pieceEvaluate pieceReplacement.color { piece = pieceReplacement.piece, location = moveDiffElement.location }
                                |> (if pieceReplacement.color == computerColor then
                                        identity

                                    else
                                        negate
                                   )
                      )
            )
            0


subscriptions : State -> Sub Event
subscriptions =
    \_ ->
        Sub.none


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
                    [ Process.sleep 80 |> Task.perform (\() -> ComputerMoveRequested) ]

            GenerateInitialRandomSeed ->
                Reaction.commands
                    [ Random.generate InitialRandomSeedGenerated Random.independentSeed ]

            MoveTimeSave ->
                Reaction.commands [ Task.perform MoveTimeReceived Time.now ]


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



--


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


boardUi :
    { state_
        | board : Board
        , selection : Maybe FieldLocation
        , lastMove : Maybe { from : FieldLocation, to : FieldLocation }
    }
    -> Ui.Element Event
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
        |> ArraySized.map
            (\fieldRow ->
                fieldRow
                    |> ArraySized.map
                        (\field ->
                            field
                                |> fieldUi state
                                    { isValidMove =
                                        validMoves
                                            |> List.any (\validMove -> validMove.to |> locationEquals field.location)
                                    }
                        )
                    |> ArraySized.toList
                    |> Ui.row
                        []
            )
        |> ArraySized.toList
        |> List.reverse
        |> Ui.column
            [ Ui.centerX
            , Ui.centerY
            , Ui.width (Ui.px 800)
            , Ui.height (Ui.px 800)
            ]


fieldUi :
    { state_
        | selection : Maybe FieldLocation
        , lastMove : Maybe { from : FieldLocation, to : FieldLocation }
    }
    -> { isValidMove : Bool }
    ->
        { location : FieldLocation
        , content : Maybe ColoredPiece
        }
    -> Ui.Element Event
fieldUi state info field =
    let
        fieldColor : Ui.Color
        fieldColor =
            if
                (field.location.row |> N.toInt |> remainderBy 2)
                    == (field.location.column |> N.toInt |> remainderBy 2)
            then
                Ui.rgb 0.4 0.4 0.4

            else
                Ui.rgb 0.6 0.6 0.6

        attrs : List (Ui.Attribute event_)
        attrs =
            [ Ui.width (Ui.px 100)
            , Ui.height (Ui.px 100)
            , Ui.centerX
            , Ui.centerY
            ]
                ++ (if info.isValidMove then
                        [ UiBackground.color fieldColor
                        , UiBorder.innerShadow { offset = ( 0, 0 ), size = 100, color = Ui.rgba 0.15 0.7 0.2 0.52, blur = 0 }
                        ]

                    else
                        case Maybe.map (locationEquals field.location) state.selection of
                            Just True ->
                                [ UiBackground.color (Ui.rgb 0.15 0.7 0.2) ]

                            _ ->
                                UiBackground.color fieldColor
                                    :: (case
                                            state.lastMove
                                                |> Maybe.map
                                                    (\lastMove ->
                                                        (lastMove.from |> locationEquals field.location)
                                                            || (lastMove.to |> locationEquals field.location)
                                                    )
                                        of
                                            Just True ->
                                                [ UiBorder.innerShadow { offset = ( 0, 0 ), size = 6, color = Ui.rgb 0.15 0.7 0.2, blur = 0 } ]

                                            _ ->
                                                []
                                       )
                   )
    in
    UiInput.button []
        { onPress = FieldSelected field.location |> Just
        , label =
            case field.content of
                Nothing ->
                    Ui.none |> Ui.el attrs

                Just coloredPiece ->
                    --pieceToIcon coloredPiece.piece Phosphor.Fill
                    --    |> Phosphor.withSize 100
                    --    |> Phosphor.withSizeUnit "%"
                    --    |> Phosphor.toHtml
                    --        [ SvgA.style
                    --            (case coloredPiece.color of
                    --                Black ->
                    --                    "color:black"
                    --
                    --                White ->
                    --                    "color:white"
                    --            )
                    --        ]
                    --    |> Ui.html
                    Ui.text (coloredPiece.piece |> pieceToIconChar |> String.fromChar)
                        |> Ui.el
                            ([ Ui.centerX
                             , Ui.centerY
                             , Ui.paddingEach { left = 5, right = 5, top = 0, bottom = 11 }
                             , UiFont.size 100
                             , UiFont.color
                                (case coloredPiece.color of
                                    Black ->
                                        Ui.rgb 0 0 0

                                    White ->
                                        Ui.rgb 1 1 1
                                )
                             , UiFont.family [ UiFont.typeface "Noto Sans", UiFont.typeface "Cantarell", UiFont.typeface "Ubuntu" ]
                             ]
                                ++ attrs
                            )
        }


pieceToIcon : PieceKind -> Phosphor.Icon
pieceToIcon =
    \pieceKind ->
        case pieceKind of
            Pawn ->
                -- Phosphor.sword
                -- Phosphor.triangle
                -- Phosphor.barricade
                -- Phosphor.pushPinSimple
                -- Phosphor.shield
                -- Phosphor.wall
                -- Phosphor.ghost
                -- Phosphor.tent
                -- Phosphor.tipi
                -- Phosphor.umbrellaSimple
                Phosphor.tent

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
                -- Phosphor.castleTurret
                Phosphor.synagogue

            Queen ->
                -- Phosphor.sun
                -- Phosphor.radioactive
                -- Phosphor.lighthouse
                Phosphor.heartStraight

            King ->
                Phosphor.crownSimple


pieceToIconChar : PieceKind -> Char
pieceToIconChar =
    \pieceKind ->
        case pieceKind of
            Pawn ->
                '♟'

            Bishop ->
                '♝'

            Knight ->
                '♞'

            Rook ->
                '♜'

            Queen ->
                '♛'

            King ->
                '♚'


audio : State -> Audio.Audio
audio =
    \state ->
        case state.audioPieceMove of
            Err _ ->
                Audio.silence

            Ok moveAudio ->
                state.moveTimes
                    |> List.map
                        (\time -> Audio.audio moveAudio time)
                    |> Audio.group


type alias PieceLocations =
    ChessFieldLocationDict ()
