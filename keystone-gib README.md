# keystone-gib

"Keystones" are a new ibgib-specific identity mechanism that leverages ibgib's unique Merkle-based DLT structure. These combine the aspect of the general CS concept of a "key" with the ibgib concept of a "stone", i.e., a non-living entity without `dna`.

## ibgib and keystones - how identity propagates through spacetime

To understand Keystones, you must understand the environment they live in. ibgib is a **Spacetime Distributed Ledger**. Data does not just "exist"; it propagates through **Spaces** (persistence layers like local storage, cloud nodes, or p2p relays).

In this universe, data falls into two categories based on how it handles time:

1.  **"Living" Data:** These ibgibs have `dna` relations pointing to the transforms (mutations) that created them. They behave like CRDTs (Conflict-free Replicated Data Types) and can be merged, forked, and reconciled across different timelines.
2.  **"Stones":** These are ibgibs **without** `dna`. They are fixed points in the causal graph. They do not merge; they only accrete. They are effectively constants.

A **Keystone** is a "Stone". It is an identity timeline (a graph of ibgib frames) that must remain historically intact to be valid. It does not support CRDT-style merging.

*   **Validation is Replay:** In traditional PKI, a Certificate Authority (CA) acts as a centralized trust anchor to establish a secure channel. In ibgib, validation is **Auditability**. To verify an identity (e.g., "Is this Alice?"), one "replays" the Keystone timeline from its Genesis to the current Frame, verifying the cryptographic proofs at every step.
*   **Propagation as Witnessing:** When a Keystone Frame is transmitted from Alice's Space to Bob's Space, Bob "witnesses" it. By accepting it into his Space, he effectively votes on its validity. If it is invalid, it is rejected and does not propagate.

## principles

### DRY - leverage the ubiquity of ibgib's already-existing crypto hypergraph

Ibgib already provides the foundations of hypergraph generation dynamics. This is core to the very being of all data within ibgib. Therefore, we do not need a separate library/algorithm that only works with specialized Merkle-based technologies like many NIST-approved technologies. We leverage the existing ibgib mechanism without having to maintain two codebases for things that do essentially the same thing.

With ibgib, keystones are one reified use case of the more general ibgib timeline dynamics.

### Non-Evil Root - ignore signing pre-optimization

Similar to the slowness of some blockchains, like Bitcoin, we prioritize security first over other optimization dimensions like signing speed or size of keys.

The "speed" of the security can occur in what I call "scoping", but this assumes a relatively small number of connections. This is not designed for general-purpose internet traffic, where signing size/rates are paramount.

### Hash-based - pre-imaging is hard

If this is not true, then the security of keystones fails. This does not mean that all hashes are equal of course, but the general principle exists.

Note that, similar to PoW, hash-based challenges must be hard only for the time of the keystone's proximal use case. The keystones themselves must be spread with witnessing protocols to make them durable beyond that proximal window.

### The need for `ib` - collisions in our future

We are nearing a future where hash-spaces may seem large to us now, much like our previous beliefs that 1 MB of RAM was a lot. But this is misleading of course. With the amount of hashes that will be used (not only in ibgib, but other technologies as well as this will be the primary addressing mechanism across all software) these hash spaces will shrink precipitously. It's a small world after all.

This is why ibgib's addressing mechanism has a per-use-case `ib` component, to reduce accidental collisions in a world of ubiquitous hashing.

### Merkle graphs - inherently optimal communication

A keystone is an entire dependency graph, not a single ibgib frame. This is like thinking, in today's understanding, of a keystone as an entire repo and not a single commit. Though, due to the coolness of Merkle graphs, we do not always need to transmit the entire dependency graph, just as we do not need to push/pull an entire repo every time. This is an inherent quality of Merkle graph transmission and is heavily relied upon.

## current implementation

The v1 implementation creates a pure TypeScript, isomorphic, hash-based identity system. It is designed to be "Non-Evil" (prioritizing security/correctness over bandwidth) and "Graph-Native" (the signature is part of the DAG).

### jargon - the language of the stone

*   **Stone:** Any ibgib without `dna`. A constant or fixed point in the graph.
*   **Keystone:** A specific type of Stone used for Identity. It is a graph of ibgib frames that evolves over time but maintains a strict, verifiable lineage.
*   **Challenge Pool:** A collection of puzzles stored in a Keystone Frame.
*   **Challenge/Solution:** An abstract pair where the `Challenge` is public and the `Solution` is private. Revealing the Solution proves authorization.
*   **Claim:** The semantic intent of a signature. Composed of a `target` (ibgib addr), `verb` (e.g., "post"), and optional `scope`.
*   **Proof:** The structure linking a `Claim` to a set of revealed `Solutions`.
*   **Policy:** The strict rules determining *which* challenges must be solved to authorize a specific Claim.

### policy engine - selection and mitigation

Why do we need complex selection logic?

In a Keystone system, authorizing a frame involves **publicly revealing** solutions to challenges. Once revealed, a solution is known to the network. If a Man-In-The-Middle (MITM) isolates a victim, they might attempt to **replay** these known solutions to forge new frames.

Our policy engine enforces a multi-layered challenge selection pipeline to mitigate this. To sign a claim, the challenges consumed must satisfy **ALL** of the following layers (without double-dipping):

1.  **Mandatory Demands (The "Alice" Layer):**
    *   *Mechanism:* The verifier (or context) explicitly demands specific `challengeIds`.
    *   *Why:* Enables parties to proactively include challenges if they think the existing layers are insufficient, e.g., Alice can demand Bob select certain challenges that Alice thinks may be stronger/more secure (for whatever reason).
2.  **Target Binding (The "Content" Layer):**
    *   *Mechanism:* Challenges are explicitly mapped to buckets (e.g., Hex Characters), and the first N number of characters in the target `ibgib.gib` (frame's hash) are required to be solved.
    *   *Why:* **Content-Dependent Binding.** A revealed solution for "Target A" with first 5 characters of "a1c04" cannot be used to sign "a40d9", because they only overlap with "a" and "0". The attacker has to forge an ibgib frame whose hash matches the target binded characters in the target addr, which is hard, similar to existing PoW leading-zero hashing. This becomes harder with more binding characters required.
3.  **FIFO (The "Order" Layer):**
    *   *Mechanism:* Must consume $N$ challenges from the "front" of the pool.
    *   *Why:* Enables lower security but faster keystones.
4.  **Stochastic (The "Chaos" Layer):**
    *   *Mechanism:* Randomly select $N$ additional challenges from the remainder.
    *   *Why:* Mitigates pre-computation attacks and grinding.

#### replenishment - sustaining the timeline

Once challenges are consumed to sign a frame, the pool must react. This dictates the longevity and bandwidth profile of the identity.

*   **Top-Up (Standard):**
    *   *Mechanism:* Generate $N$ new challenges to replace the $N$ consumed ones.
    *   *Use Case:* Long-lived identities (e.g., User Profiles). Maintains a constant pool size and consistent entropy.
*   **Replace-All (Paranoid):**
    *   *Mechanism:* Discard *all* remaining challenges in the pool and generate a completely fresh set.
    *   *Use Case:* High-security contexts where one desires total forward secrecy for the entire pool after any usage. High bandwidth cost.
*   **Consume (Burn):**
    *   *Mechanism:* Remove consumed challenges. Do *not* add new ones.
    *   *Use Case:* Revocation (Scorched Earth) or One-Time-Use ephemeral identities. When the pool is empty, the capability associated with that pool is permanently disabled.

### cryptographic engine - `strategy` is a concrete challenge/solution discriminator

While the Policy Engine handles *selection*, the Cryptographic Engine handles the concrete specifics.

We currently implement the `hash-reveal-v1` strategy, with other possibilities on the horizon:

* simpler math challenges
  * for testing
  * for low/no-security
  * for other non-security-based requirements (captcha)
* encryption-based solutions
  * must decrypt with known qualities
  * can be much more novel, such as decrypt challenge text to a sonnet verified by an agent
* PoW-style solutions
  * config qualities like leading/trailing 0s
  * not necessarily known ahead of time/at time of challenge-generation

#### `strategy: 'hash-reveal-v1'`

In the `hash-reveal-v1` strategy, we do not use RSA or Elliptic Curves. We use
**Hash-Based Cryptography** preimages for quantum resistance and simplicity.
These are configurable in algorithm and number of recursive rounds.

*   **The Mechanism:** A variation of a Sigma protocol.
    *   Alice commits to a value $H$ (The Challenge) in Frame $N$.
    *   To authorize Frame $N+1$, Alice reveals the pre-image $S$ (The Challenge's Solution) such that $Hash(S) = H$ (with `$Hash` being parameterizable in algo/rounds).
*   **Key Derivation (The Salted Wrap):**
    *   To prevent exposure of the Master Secret, we use a derivation chain:
    *   `MasterSecret` + `PoolSalt` $\to$ `PoolSecret`
    *   `PoolSecret` + `ChallengeID` $\to$ `Solution`
    *   `Solution` $\to$ `Challenge`
    *   *Note:* We use a "Salted Wrap" technique (hashing `salt + secret + salt`) to act as a rudimentary Key Derivation Function without external dependencies that mitigates against length extension attacks.

### spacetime integration - the service facade

The `KeystoneService_V1` acts as a consumer's API for keystone manipulations. These include both the cryptographic requirements, as well as persistence in ibgib spaces via the metaspace. It ensures that every cryptographic action is executed and atomically persisted to the local Space.

#### 1. genesis (creation)
*   **Input:** A Master Secret and Pool Configs.
*   **Process:** Generates the initial challenges and the Genesis Frame.
*   **Persistence:** The new Identity is immediately `put` into the local `Space`.

#### 2. sign (evolution)
*   **Input:** The Latest Keystone, Master Secret, Claim, and optional Demands.
*   **Process:**
    1.  **Auto-Routing:** Locates the correct Pool based on the Claim's Verb (e.g., routing "revoke" to the revocation pool).
    2.  **Selection:** Runs the Policy Engine (Binding -> FIFO -> Stochastic) to select challenges.
    3.  **Solving:** Generates solutions using the Master Secret.
    4.  **Replenishment:** Tops up the pool with fresh challenges (or burns them, depending on strategy).
*   **Persistence:** The new Frame (containing the Proof) is persisted to the local `Space`. The `target` address is now cryptographically linked to this new frame.

#### 3. validate (audit)
*   **Input:** The Previous Frame and the Current Frame.
*   **Process:**
    1.  **Policy Check:** Reconstructs the deterministic requirements (Demands, Binding, FIFO) and ensures the Proof satisfies them.
    2.  **Crypto Check:** Verifies the revealed Solutions match the Challenges in the Previous Frame.
*   **Result:** If valid, the Current Frame is accepted as the legitimate successor.

#### 4. revoke (kill switch)
*   **Input:** The Latest Keystone and Master Secret.
*   **Process:**
    1.  Locates the specialized **Revocation Pool**.
    2.  Consumes **ALL** challenges in that pool ("Scorched Earth").
    3.  Sets the `revocationInfo` on the new frame.
*   **Result:** The Identity is permanently marked as dead. No further valid frames can be generated because the revocation pool (required for the 'revoke' verb) is empty.
