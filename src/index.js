export * from "./local.js";
export * from "./remote.js";
export * as utils from "./utils.js";

import {storeRemoteHash} from "./remote.js";
import {storeLocalHashIfExists} from "./local.js";

/**
 * Stores a hash
 * @param {String} targetFilePath
 * @param {String} hash
 * @param {String} [eveSharedCache]
 * @returns {Promise<void>}
 */
export async function storeHash(targetFilePath, hash, eveSharedCache) {
    if (!eveSharedCache || !await storeLocalHashIfExists(targetFilePath, hash, eveSharedCache)) await storeRemoteHash(targetFilePath, hash);
}
