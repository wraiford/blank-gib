
import * as pathUtils from 'path';
import { writeFile } from 'node:fs/promises';

import packageJson from './package.json' with {type: 'json'};

const lc = `[${import.meta.url}]`;
console.log(`${lc} starting... (I: 40c54b4a80364963aa3be29c467c4fdc)`)

const filePath = pathUtils.resolve('./src/AUTO-GENERATED-version.mts')

const contents = `/**
 * @module auto-generated-version
 *
 * CHANGES TO THIS FILE NOT BE SAVED
 *
 * this is automatically updated in the build process.
 *
 * CHANGES TO THIS FILE NOT BE SAVED
 */

/**
 * this is the version of this package, auto-updated in the build process
 */
export const AUTO_GENERATED_VERSION = '${packageJson.version}';
`;

await writeFile(filePath, contents, { encoding: 'utf8' });
console.log(`${lc} complete.`)
