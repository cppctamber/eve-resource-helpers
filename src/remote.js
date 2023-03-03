import axios from "axios";
import * as stream from "stream";
import {createWriteStream} from "fs";
import {promisify} from 'util';
import {resFileIndexToObject, validateClient} from "./utils.js";
import {appFileIndexCache, resFileIndexCache} from "./cache.js";

const
    app = axios.create({baseURL: "https://binaries.eveonline.com"}),
    res = axios.create({baseURL: "https://resources.eveonline.com"});


/**
 * Gets the current client build
 * @param {String} client
 * @returns {Promise<null|Number>}
 */
export async function getCurrentRemoteClientBuild(client) {
    client = validateClient(client);
    const url = `eveclient_${client.toUpperCase()}.json`;
    console.log(`${client} > get remote ${url}`);
    return app
        .get(url)
        .then(json => Number(json["build"]));
}

/**
 * Gets a build's app file index without caching
 * TODO: Figure a better way of identifying invalid builds
 * @param {String|Number} build
 * @returns {Promise<Array<Array>>}
 */
async function getRemoteBuildAppFileIndexWithoutCaching(build) {
    return app
        .get(`/eveonline_${build}.txt`, {responseType: "text"})
        .then(response => resFileIndexToObject(response.data))
}

/**
 * Gets a build's app file index
 * @param {String|Number} build
 * @returns {Promise<Array<Array>>}
 */
export async function getRemoteBuildAppFileIndex(build) {
    build = Number(build);
    if (!appFileIndexCache.has(build)) appFileIndexCache.set(build, getRemoteBuildAppFileIndexWithoutCaching(build));
    return appFileIndexCache.get(build);
}

/**
 * Gets a build's res file index without caching
 * @param {String|Number} build
 * @returns {Promise<null|Array>}
 */
export async function getRemoteBuildResFileIndexWithoutCaching(build) {
    const appFileIndex = await getRemoteBuildAppFileIndex(build);
    const resFileIndexRes = appFileIndex.find(res => res[0] === "app:/resfileindex.txt");
    if (!resFileIndexRes) throw new Error(`Could not find resfileindex for build ${build}`);
    return app
        .get(resFileIndexRes[1], {responseType: "text"})
        .then(response => resFileIndexToObject(response.data));
}

/**
 * Gets a remote build's res file index
 * @param {String|Number} build
 * @returns {Promise<Array<Array>>}
 */
export async function getRemoteBuildResFileIndex(build) {
    build = Number(build);
    if (!resFileIndexCache.has(build)) resFileIndexCache.set(build, getRemoteBuildResFileIndexWithoutCaching(build));
    return resFileIndexCache.get(build);
}

/**
 * Gets a client's current build
 * @param client
 * @returns {Promise<{build: (Number|null), client, index: (Array|null)}>}
 */
export async function getCurrentRemoteClientInfo(client) {
    const build = await getCurrentRemoteClientBuild(client);
    return {build, index: await getRemoteBuildResFileIndex(build)};
}

const finished = promisify(stream.finished);

/**
 * Gets a resource and stores it
 * @param {String} targetFilePath
 * @param {String} hash
 * @returns {Promise<void>}
 */
export async function storeRemoteHash(targetFilePath, hash) {
    const writer = createWriteStream(targetFilePath);
    await res.get(hash, {responseType: "stream"})
        .then(response => {
            response.data.pipe(writer);
            return finished(writer);
        })
}