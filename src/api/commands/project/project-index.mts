import {
    ProjectCreateCommandData,
} from './project-create.mjs';

/**
 * @interface ProjectCommand - A union of all possible render-related commands.
 */
export type ProjectCommand =
    | ProjectCreateCommandData
    ;
