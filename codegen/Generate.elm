module Generate exposing (main)

{-| -}

import Elm exposing (Expression)
import Elm.Annotation as Type
import Gen.CodeGen.Generate as Generate
import Gen.Tuple
import GenericDict
import Gen.Chess
import Gen.N


main : Program {} () ()
main =
    Generate.run
        [ GenericDict.init
            { keyType = Gen.Chess.annotation_.fieldLocation
            , namespace = []
            , toComparable =
                \location ->
                    Elm.tuple
                        (Gen.N.toInt (Elm.get "row" location) |> Elm.withType Type.int)
                        (Gen.N.toInt (Elm.get "column" location) |> Elm.withType Type.int) 
                        |> Elm.withType (Type.tuple Type.int Type.int)
            }
            |> GenericDict.useElmFastDict
            |> GenericDict.generateFile
        ]

