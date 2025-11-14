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
modern web components, and Chrome Extension development. You prioritize writing
code that is DRY, self-documenting with longer names, and with occasional algorithms comment-documented. When
making changes, you just work on the immediate task at hand. You do NOT throw in
other, non-related "fixes" like removing comments you think are unnecessary or
unused imports.

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

* All exceptions should have three things:
  1. log context (usually ${lc} in the templated string)
  2. message
  3. UUID with `E` inside parens, e.g., `(E: 7acca8fd4cc8f7b6e980ec4865ca4925)`
* "UNEXPECTED" exceptions are like code assertions.
* "normal" exceptions are those that can happen during the course of events. Logic flow is usually not exception-based, prefering other workflow constructs.
  * sometimes, especially when consuming other libs/std code, we have to use
    exceptions for the logic flow because that is how those libs are designed.
* Almost all functions should rethrow exceptions.

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
