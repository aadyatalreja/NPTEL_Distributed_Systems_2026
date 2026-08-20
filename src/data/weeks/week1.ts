import type { WeekData } from "../../types";

const week1: WeekData = {
  week: 1,
  title: "Introduction to Distributed Systems",
  status: "ready",
  pdfUrl: "/pdfs/week1-lecture-notes.pdf",

  notes: [
    {
      heading: "L1 — What a distributed system is",
      body: `A distributed system is a collection of independent computers that don't share memory or a physical clock, and that cooperate only by passing messages over a network — each has its own memory and runs its own OS.

**Defining properties:**
- **Heterogeneity** — mixed hardware/software components
- **Concurrency** — multiple programs run at once
- **Shared data** — accessed simultaneously by many entities
- **No global clock** — every component has only a local notion of time
- **Interdependencies** — components rely on one another

**Layered view:** application → *middleware* (the distributed software, e.g. CORBA, RPC, RMI, MPI) → OS → network protocol stack. Middleware exists to hide heterogeneity from the application.

**Why build distributed systems (motivation):**
1. Inherently distributed computations (e.g. bank transfers, consensus across distant parties)
2. Resource sharing (data sets, peripherals — too costly to fully replicate)
3. Access to remote data/resources
4. Enhanced reliability via replication — geographically spread resources rarely fail together. Reliability itself breaks into **availability**, **integrity**, **fault-tolerance**
5. Better performance/cost ratio
6. Scalability — adding processors doesn't directly bottleneck the network
7. Modularity / incremental expandability

**Design challenges — systems perspective:** communication, process management, synchronization (mutual exclusion, leader election, clocks), fault tolerance, and **transparency** (access, location, migration, relocation, replication, concurrency, failure transparency — hiding implementation detail from the user).

**Design challenges — algorithmic perspective:** time & global state (physical vs. *logical* time), synchronization/coordination (leader election, mutual exclusion, termination detection, garbage collection), reliability (consensus, replication, quorum, distributed commit, self-stabilization, checkpointing, failure detectors), group communication/ordered multicast, distributed shared memory.

**Applications:** mobile systems, sensor networks, ubiquitous computing, peer-to-peer (all nodes symmetric, no hierarchy), distributed data mining, grid computing, and security (confidentiality, authentication, availability).

Studied since 1967 (Dijkstra, Lamport). Lamport won the 2013 Turing Award for causality, logical clocks, safety/liveness, replicated state machines, and sequential consistency.`,
    },
    {
      heading: "L2 — The message-passing model & basic algorithms",
      body: `**Message-passing model:** *n* processors \`p0...p(n-1)\` connected by bidirectional point-to-point channels — think of it as a graph (processors = nodes, channels = undirected edges). A channel from pi→pj is modeled as pi's **outbuf** and pj's **inbuf**. A **configuration** is the vector of all processor states (including outbufs) — a full snapshot of the system.

**Two event types:**
- **Deliver event** — moves a message from sender's outbuf to receiver's inbuf
- **Computation event** — a processor consumes its inbuf, runs its transition function, produces new outgoing messages

An **execution** is the sequence \`config, event, config, event, ...\`. **Safety** = nothing bad has happened (holds on every finite prefix); **liveness** = something good eventually happens. An execution satisfying required liveness too is **admissible**.

**Synchronous vs. asynchronous:**
- **Asynchronous** — no bound on message delay or time between steps (e.g. the internet/email). Admissible = every sent message eventually delivered + every processor takes infinitely many steps.
- **Synchronous** — lockstep rounds: every processor sends, messages deliver, every processor computes, repeat. Time = number of rounds.

**Broadcast over a rooted spanning tree:** root sends *M* to children; each processor that receives *M* forwards to its own children, then terminates. Cost: **time = depth *d*** of the tree (up to *n*−1), **messages = n−1** — same in sync and async models.

**Convergecast** (the reverse — collecting info): leaves send to parents; internal nodes wait for *all* children before combining and forwarding up.

**Finding a spanning tree given a root:** root floods *M* to neighbors; first receipt of *M* sets the sender as parent and replies "parent," subsequent receipts get a "reject." **O(m) messages, O(diam) time.** Synchronous execution always yields a BFS tree; asynchronous execution can yield any tree — not necessarily BFS or DFS.

**Finding a DFS spanning tree:** explore neighbors *one at a time in series*, waiting for a parent/reject reply before trying the next — guarantees a DFS tree. Cost: **O(m) messages, O(m) time** (worse time than BFS since exploration is serial, not parallel).

**Finding a spanning tree without a known root:** every processor runs its own copy of the DFS algorithm as if it were the root, tagging messages with its id; when two copies collide, the larger id wins. **O(nm) messages, O(m) time.**`,
    },
    {
      heading: "L3 — Leader election in rings",
      body: `**Leader election (LE):** every processor must irreversibly decide elected/not-elected, such that in every admissible execution exactly one processor ends up elected. It's the canonical symmetry-breaking problem (e.g. breaking a deadlock cycle by electing and removing one waiting processor).

**Anonymous rings (no unique ids):**
- **Uniform algorithm** — doesn't use ring size *n* (same state machine regardless of size)
- **Non-uniform algorithm** — uses *n* (different state machine per size)
- **Impossibility theorem:** no LE algorithm exists for anonymous rings, even non-uniform + synchronous. Proof idea: every processor starts identically and receives identical messages each round, so they all transition identically forever — either nobody ever elects (liveness fails) or everybody does simultaneously (safety fails). This impossibility extends to all weaker models (uniform, asynchronous).

**Rings with unique ids:** ids are arbitrary nonnegative integers available via a local variable (don't confuse with *indices*, 0..n−1, which only exist for our analysis).

**LeLann–Chang–Roberts (LCR) — O(n²) messages:** send your own id left; on receiving id *j* — if *j* > your id, forward it (you've lost); if *j* = your id, elect yourself (it went all the way around); if *j* < your id, drop it. Correctness: the largest id's message always survives and circles the whole ring. **Time O(n)**; worst-case message count is quadratic because ids arranged in decreasing order around the ring force near-total propagation of every id before it's swallowed.

**Hirschberg–Sinclair (HS) — O(n log n) messages:** operates in phases 0, 1, 2, .... In phase *k*, a phase-(*k*−1) winner probes its 2ᵏ-neighborhood in both directions; a probe is swallowed by any processor with a larger id, otherwise a reply eventually returns. Winning both directions promotes you to phase *k*+1. A processor that receives its own probe back has circled the whole ring and becomes leader. Roughly log₂n phases occur since the winner count at least halves each phase.

**Lower bound:** any LE algorithm on asynchronous rings of unknown size needs **Ω(n log n)** messages — so HS is asymptotically optimal there. In synchronous rings, O(n) is achievable only with unbounded time and non-comparison-based (arithmetic) operations; otherwise O(n log n) is still required.`,
    },
    {
      heading: "L4 — Causality and logical time",
      body: `**Setting:** no shared memory, no global physical clock — only an approximation is possible. Messages may be delayed/lost/duplicated/reordered.

**Model of a distributed execution:** each process pi produces a linearly-ordered sequence of atomic **events** — internal, send, or receive. \`send(m) →msg rec(m)\` captures causal dependency across a message. A **space-time diagram**: horizontal line per process, dot per event, slanted arrow per message.

**Causal precedence relation →** (Lamport's "happens-before"): the smallest relation such that (i) if ei, ej are on the same process and ei comes first, ei→ej; (ii) send(m)→rec(m); (iii) it's transitive. → is an **irreflexive partial order**, *not total* — some event pairs are unrelated. Two events with neither ei→ej nor ej→ei are **concurrent** (ei ∥ ej). Concurrency is *not* transitive — ei∥ej and ej∥ek doesn't imply ei∥ek. Note **logical** concurrency (no causal link) differs from **physical** concurrency (same clock instant); logically concurrent events needn't occur at the same physical instant.

**Channel/network models:** FIFO (per-channel order preserved), non-FIFO (arbitrary delivery order), and **causal ordering (CO)**: if send(mij)→send(mkj) then rec(mij)→rec(mkj) — messages to the same destination arrive respecting their send-causality. CO ⊂ FIFO ⊂ non-FIFO.

**Framework for logical clocks:** a clock C maps events to a time domain T such that ei→ej ⇒ C(ei) < C(ej) (**clock consistency condition**, i.e. monotonicity). If the converse also holds (ei→ej ⇔ C(ei)<C(ej)) the system is **strongly consistent**. Each process keeps a local clock *lci* and a view of global time *gci*, updated by rule **R1** (local step) and **R2** (on message receipt).

**Scalar (Lamport) clocks — 1978:** one integer *Ci* per process.
- R1: before any event, \`Ci := Ci + d\` (d>0, usually 1)
- R2: on receiving a message timestamped *Cmsg*: \`Ci := max(Ci, Cmsg)\`, then apply R1, then deliver

Satisfies consistency (monotonic) but is **not strongly consistent** — C(ei)<C(ej) does *not* imply ei→ej, because squashing local+global time into one integer loses information about exactly which remote event was known. Ties are broken with **(timestamp, process-id)** pairs for a total order. If d=1, an event's timestamp minus 1 gives its **height** — the minimum number of events that must have occurred before it on any causal path.

**Vector clocks — Fidge/Mattern/Schmuck:** each process keeps an *n*-vector \`vt[1..n]\`; \`vt[i]\` is its own local clock, \`vt[j]\` is its latest knowledge of pj's clock.
- R1: \`vt[i] := vt[i] + d\`
- R2: on receiving (m, vt'): \`vt[k] := max(vt[k], vt'[k])\` for all k, then R1, then deliver

Comparison: vh ≤ vk iff every component ≤; vh < vk iff ≤ and strictly less somewhere; concurrent (vh ∥ vk) iff neither dominates. **Isomorphism property:** x→y ⇔ vh<vk and x∥y ⇔ vh∥vk — vector clocks are **strongly consistent**, so you can read causality directly off two timestamps. This requires dimension ≥ n (Charron-Bost). With d=1, component *i* of pi's vector counts pi's own events, and Σ vh[j] − 1 counts all events that causally precede that event system-wide.`,
    },
  ],

  slides: [
    {
      label: "Lecture 01 — Introduction to Distributed Systems",
      note: "Definitions, properties, layered architecture, motivation, design challenges, applications.",
    },
    {
      label: "Lecture 02 — Basic Algorithms in Message-Passing Systems",
      note: "Formal message-passing model, sync/async timing, broadcast/convergecast, spanning tree construction (BFS/DFS/rootless).",
    },
    {
      label: "Lecture 03 — Leader Election in Rings",
      note: "Anonymous-ring impossibility, LCR O(n²) algorithm, Hirschberg–Sinclair O(n log n) algorithm, Ω(n log n) lower bound.",
    },
    {
      label: "Lecture 04 — Models of Distributed Computation, Causality & Logical Time",
      note: "Happens-before relation, concurrency, channel models, scalar (Lamport) clocks, vector clocks.",
    },
  ],

  mcqs: [
    {
      id: "w1-q1",
      question: "Which of the following is NOT listed as a defining property of a distributed system?",
      options: ["Heterogeneity", "A single global clock shared by all processes", "Concurrency", "Interdependencies among components"],
      correctIndex: 1,
      explanation: "Distributed systems explicitly lack a global clock — each component only has a local notion of time. This is one of the core properties (along with heterogeneity, concurrency, shared data, and interdependencies) that makes DS design hard.",
      topic: "L1",
    },
    {
      id: "w1-q2",
      question: "In the layered architecture of a distributed system, what is the role of 'middleware'?",
      options: [
        "It is the physical communication network (WAN/LAN)",
        "It is the distributed software layer that provides transparency of heterogeneity to the application",
        "It replaces the operating system on each node",
        "It is a synonym for the network protocol stack",
      ],
      correctIndex: 1,
      explanation: "Middleware sits between the distributed application and the OS/network stack, providing transparency of heterogeneity at the platform level. Standards like CORBA, RPC, RMI, DCOM, and MPI are examples.",
      topic: "L1",
    },
    {
      id: "w1-q3",
      question: "A resource can rarely be fully replicated at every site mainly because of which motivation-related trade-off?",
      options: [
        "Replication is illegal in most jurisdictions",
        "It is often neither practical nor cost-effective",
        "Distributed systems don't support replication at all",
        "Replication always violates transparency",
      ],
      correctIndex: 1,
      explanation: "Resource sharing is a key motivation for DS, but full replication of large data sets or special resources at every site is usually impractical and too costly — hence sharing (not blanket replication) is the goal.",
      topic: "L1",
    },
    {
      id: "w1-q4",
      question: "Which transparency type specifically means the user is not made aware that a resource has multiple copies?",
      options: ["Access transparency", "Migration transparency", "Replication transparency", "Concurrency transparency"],
      correctIndex: 2,
      explanation: "Replication transparency hides the existence of multiple copies of a resource from the user. Access transparency hides representation differences; migration transparency allows relocation without renaming; concurrency transparency masks concurrent shared-resource use.",
      topic: "L1",
    },
    {
      id: "w1-q5",
      question: "In the formal message-passing model, a channel directed from processor pi to pj is modeled using which two pieces of state?",
      options: [
        "pi's inbuf and pj's outbuf",
        "pi's outbuf and pj's inbuf",
        "A shared queue accessible to both",
        "pi's local state and pj's local state only",
      ],
      correctIndex: 1,
      explanation: "The channel pi→pj is split into pi's outbuf variable (physical channel) and pj's inbuf variable (incoming message queue). A deliver event moves a message from the sender's outbuf to the receiver's inbuf.",
      topic: "L2",
    },
    {
      id: "w1-q6",
      question: "What distinguishes a synchronous message-passing system from an asynchronous one?",
      options: [
        "Synchronous systems have no message loss; asynchronous systems always lose messages",
        "In synchronous systems, execution proceeds in rounds with lockstep send/deliver/compute; asynchronous systems have no bound on message delay or step timing",
        "Asynchronous systems cannot elect a leader; synchronous ones always can",
        "There is no formal difference — the terms are interchangeable in this model",
      ],
      correctIndex: 1,
      explanation: "Synchronous = lockstep rounds (send to all neighbors, deliver, compute — repeat). Asynchronous = no fixed upper bound on message delivery time or time between a processor's steps (e.g. the internet).",
      topic: "L2",
    },
    {
      id: "w1-q7",
      question: "For broadcasting a message over a rooted spanning tree with n processors and depth d, what are the time and message complexities (same for sync and async)?",
      options: ["Time O(n), messages O(n²)", "Time O(d), messages O(n−1)", "Time O(1), messages O(n)", "Time O(n log n), messages O(d)"],
      correctIndex: 1,
      explanation: "Broadcast over a rooted spanning tree takes time equal to the tree's depth d (at most n−1 for a chain), and exactly n−1 messages since one message crosses each spanning-tree edge — identical in both timing models.",
      topic: "L2",
    },
    {
      id: "w1-q8",
      question: "When the spanning-tree-construction algorithm (root floods M, first receipt sets parent, later receipts get 'reject') runs asynchronously, what kind of tree results?",
      options: [
        "Always a BFS tree, same as the synchronous case",
        "Always a DFS tree",
        "Not necessarily BFS or DFS — the resulting tree depends on message timing",
        "No valid spanning tree can be produced asynchronously",
      ],
      correctIndex: 2,
      explanation: "The synchronous version always yields a BFS tree because messages arrive round-by-round in distance order. The asynchronous version has no such guarantee — depending on delays, the same algorithm can produce a BFS tree, a DFS tree, or neither.",
      topic: "L2",
    },
    {
      id: "w1-q9",
      question: "What is the message and time complexity of the algorithm that finds a DFS spanning tree from a known root (probing neighbors one at a time in series)?",
      options: ["O(n) messages, O(1) time", "O(m) messages, O(m) time", "O(n log n) messages, O(diam) time", "O(nm) messages, O(m) time"],
      correctIndex: 1,
      explanation: "The DFS spanning-tree algorithm sends a constant number of messages per edge, so message complexity is O(m). Because neighbors are explored serially rather than in parallel, time complexity is also O(m) — worse than the O(diam) time of the BFS-style flood.",
      topic: "L2",
    },
    {
      id: "w1-q10",
      question: "Why is leader election provably impossible on an anonymous ring, even with a non-uniform, synchronous algorithm that knows the ring size?",
      options: [
        "Because message loss is unavoidable in rings",
        "Because every processor starts in the same state and receives identical messages each round, so all processors transition identically forever — either none or all eventually 'win'",
        "Because rings can only support O(n²) message complexity",
        "Because rings must be unidirectional",
      ],
      correctIndex: 1,
      explanation: "With no unique identifiers, symmetry can never be broken: every processor's local view is indistinguishable from every other's round after round, so any decision to elect must be made by all processors simultaneously (violating safety) or by none (violating liveness).",
      topic: "L3",
    },
    {
      id: "w1-q11",
      question: "In the LeLann–Chang–Roberts (LCR) algorithm, what does a processor do when it receives an id j equal to its own id?",
      options: [
        "It forwards j onward, since it lost",
        "It discards the message silently",
        "It elects itself as leader",
        "It restarts the algorithm from scratch",
      ],
      correctIndex: 2,
      explanation: "If j = own id, the message has traveled all the way around the ring back to its originator, confirming this processor has the largest id — so it elects itself. (If j > id, forward it; if j < id, drop it.)",
      topic: "L3",
    },
    {
      id: "w1-q12",
      question: "What is the worst-case message complexity of the LCR algorithm, and when is it achieved?",
      options: [
        "O(n), when ids increase around the ring",
        "O(n log n), always",
        "O(n²), when ids are arranged in decreasing order around the ring",
        "O(1), regardless of id arrangement",
      ],
      correctIndex: 2,
      explanation: "LCR's worst case occurs when ids are arranged in strictly decreasing order around the ring: the 2nd-largest id causes n−1 messages, the 3rd-largest causes n−2, and so on, summing to Θ(n²).",
      topic: "L3",
    },
    {
      id: "w1-q13",
      question: "In the Hirschberg–Sinclair (HS) algorithm, what must happen for a processor to advance from phase k−1 to phase k?",
      options: [
        "It must receive a reject message from both directions",
        "It must be the processor with the smallest id in the ring",
        "Its probe must reach the largest id in the ring without being swallowed",
        "It must receive replies from both directions of its current neighborhood, meaning it has the largest id in that neighborhood",
      ],
      correctIndex: 3,
      explanation: "A processor becomes a phase-k winner (advancing to phase k+1) only if its probes traveled the full 2^k-neighborhood in both directions without being swallowed and replies returned from both sides — meaning it held the largest id in that neighborhood.",
      topic: "L3",
    },
    {
      id: "w1-q14",
      question: "What is the asymptotic message complexity of the Hirschberg–Sinclair algorithm, and how does it compare to the known lower bound for asynchronous rings of unknown size?",
      options: [
        "O(n), which is strictly worse than the Ω(n) lower bound",
        "O(n log n), which is asymptotically optimal since the lower bound is Ω(n log n)",
        "O(n²), matching the LCR algorithm exactly",
        "O(log n), beating the known lower bound",
      ],
      correctIndex: 1,
      explanation: "HS achieves O(n log n) messages because roughly log₂n phases occur (winners roughly halve each phase) and each phase costs O(n) messages total. This matches the proven Ω(n log n) lower bound for asynchronous rings of unknown size, making HS asymptotically optimal.",
      topic: "L3",
    },
    {
      id: "w1-q15",
      question: "Two events ei and ej are said to be 'concurrent' (ei ∥ ej) when:",
      options: [
        "ei → ej and ej → ei both hold",
        "Neither ei → ej nor ej → ei holds",
        "They occur at exactly the same physical clock time",
        "They occur on the same process",
      ],
      correctIndex: 1,
      explanation: "Concurrency in the causal sense means neither event happened-before the other — there's no causal path (message chain + process-line progression) linking them in either direction. This is a logical notion, distinct from occurring at the same physical instant.",
      topic: "L4",
    },
    {
      id: "w1-q16",
      question: "Which property is TRUE of the causal precedence relation → (happens-before)?",
      options: [
        "It is a total order — every pair of events is comparable",
        "It is an irreflexive partial order; some event pairs are simply concurrent and incomparable",
        "It only applies to events on the same process",
        "The relation ∥ (concurrency) it induces is transitive",
      ],
      correctIndex: 1,
      explanation: "→ is an irreflexive partial order: it never relates an event to itself, and not every pair of events is ordered — some are concurrent. Also, ∥ is explicitly NOT transitive (ei∥ej and ej∥ek does not imply ei∥ek).",
      topic: "L4",
    },
    {
      id: "w1-q17",
      question: "What is the 'causal ordering' (CO) property of a communication network model?",
      options: [
        "All messages are delivered in the exact order they are sent, globally",
        "If send(mij) → send(mkj), then rec(mij) → rec(mkj) — causally related messages to the same destination are delivered in an order consistent with their causality",
        "Messages may be delivered in any random order regardless of causal relationships",
        "Only messages on the same channel need be ordered",
      ],
      correctIndex: 1,
      explanation: "CO guarantees that if two messages destined for the same process were sent in a causal order, they are received in that same order. Causal ordering is a stronger guarantee than FIFO: CO ⊂ FIFO ⊂ non-FIFO.",
      topic: "L4",
    },
    {
      id: "w1-q18",
      question: "In Lamport's scalar clock scheme, what does a process do upon receiving a message timestamped Cmsg?",
      options: [
        "Ci := Cmsg, discarding its own prior value",
        "Ci := max(Ci, Cmsg), then apply the local increment rule R1, then deliver",
        "Ci := Ci + Cmsg",
        "Nothing — scalar clocks only update on local events, never on receive",
      ],
      correctIndex: 1,
      explanation: "Rule R2 for scalar clocks: on receiving a message with timestamp Cmsg, set Ci to the max of its current value and Cmsg, then execute R1 (increment), then deliver the message.",
      topic: "L4",
    },
    {
      id: "w1-q19",
      question: "Why are Lamport scalar clocks NOT strongly consistent?",
      options: [
        "Because they use real numbers instead of integers",
        "Because squashing the local clock and the view of global time into a single integer loses information about which remote event was known, so C(ei) < C(ej) does not imply ei → ej",
        "Because scalar clocks don't satisfy the basic monotonicity condition at all",
        "Because they require a global physical clock to function",
      ],
      correctIndex: 1,
      explanation: "Scalar clocks guarantee ei→ej ⇒ C(ei)<C(ej) (consistency/monotonicity) but not the converse. Two unrelated (concurrent) events can end up with C(ei)<C(ej) purely by coincidence, since a single integer can't encode which specific event was causally known.",
      topic: "L4",
    },
    {
      id: "w1-q20",
      question: "What makes vector clocks 'strongly consistent' in a way scalar clocks are not?",
      options: [
        "Vector clocks use floating point precision",
        "Vector clocks require a physical global clock",
        "There is an isomorphism: x → y ⇔ vh < vk and x ∥ y ⇔ vh ∥ vk, so causality can be read directly off the timestamps",
        "Vector clocks are always smaller in size than scalar clocks",
      ],
      correctIndex: 2,
      explanation: "Because each process tracks its latest knowledge of every other process's clock (an n-dimensional vector), the resulting timestamps are isomorphic to the actual happens-before/concurrency structure of the computation — so comparing two vector timestamps fully determines their causal relationship. This requires vector dimension ≥ n (Charron-Bost's result).",
      topic: "L4",
    },
  ],

  flashcards: [
    { id: "w1-f1", front: "Define a distributed system in one line.", back: "A collection of independent computers, with no shared memory or clock, that cooperate by passing messages over a network to jointly solve a problem no single one could solve alone.", topic: "L1" },
    { id: "w1-f2", front: "Name the 5 core properties of distributed systems.", back: "Heterogeneity, concurrency, shared data, no global clock, interdependencies.", topic: "L1" },
    { id: "w1-f3", front: "What is 'middleware'?", back: "The distributed software layer between the application and the OS/network stack that provides transparency of heterogeneity (e.g. CORBA, RPC, RMI, DCOM, MPI).", topic: "L1" },
    { id: "w1-f4", front: "List the 7 types of transparency.", back: "Access, location, migration, relocation, replication, concurrency, failure transparency.", topic: "L1" },
    { id: "w1-f5", front: "What are the 3 fundamental issues that make distributed algorithm design hard?", back: "Asynchrony (no precise timing), limited local knowledge (each entity only sees its own view), and independent failures.", topic: "L1" },
    { id: "w1-f6", front: "What did Leslie Lamport win the 2013 Turing Award for?", back: "Fundamental contributions to distributed systems theory: causality and logical clocks, safety/liveness, replicated state machines, and sequential consistency.", topic: "L1" },
    { id: "w1-f7", front: "In the message-passing model, what is a 'configuration'?", back: "A vector of all processor states (including outbufs/channels) — a complete snapshot of the entire system at one point.", topic: "L2" },
    { id: "w1-f8", front: "What are the two kinds of events in the message-passing model?", back: "Deliver events (move a message from sender's outbuf to receiver's inbuf) and computation events (a processor consumes its inbuf and produces new state + outgoing messages).", topic: "L2" },
    { id: "w1-f9", front: "Safety vs. liveness — define both.", back: "Safety: nothing bad has happened yet (holds on every finite prefix). Liveness: something good eventually happens (may require infinite execution to confirm).", topic: "L2" },
    { id: "w1-f10", front: "Synchronous vs asynchronous message passing — key difference?", back: "Synchronous: lockstep rounds, bounded delay. Asynchronous: no fixed upper bound on message delay or on time between a processor's steps.", topic: "L2" },
    { id: "w1-f11", front: "Cost of broadcasting over a rooted spanning tree (n nodes, depth d)?", back: "Time O(d) (up to n−1), messages O(n−1) — same for sync and async.", topic: "L2" },
    { id: "w1-f12", front: "What does 'convergecast' do, and how does it differ from broadcast?", back: "It collects information up a spanning tree: leaves send to parents, and each internal node waits for messages from ALL its children before combining and forwarding upward — the reverse flow of broadcast.", topic: "L2" },
    { id: "w1-f13", front: "Rootless spanning tree construction — cost and technique?", back: "Every processor runs its own DFS-tree algorithm as if it were root, tagging messages with its id; on collision, the larger id wins. O(nm) messages, O(m) time.", topic: "L2" },
    { id: "w1-f14", front: "State the leader election impossibility result for anonymous rings.", back: "No LE algorithm exists for anonymous rings — even non-uniform and synchronous — because all processors start and evolve identically each round, so a decision to elect is made by everyone or no one.", topic: "L3" },
    { id: "w1-f15", front: "LCR algorithm rule in one line.", back: "Send your id left; on receiving id j: forward it if j > your id (you lost), elect yourself if j = your id, drop it if j < your id.", topic: "L3" },
    { id: "w1-f16", front: "LCR message complexity — best/worst case?", back: "O(n²) worst case (ids in decreasing order around the ring); time is always O(n).", topic: "L3" },
    { id: "w1-f17", front: "What is the 2ᵏ-neighborhood in the Hirschberg–Sinclair algorithm?", back: "The set of processors within distance 2^k of a processor pi in either direction along the ring — 2·2^k + 1 processors total including pi.", topic: "L3" },
    { id: "w1-f18", front: "HS algorithm message/time complexity, and is it optimal?", back: "O(n log n) messages — asymptotically optimal, matching the proven Ω(n log n) lower bound for asynchronous rings of unknown size.", topic: "L3" },
    { id: "w1-f19", front: "Define the happens-before relation →.", back: "The smallest relation such that: same-process events in order are related; send(m) → rec(m); and the relation is transitively closed. It's an irreflexive partial order.", topic: "L4" },
    { id: "w1-f20", front: "When are two events 'concurrent' (ei ∥ ej)?", back: "When neither ei → ej nor ej → ei holds — there's no causal path between them either way. Note ∥ is NOT transitive.", topic: "L4" },
    { id: "w1-f21", front: "CO vs FIFO vs non-FIFO channel models — order them by strength.", back: "CO (causal ordering) ⊂ FIFO ⊂ non-FIFO. CO is the strongest guarantee; non-FIFO is the weakest (arbitrary delivery order).", topic: "L4" },
    { id: "w1-f22", front: "Clock consistency (monotonicity) condition for logical clocks?", back: "ei → ej ⇒ C(ei) < C(ej). If the converse also holds, the clock system is 'strongly consistent.'", topic: "L4" },
    { id: "w1-f23", front: "Scalar clock R1 and R2 rules?", back: "R1 (before any event): Ci := Ci + d. R2 (on receiving msg with timestamp Cmsg): Ci := max(Ci, Cmsg), then apply R1, then deliver.", topic: "L4" },
    { id: "w1-f24", front: "Why aren't scalar clocks strongly consistent?", back: "Squashing local + global time into one integer loses information about which specific remote event was known, so C(ei) < C(ej) doesn't guarantee ei → ej.", topic: "L4" },
    { id: "w1-f25", front: "How are ties broken in scalar-clock total ordering?", back: "Using the pair (timestamp, process id): x ≺ y iff timestamp(x) < timestamp(y), or timestamps are equal and id(x) < id(y).", topic: "L4" },
    { id: "w1-f26", front: "Vector clock R2 rule (on message receipt)?", back: "For all k: vt[k] := max(vt[k], vt_msg[k]), then apply R1 (increment own component), then deliver.", topic: "L4" },
    { id: "w1-f27", front: "Vector clock isomorphism property?", back: "x → y ⇔ vh < vk, and x ∥ y ⇔ vh ∥ vk — the vector timestamps exactly mirror the true causal structure, making vector clocks strongly consistent.", topic: "L4" },
    { id: "w1-f28", front: "Minimum required dimension of a vector clock for strong consistency?", back: "n — the total number of processes in the system (Charron-Bost's result).", topic: "L4" },
  ],
};

export default week1;
