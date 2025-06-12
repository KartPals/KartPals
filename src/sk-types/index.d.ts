import type { FirebaseAuth as Auth } from "fbtypes";
import type { ByteBrew } from "bytebrew";

export {};

declare global {
    interface Window {
        firebase: {
            auth: Auth;
        };
        // This only provides type information for string urls inside the unityGame object.
        unityGame: {
            // deno-lint-ignore ban-types
            [key: string]: string | Function;
            sendMessage: (
                gameObject: string,
                methodName: string,
                value: string,
            ) => void;
        };
        ByteBrewSDK: ByteBrew;
    }
}
