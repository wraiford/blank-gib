import { pickRandom_Letters } from '@ibgib/helper-gib/dist/helpers/utils-helper.mjs';
import { firstOfAll, ifWe, ifWeMight, iReckon, lastOfAll, respecfully, respecfullyDear } from '@ibgib/helper-gib/dist/respec-gib/respec-gib.mjs';
const maam = `[${import.meta.url}]`, sir = maam;

// import { storageDBExists } from './helpers.web.mjs';

//todo: do these tests once we get web testing going (this won't work in node)

// await respecfully(sir, `indexeddb storage`, async () => {

//     await ifWe(sir, `storageDBExists`, async () => {
//         const randomName = pickRandom_Letters({ count: 7 });
//         const dbExists = await storageDBExists({ name: randomName });
//         iReckon(sir, dbExists).isGonnaBeFalse();
//     });
// });
