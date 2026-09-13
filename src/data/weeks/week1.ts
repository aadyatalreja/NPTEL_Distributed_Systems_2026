import type { WeekData } from "../../types";

const week1: WeekData = {
  week: 1,
  title: "Introduction to Distributed Systems",
  status: "ready",
  pdfUrl: "/pdfs/week1-lecture-notes.pdf",

  notes: [
    {
      heading: "⭐ Complete important-topics checklist",
      body: `Pulled straight from the unit outline — everything below is explicitly covered in the first lecture.

**Unit 1 — Introduction to Distributed Systems**

- Definition of Distributed System
- Characteristics / Properties
- Components of a Distributed System
- Middleware
- Layered Architecture
- Motivation for Distributed Systems
- Advantages
- Reliability
  - Availability
  - Integrity
  - Fault tolerance
- Scalability
- Modularity and incremental expandability
- Design challenges
- Transparency
  - Access
  - Location
  - Migration
  - Relocation
  - Replication
  - Concurrency
  - Failure
- Distributed Algorithms
- Complexity measures
- Asynchrony
- Local knowledge / local view
- Failures
- Safety vs Liveness
- Algorithmic challenges
- Applications of distributed computing`,
    },
    {
      heading: "Unit 1 — Introduction to Distributed Systems",
      body: `#### 1. Definition

A **distributed system** is a collection of independent computers/processors that cooperate to solve a problem that cannot be solved efficiently by one computer.

Important characteristics:
- No shared memory
- No common physical clock
- Communication occurs through **message passing**
- Each computer has its own memory, processor, and operating system
- Components cooperate to achieve a common goal

**Simple example.** Consider Google Search. Instead of one computer handling everything:

\`\`\`text
             User
               |
          Search Request
               |
       -------------------
       |        |        |
     Server   Server   Server
       |        |        |
      DB       DB       DB
       \\        |       /
        ---- Results ---
\`\`\`

Multiple computers cooperate → **Distributed System**.

#### 2. Properties of distributed systems

Remember these **5 important properties**:

1. **Heterogeneity** — different hardware/software components can coexist
2. **Concurrency** — multiple programs/processes execute simultaneously
3. **Shared data** — multiple entities may access common data
4. **No global clock** — every processor has its own notion of time
5. **Interdependencies** — although processors are independent, they depend on each other to accomplish tasks

> ⭐ **Exam question — list the characteristics of distributed systems.** Answer: heterogeneity, concurrency, shared data, absence of a global clock, and interdependencies.

#### 3. Components of a distributed system

A typical distributed system consists of:

\`\`\`text
Application
     ↓
Middleware
     ↓
Network Protocol Stack
     ↓
Operating System
     ↓
Hardware
\`\`\`

**Middleware** is the distributed software layer that allows applications running on different computers to communicate and cooperate. It hides differences between machines and provides **transparency**. Examples: CORBA, RPC, DCOM, RMI, MPI.

Important distinction: **Middleware ≠ Operating System** — middleware sits above the OS and network stack and provides distributed-system functionality.

#### 4. Motivation for distributed systems

1. **Inherently distributed computation** — some problems naturally involve geographically separated entities (banking, reaching consensus between distant parties)
2. **Resource sharing** — databases, peripherals, libraries shared among multiple computers
3. **Remote data/resource access** — remote databases, supercomputers, remote devices
4. **Enhanced reliability** — resources can be replicated so failure of one component doesn't necessarily stop the entire system
5. **Increased performance/cost ratio** — multiple systems share workload and resources
6. **Scalability** — more processors can be added as the system grows
7. **Modularity** — components can be added/replaced independently

#### 5. Reliability

Reliability has **three particularly important aspects**:

\`\`\`text
Reliability
   |
   |--- Availability      the resource/service should remain accessible
   |--- Integrity         data/state stays correct even with concurrent access
   |--- Fault tolerance    system continues functioning or recovers despite failures
\`\`\`

#### 6. Design challenges

The notes divide challenges into **system-level** and **algorithmic** issues.

**Major system challenges:**
- **Communication** — how do processors communicate?
- **Process management** — processes, threads, code migration, mobile agents
- **Synchronization** — coordination when accessing shared resources: mutual exclusion, leader election, clocks, global state recording
- **Fault tolerance** — must maintain correctness despite node/link/process failures, via checkpointing, recovery, consensus, failure detection, distributed commit, self-stabilization

#### 7. Transparency ⭐⭐⭐

**Very important for exams.** Transparency means **hiding the complexity/implementation details of the distributed system from the user**. There are **7 types**:

| Type | Meaning |
| --- | --- |
| Access transparency | Hides differences in data representation/access |
| Location transparency | User doesn't need to know where the resource is |
| Migration transparency | Resource can move without changing its name |
| Relocation transparency | Resource can move while being accessed |
| Replication transparency | User doesn't know multiple copies exist |
| Concurrency transparency | Hides simultaneous access by multiple processes |
| Failure transparency | Hides failures/recovery from the user |

⭐ Memorize all 7.

#### 8. Distributed algorithms

In a normal algorithm we commonly consider time and space complexity. In distributed algorithms, an additional major concern is **communication complexity**: number of messages, size of messages, shared variables, and the number of faulty vs. non-faulty components. Distributed systems also lead to important lower bounds, impossibility results, and negative results.

#### 9. Three fundamental difficulties

This is **VERY important**. Distributed algorithms must deal with:

1. **Asynchrony** — you cannot precisely know when another process will execute or when a message will arrive
2. **Limited knowledge / local view** — a processor only knows information it has received; it does not have a complete view of the global system
3. **Failures** — components can fail independently; one processor may fail while the others continue working

#### 10. Algorithmic challenges

- **Time and global state** — how do we determine time and system state without a global clock?
- **Synchronization** — leader election, mutual exclusion, termination detection, garbage collection
- **Fault tolerance** — consensus, replication, quorum systems, distributed databases, checkpointing, recovery, failure detection
- **Group communication** — multicast, ordered message delivery
- **Distributed shared memory** — provides the abstraction of shared memory while internally using message passing

#### 11. Applications

1. Mobile systems
2. Sensor networks
3. Ubiquitous/pervasive computing
4. Peer-to-peer computing
5. Distributed data mining
6. Grid computing
7. Security in distributed systems — confidentiality, authentication, availability`,
    },
    {
      heading: "Unit 2 — Message Passing Systems",
      body: `#### 12. Message-passing model ⭐⭐⭐

Processors communicate by sending messages through communication channels.

\`\`\`text
P1 -------- Channel -------- P2
 |                            |
Memory                      Memory
\`\`\`

The network topology is determined by the connections/channels between processors. A processor is modeled as a **state machine**. A channel is represented using \`outbuf\` at the sender and \`inbuf\` at the receiver.

#### 13. Configuration

A **configuration** represents the current state of the entire distributed system: processor states, local variables, incoming messages, and channel/outgoing buffer states.

> **Configuration = snapshot of the entire system at a particular point.**

#### 14. Events

Two major events in the basic message-passing model:

1. **Deliver event** — moves a message: sender \`outbuf\` → receiver \`inbuf\`
2. **Computation event** — a processor takes its current accessible state, applies its transition function, processes incoming messages, updates its local state, and produces outgoing messages

#### 15. Execution

\`\`\`text
Configuration → Event → Configuration → Event → Configuration → ...
\`\`\`

> **Execution = sequence of configurations and events.**

#### 16. Safety vs. Liveness ⭐⭐⭐

- **Safety** — "nothing bad ever happens." E.g. two processors should never enter the critical section simultaneously.
- **Liveness** — "something good eventually happens." E.g. a requesting process eventually gets access to the critical section.

Easy memory trick: **Safety = nothing bad. Liveness = something good eventually.** The notes explicitly use this distinction when defining admissible executions.

#### 17. Synchronous vs. Asynchronous systems ⭐⭐⭐

**Synchronous** — processors operate in rounds:

\`\`\`text
Round 1 → Send messages → Messages delivered → Compute → Round 2
\`\`\`

Every processor operates in lockstep; time is measured in **rounds**.

**Asynchronous** — no fixed upper bound on message delivery time or processor execution time. A message may be delayed arbitrarily long.

| Synchronous | Asynchronous |
| --- | --- |
| Lockstep execution | No lockstep |
| Rounds | No fixed rounds |
| Known timing bounds | No fixed timing bounds |
| Easier to analyze | Harder to analyze |
| Time = rounds | Time depends on execution |

#### 18. Broadcast ⭐⭐⭐

Purpose: send information from one processor to all processors. Assume a rooted spanning tree already exists.

\`\`\`text
             Root
            /    \\
           A      B
         /  \\      \\
        C    D      E
\`\`\`

\`\`\`text
Root sends M → Children receive M → Children forward M → All nodes receive M
\`\`\`

**Complexity:** messages = **n − 1**, time = **depth d**. This holds in both synchronous and asynchronous models.

#### 19. Convergecast ⭐⭐⭐

Basically the **opposite of broadcast** — collect information from all processors toward the root. Leaves send information to parents; each parent waits for all children, combines/aggregates the information, then sends the result upward.

Easy memory: **Broadcast → one to many. Convergecast → many to one.**

#### 20. Spanning tree

A **tree** is connected and has no cycles. A **spanning tree** is a tree containing all processors. A **rooted spanning tree** additionally has one designated root.

#### 21. Finding a spanning tree with a root

1. Root sends message \`M\` to all neighbors.
2. When a non-root node receives \`M\` for the first time: the sender becomes its parent, it sends \`parent\`, and it forwards \`M\` to other neighbors.
3. If it receives \`M\` again, it sends \`reject\`.
4. Parent/reject responses help construct the tree.

**Complexity:** messages = **O(m)**, time = **O(diameter)**.

Important distinction: **synchronous execution → BFS tree**, **asynchronous execution → not necessarily BFS**.

#### 22. DFS spanning tree

The previous algorithm does not guarantee DFS in asynchronous systems. To force DFS: explore neighbors **one at a time**, waiting for a response before moving to the next neighbor. This guarantees a DFS spanning tree.

**Complexity:** messages = **O(m)**, time = **O(m)**.

#### 23. Spanning tree without a root

If there is no predefined root: processors need **unique IDs**. Every processor starts a DFS algorithm assuming itself is root. Messages carry the initiator's ID; when two copies collide, the larger ID wins.

**Complexity:** messages = **O(nm)**, time = **O(m)**.`,
    },
    {
      heading: "Unit 3 — Leader Election",
      body: `#### 24. Leader election ⭐⭐⭐⭐⭐

Very important topic. Goal: **exactly one processor** should be elected as leader. Every processor eventually decides Leader or Non-leader — exactly one must choose Leader.

Why? A leader can coordinate spanning tree construction, token recovery, and general system coordination.

#### 25. Ring network

Processors form a ring:

\`\`\`text
P1 → P2 → P3
↑          ↓
P6 ← P5 ← P4
\`\`\`

In an **oriented ring**, processors have a common notion of left and right.

#### 26. Anonymous ring ⭐⭐⭐

Processors have **no unique IDs**.

> **Theorem.** Leader election is impossible in an anonymous ring, even if the ring size is known and the system is synchronous.

Why? Initially all processors are identical:

\`\`\`text
Same initial state → Same messages → Same received messages
      → Same state transitions → All behave identically
\`\`\`

If one becomes leader, all would become leaders — that violates "exactly one leader."

> ⭐ **Exam question — why is leader election impossible in an anonymous ring?** This proof is very important.

#### 27. Uniform vs. non-uniform

- **Uniform algorithm** — does not use ring size; the same state machine works for different ring sizes.
- **Non-uniform algorithm** — knows the ring size; a different algorithm/state machine can be designed for each \`n\`.

#### 28. Ring with unique IDs

Each processor has a unique identifier, e.g. \`3 → 37 → 19 → 4 → 25 → back to 3\`. The processor's **index** and **ID** are different — index is used for analysis, ID is what the processor actually knows.

#### 29. LCR algorithm ⭐⭐⭐⭐⭐

**LeLann–Chang–Roberts algorithm.** Goal: elect the processor with the largest ID.

Each processor initially sends its ID. When a processor receives ID \`j\`:
- If \`j > own_ID\` → forward \`j\`
- If \`j < own_ID\` → discard it
- If \`j == own_ID\` → the processor elects itself

**Example:** IDs \`3 → 8 → 5 → 2\`. Largest ID = 8. Eventually \`8 → 5 → 2 → 3 → 8\` — processor 8 receives its own ID → **8 becomes leader**.

**Complexity:** time = **O(n)**, worst-case messages = **Θ(n²)**. The worst arrangement causes \`n + (n−1) + (n−2) + ... + 1\` messages.

#### 30. Hirschberg–Sinclair algorithm ⭐⭐⭐⭐⭐

Designed to improve LCR's message complexity — **O(n log n)** messages. Instead of sending IDs all the way around the ring immediately, processors compete in **phases**.

In phase \`k\`, a processor checks a neighborhood of approximately \`2^k\` in each direction. Only processors with sufficiently large IDs survive to the next phase:

\`\`\`text
Many candidates → Fewer candidates → Even fewer → One winner
\`\`\`

#### 31. HS phases

- **Phase 0** — every processor probes its two immediate neighbors.
- **Phase 1** — winners probe farther.
- **Phase 2** — probe distance increases again.

Generally, phase \`k\` → probe distance = \`2^k\`. If a larger ID is encountered, the probe is swallowed. If the probe reaches the end of its neighborhood, a reply is sent back. If both replies return, the processor survives to the next phase. If a processor receives its **own probe**, it is the leader.

#### 32. LCR vs. HS ⭐⭐⭐⭐⭐

| Feature | LCR | Hirschberg–Sinclair |
| --- | --- | --- |
| Basic idea | Forward IDs | Probes + phases |
| Winner | Largest ID | Largest ID |
| Time | O(n) | Depends on execution model |
| Worst messages | Θ(n²) | O(n log n) |
| Complexity | Simple | More complex |
| Synchronous | Yes | Yes |
| Asynchronous | Yes | Yes |

The key exam comparison: **LCR = O(n²) messages. HS = O(n log n) messages.**

#### 33. Lower bound ⭐⭐⭐⭐⭐

Very important theoretical result. For an **asynchronous ring whose size is not known beforehand**, any leader-election algorithm requires **Ω(n log n)** messages — so HS's O(n log n) is asymptotically optimal.

\`\`\`text
Asynchronous ring → Lower bound → Ω(n log n)
\`\`\``,
    },
    {
      heading: "Unit 4 — Models of Distributed Computation",
      body: `#### 34. Distributed program

A distributed program consists of \`p1, p2, ..., pn\` asynchronous processes. Message transmission delay is **finite but unpredictable**.

#### 35. Three types of events ⭐⭐⭐

At each process:
1. **Internal event** — only changes the local state
2. **Send event** — process sends a message
3. **Receive event** — process receives a message

#### 36. Space-time diagram ⭐⭐⭐

Used to represent distributed execution:

\`\`\`text
P1  ───●────●────────●────
          \\            \\
P2  ───────●────●──────●──
             \\
P3  ──────────●────────────
\`\`\`

Horizontal line → process, dot → event, slanted arrow → message transfer.

#### 37. Partial order ⭐⭐⭐

A relation is a **partial order** if it is reflexive, antisymmetric, and transitive. A partially ordered set is called a **poset**. A **total order** is a partial order where every pair of elements is comparable — this becomes important for understanding event ordering.

#### 38. Causality ⭐⭐⭐⭐⭐

One of the most important parts of the unit. Distributed systems don't have a global physical clock, so we need another way to determine: did event A influence event B? This is **causality**.

#### 39. Happens-before relation ⭐⭐⭐⭐⭐

Lamport's **happens-before relation**, written →. For two events, \`e1 → e2\` means e1 causally occurred before e2. Two important sources of causal ordering:

- **Same process** — \`e1 → e2\` because e1 occurs before e2 on the same process
- **Message** — \`send(m) → receive(m)\` because receiving a message depends on sending it

#### 40. Transitivity

If \`e1 → e2\` and \`e2 → e3\` then \`e1 → e3\`. Extremely important when solving happens-before diagrams.

#### 41. Concurrent events ⭐⭐⭐⭐⭐

Two events are concurrent if neither causally affects the other: \`e1 || e2\` means \`NOT(e1 → e2) AND NOT(e2 → e1)\`.

Important: concurrent does **not** necessarily mean they happened at exactly the same physical time — they can occur at different physical times but still be logically concurrent.

#### 42. Physical vs. logical concurrency

- **Physical concurrency** — events happen at the same physical instant
- **Logical concurrency** — events have no causal relationship

This distinction is very important.

#### 43. Communication models

- **FIFO** — messages from the same sender are delivered in the same order they were sent
- **Non-FIFO** — messages may be delivered in arbitrary order
- **Causal ordering** — causally related messages must be delivered in causal order

\`\`\`text
Causal Ordering ⊂ FIFO ⊂ Non-FIFO
\`\`\`

#### 44. Logical clocks ⭐⭐⭐⭐⭐

Because distributed systems don't have a global physical clock, we use **logical clocks**. Three types: scalar time, vector time, matrix time.

#### 45. Logical clock consistency

A logical clock \`C\` maps an event to a timestamp. Basic consistency requirement: if \`ei → ej\` then \`C(ei) < C(ej)\` — if event A causally precedes event B, A's timestamp must be smaller.

#### 46. Strong consistency

A clock is **strongly consistent** when \`ei → ej ⇔ C(ei) < C(ej)\` — the clock ordering exactly captures causal ordering.

#### 47. Scalar / Lamport clock ⭐⭐⭐⭐⭐

Proposed by **Leslie Lamport in 1978**. Each process maintains an integer clock \`Ci\`.

- **Rule R1** — before an event: \`Ci = Ci + d\` (usually \`d = 1\`)
- **Message rule** — a message carries the sender's timestamp; at the receiver: \`Cj = max(Cj, received_timestamp) + 1\`

Purpose: ensure \`e1 → e2\` implies \`C(e1) < C(e2)\`.

#### 48. Scalar clock limitation

Lamport clocks can tell us \`e1 → e2\`, but \`C(e1) < C(e2)\` does **NOT necessarily mean** \`e1 → e2\` — the two events may be concurrent. This is why **vector clocks** are more powerful for detecting concurrency.`,
    },
    {
      heading: "⭐ Most important topics to study first",
      body: `If you're preparing for an exam, prioritize these.

#### 🔥 Tier 1 — must know

1. Definition and characteristics of Distributed Systems
2. Advantages/motivation
3. Transparency — **all 7 types**
4. System challenges
5. Synchronous vs asynchronous systems
6. Message-passing model
7. Broadcast
8. Convergecast
9. Spanning tree algorithms
10. BFS vs DFS spanning tree
11. Leader election problem
12. Anonymous ring impossibility theorem
13. **LCR algorithm**
14. **Hirschberg-Sinclair algorithm**
15. LCR vs HS complexity
16. Leader-election lower bound
17. Distributed execution model
18. Internal/send/receive events
19. Space-time diagrams
20. Happens-before relation
21. Causality
22. Concurrent events
23. FIFO vs non-FIFO vs causal ordering
24. Logical clocks
25. Scalar/Lamport clock

#### ⭐ Complexities to memorize

| Algorithm | Message Complexity | Time Complexity |
| --- | ---: | ---: |
| Broadcast | **n − 1** | **O(d)** |
| Convergecast | Based on tree edges | **O(d)** |
| Rooted spanning tree | **O(m)** | **O(diam)** |
| DFS spanning tree | **O(m)** | **O(m)** |
| Spanning tree without root | **O(nm)** | **O(m)** |
| LCR Leader Election | **Θ(n²)** worst case | **O(n)** |
| Hirschberg-Sinclair | **O(n log n)** | — |
| Async LE lower bound | **Ω(n log n)** | — |

The message/time bounds above are directly given in the lecture notes for the spanning-tree and leader-election algorithms.

#### 🧠 One-page memory map

\`\`\`text
              DISTRIBUTED SYSTEMS
                      |
       ┌──────────────┼──────────────┐
       ↓              ↓              ↓
   Basics       Message Passing   Coordination
       |              |              |
 Definition       Sync/Async      Leader Election
 Properties       Events               |
 Middleware       Broadcast        Anonymous Ring
 Transparency     Convergecast          |
 Challenges       Spanning Tree      LCR
       |              |              |
 Fault tolerance  BFS / DFS           HS
 Scalability      O(m) / O(nm)        |
                                    Ω(nlogn)
                      |
                      ↓
                DISTRIBUTED TIME
                      |
              ┌───────┴───────┐
              ↓               ↓
          Causality       Logical Clock
              |               |
       Happens-before    Scalar
              |           Vector
       Concurrent        Matrix
       events
              |
       FIFO / Causal
        ordering
\`\`\`

#### Final priority order

If you have limited time, study in this order:

**1. LCR + HS → 2. Synchronous/Asynchronous → 3. Spanning Trees → 4. Happens-Before/Causality → 5. Lamport Clock → 6. Transparency → 7. Message-Passing Model → 8. Distributed System basics.**

> The uploaded course outline also shows that the broader unit continues into **Distributed MST, Global State/Snapshot Algorithms, Distributed Mutual Exclusion, Distributed Shared Memory, Consensus, Checkpointing/Rollback, DHT, P2P/Overlay Graphs, GFS, HDFS/MapReduce, Spark, and Sensor Networks**.`,
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
      topic: "Unit 1",
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
      topic: "Unit 1",
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
      topic: "Unit 1",
    },
    {
      id: "w1-q4",
      question: "Which transparency type specifically means the user is not made aware that a resource has multiple copies?",
      options: ["Access transparency", "Migration transparency", "Replication transparency", "Concurrency transparency"],
      correctIndex: 2,
      explanation: "Replication transparency hides the existence of multiple copies of a resource from the user. Access transparency hides representation differences; migration transparency allows relocation without renaming; concurrency transparency masks concurrent shared-resource use.",
      topic: "Unit 1",
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
      topic: "Unit 2",
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
      topic: "Unit 2",
    },
    {
      id: "w1-q7",
      question: "For broadcasting a message over a rooted spanning tree with n processors and depth d, what are the time and message complexities (same for sync and async)?",
      options: ["Time O(n), messages O(n²)", "Time O(d), messages O(n−1)", "Time O(1), messages O(n)", "Time O(n log n), messages O(d)"],
      correctIndex: 1,
      explanation: "Broadcast over a rooted spanning tree takes time equal to the tree's depth d (at most n−1 for a chain), and exactly n−1 messages since one message crosses each spanning-tree edge — identical in both timing models.",
      topic: "Unit 2",
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
      topic: "Unit 2",
    },
    {
      id: "w1-q9",
      question: "What is the message and time complexity of the algorithm that finds a DFS spanning tree from a known root (probing neighbors one at a time in series)?",
      options: ["O(n) messages, O(1) time", "O(m) messages, O(m) time", "O(n log n) messages, O(diam) time", "O(nm) messages, O(m) time"],
      correctIndex: 1,
      explanation: "The DFS spanning-tree algorithm sends a constant number of messages per edge, so message complexity is O(m). Because neighbors are explored serially rather than in parallel, time complexity is also O(m) — worse than the O(diam) time of the BFS-style flood.",
      topic: "Unit 2",
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
      topic: "Unit 3",
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
      topic: "Unit 3",
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
      topic: "Unit 3",
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
      topic: "Unit 3",
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
      topic: "Unit 3",
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
      topic: "Unit 4",
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
      topic: "Unit 4",
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
      topic: "Unit 4",
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
      topic: "Unit 4",
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
      topic: "Unit 4",
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
      topic: "Unit 4",
    },
    {
      id: "w1-q21",
      question: "Which of the following is NOT one of the three fundamental issues that the lecture identifies as making distributed algorithm design difficult?",
      options: [
        "Asynchrony — timings of events cannot always be known precisely",
        "Limited local knowledge — each entity only sees information it acquires itself",
        "Independent failures — components can fail while others remain operational",
        "Guaranteed physical clock synchronization across all processors",
      ],
      correctIndex: 3,
      explanation: "The lecture names asynchrony, limited local knowledge, and independent failures as the three fundamental issues. A guaranteed synchronized physical clock is explicitly unavailable in distributed systems — that's part of why these issues arise in the first place.",
      topic: "Unit 1",
    },
    {
      id: "w1-q22",
      question: "Distributed computing systems have been studied since 1967, starting with Dijkstra and Lamport. Which Turing Award did Dijkstra win?",
      options: ["1972 Turing Award", "2013 Turing Award", "1990 Turing Award", "Dijkstra never won a Turing Award"],
      correctIndex: 0,
      explanation: "Edsger Dijkstra won the 1972 Turing Award; Leslie Lamport won the 2013 Turing Award (for causality, logical clocks, safety/liveness, replicated state machines, and sequential consistency). It's easy to swap these two dates by mistake.",
      topic: "Unit 1",
    },
    {
      id: "w1-q23",
      question: "In peer-to-peer (P2P) computing, how do the processors relate to one another?",
      options: [
        "A strict master–worker hierarchy",
        "All processors are equal and play a symmetric role, with no hierarchy among them",
        "Only a designated coordinator processor may initiate requests",
        "Processors are arranged in a fixed ring with one leader",
      ],
      correctIndex: 1,
      explanation: "P2P computing happens over an application-layer network where all interactions among processors occur at a 'peer' level — every processor is equal and symmetric, unlike client-server or master-worker models.",
      topic: "Unit 1",
    },
    {
      id: "w1-q24",
      question: "Which of the following is NOT one of the three sub-aspects of 'reliability' as a motivation for distributed systems?",
      options: ["Availability — the resource should be accessible at all times", "Integrity — the resource's state should be correct under concurrent access", "Fault-tolerance — the ability to recover from system failures", "Scalability — adding processors shouldn't bottleneck the network"],
      correctIndex: 3,
      explanation: "Reliability is broken into availability, integrity, and fault-tolerance. Scalability is listed separately, as its own distinct advantage of distributed systems — not a sub-aspect of reliability.",
      topic: "Unit 1",
    },
    {
      id: "w1-q25",
      question: "From which perspectives does the lecture frame the design issues and challenges of distributed systems?",
      options: [
        "Only a systems perspective",
        "Only an algorithmic perspective",
        "A systems perspective, an algorithmic perspective, and a perspective driven by recent technology advances / new applications",
        "Only a hardware-versus-software perspective",
      ],
      correctIndex: 2,
      explanation: "The lecture explicitly organizes design challenges into three perspectives: systems, algorithmic, and one driven by recent technology advances and newer applications (mobile systems, sensor networks, P2P, grid computing, security, etc.).",
      topic: "Unit 1",
    },
    {
      id: "w1-q26",
      question: "What specifically distinguishes a 'spanning' tree from a plain tree in the terminology used for the broadcast/convergecast algorithms?",
      options: [
        "A spanning tree must be rooted, while a plain tree cannot be",
        "A spanning tree contains all processors of the network, while a plain tree need not",
        "A spanning tree cannot contain cycles, while a plain tree can",
        "The two terms are used interchangeably with no distinction",
      ],
      correctIndex: 1,
      explanation: "A tree is defined as a connected, acyclic graph. A spanning tree is additionally required to contain every processor in the network. 'Rooted' is a further, separate property meaning there is one unique root node.",
      topic: "Unit 2",
    },
    {
      id: "w1-q27",
      question: "What must be true of the processors for the 'spanning tree without a known root' algorithm to work at all?",
      options: [
        "The network must be synchronous",
        "Each processor must have a unique identifier",
        "The topology must specifically be a ring",
        "All channels must be FIFO",
      ],
      correctIndex: 1,
      explanation: "The lecture states this outright: unique identifiers are assumed, since without them the rootless spanning-tree construction would be impossible — there'd be no way to break symmetry when multiple self-initiated DFS copies collide.",
      topic: "Unit 2",
    },
    {
      id: "w1-q28",
      question: "For finding a spanning tree given a known root (flood + parent/reject messages), what are the time and message complexities, and do they differ between synchronous and asynchronous models?",
      options: [
        "O(m) messages, O(diam) time — identical in both models",
        "O(n) messages, O(1) time — synchronous model only",
        "O(n²) messages, O(n) time — asynchronous model only",
        "O(m) messages, O(m) time — different in each model",
      ],
      correctIndex: 0,
      explanation: "This algorithm costs O(m) messages and O(diam) time in both the synchronous and asynchronous models. The models differ instead in the shape of tree produced: synchronous always yields a BFS tree, while asynchronous need not.",
      topic: "Unit 2",
    },
    {
      id: "w1-q29",
      question: "According to the formal message-passing model, what state does a processor end up in after a computation event?",
      options: [
        "Full inbufs and no outgoing messages",
        "Empty inbufs, with a new local state and possibly new outgoing messages queued",
        "Exactly the same state it started with",
        "Only its outbufs are cleared; inbufs remain untouched",
      ],
      correctIndex: 1,
      explanation: "A computation event starts from the old accessible state (local variables + incoming messages), applies the processor's transition function to handle all incoming messages, and ends with a new accessible state whose inbufs are empty — plus any newly queued outgoing messages.",
      topic: "Unit 2",
    },
    {
      id: "w1-q30",
      question: "What condition must hold for an execution to be considered 'admissible' in the asynchronous message-passing model?",
      options: [
        "Every message must be delivered within a fixed, bounded number of rounds",
        "Every message sitting in an outbuf is eventually delivered, and every processor takes an infinite number of steps",
        "Every processor must eventually halt after finitely many steps",
        "No message may ever be lost, but processors may permanently stop taking steps",
      ],
      correctIndex: 1,
      explanation: "Admissibility in the asynchronous model requires: (1) every message in an outbuf is eventually delivered, and (2) every processor takes infinitely many steps — with no constraint on when these events occur, modeling a reliable but arbitrarily-delayed system.",
      topic: "Unit 2",
    },
    {
      id: "w1-q31",
      question: "How many processors are included in the k-neighborhood of a processor pi in the Hirschberg–Sinclair algorithm?",
      options: ["k processors", "2k processors", "2k + 1 processors", "k + 1 processors"],
      correctIndex: 2,
      explanation: "The k-neighborhood of pi is the set of processors within distance k on either side — that's k processors to the left, k to the right, plus pi itself, totaling exactly 2k + 1 processors.",
      topic: "Unit 3",
    },
    {
      id: "w1-q32",
      question: "What does it mean for a ring network to be 'oriented'?",
      options: [
        "All processors share a synchronized physical clock",
        "Processors have a consistent notion of left and right, so messages forwarded on a fixed channel always circulate the same way (e.g. clockwise)",
        "The ring has exactly one designated root processor",
        "Message delivery on the ring is guaranteed to be FIFO",
      ],
      correctIndex: 1,
      explanation: "In an oriented ring, every processor agrees on which of its two channels is 'left' and which is 'right,' so a message always forwarded on, say, channel 1 will consistently cycle in one direction (e.g. clockwise) around the whole ring.",
      topic: "Unit 3",
    },
    {
      id: "w1-q33",
      question: "Why are LCR and Hirschberg–Sinclair both described as 'comparison-based' leader election algorithms?",
      options: [
        "They rely on comparing processors' physical locations",
        "They use identifiers only for comparison operations (<, >, =), never for arithmetic on the id values themselves",
        "They compare running time between the synchronous and asynchronous models",
        "They compare message contents byte by byte for equality",
      ],
      correctIndex: 1,
      explanation: "Both algorithms only ever compare ids to decide whether to swallow, forward, or elect — they never perform arithmetic (e.g. addition, hashing) on the id values. This classification matters for the lower-bound result, which applies specifically to comparison-based algorithms.",
      topic: "Unit 3",
    },
    {
      id: "w1-q34",
      question: "Under what condition can leader election in a synchronous ring be solved using only O(n) messages?",
      options: [
        "Never — Ω(n log n) messages are always required, even in synchronous rings",
        "If general (non-comparison-based) arithmetic operations on ids are permitted, and time complexity is allowed to be unbounded",
        "Only if the ring happens to be anonymous",
        "Only if the number of processors is even",
      ],
      correctIndex: 1,
      explanation: "O(n) message complexity is achievable in synchronous rings specifically when algorithms are allowed to use general arithmetic on identifiers (not just comparisons) and time complexity is left unbounded — otherwise, Ω(n log n) is required just as in the asynchronous case.",
      topic: "Unit 3",
    },
    {
      id: "w1-q35",
      question: "Which of these is given as a practical use of leader election, beyond just picking a winner?",
      options: [
        "Compressing messages before they're sent over the network",
        "Coordinating system activities, e.g. designating a root for a spanning tree, or reconstructing a lost token in a token-ring network",
        "Encrypting the contents of every channel",
        "Balancing computational load across geographically distant data centers",
      ],
      correctIndex: 1,
      explanation: "A leader can coordinate system activities such as serving as the root of a spanning tree, or regenerating a lost token in a token-ring network — leader election is a building block, not just an end in itself.",
      topic: "Unit 3",
    },
    {
      id: "w1-q36",
      question: "In the general definition given for a binary relation R to be a 'partial order' on a set A, which properties must R satisfy?",
      options: [
        "Reflexive, antisymmetric, and transitive",
        "Irreflexive, symmetric, and transitive",
        "Reflexive and total, but not necessarily transitive",
        "Antisymmetric and total, but not necessarily reflexive",
      ],
      correctIndex: 0,
      explanation: "The lecture's formal definition of a partial order requires reflexivity, antisymmetry, and transitivity. The causal precedence relation → (happens-before) is then described as an irreflexive partial order — a stricter variant used specifically for events, since no event happens-before itself.",
      topic: "Unit 4",
    },
    {
      id: "w1-q37",
      question: "In the model of distributed executions (Lecture 4), what are the three types of atomic events a process can execute?",
      options: [
        "Send, receive, and broadcast events",
        "Internal events, message-send events, and message-receive events",
        "Deliver, computation, and idle events",
        "Lock, unlock, and internal events",
      ],
      correctIndex: 1,
      explanation: "Each process's execution is modeled as a sequence of internal events, message-send events, and message-receive events. (This is distinct from — but related to — the deliver/computation event pair used in Lecture 2's system-wide message-passing model.)",
      topic: "Unit 4",
    },
    {
      id: "w1-q38",
      question: "In the general framework for logical clocks, how does a process's local logical clock (lci) relate to its logical global clock (gci)?",
      options: [
        "They are maintained completely independently, with no relationship",
        "lci is typically a part of (contained within) gci",
        "gci is discarded as soon as lci is computed",
        "lci is always numerically larger than gci",
      ],
      correctIndex: 1,
      explanation: "Each process maintains a local logical clock lci to measure its own progress, and a logical global clock gci representing its view of global logical time. lci is typically a part of gci — e.g. in scalar clocks the two are squashed into a single integer.",
      topic: "Unit 4",
    },
    {
      id: "w1-q39",
      question: "How many systems of logical time does this lecture (Lecture 4) actually work through in detail?",
      options: [
        "One — scalar time only",
        "Two — scalar time and vector time (matrix time is deferred to a later lecture)",
        "Three — scalar, vector, and matrix time, all covered in full",
        "Four, including physical clock synchronization",
      ],
      correctIndex: 1,
      explanation: "The lecture's preface mentions scalar, vector, and matrix time as the three systems of logical time in the broader course, but the conclusion confirms only scalar and vector clocks are actually presented here — matrix clocks, virtual time, and physical clock synchronization are pushed to the next lecture.",
      topic: "Unit 4",
    },
    {
      id: "w1-q40",
      question: "For event x at process pi with vector timestamp vh, and event y at process pj with vector timestamp vk, which simplified test correctly checks x → y using only the i-th vector component?",
      options: [
        "x → y ⇔ vh[i] ≤ vk[i]",
        "x → y ⇔ vh[j] ≤ vk[j]",
        "x → y ⇔ vh[i] = vk[j]",
        "x → y ⇔ vh[i] > vk[i]",
      ],
      correctIndex: 0,
      explanation: "When the process of each event is known, comparing full vectors isn't necessary: x → y holds exactly when vh[i] ≤ vk[i] — that is, pj's recorded knowledge of pi's clock (at the i-th component) has caught up to or passed x's own timestamp.",
      topic: "Unit 4",
    },
    {
      id: "w1-q41",
      question: "Which of the following is NOT a characteristic of a distributed system?",
      options: ["Heterogeneity", "Concurrency", "A common global clock", "Interdependencies"],
      correctIndex: 2,
      explanation: "Distributed systems have no common global clock — every processor keeps only a local notion of time. Heterogeneity, concurrency, and interdependencies are all genuine characteristics.",
      topic: "Unit 1",
    },
    {
      id: "w1-q42",
      question: "In a distributed system, middleware primarily provides:",
      options: [
        "Physical synchronization of processors",
        "Transparency of heterogeneity at the platform level",
        "Replacement of the operating system",
        "Shared physical memory",
      ],
      correctIndex: 1,
      explanation: "Middleware is the distributed software layer sitting above the OS and network stack that hides differences between machines and provides transparency — it does not replace the OS or create shared memory.",
      topic: "Unit 1",
    },
    {
      id: "w1-q43",
      question: "Which of the following best explains why distributed systems do not require a common global clock?",
      options: [
        "Every process executes sequentially",
        "Processes have independent local notions of time",
        "All messages arrive simultaneously",
        "Processors share a common memory",
      ],
      correctIndex: 1,
      explanation: "Each processor in a distributed system maintains its own local clock rather than sharing one global clock, since there's no shared memory or synchronized hardware clock across machines.",
      topic: "Unit 1",
    },
    {
      id: "w1-q44",
      question: "Which of the following is an example of location transparency?",
      options: [
        "A user accesses a replicated file without knowing there are multiple copies",
        "A user accesses a resource without knowing where it is physically located",
        "A resource moves while preserving its name",
        "A user is unaware that another process is accessing the resource",
      ],
      correctIndex: 1,
      explanation: "Location transparency means the user doesn't need to know a resource's physical location to access it. The other options describe replication, migration, and concurrency transparency respectively.",
      topic: "Unit 1",
    },
    {
      id: "w1-q45",
      question: "Which transparency hides the existence of multiple copies of a resource?",
      options: ["Access transparency", "Location transparency", "Replication transparency", "Failure transparency"],
      correctIndex: 2,
      explanation: "Replication transparency specifically hides from the user that a resource has multiple copies.",
      topic: "Unit 1",
    },
    {
      id: "w1-q46",
      question: "Which of the following is primarily a communication complexity measure in distributed algorithms?",
      options: ["Number of CPU registers", "Number of messages exchanged", "Number of instructions in one processor", "Size of local cache"],
      correctIndex: 1,
      explanation: "Communication complexity in distributed algorithms is measured chiefly by the number (and size) of messages exchanged, unlike single-processor algorithms which focus on time/space complexity.",
      topic: "Unit 1",
    },
    {
      id: "w1-q47",
      question: "Which combination represents the three fundamental difficulties in designing distributed algorithms?",
      options: [
        "Memory, CPU, storage",
        "Asynchrony, limited knowledge, failures",
        "Encryption, compression, routing",
        "Scalability, virtualization, caching",
      ],
      correctIndex: 1,
      explanation: "The three fundamental difficulties are asynchrony (no precise timing guarantees), limited local knowledge (no global view), and independent failures.",
      topic: "Unit 1",
    },
    {
      id: "w1-q48",
      question: "A distributed system has no global state visible to every processor because:",
      options: [
        "Each processor has complete information about all other processors",
        "Processors only have local views and communicate through messages",
        "All processors execute at exactly the same speed",
        "There is no communication between processors",
      ],
      correctIndex: 1,
      explanation: "Since every processor only knows what it has locally received via messages, no single processor ever has a complete, instantaneous global view of the system.",
      topic: "Unit 1",
    },
    {
      id: "w1-q49",
      question: "In the basic message-passing model, which of the following is NOT one of the three types of events at a process?",
      options: ["Internal event", "Send event", "Receive event", "Synchronization event"],
      correctIndex: 3,
      explanation: "The three event types are internal, send, and receive events. 'Synchronization event' is not a separate category in this model.",
      topic: "Unit 2",
    },
    {
      id: "w1-q50",
      question: "Consider a message m sent from process P1 to P2. Which causal relationship necessarily holds?",
      options: ["receive(m) → send(m)", "send(m) → receive(m)", "send(m) ∥ receive(m)", "Neither event is related"],
      correctIndex: 1,
      explanation: "By definition of the happens-before relation, a message must be sent before it can be received, so send(m) → receive(m) always holds.",
      topic: "Unit 2",
    },
    {
      id: "w1-q51",
      question: "In a synchronous message-passing system, time is generally measured in terms of:",
      options: ["Number of messages", "Number of processors", "Number of rounds", "Number of channels"],
      correctIndex: 2,
      explanation: "Synchronous systems execute in lockstep rounds (send, deliver, compute), so time complexity is expressed as a number of rounds.",
      topic: "Unit 2",
    },
    {
      id: "w1-q52",
      question: "Which statement is TRUE for an asynchronous message-passing system?",
      options: [
        "Every message has a known fixed delivery time",
        "All processors operate in lockstep",
        "Message delays can be arbitrary, subject to eventual delivery in the model",
        "Every processor executes at exactly the same speed",
      ],
      correctIndex: 2,
      explanation: "Asynchronous systems place no fixed upper bound on message delay or on the time between a processor's steps — delays can be arbitrarily long, though (for admissible executions) messages are still eventually delivered.",
      topic: "Unit 2",
    },
    {
      id: "w1-q53",
      question: "A rooted spanning tree contains:",
      options: ["Only the root and its immediate neighbors", "All processors and a designated root", "All communication links", "Exactly one cycle"],
      correctIndex: 1,
      explanation: "A rooted spanning tree is a spanning tree (connected, acyclic, touching every processor) with one designated root node.",
      topic: "Unit 2",
    },
    {
      id: "w1-q54",
      question: "Broadcast over a rooted spanning tree is best described as:",
      options: [
        "Many processors sending information toward the root",
        "Root information propagating toward all processors",
        "Processors electing a leader",
        "Processors detecting failures",
      ],
      correctIndex: 1,
      explanation: "Broadcast sends information from the root outward to every processor via the spanning tree — the opposite direction of convergecast.",
      topic: "Unit 2",
    },
    {
      id: "w1-q55",
      question: "In a rooted spanning tree containing n processors, how many messages are required for broadcast if exactly one message is sent over every tree edge?",
      options: ["n", "n + 1", "n − 1", "2n"],
      correctIndex: 2,
      explanation: "A spanning tree over n nodes has exactly n − 1 edges, and broadcast sends one message per edge, giving n − 1 messages total.",
      topic: "Unit 2",
    },
    {
      id: "w1-q56",
      question: "Convergecast is essentially the reverse of:",
      options: ["Leader election", "Broadcast", "DFS", "Logical clock synchronization"],
      correctIndex: 1,
      explanation: "Convergecast collects information from all processors toward the root — the mirror image of broadcast, which sends information from the root outward.",
      topic: "Unit 2",
    },
    {
      id: "w1-q57",
      question: "During convergecast, a non-leaf node generally:",
      options: [
        "Immediately sends its own information to every neighbor",
        "Waits for information from its children and aggregates it",
        "Becomes the leader",
        "Discards information received from children",
      ],
      correctIndex: 1,
      explanation: "A non-leaf (internal) node must wait until it has heard from all of its children before combining that information with its own and forwarding it up to its parent.",
      topic: "Unit 2",
    },
    {
      id: "w1-q58",
      question: "In the spanning-tree algorithm with a known root, when a non-root processor receives the exploration message for the FIRST time, it:",
      options: ["Rejects the message", "Becomes the leader", "Sets the sender as its parent", "Terminates immediately"],
      correctIndex: 2,
      explanation: "The first time a processor receives the exploration message M, it sets the sender as its parent and replies accordingly, then forwards M onward. Any later receipt of M gets a 'reject' reply.",
      topic: "Unit 2",
    },
    {
      id: "w1-q59",
      question: "In the lecture, a spanning tree constructed in a synchronous system using the basic exploration algorithm is:",
      options: ["Always a DFS tree", "Always a BFS tree", "Always a minimum spanning tree", "Neither BFS nor DFS"],
      correctIndex: 1,
      explanation: "Because synchronous execution delivers messages in lockstep rounds, nodes are discovered in strict distance order from the root, guaranteeing a BFS tree.",
      topic: "Unit 2",
    },
    {
      id: "w1-q60",
      question: "Why does the same basic spanning-tree algorithm NOT necessarily produce a BFS tree asynchronously?",
      options: [
        "Processors cannot communicate",
        "Different message delays can affect the order in which nodes are discovered",
        "There is no root",
        "Nodes have no identifiers",
      ],
      correctIndex: 1,
      explanation: "Without the lockstep timing guarantee of the synchronous model, unpredictable message delays can let a farther node's exploration message arrive before a nearer node's, breaking the BFS ordering.",
      topic: "Unit 2",
    },
    {
      id: "w1-q61",
      question: "A DFS spanning tree algorithm ensures DFS by:",
      options: [
        "Sending messages to all neighbors simultaneously",
        "Exploring neighbors sequentially and waiting for responses",
        "Choosing the smallest processor ID",
        "Using a global clock",
      ],
      correctIndex: 1,
      explanation: "To force a DFS shape, the algorithm explores one neighbor at a time and waits for a parent/reject reply before moving on to the next — unlike the parallel flood used for BFS.",
      topic: "Unit 2",
    },
    {
      id: "w1-q62",
      question: "What is the message complexity of the DFS spanning-tree algorithm with a known root?",
      options: ["O(1)", "O(log n)", "O(m)", "O(n²)"],
      correctIndex: 2,
      explanation: "Like the BFS-style flood, the DFS algorithm sends a constant number of messages per edge, giving O(m) message complexity overall (though its time complexity is worse, at O(m), since exploration is serial).",
      topic: "Unit 2",
    },
    {
      id: "w1-q63",
      question: "For finding a spanning tree without a predefined root, each processor initially:",
      options: [
        "Waits for the root to contact it",
        "Runs a copy of the DFS algorithm considering itself as root",
        "Chooses a random neighbor",
        "Immediately terminates",
      ],
      correctIndex: 1,
      explanation: "With no predefined root, every processor runs its own copy of the DFS spanning-tree algorithm as if it were the root, tagging messages with its own ID; when copies collide, the larger ID wins.",
      topic: "Unit 2",
    },
    {
      id: "w1-q64",
      question: "The fundamental requirement of the leader election problem is:",
      options: ["At least two processors become leaders", "Every processor becomes a leader", "Exactly one processor becomes the leader", "No processor makes a decision"],
      correctIndex: 2,
      explanation: "Leader election requires every admissible execution to end with exactly one processor deciding 'leader' and all others deciding 'non-leader.'",
      topic: "Unit 3",
    },
    {
      id: "w1-q65",
      question: "Why is leader election impossible in an anonymous synchronous ring?",
      options: [
        "Messages cannot travel around the ring",
        "Processors have identical initial states and cannot break symmetry",
        "The ring contains cycles",
        "Processors cannot communicate in synchronous systems",
      ],
      correctIndex: 1,
      explanation: "With no unique IDs, all processors start identically and every round produces identical messages/transitions everywhere — symmetry can never be broken, so a leader can never be singled out.",
      topic: "Unit 3",
    },
    {
      id: "w1-q66",
      question: "Suppose a ring has processor IDs: 4, 12, 7, 19, 3. Using the LCR algorithm, which processor will eventually be elected?",
      options: ["3", "4", "12", "19"],
      correctIndex: 3,
      explanation: "LCR always elects the processor with the largest ID, since only the largest ID's message survives being forwarded all the way around the ring. Here that's 19.",
      topic: "Unit 3",
    },
    {
      id: "w1-q67",
      question: "In LCR, when a processor receives an ID smaller than its own ID, it:",
      options: ["Forwards it", "Discards it", "Becomes the leader", "Reverses the ring direction"],
      correctIndex: 1,
      explanation: "A processor only forwards IDs larger than its own (since it has already lost); a smaller ID is simply discarded, since that candidate cannot win.",
      topic: "Unit 3",
    },
    {
      id: "w1-q68",
      question: "In LCR, when a processor receives its own ID back, it:",
      options: ["Becomes a non-leader", "Starts a new election", "Becomes the leader", "Deletes its ID"],
      correctIndex: 2,
      explanation: "Receiving its own ID means the message has circled the entire ring without being beaten by a larger ID, so the processor elects itself leader.",
      topic: "Unit 3",
    },
    {
      id: "w1-q69",
      question: "What is the worst-case message complexity of LCR?",
      options: ["O(n)", "O(log n)", "Θ(n²)", "Θ(n log n)"],
      correctIndex: 2,
      explanation: "LCR's worst case — IDs arranged in decreasing order around the ring — forces near-total propagation of every candidate ID before it's swallowed, giving Θ(n²) messages.",
      topic: "Unit 3",
    },
    {
      id: "w1-q70",
      question: "The main improvement of Hirschberg-Sinclair over LCR is:",
      options: [
        "It does not require unique IDs",
        "It reduces worst-case message complexity",
        "It eliminates message passing",
        "It works only for anonymous rings",
      ],
      correctIndex: 1,
      explanation: "HS still requires unique IDs and still elects the largest ID, but by probing exponentially growing neighborhoods in phases, it cuts worst-case message complexity from Θ(n²) down to O(n log n).",
      topic: "Unit 3",
    },
    {
      id: "w1-q71",
      question: "If e1 → e2 according to Lamport's happens-before relation, then a consistent logical clock must satisfy:",
      options: ["C(e1) > C(e2)", "C(e1) = C(e2)", "C(e1) < C(e2)", "No relationship is required"],
      correctIndex: 2,
      explanation: "This is the clock consistency condition: causal precedence must be reflected as an increasing timestamp, i.e. e1 → e2 implies C(e1) < C(e2).",
      topic: "Unit 4",
    },
    {
      id: "w1-q72",
      question: "If C(e1) < C(e2) using a Lamport scalar clock, which conclusion is definitely valid?",
      options: ["e1 → e2", "e2 → e1", "e1 and e2 are concurrent", "None of the above necessarily follows"],
      correctIndex: 3,
      explanation: "Scalar clocks satisfy consistency but not strong consistency — a smaller timestamp does not guarantee a causal relationship, since e1 and e2 could equally be concurrent.",
      topic: "Unit 4",
    },
    {
      id: "w1-q73",
      question: "Two events are logically concurrent when:",
      options: [
        "They occur at exactly the same physical time",
        "Neither happens-before the other",
        "They occur on the same processor",
        "They have identical timestamps in every clock system",
      ],
      correctIndex: 1,
      explanation: "Logical concurrency means neither e1 → e2 nor e2 → e1 holds — there is no causal path between them, regardless of physical timing.",
      topic: "Unit 4",
    },
    {
      id: "w1-q74",
      question: "Which relation is always true for a message m?",
      options: ["receive(m) → send(m)", "send(m) → receive(m)", "send(m) ∥ receive(m)", "send(m) = receive(m)"],
      correctIndex: 1,
      explanation: "A message must be sent before it is received, so send(m) → receive(m) always holds by definition of the happens-before relation.",
      topic: "Unit 4",
    },
    {
      id: "w1-q75",
      question: "Which ordering guarantees that causally related messages are delivered in causal order?",
      options: ["Non-FIFO ordering", "Random ordering", "Causal ordering", "Unordered delivery"],
      correctIndex: 2,
      explanation: "Causal ordering (CO) is precisely the channel model that guarantees messages are delivered respecting their send-time causal relationships — it's the strongest of the three models (CO ⊂ FIFO ⊂ non-FIFO).",
      topic: "Unit 4",
    },
  ],

  flashcards: [
    { id: "w1-f1", front: "Define a distributed system in one line.", back: "A collection of independent computers, with no shared memory or clock, that cooperate by passing messages over a network to jointly solve a problem no single one could solve alone.", topic: "Unit 1" },
    { id: "w1-f2", front: "Name the 5 core properties of distributed systems.", back: "Heterogeneity, concurrency, shared data, no global clock, interdependencies.", topic: "Unit 1" },
    { id: "w1-f3", front: "What is 'middleware'?", back: "The distributed software layer between the application and the OS/network stack that provides transparency of heterogeneity (e.g. CORBA, RPC, RMI, DCOM, MPI).", topic: "Unit 1" },
    { id: "w1-f4", front: "List the 7 types of transparency.", back: "Access, location, migration, relocation, replication, concurrency, failure transparency.", topic: "Unit 1" },
    { id: "w1-f5", front: "What are the 3 fundamental issues that make distributed algorithm design hard?", back: "Asynchrony (no precise timing), limited local knowledge (each entity only sees its own view), and independent failures.", topic: "Unit 1" },
    { id: "w1-f6", front: "What did Leslie Lamport win the 2013 Turing Award for?", back: "Fundamental contributions to distributed systems theory: causality and logical clocks, safety/liveness, replicated state machines, and sequential consistency.", topic: "Unit 1" },
    { id: "w1-f7", front: "In the message-passing model, what is a 'configuration'?", back: "A vector of all processor states (including outbufs/channels) — a complete snapshot of the entire system at one point.", topic: "Unit 2" },
    { id: "w1-f8", front: "What are the two kinds of events in the message-passing model?", back: "Deliver events (move a message from sender's outbuf to receiver's inbuf) and computation events (a processor consumes its inbuf and produces new state + outgoing messages).", topic: "Unit 2" },
    { id: "w1-f9", front: "Safety vs. liveness — define both.", back: "Safety: nothing bad has happened yet (holds on every finite prefix). Liveness: something good eventually happens (may require infinite execution to confirm).", topic: "Unit 2" },
    { id: "w1-f10", front: "Synchronous vs asynchronous message passing — key difference?", back: "Synchronous: lockstep rounds, bounded delay. Asynchronous: no fixed upper bound on message delay or on time between a processor's steps.", topic: "Unit 2" },
    { id: "w1-f11", front: "Cost of broadcasting over a rooted spanning tree (n nodes, depth d)?", back: "Time O(d) (up to n−1), messages O(n−1) — same for sync and async.", topic: "Unit 2" },
    { id: "w1-f12", front: "What does 'convergecast' do, and how does it differ from broadcast?", back: "It collects information up a spanning tree: leaves send to parents, and each internal node waits for messages from ALL its children before combining and forwarding upward — the reverse flow of broadcast.", topic: "Unit 2" },
    { id: "w1-f13", front: "Rootless spanning tree construction — cost and technique?", back: "Every processor runs its own DFS-tree algorithm as if it were root, tagging messages with its id; on collision, the larger id wins. O(nm) messages, O(m) time.", topic: "Unit 2" },
    { id: "w1-f14", front: "State the leader election impossibility result for anonymous rings.", back: "No LE algorithm exists for anonymous rings — even non-uniform and synchronous — because all processors start and evolve identically each round, so a decision to elect is made by everyone or no one.", topic: "Unit 3" },
    { id: "w1-f15", front: "LCR algorithm rule in one line.", back: "Send your id left; on receiving id j: forward it if j > your id (you lost), elect yourself if j = your id, drop it if j < your id.", topic: "Unit 3" },
    { id: "w1-f16", front: "LCR message complexity — best/worst case?", back: "O(n²) worst case (ids in decreasing order around the ring); time is always O(n).", topic: "Unit 3" },
    { id: "w1-f17", front: "What is the 2ᵏ-neighborhood in the Hirschberg–Sinclair algorithm?", back: "The set of processors within distance 2^k of a processor pi in either direction along the ring — 2·2^k + 1 processors total including pi.", topic: "Unit 3" },
    { id: "w1-f18", front: "HS algorithm message/time complexity, and is it optimal?", back: "O(n log n) messages — asymptotically optimal, matching the proven Ω(n log n) lower bound for asynchronous rings of unknown size.", topic: "Unit 3" },
    { id: "w1-f19", front: "Define the happens-before relation →.", back: "The smallest relation such that: same-process events in order are related; send(m) → rec(m); and the relation is transitively closed. It's an irreflexive partial order.", topic: "Unit 4" },
    { id: "w1-f20", front: "When are two events 'concurrent' (ei ∥ ej)?", back: "When neither ei → ej nor ej → ei holds — there's no causal path between them either way. Note ∥ is NOT transitive.", topic: "Unit 4" },
    { id: "w1-f21", front: "CO vs FIFO vs non-FIFO channel models — order them by strength.", back: "CO (causal ordering) ⊂ FIFO ⊂ non-FIFO. CO is the strongest guarantee; non-FIFO is the weakest (arbitrary delivery order).", topic: "Unit 4" },
    { id: "w1-f22", front: "Clock consistency (monotonicity) condition for logical clocks?", back: "ei → ej ⇒ C(ei) < C(ej). If the converse also holds, the clock system is 'strongly consistent.'", topic: "Unit 4" },
    { id: "w1-f23", front: "Scalar clock R1 and R2 rules?", back: "R1 (before any event): Ci := Ci + d. R2 (on receiving msg with timestamp Cmsg): Ci := max(Ci, Cmsg), then apply R1, then deliver.", topic: "Unit 4" },
    { id: "w1-f24", front: "Why aren't scalar clocks strongly consistent?", back: "Squashing local + global time into one integer loses information about which specific remote event was known, so C(ei) < C(ej) doesn't guarantee ei → ej.", topic: "Unit 4" },
    { id: "w1-f25", front: "How are ties broken in scalar-clock total ordering?", back: "Using the pair (timestamp, process id): x ≺ y iff timestamp(x) < timestamp(y), or timestamps are equal and id(x) < id(y).", topic: "Unit 4" },
    { id: "w1-f26", front: "Vector clock R2 rule (on message receipt)?", back: "For all k: vt[k] := max(vt[k], vt_msg[k]), then apply R1 (increment own component), then deliver.", topic: "Unit 4" },
    { id: "w1-f27", front: "Vector clock isomorphism property?", back: "x → y ⇔ vh < vk, and x ∥ y ⇔ vh ∥ vk — the vector timestamps exactly mirror the true causal structure, making vector clocks strongly consistent.", topic: "Unit 4" },
    { id: "w1-f28", front: "Minimum required dimension of a vector clock for strong consistency?", back: "n — the total number of processes in the system (Charron-Bost's result).", topic: "Unit 4" },
  ],
};

export default week1;