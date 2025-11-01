# ibgib: Your Page's Living Map

Tired of scrolling through endless articles and getting lost in walls of text? The **ibgib** extension transforms any webpage into a dynamic, interactive table of contents, giving you an AI-powered "living map" to navigate and understand content like never before.

Instantly break down long pages into manageable, semantic chunks. See a high-level summary at a glance, then expand any section to drill down into the details. Our fun, fluid animations make the process of summarization and exploration feel intuitive and engaging, turning slow AI processing time into a delightful visual experience.

But it doesn't stop there. This isn't just a static summary; it's a personal workspace. You can rearrange, edit, and collaborate with an AI agent to tailor the content's structure to your specific project or research needs. With **ibgib**, you're not just *reading* the web—you're *interacting* with it.

***

# "blank-gib" Chrome Extension: A Tool for Learning

## High-Level Intent

To create a Chrome extension that facilitates *learning as a whole*. This involves not only initial understanding but also the organization and retention of knowledge over time. It acts as a cognitive tool, augmenting the user's natural learning process.

The extension is built on two core principles:
1.  **Local-First & Privacy-Preserving:** It leverages Chrome's built-in, on-device AI, ensuring all data and processing remain on the user's machine.
2.  **Dynamic Knowledge Structuring:** It uses the `@ibgib` framework to capture knowledge not as static notes, but as a dynamic, evolving graph of interconnected ideas with a focus on both content and time, implemented on a DLT substrate.

### Backup minimalistic entry

As a backup, we can also think of an early prototype of this as being a smart, living/dynamically generated table of contents navigation tool.

## The Core Primitives: Break It Down & Synergize

Instead of generic "summarization," the extension provides two powerful, purpose-driven actions for processing information:

*   ### Break It Down (Reduce)
    This is the process of taking a large piece of information (an article, a section of text) and deconstructing it into its core, intrinsic components. It's about analysis and comprehension. For example, breaking down a dense scientific paper into a set of key bullet points, and being able to do this recursively to continually unpack concepts.

*   ### Synergize (Integrate)
    This is the process of taking multiple, distinct pieces of information (notes, bookmarks, previous breakdowns) and synthesizing them into a new, higher-level insight within a specific, *extrinsic* context. It's about synthesis and creating new meaning. For example, looking at all your notes on Italian cooking and synergizing them to generate a shopping list for a specific recipe.

"Synergize" is a future goal. The first milestone for this extension is to perfect the "Break It Down" workflow.

## First Milestone: The "Break It Down" Workflow

The initial version of the extension will focus exclusively on providing a seamless experience for breaking down web content.

### User Flow & UI

1.  **Side Panel:** The user opens the extension via a browser side panel.
2.  **Project Context:** A dropdown menu allows the user to select a "Project" (e.g., "Italian Language Learning," "Q3 Work Project"). This sets the high-level context. If no project is selected, one can be auto-generated (using the built-in Summarizer and short + heading params) based on the scope as defined in the next bullet point.
3.  **Define Scope:** The user implicitly defines the scope of the operation. If text is highlighted on the page, the scope is that selection. Otherwise, it defaults to the entire page content. If the user selects "website", this will first create a project specific to that website, then "break it down" with this page as the active scope.
  * if website is chosen, then the project context will change to auto-generate.
4.  **Execute Action:** The user clicks the "Break It Down" button.

### Implementation Notes

Basically, we have 3 basic "resting" states:

1. Showing raw `originalText` (if root src or root chunk)
2. Showing intrinsic summarized text (various lengths/qualities)
3. Showing children/broken down into bullets (after being broken down)

In addition to this, we have transitions, which will be the animations. These correspond to your "thinking node". In my mind, these are visually distinct, but really the node itself is the same. These represent some form of busy state. For the intrinsic resting states (1 and 2), it's really a busy state for that representation. For the state 3, building children, we would probably represent it differently and it's generating other components. But still the node itself is just busy with regards to this operation.

#### 1. raw `originalText`
First, the `originalText` is self-explanatory. I think even for child chunks we could map to at least a single word of original text, but I don't want to worry about that right now. The main thing is the root src and root chunk. So we can highlight the original chunk.

#### 2. summarized texts

Next, for the summarized texts: So far, we've mentioned the short/med/long summaries. But the Summarizer API gives us more options via the `type` parameter:

* "headline"
  * Summary should effectively contain the main point of the input in a single sentence, in the format of an article headline.
  * short	12 words
  * medium	17 words
  * long	22 words
* "tldr"
  * Summary should be short and to the point, providing a quick overview of the input, suitable for a busy reader.
  * short	1 sentence
  * medium	3 sentences
  * long	5 sentences
* "teaser"
  * Summary should focus on the most interesting or intriguing parts of the input, designed to draw the reader in to read more.
  * short	1 sentence
  * medium	3 sentences
  * long	5 sentences

So these texts are the various flavors, but importantly, they are essentially "intrinsic" values. They correspond to what we're thinking of as the leaf nodes. So in addition to our short/med/long summaries, we can do any of these different flavors, but they are not child nodes. They are intrinsic to this node's component.

#### 3. children

And third, for the children: The Summarizer API actually gives us a fourth `type` option:

* "key-points"
  * Summary should extract the most important points from the input, presented as a bulleted list.
  * short	3 bullet points
  * medium	5 bullet points
  * long	7 bullet points

This is our "break-it-down" functionality, and it's what we're thinking of with the branch node. Interestingly, the API documentation lists this as a third option, as if it were the same as the others. But I don't think it is, and that's where the beauty of the extension lies! But let's talk about how the UI can work.

#### UI

First, let's recognize that basically we're talking about many permutations of the various states but we have very little visual UI real estate. So we need to be clever. But we're also on a time crunch, so we need to implement functionality first.

##### simplest concept

The simplest thing to recognize is that we can think of the bulk of the component itself as the button. If it's showing a short headline, then clicking it would perhaps take us to the item in the page (scroll to its first DOM element), like a table of contents nav. If it has children, perhaps it also expands/collapses. The main thing is we have the component itself mostly be a button, with the possibility of other buttons. But we can't have a button bar, because visually we want that table of contents feel. It's possible we have a single button action bar immediately above the component be visible when we click one. Another option is the three dots menu on the right side of each component. This dots menu is probably easier to implement. The third option is gestures, but that is definitely more work to implement. So I'm thinking at first we have the component itself be a button *unless* the three dots are clicked, then a popup text menu shows up with our list of commands.

Obviously, the children panel also would not trigger a click on the intrinsic component, rather, that child/grandchild/etc component would be interacted with.

##### commands

Regardless of how we show it, our commands are at least those four API items (`type`), the short/med/long permutations (`length`), navigate/highlight corresponding DOM elements in page, and expand/collapse child container.

* headline/tldr/teaser
  * short/med/long
* key-points
  * short/med/long
* navigate/highlight
* expand/collapse

Note that I've listed key-points separately with short/med/long, but I'm not sure if we would show the med/long versions of the key-points. Because beyond the root chunks which we make manually (not via the Summarizer), we use this for the chunking. But at that point, we are showing the key point's intrinsic text via the summarizer, so our "original" text for those "synthetic" chunks would be derived from the key point itself. But just like with the root chunks, the point of the extension is not to show the "original text", rather to show the summary. So I think in the background we use the "long" key-point as the synthetic "original" text, and then we use the short headline as the default thing to visually show.

So let's talk about a walkthrough of this breaking down real quick.

##### walkthrough

_note: I'll use "chunk" the same as "break-it-down" because it's easier to type_

So we start with original text, and at the root, this is the DOM raw text that we extract (or that the user selects, or later, manually edits). The normal course of action for our extension is to summarize this. This is what our rabbit hole component does. It's a recursive interface for some original text interaction.

So the user opens the extension. We have a button to start chugging on the page, and the user clicks the button. We create a new component and pass in the root src comment. It loads and our rabbit hole component shows in its max size with vertical scrolling enabled.

I think that we always chunk this one, no matter the length of the original text, but I think usually we decide on how to summarize/chunk based on the size of original text.

So we open the child container and auto-start chunking this text using our semantic chunker (not the Summarizer API). Each one of those child rabbit hole components then starts their loading process, and *they* summarize using one of the headline/tldr/teaser options. Perhaps we always default with starting with the short headline, because our default use case is nav. I'll have to see how the perf is here, because the components will load somewhat in parallel with async/await. Ideally we create a queuing mechanism with priority, but for starters just see how the components do.

So the child components are loading, and each one starts with their full original text but quickly shrinks/animates to show they are compressing to the (headline) summary.

When the user clicks a headline, it navs to that chunk's first DOM element, highlights it, and begins chunking itself. Again, this may be slow if other siblings are still compressing, and a queue would be best as we would focus on the one most recently clicked. But we'll just have to do the basics first.

I think we should be able to get this workflow going and then add other functionality once we see this going.


### Knowledge Graph Generation & Core Algorithm

This section outlines the precise algorithmic flow when a user clicks "Break It Down."

1.  **Check API Availability:**
    *   The extension first checks the availability of the built-in Chrome AI APIs (`summarizer`, `prompt`, etc.) using the helper functions in `src/extension/helpers.mts`.
    *   If the APIs are not available, the UI will display a clear error message in red. This message will include a "Retry" button, allowing the user to re-check availability, which is useful for states like "downloading".
    *   The main UI of the extension (e.g., the "Break It Down" button) will be disabled until the APIs are confirmed to be available.

2.  **Get Content & Create Base Comment ibgib:**
    *   The extension captures the text from the user's selection or the entire page.
    *   It will then prompt the user to confirm this is the correct content, showing a snippet for long text (e.g., the first few lines, an ellipsis, and the last few lines).
    *   Upon confirmation, this captured text is used to create the "base" `CommentIbGib_V1`, which represents the original, unaltered source material.

3.  **Auto-Create Project (if applicable):**
    *   If the user has selected the "Auto-Create New Project" option, the extension will use the built-in `Summarizer` API on the base content to generate a short, descriptive name for the new project.
    *   The `createProjectIbGib` factory is then called to create the project ibgib.
    *   The base content ibgib is then relationally linked to this new project.

4.  **Break Down the Content:**
    *   The extension calls the built-in `Summarizer` API again on the base content text. This time, it uses short, terse settings and requests bullet points to perform the core "break down."
    *   The resulting bulleted list is displayed to the user in the side panel.

5.  **Concretize Breakdown & Build Graph:**
    *   Each generated bullet point from the breakdown is "reified" or "concretized" into its own individual `CommentIbGib_V1`.
    *   Each of these new "bullet" ibgibs is then relationally linked back to the base content ibgib. This creates a clear hierarchical knowledge graph: `Project -> Base Content -> Breakdown Bullets`.

6.  **Enable Interactivity & Refinement:**
    *   The UI will provide controls for the user to refine the generated knowledge graph:
        *   A main "redo" button will allow the user to re-run the entire breakdown process.
        *   Each individual bullet point will have its own controls to allow the user to re-run the summarizer/rewriter on just that bullet, providing granular control over the final output.


### Interactivity & Refinement

This is not a one-shot operation. The user can:
*   **Re-run:** Click the main "Break It Down" button again to get a completely different set of bullet points.
*   **Decompose Further:** Each individual bullet point will have its own...
    *   refresh button to redo that section
    *   edit button to allow the user to manually edit the text
    *   "Break It Down" button to allow the user to recursively deconstruct complex topics into finer and finer granules of understanding.

## Example User Story (First Milestone)

*   **As a language learner,** I browse to a news article written in Italian. I open the extension's side panel and select my "Italian Language" project. I click "Break It Down" with a scope of "content". The extension creates an ibgib for the article, links it to my project, and then generates several child ibgibs related by "content" named edge, and each one containing a key point from the article. Each of these children is rendered in UI as a bullet point. I see one bullet point that is particularly complex, so I click the small "Break It Down" button next to it that reuses the same scope, and the extension further deconstructs that single point into simpler sub-points, deepening my comprehension. I decide I need to study the intrinsic vocabulary of the article, so I select break-it-down with a scope of "learn language". The children ibgibs are now created under that scope, with a focus on the core concepts using TF-IDF. These children are linked via "learn language" named edge with each child containing the native language and target language in some schema that gets interpreted by the UI and rendered accordingly to show the translation pair. (Later we will implement games to reinforce these, and indeed, other factoids in the native language in general.)

## How It Works

The extension is composed of several key components that work together to extract content from a web page and display it in the side panel.

*   **Manifest (`manifest.json`):** This is the entry point for the extension. It defines the extension's name, version

# "blank-gib" Chrome Extension: A Tool for Learning

## High-Level Intent

To create a Chrome extension that facilitates *learning as a whole*. This involves not only initial understanding but also the organization and retention of knowledge over time. It acts as a cognitive tool, augmenting the user's natural learning process.

The extension is built on two core principles:
1.  **Local-First & Privacy-Preserving:** It leverages Chrome's built-in, on-device AI, ensuring all data and processing remain on the user's machine.
2.  **Dynamic Knowledge Structuring:** It uses the `@ibgib` framework to capture knowledge not as static notes, but as a dynamic, evolving graph of interconnected ideas with a focus on both content and time, implemented on a DLT substrate.

### Backup minimalistic entry

As a backup, we can also think of an early prototype of this as being a smart, living/dynamically generated table of contents navigation tool.

## The Core Primitives: Break It Down & Synergize

Instead of generic "summarization," the extension provides two powerful, purpose-driven actions for processing information:

*   ### Break It Down (Reduce)
    This is the process of taking a large piece of information (an article, a section of text) and deconstructing it into its core, intrinsic components. It's about analysis and comprehension. For example, breaking down a dense scientific paper into a set of key bullet points, and being able to do this recursively to continually unpack concepts.

*   ### Synergize (Integrate)
    This is the process of taking multiple, distinct pieces of information (notes, bookmarks, previous breakdowns) and synthesizing them into a new, higher-level insight within a specific, *extrinsic* context. It's about synthesis and creating new meaning. For example, looking at all your notes on Italian cooking and synergizing them to generate a shopping list for a specific recipe.

"Synergize" is a future goal. The first milestone for this extension is to perfect the "Break It Down" workflow.

## First Milestone: The "Break It Down" Workflow

The initial version of the extension will focus exclusively on providing a seamless experience for breaking down web content.

### User Flow & UI

1.  **Side Panel:** The user opens the extension via a browser side panel.
2.  **Project Context:** A dropdown menu allows the user to select a "Project" (e.g., "Italian Language Learning," "Q3 Work Project"). This sets the high-level context. If no project is selected, one can be auto-generated (using the built-in Summarizer and short + heading params) based on the scope as defined in the next bullet point.
3.  **Define Scope:** The user implicitly defines the scope of the operation. If text is highlighted on the page, the scope is that selection. Otherwise, it defaults to the entire page content. If the user selects "website", this will first create a project specific to that website, then "break it down" with this page as the active scope.
  * if website is chosen, then the project context will change to auto-generate.
4.  **Execute Action:** The user clicks the "Break It Down" button.

### Knowledge Graph Generation & Core Algorithm

This section outlines the precise algorithmic flow when a user clicks "Break It Down."

1.  **Check API Availability:**
    *   The extension first checks the availability of the built-in Chrome AI APIs (`summarizer`, `prompt`, etc.) using the helper functions in `src/extension/helpers.mts`.
    *   If the APIs are not available, the UI will display a clear error message in red. This message will include a "Retry" button, allowing the user to re-check availability, which is useful for states like "downloading".
    *   The main UI of the extension (e.g., the "Break It Down" button) will be disabled until the APIs are confirmed to be available.

2.  **Get Content & Create Base Comment ibgib:**
    *   The extension captures the text from the user's selection or the entire page.
    *   It will then prompt the user to confirm this is the correct content, showing a snippet for long text (e.g., the first few lines, an ellipsis, and the last few lines).
    *   Upon confirmation, this captured text is used to create the "base" `CommentIbGib_V1`, which represents the original, unaltered source material.

3.  **Auto-Create Project (if applicable):**
    *   If the user has selected the "Auto-Create New Project" option, the extension will use the built-in `Summarizer` API on the base content to generate a short, descriptive name for the new project.
    *   The `createProjectIbGib` factory is then called to create the project ibgib.
    *   The base content ibgib is then relationally linked to this new project.

4.  **Break Down the Content:**
    *   The extension calls the built-in `Summarizer` API again on the base content text. This time, it uses short, terse settings and requests bullet points to perform the core "break down."
    *   The resulting bulleted list is displayed to the user in the side panel.

5.  **Concretize Breakdown & Build Graph:**
    *   Each generated bullet point from the breakdown is "reified" or "concretized" into its own individual `CommentIbGib_V1`.
    *   Each of these new "bullet" ibgibs is then relationally linked back to the base content ibgib. This creates a clear hierarchical knowledge graph: `Project -> Base Content -> Breakdown Bullets`.

6.  **Enable Interactivity & Refinement:**
    *   The UI will provide controls for the user to refine the generated knowledge graph:
        *   A main "redo" button will allow the user to re-run the entire breakdown process.
        *   Each individual bullet point will have its own controls to allow the user to re-run the summarizer/rewriter on just that bullet, providing granular control over the final output.


### Interactivity & Refinement

This is not a one-shot operation. The user can:
*   **Re-run:** Click the main "Break It Down" button again to get a completely different set of bullet points.
*   **Decompose Further:** Each individual bullet point will have its own...
    *   refresh button to redo that section
    *   edit button to allow the user to manually edit the text
    *   "Break It Down" button to allow the user to recursively deconstruct complex topics into finer and finer granules of understanding.

## Example User Story (First Milestone)

*   **As a language learner,** I browse to a news article written in Italian. I open the extension's side panel and select my "Italian Language" project. I click "Break It Down" with a scope of "content". The extension creates an ibgib for the article, links it to my project, and then generates several child ibgibs related by "content" named edge, and each one containing a key point from the article. Each of these children is rendered in UI as a bullet point. I see one bullet point that is particularly complex, so I click the small "Break It Down" button next to it that reuses the same scope, and the extension further deconstructs that single point into simpler sub-points, deepening my comprehension. I decide I need to study the intrinsic vocabulary of the article, so I select break-it-down with a scope of "learn language". The children ibgibs are now created under that scope, with a focus on the core concepts using TF-IDF. These children are linked via "learn language" named edge with each child containing the native language and target language in some schema that gets interpreted by the UI and rendered accordingly to show the translation pair. (Later we will implement games to reinforce these, and indeed, other factoids in the native language in general.)

## How It Works

The extension is composed of several key components that work together to extract content from a web page and display it in the side panel.

*   **Manifest (`manifest.json`):** This is the entry point for the extension. It defines the extension's name, version, permissions, and capabilities. It registers the background script, content script, and the side panel.

*   **Background Script (`background.mts`):** This acts as the central coordinator for the extension. It listens for events, such as the user clicking the extension icon, and manages the state of the side panel. It also facilitates communication between the content script and the side panel.

*   **Side Panel (`index.sidepanel.ext.html` & `index.sidepanel.ext.mts`):** The `index.sidepanel.ext.html` file provides the basic HTML structure for the side panel that appears in the browser. The `sidepanel.mts` script is the main script for the side panel. It's responsible for bootstrapping the application and loading the main UI component.

*   **Bootstrap (`bootstrap.ext.mts`):** This contains core ibgib framework bootstrap functions specific to the extension, utilized.

*   **Side Panel Component (`component/sidepanel/sidepanel-component-one-file.mts`):** This is the main user interface, built using the custom ibgib component architecture built on top of web components and utilizing ibgib's unique content addressing and timeline dynamics to enable a unique reactive structure.

*   **Content Script (`content-script.mts`):** This script is injected directly into the active web page to provide embedded functionality that requires message passing between the page and the extension. Currently, this includes transmitting selection change events.

### Data Flow

1.  **User Interaction:** The user interacts with the web page and opens the extension side panel.
    *   The sidepanel's index is rendered, which bootstraps the ibgib environment.
    *   Injects the primary ibgib sidepanel component which contains the actual main UI.
    *   This UI shows some options and a break-it-down button.

2.  **Content Script (`content-script.mts`):**
    *   Event listeners are registered and active in the page, currently the `selectionchange` event.
    *   When the user's text selection changes, the content script sends a `selectionChange` message to the extension's runtime, indicating whether there is an active selection.

3.  **Side Panel Component (`sidepanel-component-one-file.mts`):**
    *   The side panel has a message listener. When it receives the `selectionChange` message, it dynamically updates the "Scope" dropdown option.

4.  **User Action ("Break It Down"):** The user clicks the "Break It Down" button in the side panel.

5.  **Content Extraction:**
    *   The side panel component determines the `scope` ("Page" or "Selection") (in the future, will also take the current project as context in how it will parse the page).
    *   It then executes the raw `page-content-extractor.js` (non-transpiled) script in the context of the active tab via chrome `executeScript`.
    *   This extractor script analyzes the page's DOM, identifies the main content, and captures the current text selection if any. It returns this information as a `PageContentInfo` object directly to the side panel component across the execution boundary.

6.  **`ibgib` Creation & Processing:**
    *   The side panel component, still in the break it down handler, receives the `PageContentInfo`.
    *   Based on the selected scope, it takes either the full page content or the selection text.
    *   It creates a "source" ibgib comment to represent the original content.
    *   It creates a new Project ibgib based on that comment ibGib (or uses an existing one).
    *   It breaks the content down into smaller semantic chunks and creates individual ibgib comments for each chunk.
    *   These chunk ibgibs are relationally linked to the source ibgib, forming a small knowledge graph.

7.  **Render Results:** The side panel component then renders the newly created chunk ibgibs as paragraphs within the side panel UI, allowing the user to see the deconstructed content.

### The @ibgib/component Architecture in Detail

The Side Panel UI is built using a custom, `ibgib`-native component framework. Understanding its structure is key to modifying or extending the extension. It is composed of three primary concepts, which are defined in `apps/blank-gib/src/ui/component`.

#### 1. The Component Service (`ibgib-component-service.mts`)

This is a singleton service that manages the lifecycle of all UI components.

*   **Registry:** It maintains a list of all available component "blueprints" (`IbGibDynamicComponentMeta`). Components are registered with the service at application startup.
*   **Router:** Its primary job is to act as a router. The `getComponentInstance` method takes a path (like a URL) and an `ibGibAddr`, and it's responsible for finding the correct component to handle that request.
*   **Routing Logic:** It first performs a quick filter using a regular expression (`routeRegExp`) on the registered components. For the components that pass, it can then execute a more complex, asynchronous function (`fnHandleRoute`) to make the final decision.
*   **Injection:** Once a component instance is created, the service's `inject` method is used to place it into the DOM, replacing the content of a designated parent element.

#### 2. The Component "Blueprint" (`IbGibDynamicComponentMeta`)

This is a metadata or factory object that describes a component. It does **not** have a visual representation itself. The `sidepanel-component-one-file.mts` file contains a perfect example of this in the `SidepanelComponentMeta` class.

Its key properties are:
*   `componentName`: A string that defines the custom HTML tag for the component (e.g., `'ibgib-sidepanel'`). This is registered with the browser's `customElements` API.
*   `routeRegExp`: A regular expression used by the Component Service for fast, initial matching of a path.
*   `createInstance`: A factory method that the service calls to create a new instance of the component's `HTMLElement`.

#### 3. The Component Instance (`IbGibDynamicComponentInstance`)

This is the actual Web Component that extends `HTMLElement`. It is the visual and interactive part of the UI. The `SidepanelComponentInstance` class is a concrete example.

*   **Encapsulation:** Following the `-one-file.mts` pattern from the `STYLEGUIDE.md`, a component's TypeScript class, HTML template, and CSS styles are all imported into a single module. The `IbGibDynamicComponentInstanceBase` class then handles injecting the HTML and CSS into the component's Shadow DOM, ensuring complete encapsulation.
*   **Lifecycle:** It has a well-defined lifecycle, including `initialize` (to set up initial parameters), `connectedCallback` (when it's added to the DOM), and `created` (an async method for performing initial setup like finding elements and attaching event listeners).
*   **Data-Binding:** The instance is linked to its data via its `ibGibAddr`. The base class provides a `loadIbGib` method and sets up a `LiveProxyIbGib` (at `this.ibGibProxy`). This proxy automatically listens for updates to the underlying `ibgib`'s timeline and triggers handler methods (`handleContextUpdated`) on the component, enabling a reactive UI.


## Dev

* **Build Issues:** The esbuild system has to build itself first and then build the web app and extension targets. So if you change files, sometimes you have to execute the full `npm run build` and not just the `npm run build:ext`.

## hackathon rules

Though I intend to use this extension, it is somewhat driven in the short-term for a google hackathon. Here are the rules:

### rules

Google Chrome Built-in AI Challenge 2025 Official Rules

NO PURCHASE NECESSARY TO ENTER OR WIN. VOID WHERE PROHIBITED. CONTEST IS OPEN TO EVERYONE EXCEPT FOR RESIDENTS OF QUEBEC, CRIMEA, CUBA, IRAN, SYRIA, NORTH KOREA, SUDAN, BELARUS, RUSSIA, VIETNAM, AND THE SO-CALLED DONETSK PEOPLE’S REPUBLIC OR LUHANSK PEOPLE’S REPUBLIC.

ENTRY IN THIS CONTEST CONSTITUTES YOUR ACCEPTANCE OF THESE OFFICIAL RULES.

The Google Chrome Built-in AI Challenge 2025 (the “Contest”) is a skill contest where participants must develop a web application or Chrome Extension that uses one or more APIs to interact with Chrome’s built-in AI model, Gemini Nano. The APIs include but are not limited to the Prompt API for Web and in Chrome Extensions, Summarizer API, Writer API, Rewriter API, Translator API, and Proofreader API.  The application that you develop will be evaluated by judges, who will choose the winner(s) in accordance with these Official Rules.  The prize(s) will be awarded to entrant(s) with the highest score for the judging criteria. See below for the complete details.

1. BINDING AGREEMENT: In order to enter the Contest, you must agree to these Official Rules (“Rules”). Therefore, please read these Rules prior to entry to ensure you understand and agree. You agree that submission of an entry in the Contest constitutes agreement to these Rules. You may not submit an entry to the Contest and are not eligible to receive the prizes described in these Rules unless you agree to these Rules. These Rules form a binding legal agreement between you and Google with respect to the Contest.

2. ELIGIBILITY: To be eligible to enter the Contest, you must be: (1) above the age of majority in the country, state, province or jurisdiction of residence (or at least twenty years old in Taiwan) at the time of entry; (2) not a resident of Quebec, Crimea, Cuba, Iran, Syria, North Korea, Sudan, Belarus, Russia, Vietnam, or the so-called Donetsk People’s Republic or Luhansk People’s Republic; (3) not a person or entity under U.S. export controls or sanctions; and (4) have access to the Internet as of September 9, 2025. Contest is void in Quebec, Crimea, Cuba, Iran, Syria, North Korea, Sudan, Belarus, Russia, Vietnam, and the so-called Donetsk People’s Public or Luhansk People’s Republic, and where prohibited by law.  Employees, interns, contractors, and official office-holders of Google, Devpost, Inc., and their parent companies, subsidiaries, affiliates, and their respective directors, officers, employees, advertising and promotion agencies, representatives, and agents (“Contest Entities”), and members of the Contest Entities’ and their immediate families (parents, siblings, children, spouses, and life partners of each, regardless of where they live) and members of the households (whether related or not) of such employees, officers and directors are ineligible to participate in this Contest. Sponsor reserves the right to verify eligibility and to adjudicate on any dispute at any time.

If you are entering as part of a company or on behalf of your employer, these rules are binding on you, individually, and/or your employer.  If you are acting within the scope of your employment, as an employee, contractor, or agent of another party, you warrant that such party has full knowledge of your actions and has consented thereto, including your potential receipt of a prize.  You further warrant that your actions do not violate your employer’s or company’s policies and procedures.

3. SPONSOR: The Contest is sponsored by Google Inc. (“Google” or “Sponsor”), a Delaware corporation with principal place of business at 1600 Amphitheater Parkway, Mountain View, CA, 94043, USA.

4. ADMINISTRATOR: Devpost, Inc. (“Devpost”), 222 Broadway, Floor 19, New York, NY 10038

5. CONTEST PERIOD: The Contest begins at 09:00:00 A.M. Pacific Time (PT) Zone in the United States on September 9, 2025 and ends at 11:45:00 P.M. Pacific Time (PT) Zone on October 31, 2025 (“Contest Period”). ENTRANTS ARE RESPONSIBLE FOR DETERMINING THE CORRESPONDING TIME ZONE IN THEIR RESPECTIVE JURISDICTIONS.

Dates and Timing

Submission Period: September 9, 2025 (09:00 A.M. Pacific Time) – October 31, 2025 (11:45 P.M. Pacific Time) (“Submission Period”).

Feedback Period: September 9, 2025 (09:00 A.M. Pacific Time) – October 31, 2025 (11:45 P.M. Pacific Time) (“Feedback Period”).

Judging Period: November 3, 2025 (9:00 A.M. Pacific Time) – December 1, 2025 (11:45 P.M. Pacific Time) (“Judging Period”).

Winners Announced: On or around December 5, 2025 (10:00 A.M. Pacific Time).

6. HOW TO ENTER: NO PURCHASE NECESSARY TO ENTER OR WIN. To enter the Contest, visit the Contest website located at [googlechromeai2025.devpost.com] (“Contest Site”) during the Contest Period and follow the instructions for developing a web new application or Chrome Extension that uses one or more APIs to interact with Chrome’s built-in AI model, Gemini Nano.

The APIs include but are not limited to the Prompt API for Web and in Chrome Extensions, Summarizer API, Writer API, Rewriter API, Translator API, and Proofreader API.

Please find the Application Requirements and Submission Requirements outlined below (hereinafter, referred to collectively as the “Requirements”).

Application Requirements:

What to Create: Entrants must develop a new web application or Chrome Extension that uses one or more APIs to interact with Chrome’s built-in AI models, such as Gemini Nano.
The APIs include but are not limited to the Prompt API for Web and in Chrome Extensions, Summarizer API, Writer API, Rewriter API, Translator API, and Proofreader API.
Functionality: The Application must be capable of being successfully installed and running consistently on the platform for which it is intended and must function as depicted in the demonstration video and/or expressed in the text description.
Platforms: A submitted Application must run on the platform for which it is intended and which is specified in the Submission Requirements.
New Applications: Applications must be newly created by the entrant during the duration of the Contest Period.
Third Party Integrations: If an Application integrates any third-party SDK, APIs and/or data, entrants must be authorized to use them.
Testing: The entrant must make the Application available free of charge and without any restriction, for testing, evaluation and use by the Sponsor and Judges until the judging period ends.
If the Application includes software that runs on proprietary or third party hardware that is not widely available to the public, including software running on devices or wearable technology other than smartphones, tablets, or desktop computers, the Sponsor reserves the right, at its sole discretion, to require the entrant to provide physical access to the Application hardware upon request.

The Application must, at a minimum, support English language use.

Submission Requirements. Entries to the Contest must meet the following requirements:

Include an Application built with the required developer tools and meets the above Application Requirements.
Include a text description that should explain the features and functionality of your Application. Text description must also include which APIs were used, and the problem you are looking to solve.
Include a demonstration video of your Application. The video portion of the submission:
should be less than three (3) minutes
should include footage that shows the Application functioning on the device for which it was built
must be uploaded to and made publicly visible on YouTube or Vimeo, and a link to the video must be provided on the submission form on the Contest Site; and
cannot contain any content, element, or material that violates a third party’s publicity, privacy or intellectual property rights.
Include a URL to a public open source GitHub repository. The repository must include an open source license and should include instructions and everything the judges require to test the Application.
Access must be provided to an entrant’s working Application for judging and testing by providing a link to a website, functioning demo, or a published application. If Entrant’s website is private, Entrant must include login credentials in its testing instructions. The Application must be public.
Written and video parts of Entries must be in English.
(Optional) Share your feedback on the development process with these APIs. You must have submitted a project to complete a feedback submission form and be eligible for the Most Valuable Feedback Prize.
Most Valuable Feedback Submission

To be considered for the Most Valuable Feedback prize, entrants must have submitted an eligible entry to the hackathon during the Submission Period, which runs from September 9, 2025 (9:00 A.M. Pacific Time) through October 31, 2025 (11:45 P.M. Pacific Time).

Submission Modifications.

Draft Submissions: Prior to the end of the Contest Period, you may save draft versions of your submission on Devpost to your portfolio before submitting the submission materials to the Contest for evaluation. Once the Contest Period has ended, you may not make any changes or alterations to your submission, but you may continue to update the application in your Devpost portfolio.

Modifications After the Contest Period. The Sponsor and Administrator may permit you to modify part of your submission after the Contest Period for the purpose of adding, removing or replacing material that potentially infringes a third party mark or right, discloses personally identifiable information, or is otherwise inappropriate. The modified submission must remain substantively the same as the original submission with the only modification being what the Poster and Administrator permits.

At any time, and at its sole discretion, the Poster will have the ability to re-assign a submitted Submission from one Category to another or to disqualify a submission for not sufficiently fitting the Application or Submission Requirement.

All Entries must be received by 11:45:00 P.M., Pacific Time (PT) on  October 31, 2025.  Entries are void if they are in whole or part illegible, incomplete, damaged, altered, counterfeit, obtained through fraud, or late. All Entries will be deemed made by the authorized account holder of the email address submitted at the time of entry, and the potential winner may be required to show proof of being the authorized account holder for that email address. The "authorized account holder" is the natural person assigned to an email address by an Internet service provider, online service provider, or other organization responsible for assigning email address for the domain.

During the Contest Period, the Sponsor, its agents and/or the Judges (defined below) will be evaluating each Entry to ensure that it meets the Requirements.  The Sponsor reserves the right, in its sole discretion, to disqualify any entrant who submits an Entry that does not meet the Requirements.

7. JUDGING: Each entry will be judged by a panel of experts who are employees of Sponsor (“Judges”).  On or about November 3, 2025, each Entry will be evaluated by the Judges based on the following criteria:

Stage One: The first stage will determine via pass/fail whether the Entry meets a baseline level of viability, in that the Entry reasonably fits the theme and reasonably applies the required APIs/SDKs featured in the Contest.

Stage Two: All Entries that pass Stage One will be evaluated in Stage Two based on the following equally weighted criteria:

Functionality
How scalable is the application? How well are the APIs used within the project? Can it be used in other regions, or can it be used by more than one type of audience?
Purpose
Are you solving an existing problem in a compelling manner? Is it an application that would encourage a user to use it more than once for its benefits?
Content
How creative is the application? What’s the visual quality like?
User Experience
How well executed is the application? Is it easy to use and understand?
Technical Execution
How well are you showcasing 1 or more of the APIs powered by AI models built into Google Chrome?
Judges will evaluate and attribute a score to each Entry made up of scores based upon the above-listed criteria. The Entries that receive the highest overall scores will be selected as the potential winner(s). In the event of a tie, the Entry that received the higher score from the Judges in the category of “Purpose” will be selected as one of the potential winner(s).  In the event a potential winner is disqualified for any reason, the Entry that received the next highest total score will be chosen as the potential winner.

Most Valuable Feedback Submission:

Eligible Feedback Submissions will be evaluated based on the completeness, viability, and potential impact of the feedback and written description.

On or about December 5, 2025, the potential winner(s) will be selected and notified by telephone and/or email, at Sponsor’s discretion. If a potential winner does not respond to the notification attempt within [3] days from the first notification attempt, then such potential winner will be disqualified and an alternate potential winner will be selected from among all eligible entries received based on the judging criteria described herein. With respect to notification by telephone, such notification will be deemed given when the potential winner engages in a live conversation with Sponsor or when a message is left on the potential winner’s voicemail service or answering machine by the Sponsor, whichever occurs first. Except where prohibited by law, each potential winner may be required to sign and return a Declaration of Eligibility and Liability and Publicity Release and provide any additional information that may be required by Sponsor.  If required, potential winners must return all such required documents within [5] days following attempted notification or such potential winner will be deemed to have forfeited the prize and another potential winner will be selected based on the judging criteria described herein. All notification requirements, as well as other requirements within these Rules, will be strictly enforced.

In the event that no Entries are received, no prize will be awarded.  Determinations of judges are final and binding.

8. PRIZES: The following Prizes will be awarded:


Prize

Prize

Quantity

Description

Track 1: Chrome Extensions

Most helpful

$14,000 USD

Promotion of winning project subject to Google’s discretion

Virtual coffee chat with Chrome team member

1

The ‘Most Innovative’ Chrome Extension pushes the boundaries by redefining expectations of what was previously thought possible. It sparks excitement and helps set the stage for the next wave of technological advancement.

Best multimodal AI application

$9,000 USD

Promotion of winning project subject to Google’s discretion

Virtual coffee chat with Chrome team member

1

The ‘Best multimodal AI application’ uses the Prompt API with multimodal capabilities to create a Chrome Extension with audio and/or image inputs. It effectively addresses a significant need or problem by combining practicality, usability, and technological excellence to deliver meaningful value to its users.

Best hybrid AI application

$9,000 USD

Promotion of winning project subject to Google’s discretion

Virtual coffee chat with Chrome team member

1

The Chrome Extension with the ‘Best Hybrid AI Application’ seamlessly integrates client-side and server-side AI capabilities using the Firebase AI Logic or Gemini Developer API. There is a clear reason why the Chrome Extension benefits from a hybrid AI approach, and the extension helps address a significant need or problem.

Track 2: Web Applications


Most helpful

$14,000 USD

Promotion of winning project subject to Google’s discretion

Virtual coffee chat with Chrome team member

1

The ‘Most Innovative’ Web Application pushes the boundaries by redefining expectations of what was previously thought possible. It sparks excitement and helps set the stage for the next wave of technological advancement.

Best multimodal AI application

$9,000 USD

Promotion of winning project subject to Google’s discretion

Virtual coffee chat with Chrome team member

1

The ‘Best multimodal AI application’ uses the Prompt API with multimodal capabilities to create a Web Application with audio and/or image inputs. It effectively addresses a significant need or problem by combining practicality, usability, and technological excellence to deliver meaningful value to its users

Best hybrid AI application

$9,000 USD

Promotion of winning project subject to Google’s discretion

Virtual coffee chat with Chrome team member

1

The Web Application with the ‘Best Hybrid AI Application’ seamlessly integrates client-side and server-side AI capabilities using the Firebase AI Logic or Gemini Developer API. There is a clear reason why the Chrome Extension benefits from a hybrid AI approach, and the extension helps address a significant need or problem.

Odds of winning any prize depends on the number of eligible entries received during the Contest Period and the skill of the entrants.  The prizes will be awarded within approximately 8 weeks of receipt by Sponsor of final prize acceptance documents.  No transfer, substitution or cash equivalent for prizes is allowed, except at Sponsor’s sole discretion. Sponsor reserves the right to substitute a prize, in whole or in part, of equal or greater monetary value if a prize cannot be awarded, in whole or in part, as described for any reason.  Value is subject to market conditions, which can fluctuate and any difference between actual market value and ARV will not be awarded. The prize(s) may be subject to restrictions and/or licenses and may require additional hardware, software, service, or maintenance to use. The winner shall bear all responsibility for use of the prize(s) in compliance with any conditions imposed by such manufacturer(s), and any additional costs associated with its use, service, or maintenance. Contest Entities have not made and Contest Entities are not responsible in any manner for any warranties, representations, or guarantees, express or implied, in fact or law, relating to the prize(s), regarding the use, value or enjoyment of the prize(s), including, without limitation, its quality, mechanical condition, merchantability, or fitness for a particular purpose, with the exception of any standard manufacturer's warranty that may apply to the prize or any components thereto.

Verification Requirement: THE AWARD OF A PRIZE TO A POTENTIAL WINNER IS SUBJECT TO VERIFICATION OF THE IDENTITY, QUALIFICATIONS AND ROLE OF THE POTENTIAL WINNER IN THE CREATION OF THE SUBMISSION. No submission or submitter shall be deemed a winning entry or winner until their post-competition prize affidavits have been completed and verified, even if prospective winners have been announced verbally or on the competition website. The final decision to designate a winner shall be made by the Sponsor and/or Administrator.

Prize Delivery: Prizes will be payable to the Entrant, if an individual; to the Entrant’s Representative, if a Team; or to the Organization, if the Entrant is an Organization. It will be the responsibility of the winning Entrant’s Representative to allocate the Prize among their Team or Organization’s participating members, as the Representative deems appropriate. A monetary Prize will be mailed to the winning Entrant’s address (if an individual) or the Representative’s address (if a Team or Organization), or sent electronically to the Entrant, Entrant’s Representative, or Organization’s bank account, only after receipt of the completed winner affidavit and other required forms (collectively the “Required Forms”), if applicable. Failure to provide correct information on the Required Forms, or other correct information required for the delivery of a Prize, may result in delayed Prize delivery, disqualification or the Entrant, or forfeiture of a Prize. Prizes will be delivered within 60 days of the Sponsor or Devpost’s receipt of the completed Required Forms.

9. TAXES: PAYMENTS TO POTENTIAL WINNERS ARE SUBJECT TO THE EXPRESS REQUIREMENT THAT THEY SUBMIT TO GOOGLE ALL DOCUMENTATION REQUESTED BY GOOGLE TO PERMIT IT TO COMPLY WITH ALL APPLICABLE STATE, FEDERAL, LOCAL, PROVINCIAL AND FOREIGN TAX REPORTING AND WITHHOLDING REQUIREMENTS. ALL PRIZES WILL BE NET OF ANY TAXES GOOGLE IS REQUIRED BY LAW TO WITHHOLD. ALL TAXES IMPOSED ON PRIZES ARE THE SOLE RESPONSIBILITY OF THE WINNERS. In order to receive a prize, potential winners must submit the tax documentation requested by Google or otherwise required by applicable law, to Google or the relevant tax authority, all as determined by applicable law, including, where relevant, the law of the potential winner’s country of residence. Each potential winner is responsible for ensuring that (s)he complies with all the applicable tax laws and filing requirements. If a potential winner fails to provide such documentation or comply with such laws, the prize may be forfeited and Google may, in its sole discretion, select an alternative potential winner.

Winners (and in the case of Team or Organization, all participating members) are responsible for any fees associated with receiving or using a prize, including but not limited to, wiring fees or currency exchange fees. Winners (and in the case of Team or Organization, all participating members) are responsible for reporting and paying all applicable taxes in their jurisdiction of residence (federal, state/provincial/territorial and local). The Sponsor, Devpost, and/or Prize provider reserves the right to withhold a portion of the prize amount to comply with the tax laws of the United States or other sponsor jurisdiction, or those of a winner’s jurisdiction.

10. GENERAL CONDITIONS:  All federal, state, provincial and local laws and regulations apply.  Google reserves the right to disqualify any entrant from the Contest if, in Google’s sole discretion, it reasonably believes that the entrant has attempted to undermine the legitimate operation of the Contest by cheating, deception, or other unfair playing practices or annoys, abuses, threatens or harasses any other entrants, Google, or the Judges.

11. INTELLECTUAL PROPERTY RIGHTS: By submitting an Entry in this Contest, the entrant warrants and represents that (s)he owns all of the intellectual and industrial property rights in and to the Entry.  Further, the entrant agrees that if any portion of the Entry should be deemed to be owned by the entrant that (s)he will, as a condition of entry, grant Google a perpetual, irrevocable, worldwide, royalty-free, and non-exclusive license to use, reproduce, publicly perform, publicly display and create a derivative work from, any Entry that entrant submits solely for the purposes of allowing Google to test and evaluate the Entry for purposes of the Contest and to advertise, display, demonstrate, or otherwise promote the Contest. Entrant specifically agrees that Google shall have the right to use, reproduce, publicly perform, and publicly display the Entry in connection with the advertising and promotion of the Contest via communication to the public or other groups, including, but not limited to the right to make screenshots, animations and video clips available for promotional purposes.

12. PRIVACY: Entrant acknowledges and agrees that Google may collect, store, share and otherwise use personally identifiable information provided during the registration process and the contest, including, but not limited to, name, mailing address, phone number, and email address. Google will use this information in accordance with its Privacy Policy (http://www.google.com/policies/privacy/), including for administering the contest and verifying Participant’s identity, postal address and telephone number in the event an entry qualifies for a prize.

Entrant’s information may also be transferred to countries outside the country of entrant's residence, including the United States.  Such other countries may not have privacy laws and regulations similar to those of the country of entrant’s residence.

If an entrant does not provide the mandatory data required at registration, Google reserves the right to disqualify the Entry.

Participants have the right to request access, review, rectification or deletion of any personal data held by Google in connection with the Contest by writing to Google at this email address bradfordlee@google.com.

Information collected from Entrants is also subject to the Devpost’s Privacy Policy, which is available at https://info.devpost.com/privacy. For questions, send an email to support@devpost.com.

13.  PUBLICITY.  By accepting a prize, entrant agrees to Sponsor and its agencies use of his or her name and/or likeness and Entry for advertising and promotional purposes without additional compensation, unless prohibited by law.

14. WARRANTY, INDEMNITY AND RELEASE: Entrants warrant that their Entries are their own original work and, as such, they are the sole and exclusive owner and rights holder of the submitted Entry and that they have the right to submit the Entry in the Contest and grant all required licenses.  Each entrant agrees not to submit any Entry that (1) infringes any third party proprietary rights, intellectual property rights, industrial property rights, personal or moral rights or any other rights, including without limitation, copyright, trademark, patent, trade secret, privacy, publicity or confidentiality obligations; or (2) otherwise violates the applicable state or federal law.

To the maximum extent permitted by law, each entrant indemnifies and agrees to keep indemnified Contest Entities at all times from and against any liability, claims, demands, losses, damages, costs and expenses resulting from any act, default or omission of the entrant and/or a breach of any warranty set forth herein. To the maximum extent permitted by law, each entrant agrees to defend, indemnify and hold harmless the Contest Entities from and against any and all claims, actions, suits or proceedings, as well as any and all losses, liabilities, damages, costs and expenses (including reasonable attorneys fees) arising out of or accruing from (a) any Entry or other material uploaded or otherwise provided by the entrant that infringes any copyright, trademark, trade secret, trade dress, patent or other intellectual property right of any person or defames any person or violates their rights of publicity or privacy, (b) any misrepresentation made by the entrant in connection with the Contest; (c) any non-compliance by the entrant with these Rules; (d) claims brought by persons or entities other than the parties to these Rules arising from or related to the entrant’s involvement with the Contest; and (e) acceptance, possession, misuse or use of any prize or participation in any Contest-related activity or participation in this Contest.

Entrant releases Google from any liability associated with: (a) any malfunction or other problem with the Contest Site; (b) any error in the collection, processing, or retention of entry information; or (c) any typographical or other error in the printing, offering or announcement of any prize or winners.

15. ELIMINATION: Any false information provided within the context of the Contest by any entrant concerning identity, mailing address, telephone number, email address, ownership of right or non-compliance with these Rules or the like may result in the immediate elimination of the entrant from the Contest.

16. INTERNET: Contest Entities are not responsible for any malfunction of the entire Contest Site or any late, lost, damaged, misdirected, incomplete, illegible, undeliverable, or destroyed Entries due to system errors, failed, incomplete or garbled computer or other telecommunication transmission malfunctions, hardware or software failures of any kind, lost or unavailable network connections, typographical or system/human errors and failures, technical malfunction(s) of any telephone network or lines, cable connections, satellite transmissions, servers or providers, or computer equipment, traffic congestion on the Internet or at the Contest Site, or any combination thereof, including other telecommunication, cable, digital or satellite malfunctions which may limit an entrant’s ability to participate.

17.  RIGHT TO CANCEL, MODIFY OR DISQUALIFY.  If for any reason the Contest is not capable of running as planned, including infection by computer virus, bugs, tampering, unauthorized intervention, fraud, technical failures, or any other causes which corrupt or affect the administration, security, fairness, integrity, or proper conduct of the Contest, Google reserves the right at its sole discretion to cancel, terminate, modify or suspend the Contest. Google further reserves the right to disqualify any entrant who tampers with the submission process or any other part of the Contest or Contest Site.  Any attempt by an entrant to deliberately damage any web site, including the Contest Site, or undermine the legitimate operation of the Contest is a violation of criminal and civil laws and should such an attempt be made, Google reserves the right to seek damages from any such entrant to the fullest extent of the applicable law.

18. NOT AN OFFER OR CONTRACT OF EMPLOYMENT: Under no circumstances shall the submission of a Entry into the Contest, the awarding of a prize, or anything in these Rules be construed as an offer or contract of employment with either Google, or the Contest Entities. You acknowledge that you have submitted your Entry voluntarily and not in confidence or in trust. You acknowledge that no confidential, fiduciary, agency or other relationship or implied-in-fact contract now exists between you and Google or the Contest Entities and that no such relationship is established by your submission of an Entry under these Rules.

19. FORUM AND RECOURSE TO JUDICIAL PROCEDURES: These Rules shall be governed by, subject to, and construed in accordance with the laws of the State of California, United States of America, excluding all conflict of law rules. If any provision(s) of these Rules are held to be invalid or unenforceable, all remaining provisions hereof will remain in full force and effect. To the extent permitted by law, the rights to litigate, seek injunctive relief or make any other recourse to judicial or any other procedure in case of disputes or claims resulting from or in connection with this Contest are hereby excluded, and all Participants expressly waive any and all such rights.

20. ARBITRATION: By entering the Contest, you agree that exclusive jurisdiction for any dispute, claim, or demand related in any way to the Contest will be decided by binding arbitration. All disputes between you and Google of whatsoever kind or nature arising out of these Rules, shall be submitted to Judicial Arbitration and Mediation Services, Inc. (“JAMS”) for binding arbitration under its rules then in effect in the San Jose, California, USA area, before one arbitrator to be mutually agreed upon by both parties. The parties agree to share equally in the arbitration costs incurred.

21. WINNER’S LIST: You may request a list of winners after January 13, 2025 but before June 13, 2025 by sending a self addressed stamped envelope to:

Bradford Lee

1600 Amphitheater Parkway

Mountain View, CA 94043



(Residents of Vermont need not supply postage).



22. Please review the Devpost Terms of Service at https://info.devpost.com/terms for additional rules that apply to your participation in the Hackathon and more generally your use of the Contest Website. Such Terms of Service are incorporated by reference into these Official Rules, including that the term "Poster" in the Terms of Service shall mean the same as "Sponsor" in these Official rules." If there is a conflict between the Terms of Service and these Official Rules, these Official Rules shall control with respect to this Contest only.
