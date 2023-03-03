import path from "path";
import {readFile, copyFile} from "fs/promises";
import {exists, resFileIndexToObject, validateClient} from "./utils.js";

/**
 * Reads a res file index file
 * @param {String} resFileIndexPath
 * @returns {Promise<Array<Array>>}
 */
async function readLocalResFileIndex(resFileIndexPath) {
    return resFileIndexToObject(await readFile(resFileIndexPath, "utf8"));
}

/**
 * Reads a start ini file
 * @param {String} startIniPath
 * @returns {Promise<Object>}
 */
export async function readLocalStartIni(startIniPath) {
    return (await readFile(startIniPath, 'utf-8'))
        .split(/\r?\n/)
        .filter(x => !!x)
        .reduce((acc, cur) => {
            let [key, value = ""] = cur.split("=");
            acc[key.trim()] = Number.isNaN(value) ? value : Number(value);
            return acc;
        }, {})
}

/**
 * Gets the build of a local client
 * - Returns null if the client start.ini doesn't exist or is missing a build number
 * @param {String} eveSharedCacheDir
 * @param {String} client
 * @returns {Promise<null|Number>}
 */
export async function getLocalClientBuild(eveSharedCacheDir, client) {
    client = validateClient(client);
    const startIniPath = path.join(eveSharedCacheDir, client, "start.ini");
    return await exists(startIniPath) ? await readLocalStartIni(startIniPath).then(ini => ini.build || null) : null;
}

/**
 * Gets a client's res file index
 * - Returns null if there is no res file index for the client
 * @param {String} eveSharedCacheDir
 * @param {String} client
 * @returns {Promise<null|Array>}
 */
export async function getLocalClientResFileIndex(eveSharedCacheDir, client) {
    client = validateClient(client);
    const resFileIndexPath = path.join(eveSharedCacheDir, client, "resfileindex.txt");
    return await exists(resFileIndexPath) ? readLocalResFileIndex(resFileIndexPath) : null;
}

/**
 * Gets a client's app file index
 * - Returns null if there is no app file index for the client
 * @param {String} eveSharedCacheDir
 * @param {String} client
 * @returns {Promise<null|Array>}
 */
export async function getLocalClientAppFileIndex(eveSharedCacheDir, client) {
    client = validateClient(client);
    const resFileIndexPath = path.join(eveSharedCacheDir, `index_${client}.txt`);
    return await exists(resFileIndexPath) ? readLocalResFileIndex(resFileIndexPath) : null;
}

/**
 * Gets client info
 * - Returns null if the client is invalid or data is missing
 * @param {String} eveSharedCacheDir
 * @param {String} client
 * @returns {Promise<{build: Number, client: String, res: Array<Array>}|null>}
 */
export async function getLocalClientInfo(eveSharedCacheDir, client) {
    const build = await getLocalClientBuild(eveSharedCacheDir, client);
    if (!build) return null;
    const index = await getLocalClientResFileIndex(eveSharedCacheDir, client);
    return index ? { build, client, index } : null;
}

/**
 * Copies a resource hash to a new location if it exists
 * @param {String} targetFilePath
 * @param {String} hash
 * @param {String} eveSharedCacheDir
 * @returns {Promise<boolean>} true if the has exists locally and was copied
 */
export async function storeLocalHashIfExists(targetFilePath, hash, eveSharedCacheDir) {
    const srcFilePath = path.join(eveSharedCacheDir, "ResFiles", hash);
    if (!await exists(srcFilePath)) return false;
    await copyFile(srcFilePath, targetFilePath);
    return true;
}

/**
 * Checks if a eve shared cache directory is valid
 * @param {String} dir
 * @returns {Promise<boolean>}
 */
export async function isValidEveSharedCacheDir(dir) {
    return dir && await exists(path.join(dir, "ResFiles"));
}