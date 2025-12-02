# blank-gib - CHANGELOG

I'm begrudgingly starting this changelog file in lieu of having ibgib itself for
versioning and meta-versioning. So this will be a manual set of notes of what
I'm doing per upgrade. This should be automatically created per "commit", and
really this should just be a regular part of the "chat" that is this project.
We'll get there eventually!

## v0.15.12
* progress: keystone respecs passing Suite A - D
  * still working on low level improvements
  * stopping now at the point before breaking out validate code to also
    include validating individual frame and validating the entire keystone
    graph/timeline intrinsically.


## v0.15.10
* progress: testing for keystone mechanics
  * innerspace and metaspace_innerspace still not functional for testing
    * I think it has something to do with needing singletons for space ibgibs,
      which is a non-trivial problem (for any singleton ibgib)
  * using a mock metaspace and space, seems to be working okay
  * Suite A and B tests are passing
  * Currently working on Suite C which is failing. We are moving to a better
    validation function that will provide validation errors instead of an
    opaque boolean.

## v0.15.6
* impl: upgraded build to handle respec-gib testing
  * npm run test did not work, as this was still configured for the simpler
    pre-esbuild build process.
  * added build-test.mts as esbuild target and tsconfig
* progress: keystone plumbing
  * restarting bottom up keystone with Gemini 3.0 collab
    * https://aistudio.google.com/prompts/1-Itqn0afYpgnm-ajEID8Mv0SAHii7OBY
    * largely me driving higher level and getting Gemini 3.0 up-to-speed on
      understanding the architecture enabled by the ibgib protocol, with Gemini
      iterating on implementation details.
    * the factory style approach was Gemini's idea, which is a good tactical
      decision IMO
    * deferring refactoring most names until after, as that causes hiccups with
      LLMs
  * doing in blank-gib/keystone for now for ease of development
    * this was the driver to get the testing working for blank-gib using the new
      esbuild process
* meta: iterating styleguide
  * using entire styleguide as part of system text for Gemini in Google's AI
    Studio

## v0.15.3

* **Refactor: Rabbit Hole Comment Architecture**
  * Changed details views to toggle-based. Now you can see tldr AND translation AND key points.
  * Overhauled the component to use a consistent, template-based system for all detail views (TLDR, Translate, Key Points).
  * Views are now created dynamically on-demand, improving initial render performance.
* **Fix: collapsed `ul`/`ol` tags**
  * Short list tags were getting collapsed and losing navigation.

## v0.15.2

* **Feature: In-App Translation**
  * Integrated the built-in Chrome `Translator` and `LanguageDetector` APIs.
  * Added a "Translate" button and language selection dropdown to each comment component.
  * The source language is now auto-detected and hidden from the target language list.
  * Translations are performed on-device and saved to the comment's `ibGib` data for persistence.
* **Refactor: Component Logic**
  * Refactored the `switchToView` method into smaller, more manageable sub-methods (`switchToView_children`, `switchToView_summary`, `switchToView_translation`).
  * Created new helper functions (`getTranslationTextKeyForIbGib`) to handle complex data key generation, preventing parsing issues with underscores.

## v0.15.1

* working on extension for hackathon built-in AI from google
* changed generate-version-file.js from using `assert` to `with` in import
  statement.
  * this was due to a node build warning saying that `assert` was being
    deprecated.

## v0.14.1

* refactored to esbuild
  * had to tweak component architecture a bit
    * no more dynamic JIT loading of css and html, now these are AOT
  * esbuild config to not mangle names (`keepNames: true`)

## v0.13.1

* backing up before trying to migrate to esbuild
  * for perf reasons
  * also to get the app to work in chrome web extensions, which don't currently
    support import maps.
* not sure the other changes before this version, but I believe they were minor
  adjustments and I was publishing them to ibgib.com (thus the version
  increments).

## v0.8.1

* parrot, fill-in-the-blank (fitb), and translate added to stimulus and gameplay
  * all extremely rough, and it's been slooooooow going.
  * moving variant from the game itself to each of the stimuli
  * hard-instantiation of fitb entries right now, but need to do dynamic ones
  * only superficially tested, but it's been so long I'm throwing it up there
    and going to test it out on my own real-world data.
    * this reminds me, I don't truly have a migrate functionality, so we'll see
      how that goes eessh

## v0.7.1

* simple metronome implemented
* display version on bootstrap

## v0.6.1

* working on divergent agents among other bugs
* deprecated functions are now just checked at runtime instead of mutated within the agent
  * until the agent divergence issue is resolved, then we can go back to pruning them "properly".

## v0.4.1

* chat active tab and persist open tabs per project in chronologys panel
  are working now.
  * had to correct some of the shared plumbing for ParentOfTabs components.
  * still need to migrate over the projects to include closing tabs, but this is
    good enough for now.
* next up is focusing on manually creating a pipeline for learning source text.

## v0.3.1

* chat active tab
* persist open tabs per project in chronologys panel
  * still buggy but hey, there ya go

## v0.2.1

* improvements to the editing of minigames
  * can add multiple lines at once now
  * can open quick link to google translate with all stimuli text.

## v0.1.1

* implemented manual text minigame creation/editing
* NOTE: I'm starting to change the minor version number when I intend to publish
  to the internet, instead of just publishing pkg to npm.

## v0.0.98

* implemented timer
  * like most things, is a sketch
  * really highlights the transience of a minigame. we have to walk the entire
    history of the minigame ibgib timeline to get "instances" of minigames. This
    is a poor design, but it's what I got right now.
  * at the very least, the little numbers increment while playing and not while
    paused, although the stats shown at the end of the game have an elapsedMs
    that does not account for pauses.
* implemented edit stimuli on minigame
  * "deprecated" the existing addStimuli api function.
  * had to implement prune stage for agents when loading when there is a
    deprecated function
  * there is some race condition in the agent's timeline that existed in testing
    for this. the only difference in the agent is timestampMs.
    * I went ahead and just console.warned when there is a divergent timeline
      for the agent instead of throwing an error. probably have downstream
      effects, but there ya go, I'm all alone here. Nobody else using it and no
      one else damn sure developing.
  * did basic testing on add, insert, edit and delete stimuli, i.e, not
    extensive. it looks like it's working and that the agent knows how to use
    it.

## v0.0.95

* tweaked new project to enter name of new project
  * meant to obviate issues with renaming the project with agents.

## v0.0.93

* converted left panel projects to projects-explorer
  * filter projects

## v0.0.91

* Config button added to the shell's header
  * initial button for clearing/setting (and reading a mask of) the Gemini API
    key implemented. Now you can see the masked API key, clear it, and update
    it.

## v0.0.88

* CorpusAnalyzer in the works
  * collab with Gemini 2.5 Pro
  * started with analyzeText to build a TfIdfCorpus class
    * does TF-IDF stuff on text, normal stuff
  * Moved on to AnalysisEngine
    * abstracted the concept of a "word" to a "construct" (λόγος), to enable
      "words" that represent regex-able concepts such as separable verbs for
      german, dative prepositions, etc.
    * so now we can TF-IDF and other analyses on texts using text-based
      `ConstructRule`
      * name, description, pattern props - all strings
    * this means...
      * we can encapsulate higher-order concepts (`ConstructRule.pattern` is
        composable) using ibgibs themselves.
      * agents can evolve rules at runtime as needed, persist them, share them,
        etc., without having to recompile.
      * TF-IDF and other analyses can be built against these constructs
    * limited testing done on German, Italian, Spanish, and Koine Greek, but all
      "tests" passing.
      * need to eventually turn these to proper unit/integration tests
  * `CorpusAnalyzer` is the resulting abstraction that wraps the
    `AnalysisEngine`
    * Need to write code that consumes `CorpusAnalyzer` in...
      * typing game component
      * APIFunctionInfo for use by agents

## v0.0.86

* Minigames are "working", albeit on the bare side.
* Project agents can now change the theming (updateCSSVariables function)
* Added a blog entry on the new ai-theming and project functionality
* Raw view update to enable accordions with summary, separate ib/gib/data/rel8ns
  sections
  * Rel8ns now enable navigation, i.e., opening the ibgib as an open tab in the
    project's center panel.

## v0.0.69

* WIP :under_construction: working on typing/minigame architecture
  * leaving off having stubbed minigame and typing components, some of the
    ibgibs themselves, but nothing remotely finished.
    * juuuust sketched the typing component. the idea is that the minigame
      component will inject the typing component. other variants of the typing
      component may be contained in descending classes or just within that
      component. i dunno, need a break.
* WIP :under_construction: already did some plumbing on import, but ran into the
  realization that this is essentially a timeline merge/sync and thus is
  non-trivial. is probably a good place to incorporate sync from AWS sync space
  to just be able to work with a local space.

## v0.0.64

* Export (NO import yet) implemented.
  * export project, active ibgib tab, each with or without compression.
  * import will be next
* Stopgap hack to restore the most recent theme (i.e. css variables) on app
  init.
* some UI tweaks.

## v0.0.60

* "Files" and persistence "working"!
  * Project settings are implemented to where the activeTjpAddr (active tab)
    is saved, as well as open tabs (also by their tjpAddrs).
* getIbgibs, mut8IbGib, editProject, editText commands are implemented for
  project agent.
  * getIbGibs enables the project agent to get multiple ibgibs, e.g. all ibgibs
    in the project's "past" rel8nName.
    * also has a getLatest flag
  * mut8IbGib enables agents to do fancier (but riskier) mutations on an
    ibgib/timeline.
  * editProject gives a simpler interface to editing a project
    * does things like mutating the project's ib field when the data.name is
      edited, as well as takes care of timestamps.
  * editText similarly gives a simpler facade to editing comment/text ibgibs.
    * used by the text-editor
* text-editor component has a debounced saving mechanism now.

## v0.0.55/56

* saving text-editor text via debounce (ty Gemini)
  * also small busy indicator when this is happening.
* need to fill out the UIinfo settings.

## v0.0.54

* just confirmed the refactored code is working. now we have generalized code
  that can couple local ibgibs with domain ibgibs. this is what we will use
  to couple local settings to the project ibgibs (and project child ibgibs).
  * specifically, project ibgibs will need some persistence as to what tabs are
    open, and what components are representing the ibgibs in those tabs. This is
    related to my UXInfo or UIInfo data, and the beginnings of our SettingsIbGib_V1.
    and this is what I am leaving off at.

## v0.0.53

* working on generalizing agent indexing to a "coupled" index.
  * the use case is to also have "settings" objects that will remember settings.
  * the driving "settings" config is for remembering what UI component is open for
    a given project child ibgib.
* project component much improved
  * lens bar
    * raw and text-editor components are sketched somewhat

## v0.0.43/44

* working on correcting bugs caused by brittle special ibgib index updating.
  * the (proximal) problem is that we're updating the agent index special ibgib
    too quickly in multiple calls. So we're getting divergent timelines.
  * so i'm reworking to use the command service in order to ensure that we have
    updates to special ibgib indexes happening serially and not in parallel.
    basically this is using the commanding service act as a poor man's critical
    section. it still won't defend against multiple tabs, but that is for
    another (more highly funded) time.
  * one of the ways I'm doing this is by enabling anonymous function commands.
  * I'm adding `anonApiFn?: APIFunctionInfo<any>;` to `EnqueuedCommand` and a
    command helper `commandifyAnonFn`
* timeline-api starting dev...

## v0.0.30-40

* Context ibgib workflow is working...
  * for the web 1.0 agent
  * a bit for project agents
  * By this, I mean that no longer do we do the naive chat with an agent,
    rather, agents subscribe to contexts and react to new ibgibs published to
    the metaspace pubsub. This is a huge improvement architecturally. HUGE.
* Need to start working on project ibgibs actually doing something.
* Need to persist more projects. possibly start using tags.

## v0.0.30

* in progress: hooking up agent with context ibgib instead of chat log kluge.
  * I had to refactor a bit to avoid circular references.
  * Now agents can be gotten from the agents service by the agent id.
  * tell user command and hello world command are up and going somewhat.
  * the hello world mutates the agent's data for the name.
  * when web 1 component is initialized, it sets the active context of the
    primary agent.
    * project agent yet to be done.
  * tell user implementation not done.
  * agent is not hooked up to context changes yet (wrt pubsub)


## v0.0.27

* chronology now showing the correct child
* very slow initialization, hard to tell right now.
  * commented on idx forum, may have to transition.
  * https://community.firebasestudio.dev/t/extremely-sluggish/10502/5?u=ibgib
* need to get tab color working
* need to associate user with addlmetadatatext on the comment, also
  timestampinticks
* chronologys should initialize children with existing children in addition to
  handling new children coming down the pipe.
  * probably should have ibgibs backing it or possibly entire components, hard
    to tell. (currently i am just throwing up a chat entry like the original
    chat log kluge)

## v0.0.23-26

* working on chronology (chat log)
  * in the middle of getting web1 functionality back to "working". of course,
    the chat log as a previous kluge that we are now fixing. the web1 component
    creates its own ibgib context now per session (via global storage). after init
    that as a live proxy, it inits the input to use it and the chronology on the right
    as well. the input now relates a comment ibgib to that context.
  * I'm leaving off where I need to hook up a new child to the context in the
    web component to propagating to the agent. Then I need to continue with the
    chronology showing the chat, including these newly added comments.

## v0.0.22

* corrected some agent initialization and input bugs. seems to be working better.

## v0.0.21

* created an "agentsSvc" singleton that treats each agent (witness) as a
  singleton service. It _seems_ to be working, but we'll see. At the very least
  I'm able to just chat with the website again, as well as change the theme.

## v0.0.20

* changed to input component
  * working on breaking out more agents.
    * still working on this. the primary agent is now kind of a website agent.
      But for some reason the agent doesn't have those system instructions that
      describe the ibgib protocol, website, etc.
  * UI init changes for drawing the eye better and more formalized
    * leaving off before changing the asides. I should script those asides with
      highlights I think.

## v0.0.13

* added dynamic theming backed by agent
  * still need to fill out more css variables
* ibgib projects
  * instead of the raw ai canvas
  * work in progress (incomplete)
  * created project api command related things but created a dependency order error.

## v0.0.12

* first funding! added some info to the funding page.
* Added blog and faq
* tweaking layouts/css
* path renderable improved
* added quite a bit of instructions for interacting with the primary agent.
  * anticipating users chatting with the agent about the protocol and the
    website.
* other things as well.
  * will have an ai look at diffs when ibgib versioning going, which will be
  * easier with ibgib vs git IMO, but we'll see.

## v0.0.8/9

* path renderable implementation started.

## v0.0.7

* simple send button for input textareas for agents

## v0.0.6

* fixed the pesky "race condition" of indexed db storage initialization.
  * was due to a logical error on my part when calling an inner
    `initializeStorage`. I had to explicitly call db.close, as a final db.close
    was not sufficient for the outer function, `storageCreateStoreIfNotExist`.
* fixed db.close errors throughout the storage helper functions.
* refactored storage functions into a separate file outside of the more general
  `helpers.web.mts`.

## v0.0.5

* I'm making the default local user space have an automatically-created space name to avoid prompting the user for the space name.
  * This is due to the prompt dialog screwing up the first user first land on
    ibgib.com experience. I want the user's eye to be drawn to the aside on the
    home.html component.
* I've added some plumbing to make the bootstrapping of the blank gib app idempotent.
  * This was in thinking that we may try to bootstrap later, but with the
    auto-local space naming, i'm holding off on this.
