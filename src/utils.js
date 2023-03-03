import {readdir, readFile, mkdir, stat, writeFile} from "fs/promises";
import path from "path";
import util from "util";
import child_process from "child_process";

/**
 * Valid client names
 * @type {{CHAOS: string, THUNDER_DOME: string, TRANQUILITY: string, SINGULARITY: string, DUALITY: string}}
 */
export const Client = {
    TRANQUILITY: "tq",
    SINGULARITY: "sisi",
    CHAOS: "chaos",
    DUALITY: "duality",
    THUNDER_DOME: "thunderdome"
}

/**
 * Validates a client
 * @param {String} client
 * @returns {string}
 */
export function validateClient(client) {
    client = client.toLowerCase();
    for (const key in Client) {
        if (Client.hasOwnProperty(key)  && Client[key] === client) return client;
    }
    throw new Error(`Invalid client: ${client}`);
}

/**
 * Creates a res file index array
 * @param {String} str
 * @returns {Array}
 */
export function resFileIndexToObject(str) {
    return str
        .split(/\r?\n/)
        .filter(x => !!x)
        .map(x => {
            const split = x.split(",");
            return [
                split[0].toLowerCase(),
                split[1],
                Number(split[3])
            ]
        })
        .sort((a, b) => a[0].localeCompare(b[0]))
}

/**
 * Converts a resource array in to an object
 * @param {Array} resource
 * @returns {{ext: string, fnv164: string, size: number, prefix: string, name: string, dir: string, hash: string, resPath: string, md5: string}}
 */
export function res(resource) {
    return {
        resPath: resource[0],
        hash: resource[1],
        md5: resource[1].split("_")[1],
        size: resource[2],
        prefix: resource[0].split(":/")[0],
        dir: path.dirname(resource[0]),
        name: path.basename(resource[0]),
        ext: path.extname(resource[0]),
        fnv164: resource[1].split("_")[0].substring(2)
    }
}

/**
 * Checks if a file exists and optionally throws an error
 * @param {String} path
 * @param {String|Boolean} [doThrowOnFalse]
 * @returns {Promise<Boolean>}
 */
export async function exists(path, doThrowOnFalse) {
    if (!path) throw new Error(`Invalid path: ${path}`);
    try {
        await stat(path);
        return true;
    } catch (err) {
        if (doThrowOnFalse) throw new Error(`Invalid path: ${path}`);
        return false;
    }
}

/**
 * Gets all files in a directory async
 * @param {String} dir
 * @param {Boolean} [ignoreMissing]
 * @returns {Promise<Array>}
 */
export async function directory(dir, ignoreMissing) {
    if (!await exists(dir, ignoreMissing)) return [];
    const result = await readdir(dir, {withFileTypes: true});
    const files = await Promise.all(result.map((x) => {
        const res = path.resolve(dir, x.name);
        return x.isDirectory() ? directory(res) : res;
    }));
    return files.sort().flat();
}

/**
 * Makes a directory from a file path recursively
 * @param {String} filepath
 * @return {Promise<string>}
 */
export async function makeFileDirectory(filepath) {
    return mkdir(path.dirname(filepath), {recursive: true});
}

/**
 * Makes a directory recursively
 * @param {String} dir
 * @return {Promise<string>}
 */
export async function makeDirectory(dir) {
    return mkdir(dir, {recursive: true});
}

/**
 * Reads a json file and returns an object
 * @param {String} filepath
 * @return {Promise<Object|Array>}
 */
export async function readJSON(filepath) {
    return JSON.parse(await readFile(filepath, 'utf8'));
}

/**
 * Writes a json file
 * @param {String} filepath
 * @param {Object|Array} [obj={}]
 * @param {Boolean} [pretty]
 * @returns {Promise<void>}
 */
export async function writeJSON(filepath, obj = {}, pretty) {
    await writeFile(filepath, pretty ? JSON.stringify(obj, null, 4) : JSON.stringify(obj), "utf8");
}

/**
 * Reads all json files in a path
 * @param {String} dir
 * @return {Promise<Array>}
 */
export async function readDirJSON(dir) {
    const files = await directory(dir);
    return Promise.all(files.map(filepath => readJSON(filepath)));
}

/**
 * Executes a child process
 * @type Function
 */
export const execFile = util.promisify(child_process.execFile);

/**
 * Identify if an AccessDenied error
 * @param {AxiosError} err
 * @returns {boolean}
 */
export function isErrorAccessDenied(err) {
    return !!(err && err.response && err.response.data && err.response.data.includes("AccessDenied"));
}
