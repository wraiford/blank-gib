import { getJson } from './helpers.mjs';

const lc = `[constants.mts]`;

export const ROOT_DIR = process.cwd();
export const PKG_JSON_PATH = `${ROOT_DIR}/package.json`;

export const getPackageJson = async () => getJson<any>(PKG_JSON_PATH);

export const SRC_DIR = `${ROOT_DIR}/src`;
export const BUILD_DIR = `${ROOT_DIR}/build`;

export const DIST_DIR = `${ROOT_DIR}/dist`;
export const DIST_EXT_DIR = `${ROOT_DIR}/dist-ext`;
