port module PkgPorts exposing (ports)

import Json.Decode
import Json.Encode


ports :
    { audioPortToJS : Json.Encode.Value -> Cmd msg
    , audioPortFromJS : (Json.Decode.Value -> msg) -> Sub msg
    }
ports =
    { audioPortToJS = martinsstewart_elm_audio_to_js
    , audioPortFromJS = martinsstewart_elm_audio_from_js
    }


port martinsstewart_elm_audio_to_js : Json.Encode.Value -> Cmd msg


port martinsstewart_elm_audio_from_js : (Json.Decode.Value -> msg) -> Sub msg
