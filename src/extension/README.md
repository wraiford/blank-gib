# extension-gib - A Dynamic Table of Contents for the Web

## Overview

`ibgib` is a Chrome Extension that acts as a "living map" for any webpage. It uses Chrome's built-in, on-device AI to help you digest long articles and complex information by transforming content into a dynamic and interactive table of contents.

It is designed to aid users in understanding content by breaking down pages into semantic chunks and providing a simple interface for "too long; didn't read" (tldr) summaries.

## Features

*   **Dynamic Table of Contents**: Automatically generates a hierarchical outline of any webpage's content.
*   **Semantic Chunking**: Uses AI to break down long text into smaller, meaningful sections.
*   **On-Demand Summaries**: Provides TL;DR summaries for content chunks.
*   **Content Highlighting**: Click the highlight button to visually mark a section and all of its sub-sections on the original page.
*   **Local-First AI**: All processing is done on-device using Chrome's built-in Gemini Nano model, ensuring your data remains private and secure.

## Prerequisites: Enable Chrome's Built-in AI

For the extension to function, you must enable the necessary feature flags in Chrome.

1.  Open Chrome and navigate to `chrome://flags`.
2.  Find and **Enable** the following flags:
    *   `#prompt-api-for-gemini-nano`
    *   `#optimization-guide-on-device-model`
3.  Relaunch Chrome for the changes to take effect.

## Setup and Installation

1.  Clone the repository.
2.  Install the dependencies:
    ```sh
    npm install
    ```
3.  To build the extension:
    ```sh
    npm run build:ext
    ```
    * _note: this will first compile the build scripts and then build both blank-gib app into `dist` and the extension into `dist-ext`_
4.  Open Chrome and navigate to `chrome://extensions`.
5.  Enable **Developer mode** in the top-right corner.
6.  Click **Load unpacked**.
7.  Select the `apps/blank-gib/dist-ext` directory from within the project.

## How to Use

1.  Navigate to a text-heavy webpage (e.g., wikipedia, a news article, a long blog post).
2.  Open the extension's side panel.
3.  Click the **Begin** button.
4.  The side panel will populate with a raw hierarchical table of contents generated from the page.
5.  Follow the highlighted instructions, proceeding with clicking the right arrow emoji button.
6.  Once you've gotten to the Phase 4: Digest, you can click the items and expand them to see any children.
7.  Click the **TLDR** button and then **Short** or **Long** to generate a summary for that specific section. The length of time depends on the size of text and your machine.
8.  Click the **Highlight** button to toggle a visual highlight for that section and all of its children on the main webpage.

## How It Works

### Content Parsing and Chunking

The semantic chunking process works in several phases:

1.  **Content Discovery**: First, the extension analyzes the page's DOM to locate candidate elements that might contain the main article or content.
2.  **DOM Mapping**: It selects the best candidate and maps it to a simpler, intermediate DOM representation. Each element in this representation is tagged with a unique data attribute, creating a "twin" of the original content that is easier to parse.
3.  **Semantic Analysis**: The extension then does its best to semantically chunk this simplified tree. The primary strategy involves parsing header tags (`<h1>`, `<h2>`, etc.) to build a hierarchy. This initial implementation was explicitly targeted to work well with Wikipedia articles and the hackathon's rules page, but the architecture allows for adding more sophisticated chunking strategies in the future.

### Data & UI Architecture

Once the content is chunked, it is mapped to `ibgib` data structures. The UI is built on a custom component architecture that is analogous to a React+Redux pattern but with some unique characteristics:

*   **Web Components**: The architecture is built on native Web Components, ensuring encapsulation and interoperability.
*   **ibgib Data Model**: Each component is a visual representation of an `ibgib` data structure. `ibgib` is a novel DLT-based data model that acts like "git for data," providing a complete, auditable history for every piece of information.

### AI Integration

*   **Summarizer API**: The TL;DR summary feature is powered by the built-in `Summarizer API`.
*   **Future Work**: The plan was to integrate additional APIs for more advanced features, but this was deferred due to time constraints.

## Thanks

This extension was developed with significant assistance from Google's suite of AI-powered tools. Special thanks to:

*   **Firebase Studio**: The AI-assisted IDE was invaluable for generating code, running terminal commands, and providing contextual code suggestions throughout the development process.
*   **AI Studio & Gemini**: The underlying intelligence of Gemini, exposed through AI Studio, helped with prototyping, architecting, and building out many facets of the extension.
