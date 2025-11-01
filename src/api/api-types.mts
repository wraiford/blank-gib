/**
 * @interface APIFunctionInfo - Information about an available API function for the agent.
 * @typeParam TFunc - The type of the function implementation. Defaults to a promise that resolves to void.
 */
export interface APIFunctionInfo<TFunc extends (...args: any[]) => Promise<any> = (...args: any[]) => Promise<void>> {
    /**
     * @property nameOrId - A unique identifier for the function (e.g., 'renderableCreate').
     */
    readonly nameOrId: string;
    /**
     * @property fnViaCmd - factory function for the command that invokes the API function.
     */
    readonly fnViaCmd: TFunc;
    /**
     * @property functionImpl - The actual implementation of the API function.
     */
    readonly functionImpl: TFunc;
    /**
     * @property cmd - The base command associated with this function (e.g., 'renderable').
     */
    readonly cmd: string;
    /**
     * @property cmdModifiers - The command modifiers associated with this function (e.g., ['create']).
     */
    readonly cmdModifiers: readonly string[];
    /**
     * @property schema - The OpenAPI schema representing the function's parameters.
     */
    readonly schema: any;
    // Add other relevant information as needed (e.g., description)
    /**
     * if true, then the commanding service will not try to locate the command
     * in an existing whitelist.
     */
    isAnon?: boolean;
}
