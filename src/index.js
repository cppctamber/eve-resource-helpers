export * as local from "./local.js";
export * as remote from "./remote.js";
export * as utils from "./utils.js";

import {storeRemoteHash} from "./remote.js";
import {isValidEveSharedCacheDir, storeLocalHashIfExists} from "./local.js";

/**
 * Gets a hash
 * @param {String} targetFilePath
 * @param {String} hash
 * @param {String} eveSharedCache
 * @returns {Promise<void>}
 */
export async function storeHash(targetFilePath, hash, eveSharedCache) {
    if (!await isValidEveSharedCacheDir(eveSharedCache) || !await storeLocalHashIfExists(targetFilePath, hash, eveSharedCache)) await storeRemoteHash(targetFilePath, hash);
}
