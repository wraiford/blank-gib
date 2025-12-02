# ibgib Project Styleguide & AI Directives

This document outlines the coding conventions, architectural patterns, and style
preferences for ibgib projects. All contributors (Human, AI, other) are expected
to adhere to these guidelines when generating, refactoring, or modifying code.

## Project Structure

### organization - hybrid semantic approach

The project is essentially semantically organized. However, within semantic chunks, the code files in particular often are broken down by their content type: constants, types, helpers, functions, and classes. In the early stages of a semantic chunk, these may all be combined into a single file with the name pattern:

* `[semantic-chunk]` (folder)
    * `[semantic-chunk]-one-file.mts`

This indicates that all of the constants, types, etc., are all contained in that one file. This is especially true, for example, with ibgib components. But once it gets large enough, these single files are often broken out into the constituent files (often solving a compile-time reference issue).

* `[semantic-chunk]`
    * `[semantic-chunk]-constants.mts`
    * `[semantic-chunk]-types.mts`
    * `[semantic-chunk]-helpers.mts`
    * `[semantic-chunk]-v1.mts` (if it's an ibgib class), OR
      `[semantic-chunk].mts` (some other class)

**The general rule is that as complexity grows, the folder/file organization follows this semantic chunking pattern. _Usually_, a semantic chunk starts as one file, and then is broken out as needed.**

## AI-specific Guidance

### Persona

You are an expert full-stack developer with deep proficiency in TypeScript,
modern web components, and Chrome Extension development, with knowledge also in
other modern web technologies. You prioritize writing code that is DRY,
self-documenting with longer names, and with occasional more complex algorithms
comment-documented. When making changes, you just work on the immediate task at
hand. You do NOT throw in other, non-related "fixes" like removing comments you
think are unnecessary, unused imports, or empty lines.

## High-level Principles

### DRY (Don't Repeat Yourself)

Abstract repeated logic into reusable functions or services.

### Premature Optimization is Evil

Make it best-effort clean and maintainable first, and tweak/concretize as needed
for real bottlenecks.

### Component Encapsulation

Components should be self-contained. Their HTML, CSS, and TypeScript should
manage their own state and not bleed into the global scope.

### Clarity and Readability

Write code for humans first. Use meaningful variable names, don't fear long
names. Code with longer names should be relatively self-documenting, but for
lengthier or more intricate algorithms, write terse comments describing your
intent of what the code is meant to do and any pertinent considerations.

## Language & Framework Conventions

### General Languages

* Use 4 spaces for indentation
* Use descriptive names for classes, interfaces, function names, variables, constants, etc.
  * Only use short names for extremely common patterns, such as...
    * `lc` is for "log context", but only because this is in literally every
      single TS file, in every single class/function.
    * lambdas frequently use `x`, e.g., `.filter(x => x === 'ok')`, but this is
      because the long name should be in the name of the array being worked
      upon.
* Tag ALL logging messages, warnings, and errors with the proper prefix, a uuid or "genuuid", inside parens.
  * ```
    console.log(`${lc} Some info message (I: ea6fe8637f74134775c02e8749e7e825)`);
    console.log(`${lc} Some info message (I: genuuid)`);
    console.warn(`${lc} Some warning (W: 2f7b7cefcc2bbe905c9f6268885ee325)`);
    console.warn(`${lc} Some warning (W: genuuid)`);
    throw new Error(`some error (E: eb7a98a3bdf2df9ff35769f38ef01825)`);
    throw new Error(`some error (E: genuuid)`);
    throw new Error(`(UNEXPECTED) value falsy? We expect this to always be truthy at this point. (E: a2f717c53b582b5b4fac57a5ee1f6125)`);
    throw new Error(`(UNEXPECTED) value falsy? We expect this to always be truthy at this point. (E: a2f717c53b582b5b4fac57a5ee1f6125)`);
    ```
    * The "genuuid" is the code snippet here in the ide. Agents have a hard time
      generating uuids, so its best just to put this in and the human coder (or
      agent with access to ide) can do a "Find all" and invoke the snippet.

### TypeScript

#### Use destructured params and logging in 99% of functions

```typescript
export async function foo({
    metaspace,
    space,
}: {
    metaspace: MetaspaceService,
    space?: IbGibSpaceAny | undefined,
}): Promise<IbGib_V1> {
    const lc = `[${foo.name}]`;
    try {
        if (logalot) { console.log(`${lc} starting... (I: genuuid)`); }

        // foo implementation here

    } catch (error) {
        console.error(`${lc} ${extractErrorMsg(error)}`);
        throw error;
    } finally {
        if (logalot) { console.log(`${lc} complete.`); }
    }
}
```
_Note: the `genuuid` is a workspace keyboard snippet that is expanded in the IDE to a valid UUID. For AIs, just type `genuuid` and the human (me I guess!) will manually expand it, so we have a legit UUID._

The exceptions to this are two-fold:

* For extremely small helper functions with a single obvious parameter, destructured args is not needed
* For extremely performant functions (like rendering), the logging must be thought of on a case by case basis.

But on the whole, we sacrifice slivers of performance for logging and then later, we will cull this back.

#### exceptions and UNEXPECTED exceptions

_Note: the `genuuid` is a workspace keyboard snippet that is expanded in the IDE to a valid UUID. For AIs, just type `genuuid` and the human (me I guess!) will manually expand it, so we have a legit UUID._

* All exceptions should have...
  * The error message describing the problem.
  * UUID with `E` inside parens, e.g., `(E: 7acca8fd4cc8f7b6e980ec4865ca4925)`
* "UNEXPECTED" exceptions are like code assertions and usually have very short
  questions, with optional expectated description.
* "normal" exceptions are those that can happen during the course of events. Logic flow is usually not exception-based, prefering other workflow constructs.
  * sometimes, especially when consuming other libs/std code, we have to use
    exceptions for the logic flow because that is how those libs are designed.
* The majority of functions should rethrow exceptions.
* examples
  ```
  throw new Error(`some error (E: eb7a98a3bdf2df9ff35769f38ef01825)`);
  throw new Error(`some error (E: genuuid)`);
  throw new Error(`(UNEXPECTED) value falsy? We expect this to always be truthy at this point. (E: a2f717c53b582b5b4fac57a5ee1f6125)`);
  throw new Error(`(UNEXPECTED) value falsy? We expect this to always be truthy at this point. (E: a2f717c53b582b5b4fac57a5ee1f6125)`);
  ```

#### use "sub-functions/methods" to organize complex fns/methods

Whenever a function or method starts growing in complexity and size, it often
needs to be broken down into smaller parts. But really these parts only belong
to that function or method. When this is true, sometimes we place the function
nested in the scope, and sometimes we create what I call a "sub-method". For
these, the naming convention is `[super method name]_[sub-method name]`, e.g.,
`doSomething_doAPart({...})`.

These should always *NOT* be exported in the case of functions, and `private` in
the case of methods. Usually these will only be called from within the primary
method. These should be located just above the primary function/method
declaration and should be enclosed in region tags:

`// #region doSomething` and `// #endregion doSomething`

Note that the `#endregion` tag has the same exact text as the opening tag and is
not just a bare `#endregion` comment like most code bases.

One real world example is with `renderUI`: `renderUI`, `renderUI_header`,
`renderUI_content`, `renderUI_footer`, etc. But note that because some of these
stand on their own for micro-updates, they are sometimes called outside of the
primary method.

#### ES modules, imports

All ibgib code uses ES modules. The specific version can be seen from the base tsconfig settings.

This has a couple of important consequences.

##### *.mjs and *.mts files, no bare imports

This is the number one difficulty most people and agents have, because most code people and agents have trained on use CommonJS. But here is the cascade of changes to use all ES modules.

**tl;dr: NO BARE IMPORT STATEMENTS. All source files are *.mts that transpile to *.mjs files. All `import` statements must explicitly state the full *.mjs file path.**

Here is the reasoning for this tl;dr:

1. Browsers need *.mjs file extensions to show ES module usage.
2. Browsers need import maps to resolve ES module import paths.
3. Import maps grow out of control if you try to add every single path.
   * So import maps in ibgib all point to the root of a package (no import map entries to specific files).
4. TypeScript requires *.mts file extensions to transpile to *.mjs.
   * So within *.mts files, we MUST reference the corresponding *.mjs file and NOT the *.mts file.

**NOTE: If a bare import is used in source, a mysterious, extremely unhelpful error will come up at runtime (not at compile time).**

##### type=module in `<script>` tags

Over 99% of the time (unless we are kluging a raw *.js file), we must use the module type attr on the `<script>` tag.

##### special agent instructions

Since bare imports are such a headache and difficult to troubleshoot, agents should either...

1. Leave `import` statments out
2. Put a `console.error` statement BEFORE the imports you are adding stating any assumptions about the path, existence of the function, etc.

Today's tooling has amazing capabilities for automatically adding import statements correctly, and it is good to leverage this until there is more ESM training data that references *.mjs files.

#### JavaScript Quirks

JavaScript has quirks and we try to obviate them as much as possible.

##### always use explicit `===` for equality, never `==`

Avoid difficult-to-track casting issues.

##### always use explicit blocks for `if`, `else` blocks

Even for one liners, use curly brackets, e.g.:

```
if (isValid) { foo(); }
```

NEVER skip using these curly brackets. Although most changes should be laser-focused on the concrete issue at hand (bug/feature/etc.), this is one where you should fix ASAP if it's noticed.

#### Use truthy assertions with ! as a last resort

Actual ! assertions, like `ibGib.data!.myProp` should be AVOIDED almost always. Instead, throw an error.

_note: In this particular case of `ibGib.data`, this would be an UNEXPECTED error which is detailed elsewhere in this styleguide._

thrownewun

### Markdown

* Use asterisks for bullets.
* Indent bullets two spaces between levels.

## UI

This section covers conventions for building user interfaces, including component structure and styling.

### Component Structure (HTML/DOM)

*   **Component Root Naming:** The root element of a component should have an `id` that matches the component's name, e.g., `my-component`.

*   **Internal Component Layout:** Within a component's root element, its primary child elements should follow a `[component-name]-header`, `[component-name]-content`, and `[component-name]-footer` naming convention for their `id`s. This provides a consistent and predictable DOM structure across all components. Not all sections are required. For example:

    ```html
    <div id="my-component">
        <div id="my-component-header">...</div>
        <div id="my-component-content">...</div>
        <div id="my-component-footer">...</div>
    </div>
    ```

*   **TypeScript Interaction Pattern:** Accessing DOM elements from within the component's TypeScript class should follow a standard, type-safe pattern.

    1.  **Extend `ElementsBase`:** Define an interface for your component's elements that extends the shared `ElementsBase`. Add properties for each interactive element defined in your HTML.

        ```typescript
        interface MyComponentElements extends ElementsBase {
            header: HTMLDivElement;
            someButton: HTMLButtonElement;
            // contentEl is already in ElementsBase and is required
        }
        ```

    2.  **Implement `initElements`:** In your component class, implement an `initElements` method. This method's job is to query the Shadow DOM and populate the `this.elements` property, which should be typed with your new interface.

    3.  **Use `shadowRoot_getElementById`:** Inside `initElements`, use the `shadowRoot_getElementById` helper function for each element.

        ```typescript
        // In your component class...
        protected elements: MyComponentElements;

        async initElements(): Promise<void> {
            const lc = `${this.lc}[${this.initElements.name}]`;
            try {
                if (!this.shadowRoot) { throw new Error(`(UNEXPECTED) shadowRoot not initialized.`); }
                this.elements = {
                    header: shadowRoot_getElementById(this.shadowRoot, 'my-component-header'),
                    contentEl: shadowRoot_getElementById(this.shadowRoot, 'my-component-content'),
                    someButton: shadowRoot_getElementById(this.shadowRoot, 'some-button-id'),
                };
            } catch (error) {
                console.error(`${lc} ${extractErrorMsg(error)}`);
                throw error;
            }
        }
        ```

    *Footnote:* The purpose of this pattern is to enforce discipline. By centralizing all DOM lookups into `initElements` and using a helper that throws on failure, we can safely assume that `this.elements.someButton` is *always* defined in any other component method (like `renderUI` or event handlers). This avoids littering the code with non-null assertion operators (`!`) and provides a single, clear point of failure if the HTML and TypeScript get out of sync.

### Styling (CSS)

#### Use nested CSS declarations

To help specify css scope, always use nested declarations when possible (99% of
the time).  Sometimes, certain selectors/pseudo selectors require side-by-side
declarations. Of course use this when it is necessary.

Use this (nested)...
```css
#sidepanel-component {
    display: flex;
    flex-direction: column;

    #sidepanel-header {
        padding: 0.5em;
        border-bottom: 1px solid #ccc;
    }
}
```
...and DO NOT side-by-side:
```css
#sidepanel-component {
    display: flex;
    flex-direction: column;
}
#sidepanel-header {
    padding: 0.5em;
    border-bottom: 1px solid #ccc;
}
```
#### Use CSS Variables

Define and use CSS variables for themeable properties like colors, fonts, and
spacing. This allows for dynamic theming, especially via runtime agents.
