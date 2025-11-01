import { extractErrorMsg } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
import { readFile } from 'fs/promises';

const lcFile = `[build][helpers.mts]`;

export async function getJson<T>(path: string): Promise<T> {
    const lc = `${lcFile}[${getJson.name}]`;
    try {
        const file = await readFile(path, 'utf-8');
        const data = JSON.parse(file);
        return data;
    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    }
}
