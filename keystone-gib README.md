# keystone-gib

"Keystones" are a new ibgib-specific identity mechanism that leverages ibgib's unique Merkle-based DLT structure. These combine the aspect of the general CS concept of a "key" with the ibgib concept of a "stone", i.e., a non-living entity without `dna`.

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
