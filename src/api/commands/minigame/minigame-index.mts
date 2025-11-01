import { APIFunctionInfo } from "../../api-types.mjs";
import { minigameBuilderEditStimuliFunctionInfo } from "./minigame-builder-edit-stimuli.mjs";
import { minigameBuilderStartFunctionInfo } from "./minigame-builder-start.mjs";
import { minigameBuilderValidateAndReadyFunctionInfo } from "./minigame-builder-validate-and-ready.mjs";

export const MinigameFunctionInfos: APIFunctionInfo<any>[] = [
    minigameBuilderStartFunctionInfo,
    minigameBuilderEditStimuliFunctionInfo,
    minigameBuilderValidateAndReadyFunctionInfo,
];
