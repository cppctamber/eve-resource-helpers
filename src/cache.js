export const
    appFileIndexCache = new Map(),
    resFileIndexCache = new Map();

/**
 * Clears cache
 */
export function clearCache()
{
    appFileIndexCache.clear();
    resFileIndexCache.clear();
}
