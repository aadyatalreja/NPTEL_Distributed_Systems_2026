import type { WeekData } from "../../types";

const week4: WeekData = {
  week: 4,
  title: "Distributed Deadlock Detection, Shared Memory & Minimum Spanning Tree",
  status: "ready",
  pdfUrl: "/pdfs/week4-lecture-notes.pdf",

  notes: [
  {
    heading: `Deadlocks in distributed systems: setup`,
    body: `A **deadlock** occurs when a set of processes are each waiting for a resource held by another process in the same set, so none of them can ever proceed — e.g. \`P1 -> P2 -> P3 -> P1\`. Detecting this is harder in a distributed system than on a single machine because there's **no global memory**, **no global clock**, unpredictable **message delay**, and possible **message loss/duplication**, **processor failures**, and **link failures**.

Three general strategies exist: **prevention** (structurally rule deadlock out, e.g. grab all resources up front — inefficient in practice), **avoidance** (only grant a request if the resulting global state stays *safe* — needs global-state knowledge that's hard to get in a distributed system), and **detection** (let deadlock happen, then detect and resolve it afterward — the practical choice for distributed systems).`,
  },
  {
    heading: `The Wait-For Graph (WFG)`,
    body: `A **Wait-For Graph** captures blocking dependencies between processes: each **node** is a process, and a directed edge \`Pi -> Pj\` means *Pi is blocked, waiting for Pj to release a resource*. Deadlock detection has two tasks: **(1) maintain** the (distributed) WFG as requests/releases happen, and **(2) search** it for a **cycle** or a **knot**, depending on which request model is in play.

A correct detection algorithm must satisfy two properties:
- **Progress** — no undetected deadlocks; every deadlock that actually exists is eventually found.
- **Safety** — no false deadlocks; a falsely reported deadlock is called a **phantom deadlock**.

Mnemonic: *Progress = don't MISS deadlocks; Safety = don't INVENT deadlocks.* Detection isn't the same as resolution — once found, the deadlock must still be broken by selecting a process, rolling it back / aborting it, releasing its resources, and letting blocked processes continue.`,
  },
  {
    heading: `Models of distributed deadlocks`,
    body: `How a process's resource *request* is structured changes what "deadlock" looks like in the WFG:

| Model | Request pattern | Deadlock indicator |
|---|---|---|
| **Single Resource** | at most one outstanding request (out-degree <= 1) | Cycle |
| **AND** | needs **ALL** requested resources | Cycle |
| **OR** | needs **ANY ONE** requested resource | **Knot** (cycle alone isn't enough) |
| **AND-OR** | e.g. \`X AND (Y OR Z)\` | no simple graph test; repeat the OR-model test |
| **P-out-of-Q** | any *k* out of *n* resources | generalizes AND-OR compactly |
| **Unrestricted** | no structural assumption | only relies on deadlock being *stable* |

The **AND vs OR / Cycle vs Knot** distinction is the single most testable idea here: in the AND model a process needs everything it asked for, so a cycle of mutual waiting is already fatal; in the OR model a process can proceed the moment *any one* of its requests is satisfied, so a cycle might still resolve itself — only a knot (a set of nodes that all can only reach each other, with no exit) guarantees deadlock. Also note: in the AND model, a process doesn't have to sit *on* the cycle to be deadlocked — if it depends on a cycle member, it's stuck too.`,
  },
  {
    heading: `Knapp's classification of detection algorithms`,
    body: `Knapp groups distributed deadlock-detection algorithms into **four classes**:

1. **Path-pushing** — sites explicitly build and exchange the (evolving) global WFG until someone has enough information to see a cycle.
2. **Edge-chasing** — instead of the whole graph, short **probe** messages travel along WFG edges; only *blocked* processes forward them (executing processes just discard them); a probe returning to its sender means a cycle exists. Probes are attractive because they're fixed-size and short.
3. **Diffusion computation** — an echo-algorithm-style scheme: an initiator sends **queries** that diffuse outward along the WFG; a blocked process getting its *first* query for a round waits for replies to everything *it* forwarded before replying; a deadlock is confirmed once the initiator has collected replies to every query it originally sent.
4. **Global-state detection** — take a **consistent snapshot** of the whole system (Chandy–Lamport style, without stopping computation) and examine it; this works because deadlock is a *stable property* — once it's true, it stays true until broken.`,
  },
  {
    heading: `Mitchell–Merritt algorithm`,
    body: `Mitchell–Merritt is an **edge-chasing** algorithm built specifically for the **single-resource model**. Each process keeps two labels, each of the form \`(count, PID)\`:

- **Private label** — unique to the process, changes over time, not directly usable as a public identifier by others.
- **Public label** — readable by other processes, may not be unique.

Initially \`public = private\`. When process \`X\` waits on \`Y\`: \`public_X = max(X, Y) + 1\`; if \`X\` later discovers \`Y\`'s public label is larger, it copies it: \`public_X = public_Y\`. Labels therefore propagate in the **reverse direction of the WFG edges** — probes move opposite to the "waits-for" arrows. If a process ever sees its *own* label come back to it, a deadlock exists, and — importantly — **exactly one process** in the cycle detects it, which simplifies resolution.

For a cycle of \`s\` processes, the worst-case number of **transmit steps** is:

$$s(s-1)/2$$

(e.g. \`s = 5\` gives \`5*4/2 = 10\`). The algorithm needs FIFO channels but no extra synchronization mechanism.`,
  },
  {
    heading: `Distributed Shared Memory (DSM): concept and abstraction`,
    body: `**DSM** makes a distributed system *look* to the programmer like it has one shared memory, even though physically the memory is distributed. Instead of explicit \`send()\`/\`receive()\`, application code just does ordinary **\`read()\`/\`write()\`**; the **DSM manager** handles all the underlying communication behind the scenes — send/receive still happen, just internally, never called directly by the application.

\`\`\`text
Application -> read/write -> DSM Manager -> network -> remote memory
\`\`\``,
  },
  {
    heading: `DSM advantages, disadvantages, and implementation issues`,
    body: `**Advantages:** hides send/receive; gives a single address space, which simplifies passing complex data structures (no manual serialization); exploits **locality of reference** through caching/replication; simpler software interfaces; can run on cheaper off-the-shelf hardware; avoids a single shared-bus bottleneck; improves portability.

**Disadvantages:** the programmer now has to *understand the consistency model* being used (DSM does not eliminate consistency concerns — replication is exactly what creates them); asynchronous message passing under the hood adds overhead; the DSM manager, not the programmer, controls communication.

**Implementation issues to decide:** how concurrent accesses behave; full vs partial replication; read-only/write-only handling; where replicas live and how to find the nearest copy when data isn't fully replicated; how to reduce message counts; hardware vs software remote access/caching; whether DSM sits in the OS, the memory manager, or the runtime.`,
  },
  {
    heading: `Memory coherence and the consistency-model idea`,
    body: `With \`n\` processors, and processor \`Pi\` performing \`si\` memory operations, the number of possible **interleavings** of all these operations is:

$$\\frac{(s_1+s_2+\\cdots+s_n)!}{s_1!\\,s_2!\\cdots s_n!}$$

A **consistency model** is simply a rule for which of these interleavings are legal outcomes for a DSM to produce. The models covered, from strongest to weakest, are: Linearizability, Sequential, Causal, PRAM, and Slow Memory (plus Weak, Release, and Entry consistency, which are about *when* synchronization enforces ordering rather than about global orderings per se).`,
  },
  {
    heading: `Linearizability and sequential consistency`,
    body: `**Linearizability** (aka strict/atomic consistency) requires a Read to return the value of the most recent Write according to **real (wall-clock) time**, and requires all processors to agree on one ordering consistent with that real-time order. Formally: **C1** — a Read returns the value from the most recent preceding Write in the linearized sequence; **C2** — if \`response(op1) < invocation(op2)\` in real time, then \`op1 < op2\` in the linearization.

**Sequential consistency** is weaker: it only requires (1) each processor's own **program order** is preserved, and (2) all processors see the **same global interleaving**. Crucially, it does **not** require real-time order to be preserved across *different* processors — that's the classic NPTEL trap: *if a question says "real-time order must be respected," the answer is linearizability, not sequential consistency.*

| Feature | Linearizability | Sequential Consistency |
|---|---|---|
| Program order | Preserved | Preserved |
| Common global ordering | Yes | Yes |
| Real-time order | **Required** | Not required |
| Relative strength | Stronger | Weaker |`,
  },
  {
    heading: `Causal, PRAM, and slow memory consistency`,
    body: `**Causal consistency** only requires *causally related* writes to be seen in the same order by everyone — causality comes from (1) local program order, (2) a write-then-read dependency (a read observing a write), and (3) the transitive closure of these. Independent (non-causally-related) writes can be seen in different orders by different processes.

**PRAM (Pipelined RAM) consistency** only requires that **writes from the same processor** be seen by others in the order they were issued; writes from *different* processors may be seen in different orders by different observers.

**Slow memory** is weaker still: it only requires writes from the same processor **to the same memory location** to be observed in order — different variables can have entirely independent "pipelines."

**Consistency hierarchy (strongest -> weakest):**

\`\`\`text
Linearizability > Sequential Consistency > Causal Consistency > PRAM > Slow Memory
\`\`\`

Memorize this order — it's the single most-tested list in this unit.`,
  },
  {
    heading: `Weak, release, and entry consistency`,
    body: `**Weak consistency** relaxes ordinary data-operation ordering and instead enforces consistency mainly around **synchronization operations** (e.g. a barrier).

**Release consistency** defines two synchronization operations: **acquire** (entering a critical section — pull in others' updates) and **release** (leaving a critical section — push local updates out to other replicas). **Lazy release consistency** delays propagating those updates until they're actually needed (on demand), rather than immediately at release time.

**Entry consistency** goes further: every ordinary shared variable is explicitly tied to a **synchronization variable** (e.g. \`Data X -> Lock L1\`), so acquiring/releasing a lock only needs to synchronize the variables associated with *that* lock, not the whole memory.`,
  },
  {
    heading: `Lamport's Bakery Algorithm`,
    body: `The Bakery Algorithm provides **n-process mutual exclusion** for shared-memory systems, modeled on customers taking numbered tickets at a bakery counter. A process: (1) chooses a ticket number, (2) waits for every process holding a *smaller* \`(ticket, PID)\` pair, (3) uses **PID to break ties** on equal ticket numbers (lexicographic ordering of \`(ticket, PID)\`), (4) enters the critical section, and (5) releases its ticket afterward.

It satisfies the three classic mutual-exclusion requirements: **mutual exclusion** (at most one process in CS), **bounded waiting** (a process can be overtaken by each other process at most once, so it's never postponed indefinitely), and **progress** (if the CS is free, some waiting process eventually gets in). Its time complexity is **O(n)**, and it needs at least \`n\` shared registers.`,
  },
  {
    heading: `Distributed MST: setup and the case for GHS`,
    body: `A **Minimum Spanning Tree (MST)** of a connected weighted graph \`G = (V, E)\` is the spanning tree minimizing total edge weight: \`MST = argmin_T sum_{e in T} w(e)\`. A spanning tree touches every vertex, stays connected, has no cycles, and uses exactly \`n - 1\` edges for \`n\` vertices.

In the **distributed** setting, each vertex is an independent computing node communicating only over its incident edges (no shared memory, no global view). Classic sequential algorithms like **Prim's** and **Kruskal's** don't transfer directly, because they process vertices/edges in a fixed sequential order and generally assume knowledge of the whole graph — but a distributed node initially knows only the weights of its own incident edges. This gap is exactly why the **GHS algorithm** (Gallager, Humblet, Spira, 1983) exists: it builds the MST using only local knowledge and message passing, assuming a connected, undirected graph with **distinct, finite edge weights** (which also guarantees the MST is unique).`,
  },
  {
    heading: `MST fragments, MWOE, and the cut property`,
    body: `A **fragment** is any connected subtree of the eventual MST; GHS works by repeatedly merging fragments until only one remains. For any fragment, its **MWOE (Minimum Weight Outgoing Edge)** is the lowest-weight edge connecting it to a different fragment without creating a cycle.

The algorithm rests on the MST **cut property**: a fragment's MWOE can always be safely added to it and the result is still a valid piece of *some* MST. Repeatedly adding each fragment's MWOE and merging is therefore guaranteed to build a correct MST.`,
  },
  {
    heading: `Synchronous vs asynchronous GHS`,
    body: `**Synchronous GHS** proceeds in coordinated rounds: every fragment finds its MWOE, merges across it, and repeats — simple, but requires global round synchronization.

**Asynchronous GHS** (the version the lecture focuses on) drops that assumption and instead tracks a **fragment level**, starting at 0 for every single node. Levels govern how fragments combine:
- **Same level, connected via MWOE -> Join**: the new fragment's level becomes \`old level + 1\`.
- **Different levels -> Absorption**: the lower-level fragment is absorbed into the higher-level one, which *keeps* its level.

A non-zero-level fragment's **ID** is the ID of its **core edge** — the edge selected when the fragment was formed. A sleeping node that wakes up finds its minimum-weight incident edge, marks it Branch, and sends a Connect message over it; if both endpoints pick the same edge, it becomes the core of a new level-1 fragment.`,
  },
  {
    heading: `GHS edge states, node states, and the level bound`,
    body: `Every incident edge is classified as **Basic** (undecided), **Branch** (known to be in the MST), or **Rejected** (known not to be in the MST). Every node is in one of three states: **Sleeping** (initial), **Find** (actively searching for the fragment's MWOE), or **Found** (MWOE already located).

A fragment at level \`L\` contains at least \`2^L\` nodes, so for \`N\` total nodes:

$$L \\le \\log_2 N$$

This logarithmic level bound is the basis for GHS's overall message/time complexity analysis.`,
  },
  {
    heading: `GHS stages and messages`,
    body: `For a fragment at a given level, each round runs three stages:

1. **Broadcast** — the two nodes adjacent to the core send the fragment's ID and level out along branch edges, so every node in the fragment learns them.
2. **Convergecast** — leaves examine their Basic (outgoing) edges and send candidate-edge reports back toward the core; each internal node compares its children's reports against its own candidates and keeps the best, remembering the branch toward it as its **best-edge**. Eventually the core learns the fragment-wide MWOE.
3. **Change-Core** — once the MWOE is known, a Change-Core message routes the core toward it, and a **Connect** message is sent over the MWOE to merge with the neighboring fragment.

**Test/Accept/Reject** resolve individual candidate edges: a node sends a **Test** on its lowest-weight Basic edge to check where it leads. If both ends are already in the *same* fragment, the edge is marked **Rejected**. If it reaches a node in a genuinely different (and not-lower-level) fragment, an **Accept** is returned and the edge becomes an MWOE candidate. If it reaches a **lower-level** fragment, the response is **delayed** until that fragment's level catches up — this prevents incorrect merges during asynchronous execution. After finding its minimum outgoing edge (or determining it has none, at which point that fragment's part of the algorithm can terminate), a node sends a **Report** up toward the core.

| Message | Purpose |
|---|---|
| Connect | Connect two fragments over the MWOE |
| Initiate | Tell nodes the fragment ID / level / state |
| Test | Probe a candidate outgoing edge |
| Accept | Edge is a valid outgoing candidate |
| Reject | Edge is internal to the same fragment |
| Report | Report the minimum outgoing edge upward |
| ChangeRoot | Move the core toward the MWOE |`,
  },
  {
    heading: `Week 4 quick-reference tables`,
    body: `**Deadlock models:** Single Resource -> Cycle · AND -> Cycle · OR -> Knot · AND-OR -> repeated OR-test · P-out-of-Q -> generalized · Unrestricted -> stability only.

**Knapp's four classes:** Path-pushing -> explicit global WFG · Edge-chasing -> probes · Diffusion -> queries + replies (echo) · Global-state -> consistent snapshot.

**Consistency hierarchy:** Linearizability > Sequential > Causal > PRAM > Slow Memory.

**GHS edge types:** Basic = undecided · Branch = MST edge · Rejected = non-MST edge.

**GHS node states:** Sleeping -> Find -> Found.

**GHS merging:** same level -> Join (level + 1) · different levels -> Absorption (higher level kept).

**Key formulas:** interleavings \`= (s1+...+sn)! / (s1!...sn!)\` · Mitchell–Merritt worst case \`= s(s-1)/2\` · Bakery time \`= O(n)\` · GHS level bound \`L <= log2 N\`.

**One-line summary:** Lecture 12 = Deadlocks -> WFG -> Models -> Detection classes -> Mitchell-Merritt. Lecture 13 = DSM -> Consistency models -> Hierarchy -> Bakery. Lecture 14 = MST -> MWOE -> Fragments -> GHS -> Levels -> Messages -> Complexity.`,
  },
  ],

  slides: [],
  mcqs: [
  {
    id: "w4-q1",
    question: `In a Wait-For Graph (WFG), an edge \`P_i -> P_j\` indicates:`,
    options: [
        `\`P_j\` is waiting for \`P_i\``,
        `\`P_i\` is waiting for \`P_j\``,
        `\`P_i\` has terminated`,
        `\`P_i\` and \`P_j\` are independent`,
    ],
    correctIndex: 1,
    explanation: `The edge points from the waiter to the holder: Pi -> Pj means Pi is blocked waiting for a resource held by Pj.`,
    topic: "Deadlock Detection",
  },
  {
    id: "w4-q2",
    question: `Which of the following is NOT one of the four classes in Knapp's classification?`,
    options: [
        `Path-pushing`,
        `Edge-chasing`,
        `Diffusion computation`,
        `Token-passing`,
    ],
    correctIndex: 3,
    explanation: `Knapp's four classes are path-pushing, edge-chasing, diffusion computation, and global-state detection — token-passing is not one of them (that's a mutual-exclusion technique).`,
    topic: "Deadlock Detection",
  },
  {
    id: "w4-q3",
    question: `In a path-pushing algorithm, the main idea is to:`,
    options: [
        `Send fixed-size probes`,
        `Maintain an explicit global WFG`,
        `Use only local information`,
        `Elect a coordinator first`,
    ],
    correctIndex: 1,
    explanation: `Path-pushing algorithms work by explicitly building and forwarding the global WFG between sites until one site has enough information to spot a cycle.`,
    topic: "Deadlock Detection",
  },
  {
    id: "w4-q4",
    question: `Why are edge-chasing algorithms called "edge-chasing"?`,
    options: [
        `They move physical resources between processes`,
        `They propagate probes along WFG edges`,
        `They modify graph edges`,
        `They chase failed network links`,
    ],
    correctIndex: 1,
    explanation: `Edge-chasing algorithms send short probe messages that travel along the directed edges of the WFG, hence the name.`,
    topic: "Deadlock Detection",
  },
  {
    id: "w4-q5",
    question: `Which type of message is specifically associated with edge-chasing algorithms?`,
    options: [
        `Token`,
        `Probe`,
        `Snapshot`,
        `Commit`,
    ],
    correctIndex: 1,
    explanation: `The probe is the signature message type of edge-chasing deadlock detection.`,
    topic: "Deadlock Detection",
  },
  {
    id: "w4-q6",
    question: `In edge-chasing deadlock detection, which processes propagate probe messages along their outgoing edges?`,
    options: [
        `All processes`,
        `Only executing processes`,
        `Only blocked processes`,
        `Only the initiator`,
    ],
    correctIndex: 2,
    explanation: `Only blocked processes forward probes along their outgoing WFG edges; an executing (unblocked) process simply discards them.`,
    topic: "Deadlock Detection",
  },
  {
    id: "w4-q7",
    question: `A major advantage of edge-chasing algorithms is that:`,
    options: [
        `They require no messages`,
        `Probe messages are fixed-size and usually short`,
        `They always require a global snapshot`,
        `They require a centralized coordinator`,
    ],
    correctIndex: 1,
    explanation: `Because probes carry only a little fixed information, they stay small and cheap to send compared to pushing an entire WFG.`,
    topic: "Deadlock Detection",
  },
  {
    id: "w4-q8",
    question: `In diffusion-computation-based deadlock detection, computation is:`,
    options: [
        `Diffused through the WFG`,
        `Restricted to the initiator`,
        `Performed only at the root`,
        `Performed only after a snapshot`,
    ],
    correctIndex: 0,
    explanation: `In diffusion computation the detection computation itself spreads out (diffuses) across the WFG via queries.`,
    topic: "Deadlock Detection",
  },
  {
    id: "w4-q9",
    question: `Diffusion-computation algorithms make use of:`,
    options: [
        `Election algorithms`,
        `Echo algorithms`,
        `Sorting algorithms`,
        `Consensus algorithms`,
    ],
    correctIndex: 1,
    explanation: `Diffusion computation is built on an echo-algorithm style of queries going out and replies coming back to the initiator.`,
    topic: "Deadlock Detection",
  },
  {
    id: "w4-q10",
    question: `In diffusion computation, a blocked process receiving the **first query** for a particular detection initiation:`,
    options: [
        `Immediately sends a reply`,
        `Discards the query`,
        `Waits for replies to all queries it sent before replying`,
        `Terminates`,
    ],
    correctIndex: 2,
    explanation: `On the first query for a given detection round, a blocked process forwards queries along its own edges and must collect all the replies to those before it can reply itself.`,
    topic: "Deadlock Detection",
  },
  {
    id: "w4-q11",
    question: `The initiator detects a deadlock in diffusion computation when:`,
    options: [
        `It receives the first reply`,
        `It receives replies for every query it sent`,
        `Every process sends exactly one query`,
        `The network becomes idle`,
    ],
    correctIndex: 1,
    explanation: `The initiator concludes a deadlock exists once it has gotten back a reply for every query it originally sent out.`,
    topic: "Deadlock Detection",
  },
  {
    id: "w4-q12",
    question: `Global-state detection-based algorithms rely on the fact that:`,
    options: [
        `Distributed computation must be frozen`,
        `A consistent snapshot can be obtained without freezing computation`,
        `Every process must stop before snapshotting`,
        `Only local states are sufficient`,
    ],
    correctIndex: 1,
    explanation: `Global-state algorithms rely on the Chandy-Lamport style result that a consistent snapshot can be captured without halting the underlying computation.`,
    topic: "Deadlock Detection",
  },
  {
    id: "w4-q13",
    question: `Which of the following correctly matches the algorithm class with its basic idea?`,
    options: [
        `Path-pushing → probes`,
        `Edge-chasing → explicit global WFG`,
        `Diffusion → queries and replies through WFG`,
        `Global-state → edge modification`,
    ],
    correctIndex: 2,
    explanation: `Diffusion computation is built from queries sent out and replies collected back through the WFG.`,
    topic: "Deadlock Detection",
  },
  {
    id: "w4-q14",
    question: `Which of the following is a correct statement regarding deadlock detection?`,
    options: [
        `Only cycles are relevant in every deadlock model`,
        `Deadlock detection involves constructing/maintaining a WFG and searching for deadlock conditions`,
        `Deadlocks can always be detected locally`,
        `Global state detection requires freezing the system`,
    ],
    correctIndex: 1,
    explanation: `Deadlock detection in general means building/maintaining a WFG and then searching it for a deadlock condition (cycle or knot, depending on the model).`,
    topic: "Deadlock Detection",
  },
  {
    id: "w4-q15",
    question: `According to the lecture, distributed deadlock detection algorithms are divided into how many classes?`,
    options: [
        `2`,
        `3`,
        `4`,
        `5`,
    ],
    correctIndex: 2,
    explanation: `Knapp's classification splits distributed deadlock-detection algorithms into exactly four classes.`,
    topic: "Deadlock Detection",
  },
  {
    id: "w4-q16",
    question: `Mitchell and Merritt's algorithm is specifically discussed for:`,
    options: [
        `AND model`,
        `OR model`,
        `Single-resource model`,
        `Unrestricted model`,
    ],
    correctIndex: 2,
    explanation: `Mitchell-Merritt is an edge-chasing algorithm specifically designed for the single-resource request model.`,
    topic: "Deadlock Detection",
  },
  {
    id: "w4-q17",
    question: `For a cycle containing \`s\` processes, the worst-case number of transmit steps in Mitchell-Merritt's algorithm is:`,
    options: [
        `\`s\``,
        `\`s^2\``,
        `\`s(s-1)\``,
        `\`s(s-1)/2\``,
    ],
    correctIndex: 3,
    explanation: `For a cycle of s processes, Mitchell-Merritt's worst-case number of transmit (probe) steps is s(s-1)/2.`,
    topic: "Deadlock Detection",
  },
  {
    id: "w4-q18",
    question: `Distributed Shared Memory provides the programmer with the abstraction of:`,
    options: [
        `Multiple independent memories`,
        `A single monolithic memory`,
        `A centralized processor`,
        `A shared network channel`,
    ],
    correctIndex: 1,
    explanation: `DSM makes a distributed system look, to the programmer, like it has one single shared memory rather than many separate memories.`,
    topic: "Distributed Shared Memory",
  },
  {
    id: "w4-q19",
    question: `In DSM, application programmers primarily use:`,
    options: [
        `Send/receive primitives`,
        `Read/write primitives`,
        `Lock/unlock network primitives only`,
        `Interrupt primitives`,
    ],
    correctIndex: 1,
    explanation: `DSM programmers just issue ordinary read() and write() operations; the DSM manager handles the underlying communication.`,
    topic: "Distributed Shared Memory",
  },
  {
    id: "w4-q20",
    question: `In DSM, send and receive operations are:`,
    options: [
        `Completely absent`,
        `Used internally by the DSM manager`,
        `Used directly by application programmers`,
        `Replaced by hardware interrupts`,
    ],
    correctIndex: 1,
    explanation: `send/receive still happen, but they're hidden inside the DSM manager rather than being used directly by the application.`,
    topic: "Distributed Shared Memory",
  },
  {
    id: "w4-q21",
    question: `Replica management in DSM introduces the problem of:`,
    options: [
        `Routing`,
        `Consistency`,
        `Compilation`,
        `Encryption`,
    ],
    correctIndex: 1,
    explanation: `Once data is replicated across sites, keeping those copies consistent with each other becomes the core problem DSM must solve.`,
    topic: "Distributed Shared Memory",
  },
  {
    id: "w4-q22",
    question: `Which is an advantage of DSM?`,
    options: [
        `Programmer must explicitly manage all communication`,
        `Single address space simplifies passing complex data structures`,
        `It requires a single shared bus`,
        `It eliminates all synchronization issues`,
    ],
    correctIndex: 1,
    explanation: `A single address space lets programmers pass around complex data structures (pointers, structs) without manually serializing and sending them.`,
    topic: "Distributed Shared Memory",
  },
  {
    id: "w4-q23",
    question: `DSM can exploit:`,
    options: [
        `Locality of reference`,
        `Only temporal ordering`,
        `Only network topology`,
        `CPU pipelining`,
    ],
    correctIndex: 0,
    explanation: `DSM can cache/replicate frequently accessed data close to where it's used, exploiting locality of reference.`,
    topic: "Distributed Shared Memory",
  },
  {
    id: "w4-q24",
    question: `Which is a disadvantage of DSM?`,
    options: [
        `It provides no shared abstraction`,
        `Programmers need to understand consistency models`,
        `It cannot use caching`,
        `It cannot replicate data`,
    ],
    correctIndex: 1,
    explanation: `Because the DSM manager hides communication, the programmer instead has to understand which consistency model the DSM provides.`,
    topic: "Distributed Shared Memory",
  },
  {
    id: "w4-q25",
    question: `Which of the following is an implementation issue in DSM?`,
    options: [
        `Replica location`,
        `Number of CPU registers`,
        `Instruction pipelining`,
        `Compiler optimization only`,
    ],
    correctIndex: 0,
    explanation: `Deciding where replicas should live (replica placement/location) is a core DSM implementation issue.`,
    topic: "Distributed Shared Memory",
  },
  {
    id: "w4-q26",
    question: `If a DSM does not fully replicate data, it may need to determine:`,
    options: [
        `The nearest location containing the required data`,
        `The fastest CPU in the system`,
        `The root node of the network`,
        `The largest memory`,
    ],
    correctIndex: 0,
    explanation: `Without full replication, an access may need to locate the nearest node holding a copy of the needed data.`,
    topic: "Distributed Shared Memory",
  },
  {
    id: "w4-q27",
    question: `Which consistency model requires operations to respect real-time ordering?`,
    options: [
        `PRAM consistency`,
        `Causal consistency`,
        `Linearizability`,
        `Slow memory`,
    ],
    correctIndex: 2,
    explanation: `Linearizability is the one model in the hierarchy that explicitly requires operations to respect real (wall-clock) time ordering.`,
    topic: "Consistency Models",
  },
  {
    id: "w4-q28",
    question: `Sequential consistency requires:`,
    options: [
        `Real-time order across all processors`,
        `Preservation of each processor's program order and a single common interleaving`,
        `Only causal writes to be ordered`,
        `No ordering constraints`,
    ],
    correctIndex: 1,
    explanation: `Sequential consistency needs two things: each processor's own program order is preserved, and all processors agree on one common interleaving of all operations.`,
    topic: "Consistency Models",
  },
  {
    id: "w4-q29",
    question: `Consider two processors \`P_1\` and \`P_2\`. Under sequential consistency:`,
    options: [
        `The real-time order between operations of \`P_1\` and \`P_2\` must always be preserved`,
        `Each processor's program order must be preserved`,
        `No processor ordering is required`,
        `Only writes need ordering`,
    ],
    correctIndex: 1,
    explanation: `Sequential consistency only requires each processor's own program order to be respected — not real-time order across different processors.`,
    topic: "Consistency Models",
  },
  {
    id: "w4-q30",
    question: `Causal consistency requires:`,
    options: [
        `All writes to be seen in exactly the same order`,
        `Causally related writes to be seen in the same order`,
        `Only writes from the same processor to be ordered`,
        `No ordering of writes`,
    ],
    correctIndex: 1,
    explanation: `Causal consistency only forces writes that are causally related (by potential influence) to be seen in the same order by everyone; unrelated writes can be seen differently.`,
    topic: "Consistency Models",
  },
  {
    id: "w4-q31",
    question: `Under PRAM consistency:`,
    options: [
        `All processors must observe all writes in the same order`,
        `Writes from the same processor are seen in order`,
        `Real-time ordering must be preserved`,
        `Only reads are ordered`,
    ],
    correctIndex: 1,
    explanation: `PRAM guarantees that writes issued by the same processor are seen by others in the order they were issued.`,
    topic: "Consistency Models",
  },
  {
    id: "w4-q32",
    question: `Under PRAM consistency, writes from different processors:`,
    options: [
        `Must always be seen in the same order`,
        `May be seen in different orders`,
        `Are never visible`,
        `Must obey real-time ordering`,
    ],
    correctIndex: 1,
    explanation: `PRAM says nothing about the relative order of writes coming from different processors — those can be seen in different orders by different processes.`,
    topic: "Consistency Models",
  },
  {
    id: "w4-q33",
    question: `Which consistency model is weaker than PRAM according to the lecture's hierarchy?`,
    options: [
        `Sequential consistency`,
        `Causal consistency`,
        `Linearizability`,
        `Slow memory`,
    ],
    correctIndex: 3,
    explanation: `In the lecture's strongest-to-weakest hierarchy, slow memory sits below PRAM, making it the weakest of the listed options.`,
    topic: "Consistency Models",
  },
  {
    id: "w4-q34",
    question: `Arrange the following from **strongest to weakest** consistency: 1. PRAM 2. Linearizability 3. Slow Memory 4. Sequential Consistency 5. Causal Consistency`,
    options: [
        `2 -> 4 -> 5 -> 1 -> 3`,
        `4 -> 2 -> 5 -> 1 -> 3`,
        `2 -> 5 -> 4 -> 1 -> 3`,
        `3 -> 1 -> 5 -> 4 -> 2`,
    ],
    correctIndex: 0,
    explanation: `The full ordering, strongest to weakest, is Linearizability -> Sequential -> Causal -> PRAM -> Slow Memory, i.e. 2 -> 4 -> 5 -> 1 -> 3.`,
    topic: "Consistency Models",
  },
  {
    id: "w4-q35",
    question: `Which model requires writes from the same processor to be observed in order?`,
    options: [
        `PRAM`,
        `Linearizability only`,
        `None`,
        `Unrestricted model`,
    ],
    correctIndex: 0,
    explanation: `PRAM (Pipelined RAM) is defined by requiring a single processor's writes to be observed by others in the order issued.`,
    topic: "Consistency Models",
  },
  {
    id: "w4-q36",
    question: `The key idea behind slow memory consistency is:`,
    options: [
        `All writes globally occur in real-time order`,
        `Writes by the same processor to the same location are observed in order`,
        `Causally related writes are ordered`,
        `All writes from all processors are globally ordered`,
    ],
    correctIndex: 1,
    explanation: `Slow memory only requires that writes from the same processor to the same memory location be seen in order — even weaker than PRAM's per-processor guarantee.`,
    topic: "Consistency Models",
  },
  {
    id: "w4-q37",
    question: `Weak consistency primarily emphasizes:`,
    options: [
        `Synchronization operations`,
        `Processor speed`,
        `Network topology`,
        `Global snapshots`,
    ],
    correctIndex: 0,
    explanation: `Weak consistency concentrates ordering guarantees around synchronization operations (like barriers), leaving ordinary data accesses free to be reordered.`,
    topic: "Consistency Models",
  },
  {
    id: "w4-q38",
    question: `In release consistency, an **acquire** operation is associated with:`,
    options: [
        `Leaving a critical section`,
        `Entering a critical section`,
        `Creating a process`,
        `Terminating a process`,
    ],
    correctIndex: 1,
    explanation: `An acquire operation marks a process entering a critical section, and pulls in updates made by others before continuing.`,
    topic: "Consistency Models",
  },
  {
    id: "w4-q39",
    question: `In release consistency, a **release** operation is associated with:`,
    options: [
        `Entering a critical section`,
        `Leaving a critical section`,
        `Creating a replica`,
        `Reading a variable`,
    ],
    correctIndex: 1,
    explanation: `A release operation marks a process leaving a critical section, at which point its local updates get propagated to other replicas.`,
    topic: "Consistency Models",
  },
  {
    id: "w4-q40",
    question: `In lazy release consistency, updates are propagated:`,
    options: [
        `Immediately after every write`,
        `On demand when needed`,
        `Only at system startup`,
        `Never`,
    ],
    correctIndex: 1,
    explanation: `Lazy release consistency delays propagating updates until they are actually needed (on demand), rather than pushing them out immediately at release time.`,
    topic: "Consistency Models",
  },
  {
    id: "w4-q41",
    question: `In entry consistency, data is associated with:`,
    options: [
        `A processor ID`,
        `A synchronization variable`,
        `A network address`,
        `A process state`,
    ],
    correctIndex: 1,
    explanation: `Entry consistency ties each ordinary shared variable to a specific synchronization variable (like a lock), so only the relevant data syncs on acquire/release.`,
    topic: "Consistency Models",
  },
  {
    id: "w4-q42",
    question: `Lamport's Bakery Algorithm is primarily used for:`,
    options: [
        `Deadlock detection`,
        `Distributed MST construction`,
        `Mutual exclusion`,
        `Leader election`,
    ],
    correctIndex: 2,
    explanation: `Lamport's Bakery Algorithm is a classic solution to the n-process mutual exclusion problem.`,
    topic: "Bakery Algorithm",
  },
  {
    id: "w4-q43",
    question: `The Bakery Algorithm is designed for:`,
    options: [
        `Two processes only`,
        `Exactly three processes`,
        `\`n\` processes`,
        `A single process`,
    ],
    correctIndex: 2,
    explanation: `Unlike two-process solutions, the Bakery Algorithm is explicitly designed to work for n processes.`,
    topic: "Bakery Algorithm",
  },
  {
    id: "w4-q44",
    question: `A process in the Bakery Algorithm obtains a:`,
    options: [
        `Random number`,
        `Ticket number`,
        `Hash value`,
        `Timestamp from a central server`,
    ],
    correctIndex: 1,
    explanation: `Each process picks a ticket number (like customers at a bakery counter) and waits its turn based on that number.`,
    topic: "Bakery Algorithm",
  },
  {
    id: "w4-q45",
    question: `If two processes obtain the same ticket number, how does the Bakery Algorithm break the tie?`,
    options: [
        `Random selection`,
        `Processor speed`,
        `Process ID`,
        `Arrival time`,
    ],
    correctIndex: 2,
    explanation: `Ties on equal ticket numbers are broken using the process ID, giving the lexicographic ordering (ticket, PID).`,
    topic: "Bakery Algorithm",
  },
  {
    id: "w4-q46",
    question: `Which of the following is NOT a desired property of the Bakery Algorithm?`,
    options: [
        `Mutual exclusion`,
        `Bounded waiting`,
        `Progress`,
        `Deadlock creation`,
    ],
    correctIndex: 3,
    explanation: `The Bakery Algorithm is designed to guarantee mutual exclusion, progress, and bounded waiting — creating deadlock is the opposite of what it achieves.`,
    topic: "Bakery Algorithm",
  },
  {
    id: "w4-q47",
    question: `The approximate time complexity of Lamport's Bakery Algorithm given in the lecture is:`,
    options: [
        `\`O(1)\``,
        `\`O(\\log n)\``,
        `\`O(n)\``,
        `\`O(n^2)\``,
    ],
    correctIndex: 2,
    explanation: `The lecture gives the Bakery Algorithm's time complexity as O(n), since a process can be overtaken by every other process at most once.`,
    topic: "Bakery Algorithm",
  },
  {
    id: "w4-q48",
    question: `GHS stands for:`,
    options: [
        `Gallager, Herman, Singhal`,
        `Gallager, Humblet, Spira`,
        `Gligor, Haas, Spira`,
        `Gallager, Haas, Singhal`,
    ],
    correctIndex: 1,
    explanation: `GHS is named after its inventors: Gallager, Humblet, and Spira.`,
    topic: "Distributed MST / GHS",
  },
  {
    id: "w4-q49",
    question: `The GHS algorithm was introduced in:`,
    options: [
        `1979`,
        `1980`,
        `1983`,
        `1994`,
    ],
    correctIndex: 2,
    explanation: `The lecture dates the GHS algorithm to 1983.`,
    topic: "Distributed MST / GHS",
  },
  {
    id: "w4-q50",
    question: `GHS constructs:`,
    options: [
        `Shortest path tree`,
        `Minimum-weight spanning tree`,
        `Maximum spanning tree`,
        `BFS tree`,
    ],
    correctIndex: 1,
    explanation: `GHS is a distributed algorithm for constructing a minimum-weight spanning tree (MST) of the network.`,
    topic: "Distributed MST / GHS",
  },
  {
    id: "w4-q51",
    question: `GHS assumes the graph is:`,
    options: [
        `Directed and disconnected`,
        `Connected and undirected`,
        `Directed and connected`,
        `Undirected and disconnected`,
    ],
    correctIndex: 1,
    explanation: `GHS assumes the underlying communication graph is connected and undirected.`,
    topic: "Distributed MST / GHS",
  },
  {
    id: "w4-q52",
    question: `An important assumption of GHS is that:`,
    options: [
        `All edges have equal weights`,
        `Edge weights are distinct and finite`,
        `Nodes know the entire graph`,
        `Only one node knows edge weights`,
    ],
    correctIndex: 1,
    explanation: `GHS requires that all edge weights be distinct and finite, which also guarantees a unique MST.`,
    topic: "Distributed MST / GHS",
  },
  {
    id: "w4-q53",
    question: `Initially, each node in synchronous GHS is considered:`,
    options: [
        `A root`,
        `A fragment`,
        `A branch`,
        `A rejected edge`,
    ],
    correctIndex: 1,
    explanation: `At the very start of (synchronous) GHS, every single node is its own level-0 fragment.`,
    topic: "Distributed MST / GHS",
  },
  {
    id: "w4-q54",
    question: `Each fragment finds its:`,
    options: [
        `Maximum Weight Incoming Edge`,
        `Minimum Weight Outgoing Edge`,
        `Maximum Weight Outgoing Edge`,
        `Minimum Weight Internal Edge`,
    ],
    correctIndex: 1,
    explanation: `Each fragment searches for its Minimum Weight Outgoing Edge (MWOE) — the cheapest edge leaving the fragment without creating a cycle.`,
    topic: "Distributed MST / GHS",
  },
  {
    id: "w4-q55",
    question: `MWOE stands for:`,
    options: [
        `Minimum Weight Overall Edge`,
        `Maximum Weight Outgoing Edge`,
        `Minimum Weight Outgoing Edge`,
        `Minimum Weighted Ordered Edge`,
    ],
    correctIndex: 2,
    explanation: `MWOE stands for Minimum Weight Outgoing Edge, the edge a fragment uses to safely merge with another fragment.`,
    topic: "Distributed MST / GHS",
  },
  {
    id: "w4-q56",
    question: `Synchronous GHS repeatedly:`,
    options: [
        `Finds MWOE and merges fragments`,
        `Finds shortest paths`,
        `Elects a leader`,
        `Takes global snapshots`,
    ],
    correctIndex: 0,
    explanation: `Synchronous GHS proceeds in rounds, each time finding the MWOE of every fragment and merging fragments across it.`,
    topic: "Distributed MST / GHS",
  },
  {
    id: "w4-q57",
    question: `In asynchronous GHS, each fragment has:`,
    options: [
        `A priority queue`,
        `A level`,
        `A timestamp only`,
        `A global identifier`,
    ],
    correctIndex: 1,
    explanation: `In asynchronous GHS, each fragment tracks a level, which governs how fragments are allowed to merge (join vs absorption).`,
    topic: "Distributed MST / GHS",
  },
  {
    id: "w4-q58",
    question: `Initially, the level of every fragment in asynchronous GHS is:`,
    options: [
        `0`,
        `1`,
        `-1`,
        `\`N\``,
    ],
    correctIndex: 0,
    explanation: `Every node/fragment starts at level 0 in asynchronous GHS before any merging has happened.`,
    topic: "Distributed MST / GHS",
  },
  {
    id: "w4-q59",
    question: `Asynchronous GHS has two types of merges:`,
    options: [
        `Push and pull`,
        `Join and absorption`,
        `Split and join`,
        `Accept and reject`,
    ],
    correctIndex: 1,
    explanation: `Asynchronous GHS fragments combine either by join (same level) or absorption (different levels).`,
    topic: "Distributed MST / GHS",
  },
  {
    id: "w4-q60",
    question: `Initially, a node knows:`,
    options: [
        `The complete graph topology`,
        `Only the weights of its adjacent edges`,
        `All edge weights`,
        `Only the MST`,
    ],
    correctIndex: 1,
    explanation: `Initially a node only knows the weights of the edges incident to itself — not the rest of the graph.`,
    topic: "Distributed MST / GHS",
  },
  {
    id: "w4-q61",
    question: `Which statement is TRUE?`,
    options: [
        `Sequential consistency preserves global real-time order`,
        `Linearizability does not care about real-time order`,
        `Sequential consistency preserves each processor's program order`,
        `PRAM requires all processors to see writes in the same order`,
    ],
    correctIndex: 2,
    explanation: `Sequential consistency's defining requirement is that each processor's own program order is preserved, not global real-time order (that's linearizability).`,
    topic: "Mixed / Trap Questions",
  },
  {
    id: "w4-q62",
    question: `Which pairing is INCORRECT?`,
    options: [
        `Edge-chasing — Probes`,
        `Path-pushing — Global WFG`,
        `Diffusion — Queries and replies`,
        `Global-state detection — MWOE`,
    ],
    correctIndex: 3,
    explanation: `Global-state detection is based on taking a consistent snapshot, not on computing an MWOE — MWOE belongs to GHS/MST, not deadlock detection.`,
    topic: "Mixed / Trap Questions",
  },
  {
    id: "w4-q63",
    question: `Which is stronger?`,
    options: [
        `PRAM consistency`,
        `Causal consistency`,
        `Sequential consistency`,
        `Slow memory`,
    ],
    correctIndex: 2,
    explanation: `Sequential consistency sits above causal, PRAM, and slow memory in the hierarchy, making it the strongest of these four options.`,
    topic: "Mixed / Trap Questions",
  },
  {
    id: "w4-q64",
    question: `Which sequence is correct?`,
    options: [
        `Causal -> Sequential -> Linearizability`,
        `Linearizability -> Sequential -> Causal`,
        `PRAM -> Causal -> Linearizability`,
        `Slow Memory -> PRAM -> Linearizability`,
    ],
    correctIndex: 1,
    explanation: `The correct strongest-to-weakest order among these is Linearizability -> Sequential -> Causal.`,
    topic: "Mixed / Trap Questions",
  },
  {
    id: "w4-q65",
    question: `In GHS, the fundamental edge used to connect fragments is the:`,
    options: [
        `Maximum weight internal edge`,
        `Minimum weight outgoing edge`,
        `Maximum weight outgoing edge`,
        `Minimum weight internal edge`,
    ],
    correctIndex: 1,
    explanation: `Fragments in GHS always connect to each other over their Minimum Weight Outgoing Edge.`,
    topic: "Mixed / Trap Questions",
  },
  {
    id: "w4-q66",
    question: `Which algorithm is specifically associated with the Single-Resource model?`,
    options: [
        `GHS`,
        `Lamport Bakery`,
        `Mitchell-Merritt`,
        `Prim`,
    ],
    correctIndex: 2,
    explanation: `Mitchell-Merritt's algorithm is the edge-chasing technique specifically built for the single-resource deadlock model.`,
    topic: "Mixed / Trap Questions",
  },
  {
    id: "w4-q67",
    question: `Which of the following is NOT an advantage of DSM?`,
    options: [
        `Single address space`,
        `Hides send/receive operations`,
        `Eliminates consistency concerns`,
        `Exploits locality of reference`,
    ],
    correctIndex: 2,
    explanation: `DSM does not eliminate consistency concerns — replication actually introduces the consistency problem the programmer must reason about.`,
    topic: "Mixed / Trap Questions",
  },
  {
    id: "w4-q68",
    question: `Which statement about GHS is FALSE?`,
    options: [
        `It works on connected undirected graphs`,
        `Nodes initially know adjacent edge weights`,
        `It constructs an MST`,
        `Every node initially knows the complete graph`,
    ],
    correctIndex: 3,
    explanation: `Nodes never know the complete graph topology up front in GHS; they only start out knowing their own incident edge weights, which is why the algorithm is needed at all.`,
    topic: "Mixed / Trap Questions",
  },
  {
    id: "w4-q69",
    question: `Which deadlock-detection technique uses a consistent snapshot?`,
    options: [
        `Path-pushing`,
        `Edge-chasing`,
        `Global-state detection`,
        `Mitchell-Merritt`,
    ],
    correctIndex: 2,
    explanation: `Global-state detection is the deadlock-detection class that works by capturing and examining a consistent snapshot of the system.`,
    topic: "Mixed / Trap Questions",
  },
  {
    id: "w4-q70",
    question: `If a cycle has \`s=5\` processes, the worst-case Mitchell-Merritt transmit steps are:`,
    options: [
        `5`,
        `10`,
        `15`,
        `20`,
    ],
    correctIndex: 1,
    explanation: `For s = 5, s(s-1)/2 = 5 x 4 / 2 = 10 worst-case transmit steps.`,
    topic: "Mixed / Trap Questions",
  },
  ],

  flashcards: [
  {
    id: "w4-f1",
    front: `What does an edge Pi -> Pj mean in a Wait-For Graph (WFG)?`,
    back: `Pi is blocked, waiting for a resource held by Pj.`,
  },
  {
    id: "w4-f2",
    front: `What two structures can a WFG contain that signal deadlock, and under which models?`,
    back: `A cycle (AND model, single-resource model) or a knot (OR model).`,
  },
  {
    id: "w4-f3",
    front: `Name the three deadlock handling strategies.`,
    back: `Prevention (avoid it structurally), avoidance (only grant if the resulting state is safe), and detection (let it happen, then detect and resolve it).`,
  },
  {
    id: "w4-f4",
    front: `What are the two correctness criteria for a deadlock detection algorithm?`,
    back: `Progress (no undetected deadlocks — every real deadlock is eventually found) and Safety (no false/phantom deadlocks are reported).`,
  },
  {
    id: "w4-f5",
    front: `What is a 'phantom deadlock'?`,
    back: `A deadlock falsely reported by a detection algorithm that doesn't actually exist — a safety violation.`,
  },
  {
    id: "w4-f6",
    front: `Single Resource model: request pattern and deadlock indicator?`,
    back: `A process has at most one outstanding request (out-degree <= 1); a cycle in the WFG means deadlock.`,
  },
  {
    id: "w4-f7",
    front: `AND model: request pattern and deadlock indicator?`,
    back: `A process needs ALL of several requested resources simultaneously; a cycle in the WFG indicates deadlock.`,
  },
  {
    id: "w4-f8",
    front: `OR model: request pattern and deadlock indicator?`,
    back: `A process needs ANY ONE of several requested resources; a cycle does NOT necessarily mean deadlock — a knot does.`,
  },
  {
    id: "w4-f9",
    front: `Quick mnemonic for AND vs OR deadlock indicator?`,
    back: `AND -> Cycle, OR -> Knot.`,
  },
  {
    id: "w4-f10",
    front: `What is the P-out-of-Q model?`,
    back: `A process needs any k resources out of a set of n (a compact generalization with the same expressive power as AND-OR).`,
  },
  {
    id: "w4-f11",
    front: `What is the Unrestricted deadlock model's only assumption?`,
    back: `That deadlock is a stable property — no assumption is made about the structure of resource requests.`,
  },
  {
    id: "w4-f12",
    front: `List Knapp's four classes of distributed deadlock detection algorithms.`,
    back: `Path-pushing, edge-chasing, diffusion computation, and global-state detection.`,
  },
  {
    id: "w4-f13",
    front: `Path-pushing: core idea?`,
    back: `Sites explicitly build, exchange, and update a global WFG until one site has enough information to detect a deadlock.`,
  },
  {
    id: "w4-f14",
    front: `Edge-chasing: core idea?`,
    back: `Special, fixed-size probe messages are propagated along WFG edges by blocked processes; a probe returning to its origin signals a deadlock.`,
  },
  {
    id: "w4-f15",
    front: `Diffusion computation: core idea?`,
    back: `An echo-algorithm style scheme where the initiator sends queries that diffuse through the WFG and collects matching replies; all replies back means deadlock.`,
  },
  {
    id: "w4-f16",
    front: `Global-state detection: core idea?`,
    back: `Take a consistent distributed snapshot (without freezing computation) and examine it for a deadlock, since deadlock is a stable property.`,
  },
  {
    id: "w4-f17",
    front: `In edge-chasing, who propagates probes and who doesn't?`,
    back: `Only blocked processes propagate probes along outgoing edges; executing (unblocked) processes discard them.`,
  },
  {
    id: "w4-f18",
    front: `In diffusion computation, when does the initiator detect a deadlock?`,
    back: `When it has received replies to every query it originally sent out.`,
  },
  {
    id: "w4-f19",
    front: `What model is the Mitchell-Merritt algorithm designed for?`,
    back: `The single-resource model, using edge-chasing.`,
  },
  {
    id: "w4-f20",
    front: `What two kinds of labels does each process keep in Mitchell-Merritt?`,
    back: `A private label (unique, changes over time) and a public label (readable by others, may not be unique); each is (count, PID).`,
  },
  {
    id: "w4-f21",
    front: `Mitchell-Merritt worst-case transmit steps for a cycle of s processes?`,
    back: `s(s-1)/2.`,
  },
  {
    id: "w4-f22",
    front: `What abstraction does DSM give the programmer?`,
    back: `A single, monolithic shared memory, accessed via ordinary read()/write() instead of send()/receive().`,
  },
  {
    id: "w4-f23",
    front: `Who actually uses send/receive in a DSM system?`,
    back: `The DSM manager internally — the application programmer never calls them directly.`,
  },
  {
    id: "w4-f24",
    front: `Name three advantages of DSM.`,
    back: `Hides send/receive, gives a single address space (simplifies passing complex data structures), and exploits locality of reference (any three of the listed advantages).`,
  },
  {
    id: "w4-f25",
    front: `Name the main disadvantage of DSM.`,
    back: `Programmers must understand the underlying consistency model — replication introduces consistency issues DSM does not eliminate.`,
  },
  {
    id: "w4-f26",
    front: `What is linearizability also known as?`,
    back: `Strict / atomic consistency — reads must return the most recent write according to real (global) time.`,
  },
  {
    id: "w4-f27",
    front: `What are linearizability's two conditions, C1 and C2?`,
    back: `C1: a Read returns the value of the most recent preceding Write in the linearized order. C2: if op1's response precedes op2's invocation in real time, op1 must precede op2 in the linearization.`,
  },
  {
    id: "w4-f28",
    front: `What are sequential consistency's two requirements?`,
    back: `Each processor's own program order is preserved, and all processors observe the same global interleaving of operations.`,
  },
  {
    id: "w4-f29",
    front: `Does sequential consistency require real-time ordering across processors?`,
    back: `No — that's the key trap. Only linearizability requires real-time ordering.`,
  },
  {
    id: "w4-f30",
    front: `What does causal consistency require?`,
    back: `Only causally related writes (via program order, write-then-read dependency, or their transitive closure) must be seen in the same order by all processes; independent writes can be seen differently.`,
  },
  {
    id: "w4-f31",
    front: `What does PRAM (Pipelined RAM) consistency require?`,
    back: `Writes from the same processor must be seen by others in the order issued; writes from different processors may be seen in different orders.`,
  },
  {
    id: "w4-f32",
    front: `What does slow memory consistency require, and how does it differ from PRAM?`,
    back: `Only writes from the same processor to the SAME memory location need to be seen in order — even weaker than PRAM's per-processor (all-location) guarantee.`,
  },
  {
    id: "w4-f33",
    front: `Recite the consistency hierarchy, strongest to weakest.`,
    back: `Linearizability > Sequential Consistency > Causal Consistency > PRAM > Slow Memory.`,
  },
  {
    id: "w4-f34",
    front: `What does weak consistency emphasize?`,
    back: `Ordering guarantees mainly apply at synchronization operations (e.g. barriers); ordinary data operations can be reordered.`,
  },
  {
    id: "w4-f35",
    front: `Release consistency: what do 'acquire' and 'release' mean?`,
    back: `Acquire = entering a critical section (pull in others' updates); Release = leaving a critical section (push out local updates).`,
  },
  {
    id: "w4-f36",
    front: `What is lazy release consistency?`,
    back: `A release-consistency variant where updates are propagated on demand rather than immediately at release time.`,
  },
  {
    id: "w4-f37",
    front: `What does entry consistency associate shared data with?`,
    back: `Each ordinary shared variable is tied to a specific synchronization variable (e.g. a lock); only variables tied to that lock sync on acquire/release.`,
  },
  {
    id: "w4-f38",
    front: `What problem does Lamport's Bakery Algorithm solve, and for how many processes?`,
    back: `n-process mutual exclusion (not just 2).`,
  },
  {
    id: "w4-f39",
    front: `How does a process get priority in the Bakery Algorithm?`,
    back: `It picks a ticket number and waits for all processes with a smaller (ticket, PID) pair; ties are broken by process ID.`,
  },
  {
    id: "w4-f40",
    front: `What three properties does the Bakery Algorithm guarantee?`,
    back: `Mutual exclusion, bounded waiting, and progress.`,
  },
  {
    id: "w4-f41",
    front: `What is the Bakery Algorithm's time complexity?`,
    back: `O(n) — a process can be overtaken by each other process at most once.`,
  },
  {
    id: "w4-f42",
    front: `What does GHS stand for and who introduced it (year)?`,
    back: `Gallager, Humblet, and Spira — introduced in 1983.`,
  },
  {
    id: "w4-f43",
    front: `What does GHS construct, and on what kind of graph?`,
    back: `A minimum-weight spanning tree (MST), on a connected, undirected graph with distinct, finite edge weights.`,
  },
  {
    id: "w4-f44",
    front: `What is an MST 'fragment'?`,
    back: `Any connected subtree of the eventual MST; the algorithm progressively merges fragments until one MST remains.`,
  },
  {
    id: "w4-f45",
    front: `What does MWOE stand for and what is it?`,
    back: `Minimum Weight Outgoing Edge — the lowest-weight edge connecting a fragment to another fragment without creating a cycle.`,
  },
  {
    id: "w4-f46",
    front: `What is the MST cut property that underlies GHS?`,
    back: `A fragment's MWOE can always safely be added to the fragment and still yield a valid MST fragment.`,
  },
  {
    id: "w4-f47",
    front: `Why can't Prim's or Kruskal's algorithm be used directly in a distributed setting?`,
    back: `They process vertices/edges sequentially and generally need knowledge of the whole graph, but distributed nodes initially know only their own incident edges.`,
  },
  {
    id: "w4-f48",
    front: `What does synchronous GHS do in each round?`,
    back: `Every fragment finds its MWOE and merges across it, repeating until one fragment (the MST) remains.`,
  },
  {
    id: "w4-f49",
    front: `What tracks how fragments merge in asynchronous GHS?`,
    back: `A fragment level, starting at 0 for every node; levels determine whether fragments join or one is absorbed.`,
  },
  {
    id: "w4-f50",
    front: `When do two fragments 'join' vs get 'absorbed' in GHS?`,
    back: `Join: equal levels connecting via their MWOE (new level = old level + 1). Absorption: a lower-level fragment merges into a higher-level one, which keeps its level.`,
  },
  {
    id: "w4-f51",
    front: `What are the three edge classifications in GHS?`,
    back: `Basic (undecided), Branch (known MST edge), Rejected (known non-MST edge).`,
  },
  {
    id: "w4-f52",
    front: `What are the three node states in GHS?`,
    back: `Sleeping (initial), Find (searching for MWOE), Found (MWOE already found).`,
  },
  {
    id: "w4-f53",
    front: `What are the three main stages a GHS fragment goes through each level?`,
    back: `Broadcast (spread fragment ID/level), Convergecast (collect MWOE candidates back to the core), Change-Core (move the core toward the MWOE).`,
  },
  {
    id: "w4-f54",
    front: `What is 'best-edge' in GHS convergecast?`,
    back: `The branch each node remembers as leading toward the minimum outgoing edge found in its subtree.`,
  },
  {
    id: "w4-f55",
    front: `What do Test, Accept, and Reject messages do in GHS?`,
    back: `Test checks a candidate basic edge; Accept confirms it leads to a different fragment (candidate MWOE); Reject means both ends are already in the same fragment.`,
  },
  {
    id: "w4-f56",
    front: `What happens when a GHS Test message reaches a lower-level fragment?`,
    back: `The response is delayed until that fragment's level catches up, preventing incorrect merge decisions during asynchronous execution.`,
  },
  {
    id: "w4-f57",
    front: `What is the GHS level bound, and why does it matter?`,
    back: `A level-L fragment has at least 2^L nodes, so L <= log2(N) — this logarithmic bound drives GHS's complexity analysis.`,
  },
  ],
};

export default week4;