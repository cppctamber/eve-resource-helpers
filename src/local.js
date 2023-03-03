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
 * @param {String} eveSharedCacheDir
 * @param {String} client
 * @returns {Promise<null|Number>}
 */
export async function getLocalClientBuild(eveSharedCacheDir, client) {
    client = validateClient(client);
    const startIniPath = path.join(eveSharedCacheDir, client, "start.ini");
    if (!await exists(startIniPath)) return null;
    const {build} = await readLocalStartIni(startIniPath);
    return build || null;
}

/**
 * Gets a client's res file index
 * @param {String} eveSharedCacheDir
 * @param {String} client
 * @returns {Promise<null|Array>}
 */
export async function getLocalClientResFileIndex(eveSharedCacheDir, client) {
    client = validateClient(client);
    const resFileIndexPath = path.join(eveSharedCacheDir, client, "resfileindex.txt");
    if (!await exists(resFileIndexPath)) return null;
    return readLocalResFileIndex(resFileIndexPath);
}

/**
 * Gets a client's app file index
 * @param {String} eveSharedCacheDir
 * @param {String} client
 * @returns {Promise<null|Array>}
 */
export async function getLocalClientAppFileIndex(eveSharedCacheDir, client) {
    client = validateClient(client);
    const resFileIndexPath = path.join(eveSharedCacheDir, `index_${client}.txt`);
    if (!await exists(resFileIndexPath)) return null;
    return readLocalResFileIndex(resFileIndexPath);
}

/**
 * Gets client info
 * @param {String} eveSharedCacheDir
 * @param {String} client
 * @returns {Promise<{build: Number, client: String, res: Array<Array>}>}
 */
export async function getLocalClientInfo(eveSharedCacheDir, client) {
    const [build, res] = await Promise.all([
        getLocalClientBuild(eveSharedCacheDir, client),
        getLocalClientResFileIndex(eveSharedCacheDir, client)
    ]);
    return build && client ? {build, client, res} : null;
}

/**
 * Copies a resource hash to a new location if it exists
 * @param {String} targetFilePath
 * @param {String} hash
 * @param {String} eveSharedCacheDir
 * @returns {Promise<boolean>} true if copied
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