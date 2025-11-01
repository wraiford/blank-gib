/**
 * @module command-service respec, not quite a real respec atow (01/2025).
 * convert later when doing better testing. for now, just import the test function
 * and run it to test.
 */

// import { RenderableHandle } from '../../render/render-one-file.mjs';
// import { renderableCreateFunctionInfo } from './renderable/create-renderables.mjs';
// import { renderableDestroyFunctionInfo } from './renderable/destroy-renderable.mts';
// import { renderableUpdateFunctionInfo } from './renderable/update-renderable.mts';

// /**
//  * @function testCommandService - A test function to demonstrate using the command service.
//  * @returns {Promise<void>}
//  */
// export async function testCommandService(): Promise<void> {
//     console.log('>>> Starting testCommandService...');

//     // 1. Create a renderable
//     let createHandle: RenderableHandle | undefined;
//     try {
//         const renderableCreateViaCmd = renderableCreateFunctionInfo.fnViaCmd;
//         // createHandle = (await renderableCreateViaCmd({
//         const resCreate = await renderableCreateViaCmd(
//             {
//                 cmd: 'Renderable',
//                 initialStates: [{
//                     isVisible: true,
//                     color: { r: 1, g: 0, b: 0, a: 1 }, // Red
//                     position: { x: 10, y: 10, z: 0 },
//                     scale: { x: 1, y: 1 },
//                     geometry: { type: 'rect', parameters: { type: 'rect', width: 50, height: 50 } },
//                 }],
//             });

//         createHandle = resCreate.at(0);
//         console.log(`testCommandService: Created renderable with handle ${createHandle.uuid}`);
//     } catch (error) {
//         console.error('testCommandService: Error creating renderable:', error);
//         return;
//     }

//     if (!createHandle) {
//         console.error('testCommandService: Error creating renderable - handle is undefined. (E: 6548f5560b07137bd683cb713a4fcc24)');
//         return;
//     }

//     // 2. Update the renderable after a short delay
//     await new Promise(resolve => setTimeout(resolve, 2000));
//     try {
//         const renderableUpdateViaCmd = renderableUpdateFunctionInfo.fnViaCmd;
//         await renderableUpdateViaCmd({
//             handle: createHandle,
//             updatedState: { color: { r: 0, g: 1, b: 0, a: 1 }, position: { x: 100, y: 100, z: 0 } }, // Green, moved
//         });
//         console.log(`testCommandService: Updated renderable with handle ${createHandle.uuid}`);
//     } catch (error) {
//         console.error('testCommandService: Error updating renderable:', error);
//     }

//     // 3. Destroy the renderable after another short delay
//     await new Promise(resolve => setTimeout(resolve, 2000));
//     try {
//         const renderableDestroyViaCmd = renderableDestroyFunctionInfo.fnViaCmd;
//         await renderableDestroyViaCmd({ handle: createHandle });
//         console.log(`testCommandService: Destroyed renderable with handle ${createHandle.uuid}`);
//     } catch (error) {
//         console.error('testCommandService: Error destroying renderable:', error);
//     }

//     console.log('>>> Finished testCommandService.');
// }
