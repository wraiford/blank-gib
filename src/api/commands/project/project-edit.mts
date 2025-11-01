import { pretty } from "@ibgib/helper-gib/dist/helpers/utils-helper.mjs";

import { APIFunctionInfo } from "../../api-types.mjs";
import { COMMAND_BASE_SCHEMA_PROPERTIES } from "../command-constants.mjs";
import { mut8IbGibFunctionInfo, mut8IbGibViaCmd, FUNCTION_NAME as MUT8_FUNCTION_NAME } from "../ibgib/mut8-ibgib.mjs";

const FUNCTION_NAME = 'editProject'

export const editProjectFunctionInfo: APIFunctionInfo<typeof mut8IbGibViaCmd> = {
    ...mut8IbGibFunctionInfo,
    nameOrId: FUNCTION_NAME,
    schema: {
        name: FUNCTION_NAME,
        description: `Edits a project's simple properties. Use this for simple edits on a project ibgib, like changing the name/title or description. More powerful edits can happen with the raw ${MUT8_FUNCTION_NAME} function, but this one automatically takes care of the business logic details like keeping the ib in sync with the data.name field.`,
        parameters: {
            type: 'object',
            properties: {
                ...COMMAND_BASE_SCHEMA_PROPERTIES,
                ibGibAddr: {
                    type: 'string',
                    description: 'The content address of the project ibGib to edit.',
                },
                newName: {
                    type: 'string',
                    description: `New name/title of the project. Only set if you are changing the name/title (a project's title is stored in the data.name field).`,
                },
                newDescription: {
                    type: 'string',
                    description: `New description for the project. Only set if changing the description.`,
                },
            },
            required: [
                'ibGibAddr',
            ],
        },
    }
};
