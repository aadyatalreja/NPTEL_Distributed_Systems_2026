import type { WeekData } from "../../types";

const week2: WeekData = {
  week: 2,
  title: "Matrix Clocks, Global Snapshots & Distributed Mutual Exclusion",
  status: "ready",
  pdfUrl: "/pdfs/week2-lecture-notes.pdf",

  notes: [
    {
      heading: "L5 — Size of vector clocks, matrix clocks, virtual time & physical clock sync",
      body: `**Is size n really necessary for a vector clock?** Not always. A vector clock of size n lets you explicitly track progress at *every* process, but for the narrower job of testing causality between a *pair* of events e and f (e ≺ f iff T(e) < T(f)), you only need a clock whose size equals the **dimension of the partial order (E, ≺)** — and that dimension is only *upper-bounded* by n, not always equal to it.

**Dimension of a partial order:** A **linear extension** of (E, ≺) is a total ordering of E consistent with ≺ — think of it as projecting every event from every process onto one shared time axis. Different linear extensions are possible in general, and each necessarily introduces *extra* orderings between events that weren't ordered in the original partial order. The **dimension** is the minimum number of linear extensions L1, L2, ... whose *intersection* recovers exactly the causality relation P.

**Worked examples of dimension:**
- **Client–server (strict alternation):** n=2 processes, but every event is strictly ordered — only one linear order is consistent with it. **Dimension = 1**, so a plain scalar (Lamport) clock is adequate.
- **Concurrent send–receive "crown":** both processes send before receiving the other's message. The two sends are concurrent, as are the two receives — a single integer can't capture this. **Dimension = 2**, requiring a genuine vector clock. Generalizes: a **crown of n messages** (Send(mi) ≺ Receive(m_{i+1 mod n-1}) for all i) has **dimension n**.
- **Complex 4-process execution:** even though n=4, careful analysis of the longest chain plus events outside it shows the **dimension is only 2** — two linear extensions L1, L2 whose intersection recovers exactly the partial order.

**Matrix clocks — the next step up.** Each process pi keeps an n×n matrix mt_i:
- \`mt_i[i,i]\` — pi's own local logical clock (progress at pi)
- \`mt_i[i,j]\` — pi's latest knowledge of pj's local clock
- \`mt_i[j,k]\` — pi's knowledge of what pj knows about pk's local clock (second-hand knowledge)

**Update rules:**
- **R1** (before any event): \`mt_i[i,i] := mt_i[i,i] + d\` (d>0)
- **R2** (on receiving piggybacked (m, mt) from pj): (a) update row i with pj's row: \`mt_i[i,k] := max(mt_i[i,k], mt[j,k])\` for all k; (b) update the *whole* matrix: \`mt_i[k,l] := max(mt_i[k,l], mt[k,l])\` for all k,l; then execute R1 and deliver m.

**Why matrix clocks are useful beyond vector clocks:** row \`mt_i[i,.]\` behaves exactly like a vector clock. But additionally, if \`min_k(mt_i[k,l]) ≥ t\`, then pi knows *every other process* already knows pl's local time has progressed past t — meaning no process will ever again need old information from pl below that point, so it can be safely **discarded** (garbage-collected). If d=1 always, \`mt_i[k,l]\` literally counts events at pl that pk knows about, as far as pi is aware.

**Virtual time & the Time Warp mechanism.** Virtual time is *"a global, one-dimensional, temporal coordinate system on a distributed computation"* used to measure progress and drive synchronization. It's implemented via loosely-synchronized local virtual clocks that mostly move forward but can occasionally roll back. Every message carries 4 values: sender name, **virtual send time**, receiver name, **virtual receive time**.

Two semantic rules mirror Lamport's clock conditions:
- **Rule 1:** virtual send time of a message < its virtual receive time
- **Rule 2:** virtual time of an event in a process < virtual time of the next event in that process

**Time Warp** implements this optimistically: each process runs ahead without regard to others, on the assumption that synchronization conflicts (and the rollbacks they cause) are *rare*. If a conflict is detected, the offending process(es) roll back to just before the conflict and re-execute forward — transparently to the user. This is essentially the **inverse of Lamport's scheme**: Lamport conservatively advances clocks only as causality is learned (never violating it), whereas Time Warp advances optimistically and corrects after the fact. Two parts: **local control** (correct-order execution/message processing) and **global control** (global progress, termination detection, I/O, flow control).

**Physical clock synchronization — NTP.** Distributed systems have no global clock; each processor's local clock can drift (accumulating seconds/day of error) even if they started synchronized. NTP addresses this with the **Offset Delay Estimation method** over a hierarchical tree: a **primary server** synced to UTC, **secondary servers** as backups, and **clients** at the lowest (synchronization subnet) level.

Given four recent timestamps T1, T2, T3, T4 exchanged between peers A and B (with a = T1−T3, b = T2−T4), the **clock offset** θ and **round-trip delay** δ of B relative to A are approximately θ = (a+b)/2, δ = a−b. More generally with Ti-3, Ti-2, Ti-1, Ti: **offset** Oi = (Ti-2 − Ti-3 + Ti-1 − Ti)/2, **round-trip delay** Di = (Ti − Ti-3) − (Ti-1 − Ti-2). NTP keeps the 8 most recent (Oi, Di) pairs and uses the Oi with the *minimum* Di as the best estimate.

**Physical vs. logical clocks for causality:** in distributed systems the event rate is far too high and execution time far too small for loosely-synchronized physical clocks (unlike wall clocks in daily life) to reliably capture causality — so **logical clocks**, not physical ones, are what accurately capture the causality relation and its monotonicity property.`,
    },
    {
      heading: "L6 — Global state and snapshot recording algorithms",
      body: `**Why this is hard:** there's no shared memory, no global clock, and message delays are unpredictable — so recording a distributed system's global state "on the fly" is non-trivial.

**System model:** n processes p1...pn connected by channels; \`Cij\` is the channel from pi to pj with state \`SCij\`. Events are internal, send, or receive. \`LSi\` is pi's local state (result of all events executed so far). For a channel Cij, \`transit(LSi, LSj) = {mij | send(mij) ∈ LSi ∧ rec(mij) ∉ LSj}\` — messages sent but not yet reflected as received.

**Global state:** \`GS = {∪i LSi, ∪i,j SCij}\` — the collection of all local states plus all channel states. GS is **consistent** iff for every message: \`send(mij) ∈ LSi ⇒ mij ∈ SCij ⊕ rec(mij) ∈ LSj\` (C1 — exclusive-or: the message is either still "in the channel" or has been received, not both/neither) and the corresponding AND version (C2). A state is **transitless** if every channel is recorded empty, and **strongly consistent** if it's both transitless and consistent.

**Cuts.** A zigzag line through the space-time diagram, one point per process, is a **cut** — it splits all events into **PAST** (left) and **FUTURE** (right). Every cut corresponds to a global state and vice versa. A cut is **consistent** iff every message received in the PAST was also sent in the PAST (no message crosses from FUTURE back to PAST); otherwise it's **inconsistent**.

**Two issues any snapshot protocol must solve:**
- **I1 (which messages to record):** a message sent *before* the sender's snapshot must be recorded (from C1); one sent *after* must not be (from C2).
- **I2 (when to take the snapshot):** a receiver must record its own snapshot *before* processing any message that was sent by another process *after that sender's* snapshot was taken.

**Money-transfer example — why naive recording breaks:** if Account A's state ($600) is recorded *before* a $50 transfer is initiated, but the channel carrying that $50 is recorded *after* the transfer starts, the sum shows $850 instead of the true $800 — an extra $50 appears because the snapshot straddled the transfer inconsistently. This motivates coordinated snapshot algorithms.

**Chandy-Lamport algorithm (assumes FIFO channels).** Uses a control message called a **marker** to separate pre-snapshot from post-snapshot messages on each channel.
- **Marker Sending Rule** (process i): (1) record its own state; (2) for every outgoing channel on which a marker hasn't yet been sent, send one *before* sending any further messages on that channel.
- **Marker Receiving Rule** (process j, on receiving a marker on channel C): if j hasn't recorded its state yet → record C's state as **empty**, then follow the Marker Sending Rule (this is I2's enforcement — record own state no later than first incoming marker). If j *has* already recorded its state → record C's state as the set of messages received on C **after** j's snapshot and **before** this marker arrived.
- **Termination:** once every process has received a marker on every incoming channel, all local snapshots (once disseminated) determine the global state.
- **Complexity:** O(e) messages, O(d) time (e = edges, d = network diameter).

**Important subtlety:** the recorded global state may **never have actually occurred** during the real execution (a process can change state asynchronously before its markers propagate). But it's guaranteed to be a valid state in some *equivalent* execution — so any **stable property** (one that, once true, remains true) that held before the snapshot began will still be detected as holding in the recorded snapshot. This is exactly why snapshots are useful for things like deadlock/termination detection.

**Variants at a glance:**
| Algorithm | Key feature |
|---|---|
| Chandy-Lamport | Baseline; requires FIFO channels; O(e) msgs, O(d) time |
| Spezialetti-Kearns | Supports concurrent initiators, efficient snapshot assembly; bidirectional channels |
| Lai-Yang | Works for **non-FIFO** channels; markers piggybacked on computation messages; needs message history |
| Li et al. | Only small message history needed (incremental channel-state computation) |
| Mattern | No message history required at all |
| Acharya-Badrinath | Needs causal delivery + termination detection to compute channel states |
| Alagar-Venkatesan | Needs causal delivery; distributed channel-state computation; 3n messages, 3 time units |`,
    },
    {
      heading: "L7 — Distributed mutual exclusion: non-token based approaches",
      body: `**Why message passing is the only option:** distributed sites share no memory or kernel, so classic shared-variable primitives (semaphores) don't apply — coordination for mutual exclusion must happen entirely via messages.

**Three families of approaches:**
1. **Non-token based** — two+ rounds of messages decide who enters the CS next (e.g. Lamport, Ricart-Agrawala)
2. **Quorum based** — each site asks only a subset (quorum) of sites; any two quorums intersect (e.g. Maekawa, Agarwal-El Abbadi)
3. **Token based** — a unique token (PRIVILEGE) circulates; holding it = permission to enter CS (e.g. Suzuki-Kasami, Raymond's tree — covered next lecture)

**System model:** N sites S1...SN, one process pi per site. A site is in exactly one of: **requesting** the CS (blocked, can't issue new requests), **executing** the CS, or **idle**. Token-based algorithms add an **idle token state**. Pending requests at a site queue up and are served one at a time.

**Three requirements every algorithm must satisfy:**
- **Safety** — only one process executes the CS at any instant
- **Liveness** — no deadlock, no starvation (sites don't wait forever for messages that never come)
- **Fairness** — requests are generally served in (logical-clock) arrival order

**Four performance metrics:**
- **Message complexity** — messages needed per CS execution
- **Synchronization delay** — time between the last site *exiting* the CS and the next site *entering* it
- **Response time** — time from a request's messages going out to its CS execution finishing
- **System throughput** — 1/(SD + E), where SD = synchronization delay, E = average CS execution time

**(i) Lamport's algorithm.** Requires FIFO channels. Every site keeps a timestamp-ordered \`request_queue\`. Three message types (REQUEST, REPLY, RELEASE), each carrying/updating logical-clock timestamps.
- **Request CS:** broadcast REQUEST(tsi, i), place it on your own queue.
- Receiving REQUEST(tsi, i) at Sj → place on \`request_queuej\`, reply with a timestamped REPLY.
- **Enter CS** when: **L1** — you've received a message timestamped later than your own request from *every* other site, **and L2** — your request is at the *head* of your own queue.
- **Release CS:** remove your request from the head of the queue, broadcast a timestamped RELEASE; recipients remove your request from their queues (which may promote their own request to the head).
- **Correctness (proof sketch):** if two sites executed the CS concurrently, both would need their own request at the head of their queue and L1 satisfied — but FIFO + L1 forces the smaller-timestamp site's request to already be present in the other's queue, contradicting that other site's own request being at the head. Fairness follows similarly by contradiction.
- **Message cost:** 3(N−1) per CS execution — (N−1) each of REQUEST, REPLY, RELEASE. **Optimization:** a site can skip its REPLY if it has already sent a *higher-timestamped* request of its own — reduces the range to between 2(N−1) and 3(N−1).
- **Synchronization delay:** T (one message propagation time).

**(ii) Ricart-Agrawala algorithm.** Also assumes FIFO channels; uses only REQUEST and REPLY (no separate RELEASE — deferred replies do that job). Each process keeps a Request-Deferred array RDi (initially all 0).
- **Request CS:** broadcast a timestamped REQUEST to everyone.
- Receiving REQUEST from Si at Sj: reply **immediately** if Sj is neither requesting nor executing the CS, *or* if Sj is requesting but Si's timestamp is smaller (higher priority). **Otherwise defer** — set RDj[i]=1.
- **Enter CS** once REPLYs have arrived from *every* site sent a REQUEST.
- **Release CS:** send all deferred REPLYs (∀j: if RDi[j]=1, reply to Sj and reset RDi[j]=0).
- **Correctness (proof sketch):** if two sites concurrently held the CS, the higher-priority one would have had to REPLY to the lower-priority one *before exiting* — but the algorithm never does that (it only defers), contradiction.
- **Message cost:** 2(N−1) per CS execution — cheaper than Lamport's basic version. Synchronization delay: T.`,
    },
    {
      heading: "L8 — Quorum based distributed mutual exclusion algorithms",
      body: `**Core idea:** instead of asking *every* site for permission, a site only asks a **quorum** — a carefully chosen subset — such that any two quorums are guaranteed to share a common site, which mediates conflicts between them.

**Coteries and quorums.** A coterie C is a set of quorums satisfying:
- **Intersection property:** for every g, h ∈ C, g ∩ h ≠ ∅
- **Minimality property:** no quorum in C is a superset of another (this matters for *efficiency*, not correctness)

**Simple protocol using coteries:** a site requests permission from every site in its own quorum; the intersection property guarantees some common site mediates any conflict, and since a common site only grants permission to one requester at a time, mutual exclusion is guaranteed.

**(i) Maekawa's algorithm** — the first quorum-based ME algorithm. Request sets Ri satisfy:
- **M1:** any two request sets intersect (correctness)
- **M2:** Si ∈ Ri (a site is in its own request set)
- **M3:** all |Ri| are equal (= K) — equal workload for every site
- **M4:** every site appears in exactly K different Ri's — equal responsibility

M1–M2 are needed for correctness; M3–M4 give fairness/load-balancing. Using projective-plane theory, N = K(K−1)+1, so |Ri| ≈ **√N**.

**Protocol:** Si sends REQUEST(i) to everyone in Ri. Sj replies immediately *unless* it has already replied to someone since its last RELEASE, in which case it queues the request. Si enters the CS once it has REPLYs from *all* of Ri; on exit it sends RELEASE(i) to all of Ri, prompting the next queued request to get a REPLY.
- **Correctness:** if Si and Sj both entered the CS concurrently, the common site in Ri ∩ Rj would have had to REPLY to both concurrently — contradiction.
- **Message cost:** 3√N per CS execution (√N each of REQUEST, REPLY, RELEASE).
- **Synchronization delay: 2T** (worse than non-token approaches) since a site must first release all of Ri before the next requester's turn is enabled.

**Maekawa can deadlock** — because requests aren't timestamp-prioritized, three sites' pairwise-intersecting request sets can form a **circular wait** (Si locked out by Sj's holder, Sj by Sk's, Sk by Si's). Deadlock handling adds three more message types:
- **FAILED** — "I can't grant you; I've already granted a higher-priority request"
- **INQUIRE** — "have you actually locked all your requested sites yet?"
- **YIELD** — "I'm giving my permission back to you, since a higher-priority request is waiting on me"

A blocked higher-priority request triggers a FAILED (if it's lower priority than the current holder) or an INQUIRE (if it's higher priority) to the current holder — which may respond with a YIELD, letting the blocked-on site re-grant permission to the higher-priority request. This adds overhead: **up to 5 messages** per CS execution in the worst case.

**(ii) Agarwal-El Abbadi tree-quorum algorithm.** Sites are logically arranged as a **complete binary tree**. A tree of level k has \`2^(k+1) − 1\` sites, and any root-to-leaf path has \`k+1 = O(log n)\` sites — this is the best-case quorum size.

**GetQuorum construction:** recursively try to include a node and recurse into *one* child (left or right) if the node grants permission; if a node fails/refuses, substitute **both** its children's subtrees (each still needing to reach a leaf) — this is what lets the algorithm tolerate failures.

**Graceful degradation:** since best-case quorums need only O(log n) sites, the algorithm can still form a valid tree quorum as long as fewer than **log n** sites have failed. Beyond that, quorum size grows — worst case **O((n+1)/2)** — but the algorithm still functions as long as *some* root-to-leaf path (possibly rerouted through substituted subtrees) survives.

**Protocol mechanics:** mirrors Maekawa's REQUEST/REPLY/RELEASE (here called Request/Reply/Relinquish) with timestamp-ordered per-site request queues; if a lower-timestamp request arrives after a higher one is already at the head of some site's queue, an **Inquire** message checks whether that higher request has finished collecting all its replies — if not, it **Yields**, letting the more urgent (lower-timestamp) request take its place.

**Correctness:** guaranteed by the same intersection property as any coterie — e.g. with quorums {1,2,3}, {2,4,5}, {4,1,6}, if sites 3, 5, 6 simultaneously request the CS, whichever request arrives first at each shared intersection site (1 or 2) wins that mediation, and only the request that wins *every* mediation in its own quorum can actually enter — guaranteeing at most one winner at a time.`,
    },
  ],

  slides: [
    {
      label: "Lecture 05 — Size of Vector Clocks, Matrix Clocks, Virtual Time & Physical Clock Synchronization",
      note: "Dimension of a partial order vs. vector clock size, matrix clock rules R1/R2, Time Warp's optimistic virtual time, NTP offset-delay estimation.",
    },
    {
      label: "Lecture 06 — Global State and Snapshot Recording Algorithms",
      note: "Consistent vs. inconsistent global states, cuts in the space-time diagram, the Chandy-Lamport marker algorithm and its variants.",
    },
    {
      label: "Lecture 07 — Distributed Mutual Exclusion: Non-Token Based Approaches",
      note: "Safety/liveness/fairness requirements, performance metrics, Lamport's algorithm, and the Ricart-Agrawala algorithm.",
    },
    {
      label: "Lecture 08 — Quorum Based Distributed Mutual Exclusion Algorithms",
      note: "Coteries and quorums, Maekawa's algorithm and its deadlock handling, and the Agarwal-El Abbadi tree-quorum algorithm.",
    },
  ],

  mcqs: [
    // ---- Lecture 05 ----
    {
      id: "w2-q1",
      question: "Is a vector clock of size n always necessary to capture causality among events produced by n processes?",
      options: [
        "Yes, size n is always strictly required",
        "No — a size equal to the dimension of the partial order (E, ≺), which is at most n, is sufficient",
        "No, a scalar clock is always sufficient regardless of n",
        "Only if the processes communicate over non-FIFO channels",
      ],
      correctIndex: 1,
      explanation: "While a vector clock of size n lets you explicitly track progress at every process, determining causality between a pair of events only requires a clock whose size equals the dimension of the partial order (E, ≺) — and this dimension is upper-bounded by n, not always equal to it.",
      topic: "L5",
    },
    {
      id: "w2-q2",
      question: "What is the dimension of a partial order defined as?",
      options: [
        "The number of processes in the system",
        "The minimum number of linear extensions whose intersection gives exactly the partial order",
        "The maximum number of concurrent events at any instant",
        "The number of messages exchanged in the execution",
      ],
      correctIndex: 1,
      explanation: "A linear extension projects all events onto a single time axis consistently with the partial order. The dimension is the minimum number of such linear extensions L1, L2, ... whose intersection recovers exactly the causality relation P.",
      topic: "L5",
    },
    {
      id: "w2-q3",
      question: "In a strict client-server interaction (queries and responses strictly alternate) between two processes, what is the dimension of the execution, and what clock suffices?",
      options: [
        "Dimension 2; a vector clock of size 2 is required",
        "Dimension 1; a single scalar (Lamport) clock is adequate",
        "Dimension n; a matrix clock is required",
        "Dimension 0; no clock is needed since there's only one linear order",
      ],
      correctIndex: 1,
      explanation: "Although n = 2, every event is strictly ordered by the alternating query/response pattern, so there is only one linear order consistent with the partial order. The dimension is 1, and Lamport's scalar clock rules suffice to determine e ≺ f for any pair of events.",
      topic: "L5",
    },
    {
      id: "w2-q4",
      question: "A 'crown' of n messages m0, ..., mn-1 where Send(mi) ≺ Receive(m(i+1 mod n-1)) for all i has what dimension, and what does this imply?",
      options: [
        "Dimension 1 — a scalar clock always suffices for crowns",
        "Dimension n — a vector clock of size n is genuinely necessary",
        "Dimension n/2 — half the processes need tracking",
        "The dimension is undefined for crowns",
      ],
      correctIndex: 1,
      explanation: "A crown of n messages has dimension n. The concurrent send-receive example (two processes each sending before receiving the other's message) is the n=2 case: the two sends and two receives are concurrent, and a single integer is not sufficient — a vector clock of size 2 is genuinely required.",
      topic: "L5",
    },
    {
      id: "w2-q5",
      question: "In a system of matrix clocks, what does the entry mt_i[j, k] represent for process pi?",
      options: [
        "The local logical clock of process pi itself",
        "The latest knowledge pi has about pj's local logical clock",
        "The knowledge pi has about what pj knows about pk's local logical clock",
        "The number of messages pi has sent to pj",
      ],
      correctIndex: 2,
      explanation: "mt_i[i,i] is pi's own local clock; mt_i[i,j] is pi's latest knowledge of pj's local clock; and mt_i[j,k] represents pi's knowledge of what pj knows about pk's local clock — capturing second-hand knowledge across the whole matrix.",
      topic: "L5",
    },
    {
      id: "w2-q6",
      question: "What useful property do matrix clocks have that plain vector clocks lack?",
      options: [
        "They require fewer than n components to work",
        "If min_k(mt_i[k,l]) ≥ t, process pi knows that every other process pk knows pl's local time has progressed to at least t, allowing obsolete information to be discarded",
        "They eliminate the need for message piggybacking entirely",
        "They guarantee FIFO delivery on all channels",
      ],
      correctIndex: 1,
      explanation: "Beyond containing all the properties of a vector clock in row mt_i[i,.], the matrix clock lets pi conclude that all other processes already know pl won't send anything with local time ≤ t — so information about pl older than t can safely be discarded as obsolete.",
      topic: "L5",
    },
    {
      id: "w2-q7",
      question: "What optimistic assumption underlies the Time Warp implementation of virtual time?",
      options: [
        "That all channels are FIFO and messages never arrive out of order",
        "That synchronization conflicts and the resulting rollbacks generally occur rarely",
        "That every process runs at exactly the same physical speed",
        "That virtual time always equals real time",
      ],
      correctIndex: 1,
      explanation: "Time Warp uses a lookahead-rollback mechanism: each process executes without regard to others, assuming conflicts are rare. If a conflict is detected, the offending processes roll back to just before the conflict and re-execute — transparently to the user.",
      topic: "L5",
    },
    {
      id: "w2-q8",
      question: "Which pair of rules must every virtual time system obey, analogous to Lamport's clock conditions?",
      options: [
        "Rule 1: physical send time < physical receive time; Rule 2: events across processes are totally ordered",
        "Rule 1: virtual send time of a message < its virtual receive time; Rule 2: virtual time of an event in a process < virtual time of the next event in that process",
        "Rule 1: every process must have an identical virtual clock; Rule 2: rollbacks are forbidden",
        "Rule 1: messages must be delivered in FIFO order; Rule 2: virtual time must be discrete",
      ],
      correctIndex: 1,
      explanation: "These two rules mean a process sends messages in increasing order of virtual send time and receives/processes them in increasing order of virtual receive time — mirroring Lamport's clock consistency condition but applied to an assumed, optimistically-advanced virtual clock.",
      topic: "L5",
    },
    {
      id: "w2-q9",
      question: "In NTP's hierarchical design, what is the role of the primary server at the root of the tree?",
      options: [
        "It acts purely as a backup in case secondary servers fail",
        "It synchronizes directly with UTC (Universal Coordinated Time)",
        "It only serves clients, never other servers",
        "It has no special role — all servers are peers",
      ],
      correctIndex: 1,
      explanation: "NTP's tree has three levels: the primary server at the root synchronizes with UTC, secondary servers at the next level act as a backup to the primary, and the lowest level (the synchronization subnet) contains the clients.",
      topic: "L5",
    },
    {
      id: "w2-q10",
      question: "Given NTP timestamps Ti-3, Ti-2, Ti-1, Ti exchanged between two peers, how is the clock offset Oi estimated (assuming equal one-way delays)?",
      options: [
        "Oi = Ti − Ti-3",
        "Oi = (Ti-2 − Ti-3 + Ti-1 − Ti) / 2",
        "Oi = (Ti − Ti-1) − (Ti-2 − Ti-3)",
        "Oi = max(Ti-3, Ti-2, Ti-1, Ti)",
      ],
      correctIndex: 1,
      explanation: "With a = Ti-2 − Ti-3 and b = Ti-1 − Ti, the offset is estimated as Oi = (a + b) / 2 = (Ti-2 − Ti-3 + Ti-1 − Ti) / 2, while the round-trip delay is Di = (Ti − Ti-3) − (Ti-1 − Ti-2). NTP retains the eight most recent (Oi, Di) pairs and picks the Oi with minimum Di.",
      topic: "L5",
    },

    // ---- Lecture 06 ----
    {
      id: "w2-q11",
      question: "A global state GS is defined as a consistent global state if it satisfies which condition (using ⊕ as exclusive-or)?",
      options: [
        "send(mij) ∈ LSi ⇒ mij ∈ SCij ⊕ rec(mij) ∈ LSj",
        "rec(mij) ∈ LSj ⇒ send(mij) ∈ LSi is never required",
        "Every channel must always be recorded as non-empty",
        "All local states must be recorded at exactly the same physical time",
      ],
      correctIndex: 0,
      explanation: "Condition C1 requires that for every message send recorded in a process's local state, the message is either still in transit in the channel state or has been recorded as received — but not both (exclusive-or) and not neither.",
      topic: "L6",
    },
    {
      id: "w2-q12",
      question: "What does it mean for a global state to be 'strongly consistent'?",
      options: [
        "It is consistent but every channel contains at least one message",
        "It is both transitless (all channels recorded empty) and consistent",
        "It was recorded by a single, centralized coordinator process",
        "It uses matrix clocks instead of vector clocks",
      ],
      correctIndex: 1,
      explanation: "A global state is transitless iff every channel state SCjk is recorded as empty. A state that is both transitless and consistent is called strongly consistent.",
      topic: "L6",
    },
    {
      id: "w2-q13",
      question: "In the space-time diagram, what characterizes a consistent cut versus an inconsistent cut?",
      options: [
        "A consistent cut has more events in its PAST than its FUTURE",
        "A consistent cut has no message crossing from FUTURE to PAST; an inconsistent cut has at least one message crossing from FUTURE to PAST",
        "A consistent cut must pass through every process at the same physical time",
        "There is no meaningful difference — all cuts represent valid global states",
      ],
      correctIndex: 1,
      explanation: "A cut slices the computation into a PAST (left of the cut) and a FUTURE (right). In a consistent cut, every message received in the PAST was sent in the PAST too. If a message crosses from the FUTURE back into the PAST (i.e., its receipt is recorded before its send), the cut is inconsistent.",
      topic: "L6",
    },
    {
      id: "w2-q14",
      question: "In the classic money-transfer example, recording Account A's state before the $50 transfer message was sent, but recording channel C12's state after that transfer began, produced what result?",
      options: [
        "The recorded state exactly matched the true balance at every instant",
        "An inconsistency: the recorded global state showed $850 in the system instead of the true $800",
        "A deadlock between the two sites",
        "The channels were recorded as permanently empty",
      ],
      correctIndex: 1,
      explanation: "Because A's $600 was recorded before the $50 debit, while C12 was later recorded as carrying $50 (from a transfer that had already been reflected in A's decremented balance in reality), the snapshot double-counted the $50 — showing $850 instead of the true $800. This illustrates why recording activities must be coordinated.",
      topic: "L6",
    },
    {
      id: "w2-q15",
      question: "In the Chandy-Lamport algorithm, what must a process do upon executing the 'Marker Sending Rule'?",
      options: [
        "Ignore all further incoming messages until termination",
        "Record its local state, then send a marker along every outgoing channel before sending any further messages on that channel",
        "Broadcast its entire message history to all other processes",
        "Immediately terminate the algorithm",
      ],
      correctIndex: 1,
      explanation: "The Marker Sending Rule for process i: (1) record its own state, and (2) for each outgoing channel on which a marker has not yet been sent, send a marker along it before sending any further messages on that channel — this is what separates pre-snapshot from post-snapshot messages.",
      topic: "L6",
    },
    {
      id: "w2-q16",
      question: "Under the Chandy-Lamport 'Marker Receiving Rule', what does a process do if it has NOT yet recorded its own state when a marker arrives on channel C?",
      options: [
        "It records the state of channel C as the set of all messages ever sent on it",
        "It records the state of C as the empty set and then executes the Marker Sending Rule",
        "It ignores the marker entirely",
        "It terminates the algorithm immediately",
      ],
      correctIndex: 1,
      explanation: "If the process hasn't recorded its state yet, it records C's state as empty (since the marker's arrival means nothing sent before the sender's snapshot remains in that channel) and then follows the Marker Sending Rule itself, propagating markers onward.",
      topic: "L6",
    },
    {
      id: "w2-q17",
      question: "What is the message and time complexity of a single instance of the Chandy-Lamport snapshot algorithm, where e is the number of edges and d is the network diameter?",
      options: [
        "O(e) messages and O(d) time",
        "O(n²) messages and O(1) time",
        "O(1) messages and O(e) time",
        "O(d) messages and O(e) time",
      ],
      correctIndex: 0,
      explanation: "The recording part of a single Chandy-Lamport instance requires O(e) messages (roughly one marker per channel direction) and O(d) time, where d is the diameter of the network.",
      topic: "L6",
    },
    {
      id: "w2-q18",
      question: "Why is a global state recorded by the Chandy-Lamport algorithm still useful, even though it may never have actually occurred during the real execution?",
      options: [
        "Because it is always identical to the very first global state of the execution",
        "Because it is a valid state in some equivalent execution, so any stable property holding before the algorithm began will still hold in the recorded snapshot",
        "Because recorded states are guaranteed to be the final state of the computation",
        "It isn't useful — recorded states that never occurred are discarded",
      ],
      correctIndex: 1,
      explanation: "A process can change state asynchronously before its markers are received elsewhere, so the exact recorded combination of local states may never have co-occurred. But the system could have passed through it in an equivalent execution, which is why stable properties (ones that persist once true) detected in the snapshot are reliable.",
      topic: "L6",
    },
    {
      id: "w2-q19",
      question: "Which snapshot algorithm variant is designed to work for non-FIFO channels by piggybacking markers on computation messages?",
      options: [
        "Chandy-Lamport",
        "Lai-Yang",
        "Spezialetti-Kearns",
        "Mattern",
      ],
      correctIndex: 1,
      explanation: "Unlike the baseline Chandy-Lamport algorithm (which requires FIFO channels), the Lai-Yang algorithm works for non-FIFO channels by piggybacking markers on computation messages and using message history to compute channel states.",
      topic: "L6",
    },

    // ---- Lecture 07 ----
    {
      id: "w2-q20",
      question: "Why can't shared variables (semaphores) or a local kernel be used to implement mutual exclusion in a distributed system?",
      options: [
        "Because distributed systems don't support locking of any kind",
        "Because there is no shared memory across sites — message passing is the only means of coordination",
        "Because semaphores are only defined for single-threaded programs",
        "Because it would violate the FIFO channel assumption",
      ],
      correctIndex: 1,
      explanation: "In a distributed system, sites don't share memory or a kernel, so classic OS-level synchronization primitives don't apply. Message passing over the network is the sole means available for implementing distributed mutual exclusion.",
      topic: "L7",
    },
    {
      id: "w2-q21",
      question: "Which requirement of mutual exclusion algorithms specifically demands the absence of deadlock and starvation?",
      options: [
        "Safety",
        "Liveness",
        "Fairness",
        "Synchronization delay",
      ],
      correctIndex: 1,
      explanation: "Safety ensures only one process executes the CS at a time. Liveness ensures the absence of deadlock and starvation — two or more sites must not endlessly wait for messages that never arrive. Fairness additionally requires requests be served in (logical-clock) arrival order.",
      topic: "L7",
    },
    {
      id: "w2-q22",
      question: "What is 'synchronization delay' as a performance metric for mutual exclusion algorithms?",
      options: [
        "The total number of messages exchanged per CS execution",
        "The time between when the last site exits the CS and when the next site enters it",
        "The time between a site's CS request arriving and its request messages being sent",
        "The rate at which the system executes CS requests overall",
      ],
      correctIndex: 1,
      explanation: "Synchronization delay is specifically the gap between one site leaving the critical section and the next site being able to enter it — distinct from response time (which measures a single request's wait) and system throughput (the overall request-servicing rate, 1/(SD+E)).",
      topic: "L7",
    },
    {
      id: "w2-q23",
      question: "In Lamport's mutual exclusion algorithm, under what two conditions may site Si enter the critical section?",
      options: [
        "L1: Si has received a message with a larger timestamp than (tsi, i) from all other sites; L2: Si's request is at the top of request_queuei",
        "L1: Si has sent a REQUEST to every site; L2: no REPLY messages are pending anywhere in the system",
        "L1: Si's timestamp is the smallest possible integer; L2: all other sites are idle",
        "L1: Si has received a RELEASE from the previous CS holder; L2: Si's queue is empty",
      ],
      correctIndex: 0,
      explanation: "Si enters the CS only when it has received a message timestamped later than its own request from every other site (L1) and its own request sits at the head of its local request_queue (L2) — guaranteeing it has the earliest pending request it's currently aware of.",
      topic: "L7",
    },
    {
      id: "w2-q24",
      question: "How many messages per CS execution does Lamport's algorithm require in the basic (unoptimized) version, for N sites?",
      options: [
        "N messages",
        "2(N − 1) messages",
        "3(N − 1) messages: (N−1) REQUEST + (N−1) REPLY + (N−1) RELEASE",
        "N² messages",
      ],
      correctIndex: 2,
      explanation: "Each CS execution needs (N−1) REQUEST, (N−1) REPLY, and (N−1) RELEASE messages, for 3(N−1) total. An optimization that omits some REPLY messages (when a site has already sent a higher-timestamped request of its own) reduces this to between 2(N−1) and 3(N−1).",
      topic: "L7",
    },
    {
      id: "w2-q25",
      question: "In the Ricart-Agrawala algorithm, when does site Sj defer its REPLY to a REQUEST from Si?",
      options: [
        "Whenever Sj is idle and not requesting the CS",
        "Whenever Sj is requesting or executing the CS and its own request has a smaller (higher-priority) timestamp than Si's request",
        "Always — REPLY is never sent immediately in this algorithm",
        "Only if Si and Sj have identical timestamps",
      ],
      correctIndex: 1,
      explanation: "Sj replies immediately if it is neither requesting nor executing the CS, or if it is requesting but Si's timestamp is smaller than its own. Otherwise — i.e., Sj's own request has priority — it defers the reply and sets RDj[i]=1, replying only after it exits the CS.",
      topic: "L7",
    },
    {
      id: "w2-q26",
      question: "How does Ricart-Agrawala's message complexity per CS execution compare to Lamport's algorithm, for N sites?",
      options: [
        "Ricart-Agrawala needs 3(N−1) messages, more than Lamport's 2(N−1)",
        "Ricart-Agrawala needs 2(N−1) messages ((N−1) REQUEST + (N−1) REPLY) — no separate RELEASE message type is broadcast",
        "Both require exactly N² messages",
        "Ricart-Agrawala requires no messages at all once quorums are formed",
      ],
      correctIndex: 1,
      explanation: "Ricart-Agrawala uses only REQUEST and REPLY message types (deferred replies double as the release mechanism), needing (N−1) REQUEST + (N−1) REPLY = 2(N−1) messages per CS execution — fewer than Lamport's basic 3(N−1).",
      topic: "L7",
    },
    {
      id: "w2-q27",
      question: "The correctness proof that Ricart-Agrawala achieves mutual exclusion proceeds by contradiction. What does it show?",
      options: [
        "That two sites executing the CS concurrently would require the higher-priority site to send its own REPLY to the lower-priority site before exiting — which its algorithm forbids",
        "That REQUEST messages can never be lost in the model",
        "That FIFO channels are unnecessary for the proof to hold",
        "That a site can safely execute the CS without ever sending REQUEST messages",
      ],
      correctIndex: 0,
      explanation: "If Si (higher priority) and Sj were concurrently in the CS, Sj could only proceed if Si had already sent it a REPLY — but a site never replies to a lower-priority request before exiting the CS itself, so this scenario is impossible, proving mutual exclusion holds.",
      topic: "L7",
    },

    // ---- Lecture 08 ----
    {
      id: "w2-q28",
      question: "In quorum-based mutual exclusion, what does the 'intersection property' of a coterie require?",
      options: [
        "Every pair of quorums g, h in the coterie must satisfy g ∩ h ≠ ∅",
        "Every quorum must contain all N sites in the system",
        "No two quorums may share any site",
        "Quorums must be exactly half the size of the total number of sites",
      ],
      correctIndex: 0,
      explanation: "The intersection property guarantees any two quorums share at least one common site, which mediates conflicting requests between the two quorums' owners. The separate minimality property additionally forbids one quorum from being a superset of another (for efficiency, not correctness).",
      topic: "L8",
    },
    {
      id: "w2-q29",
      question: "In Maekawa's algorithm, what do conditions M3 and M4 (as opposed to M1 and M2) provide?",
      options: [
        "They are required purely for correctness of mutual exclusion",
        "They give desirable fairness/load-balancing features: equal request-set size (M3) and equal responsibility across sites (M4)",
        "They guarantee the algorithm is deadlock-free",
        "They eliminate the need for a REQUEST/REPLY/RELEASE message cycle",
      ],
      correctIndex: 1,
      explanation: "M1 and M2 are necessary for correctness. M3 (|Ri| = K for all i) ensures all sites do equal work, and M4 (every site appears in exactly K request sets) ensures equal responsibility in granting permissions — together giving |Ri| ≈ √N via projective-plane construction.",
      topic: "L8",
    },
    {
      id: "w2-q30",
      question: "Why can Maekawa's algorithm deadlock, even though it satisfies mutual exclusion?",
      options: [
        "Because messages are never acknowledged",
        "Because a site can be exclusively locked by other sites and requests are not prioritized by timestamp, so three sites can form a circular wait via their pairwise-intersecting request sets",
        "Because all sites share a single global quorum",
        "Because REPLY messages are broadcast to every site instead of just the quorum",
      ],
      correctIndex: 1,
      explanation: "With three sites Si, Sj, Sk simultaneously requesting the CS, if the intersection site between each pair has already granted the lock to the 'wrong' one, a circular wait can form (Si waits on Sj's lock-holder, which waits on Sk's, which waits on Si's) — a classic deadlock, resolved via FAILED/INQUIRE/YIELD messages.",
      topic: "L8",
    },
    {
      id: "w2-q31",
      question: "In the Agarwal-El Abbadi tree-quorum algorithm, sites are logically organized into a complete binary tree of level k. What is the length of a root-to-leaf path (and hence the best-case quorum size)?",
      options: [
        "O(√n)",
        "O(log n) — specifically k+1, the tree's level plus one",
        "O(n) — every site must be included",
        "A constant, independent of n",
      ],
      correctIndex: 1,
      explanation: "A complete binary tree of level k has 2^(k+1) − 1 sites, and the number of sites on any root-to-leaf path is k+1 = O(log n). In the failure-free best case, a quorum is exactly one such root-to-leaf path.",
      topic: "L8",
    },
    {
      id: "w2-q32",
      question: "What does 'graceful degradation' mean for the tree-quorum algorithm's fault tolerance?",
      options: [
        "The algorithm always requires exactly n/2 sites for a quorum, faults or not",
        "As long as fewer than log n site failures occur, the algorithm can still guarantee formation of a tree-structured quorum",
        "The algorithm stops working the moment any single site fails",
        "Performance degrades linearly with the number of CS requests",
      ],
      correctIndex: 1,
      explanation: "When a node fails, the GetQuorum construction substitutes it with two paths through its children, still needing only O(log n) sites in many failure cases. As long as failures number fewer than log n, a quorum can still be formed — this is the graceful degradation property. In the worst case, quorum size grows to O((n+1)/2).",
      topic: "L8",
    },
  ],

  flashcards: [
    { id: "w2-f1", front: "Is a vector clock of size n always necessary to determine causality between a pair of events?", back: "No — the minimum sufficient size equals the dimension of the partial order (E, ≺), which is upper-bounded by n but can be smaller (e.g. dimension 1 for strictly-alternating client-server interactions).", topic: "L5" },
    { id: "w2-f2", front: "Define the dimension of a partial order.", back: "The minimum number of linear extensions (total orders consistent with the partial order) whose intersection recovers exactly the original partial order.", topic: "L5" },
    { id: "w2-f3", front: "What dimension does a 'crown' of n messages have?", back: "Dimension n — a crown (Send(mi) ≺ Receive(m_{i+1 mod n-1}) for all i) genuinely requires a vector clock of size n to capture causality.", topic: "L5" },
    { id: "w2-f4", front: "In a matrix clock, what does mt_i[j,k] represent?", back: "Process pi's knowledge of what process pj knows about pk's local logical clock — i.e. second-hand knowledge, one level deeper than a vector clock.", topic: "L5" },
    { id: "w2-f5", front: "What extra capability do matrix clocks give beyond vector clocks?", back: "If min_k(mt_i[k,l]) ≥ t, pi knows every other process already knows pl's clock has passed t, so information about pl older than t can be safely discarded (garbage-collected).", topic: "L5" },
    { id: "w2-f6", front: "What optimistic assumption does the Time Warp mechanism make?", back: "That synchronization conflicts — and the rollbacks they require — occur rarely, so processes can run ahead without waiting and roll back only when a conflict is actually detected.", topic: "L5" },
    { id: "w2-f7", front: "State virtual time's two semantic rules (Time Warp).", back: "Rule 1: virtual send time of a message < its virtual receive time. Rule 2: virtual time of an event in a process < virtual time of the next event in that same process.", topic: "L5" },
    { id: "w2-f8", front: "How is Time Warp related to Lamport's logical clock scheme?", back: "It's essentially the inverse: Lamport conservatively advances clocks only as causality is learned (never violating it), while Time Warp optimistically advances and corrects violations after the fact via rollback.", topic: "L5" },
    { id: "w2-f9", front: "Describe NTP's hierarchical server structure.", back: "A primary server at the root syncs directly with UTC; secondary servers act as backups to the primary; clients sit at the lowest (synchronization subnet) level.", topic: "L5" },
    { id: "w2-f10", front: "Given NTP timestamps Ti-3, Ti-2, Ti-1, Ti, how is the offset Oi estimated?", back: "Oi = (Ti-2 − Ti-3 + Ti-1 − Ti) / 2, with round-trip delay Di = (Ti − Ti-3) − (Ti-1 − Ti-2); NTP keeps the 8 most recent (Oi, Di) pairs and picks the Oi with minimum Di.", topic: "L5" },
    { id: "w2-f11", front: "Why are logical clocks preferred over physical clocks for capturing causality in distributed systems?", back: "Event rates are far higher and execution times far smaller than in everyday life, so loosely-synchronized physical clocks can't reliably order events — logical clocks accurately capture causality's monotonicity property instead.", topic: "L5" },
    { id: "w2-f12", front: "Define transit(LSi, LSj) for channel Cij.", back: "The set of messages mij such that send(mij) has occurred in LSi but rec(mij) has not yet occurred in LSj — i.e. messages 'in flight' between the two recorded local states.", topic: "L6" },
    { id: "w2-f13", front: "What makes a global state 'strongly consistent'?", back: "It is both consistent (satisfies C1/C2) AND transitless — every channel is recorded as empty.", topic: "L6" },
    { id: "w2-f14", front: "What distinguishes a consistent cut from an inconsistent cut?", back: "A consistent cut has no message crossing from FUTURE to PAST (every received-in-PAST message was also sent in PAST). An inconsistent cut has at least one message crossing backward from FUTURE into PAST.", topic: "L6" },
    { id: "w2-f15", front: "State the two core issues (I1, I2) any snapshot algorithm must resolve.", back: "I1: distinguish which messages belong in the snapshot (sent before sender's snapshot = include; sent after = exclude). I2: determine when each process must take its own snapshot (no later than processing a message sent after the sender's snapshot).", topic: "L6" },
    { id: "w2-f16", front: "State Chandy-Lamport's Marker Sending Rule.", back: "A process records its own local state, then sends a marker along every outgoing channel (on which one hasn't been sent yet) before sending any further messages on that channel.", topic: "L6" },
    { id: "w2-f17", front: "State Chandy-Lamport's Marker Receiving Rule.", back: "If the process hasn't recorded its state yet: record the channel's state as empty, then execute the Marker Sending Rule. If it already has: record the channel's state as the messages received on it after its own snapshot and before this marker.", topic: "L6" },
    { id: "w2-f18", front: "What is the message and time complexity of the Chandy-Lamport algorithm?", back: "O(e) messages and O(d) time, where e = number of edges/channels and d = network diameter.", topic: "L6" },
    { id: "w2-f19", front: "Why can a recorded Chandy-Lamport snapshot still be useful even if it never actually occurred during execution?", back: "It is guaranteed to be a valid state in some equivalent execution, so any stable property (one that persists once true) holding before the snapshot began will still hold in the recorded snapshot — making it reliable for detecting stable properties like deadlock or termination.", topic: "L6" },
    { id: "w2-f20", front: "Which snapshot algorithm variant works for non-FIFO channels, and how?", back: "Lai-Yang — it piggybacks markers on regular computation messages and uses message history to compute channel states, instead of relying on FIFO ordering.", topic: "L6" },
    { id: "w2-f21", front: "Why can't shared-memory primitives like semaphores implement distributed mutual exclusion?", back: "Distributed sites share no memory or common kernel — message passing over the network is the only coordination mechanism available.", topic: "L7" },
    { id: "w2-f22", front: "Name the three requirements every mutual exclusion algorithm must satisfy.", back: "Safety (only one process in CS at a time), liveness (no deadlock/starvation), and fairness (requests generally served in logical-clock arrival order).", topic: "L7" },
    { id: "w2-f23", front: "Define synchronization delay as a performance metric.", back: "The time between when the last site exits the CS and when the next site enters it.", topic: "L7" },
    { id: "w2-f24", front: "State Lamport's algorithm's two conditions (L1, L2) for entering the CS.", back: "L1: the site has received a message timestamped later than its own request from every other site. L2: the site's own request is at the head of its local request_queue.", topic: "L7" },
    { id: "w2-f25", front: "What is Lamport's algorithm's message complexity per CS execution, and its optimization?", back: "3(N−1) messages base case ((N−1) each of REQUEST/REPLY/RELEASE); an optimization skipping unnecessary REPLYs brings it down to between 2(N−1) and 3(N−1).", topic: "L7" },
    { id: "w2-f26", front: "When does a site defer its REPLY in the Ricart-Agrawala algorithm?", back: "When it is itself requesting or executing the CS and its own request has a smaller (higher-priority) timestamp than the incoming request — it sets RDj[i]=1 and replies only after exiting the CS.", topic: "L7" },
    { id: "w2-f27", front: "What is Ricart-Agrawala's message complexity per CS execution?", back: "2(N−1) — (N−1) REQUEST + (N−1) REPLY messages; no separate RELEASE type since deferred replies serve that purpose.", topic: "L7" },
    { id: "w2-f28", front: "State the two properties every coterie of quorums must satisfy.", back: "Intersection property: any two quorums g, h share a common site (g ∩ h ≠ ∅). Minimality property: no quorum is a superset of another (for efficiency, not correctness).", topic: "L8" },
    { id: "w2-f29", front: "What do Maekawa's conditions M3 and M4 provide (beyond M1/M2's correctness)?", back: "M3 (equal request-set size |Ri|=K for all i) ensures equal workload; M4 (every site appears in exactly K request sets) ensures equal responsibility — giving fairness/load-balancing, with |Ri| ≈ √N.", topic: "L8" },
    { id: "w2-f30", front: "What is Maekawa's algorithm's message complexity and synchronization delay?", back: "3√N messages per CS execution (√N each of REQUEST/REPLY/RELEASE); synchronization delay is 2T since a site must release its whole quorum before the next requester's turn is enabled.", topic: "L8" },
    { id: "w2-f31", front: "Why can Maekawa's algorithm deadlock?", back: "Requests aren't timestamp-prioritized, so three sites with pairwise-intersecting request sets can form a circular wait (each blocked at a site that has granted permission to a different one of the three) — resolved via FAILED/INQUIRE/YIELD messages.", topic: "L8" },
    { id: "w2-f32", front: "In the Agarwal-El Abbadi tree-quorum algorithm, what is the best-case quorum size?", back: "O(log n) — the length of a root-to-leaf path in the complete binary tree of sites (k+1 sites for a tree of level k).", topic: "L8" },
    { id: "w2-f33", front: "Explain 'graceful degradation' in the tree-quorum algorithm.", back: "As long as fewer than log n sites have failed, the algorithm can still form a valid tree quorum (by substituting failed nodes with paths through both children); beyond that, quorum size grows up to the worst case O((n+1)/2).", topic: "L8" },
    { id: "w2-f34", front: "What is the worst-case tree-quorum size in the Agarwal-El Abbadi algorithm?", back: "O((n+1)/2) — roughly a majority of all sites, required when failures exceed the graceful-degradation threshold.", topic: "L8" },
  ],
};

export default week2;