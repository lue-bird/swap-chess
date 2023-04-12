port module PkgPorts exposing (ports)

import Json.Decode
import Json.Encode


ports :
    { audioPortToJS : Json.Encode.Value -> Cmd event
    , audioPortFromJS : (Json.Decode.Value -> event) -> Sub event
    }
ports =
    { audioPortToJS = martinsstewart_elm_audio_to_js
    , audioPortFromJS = martinsstewart_elm_audio_from_js
    }


port martinsstewart_elm_audio_to_js : Json.Encode.Value -> Cmd event_


port martinsstewart_elm_audio_from_js : (Json.Decode.Value -> event) -> Sub event
