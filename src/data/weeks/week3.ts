import type { WeekData } from "../../types";

const week3: WeekData = {
  week: 3,
  title: "Distributed Mutual Exclusion, Consensus & Rollback Recovery",
  status: "ready",
  pdfUrl: "/pdfs/week3-lecture-notes.pdf",

  notes: [
  {
    heading: `Token-based mutual exclusion`,
    body: `A single **token** circulates the system; a process may enter the critical section (CS) only while it holds the token, so exclusivity is automatic — one token, one process in CS at a time. Token-based algorithms use **sequence numbers**, not timestamps, to tell old requests from new ones. The two algorithms covered are **Suzuki–Kasami's broadcast algorithm** and **Raymond's tree-based algorithm**.`,
  },
  {
    heading: `Suzuki–Kasami's broadcast algorithm`,
    body: `If a process \`Pi\` wants the CS and already has the token, it enters directly. Otherwise it broadcasts \`REQUEST(i, sn)\` to every other process, and whoever holds the token eventually forwards it.

Two problems this must solve: **outdated requests** arriving after they've already been satisfied (due to variable message delay), and **finding outstanding requests** — after finishing CS, the token holder must know who's still waiting.

**RN array**: every process \`Si\` maintains \`RN_i[1..N]\`, where \`RN_i[j]\` is the largest sequence number seen so far from \`Sj\`. On receiving \`REQUEST(j, n)\`: \`RN_i[j] = max(RN_i[j], n)\`. A request is outdated if \`RN_i[j] > n\`.

**Token structure**: a FIFO queue \`Q\` of waiting processes, plus an \`LN\` array where \`LN[j]\` is the sequence number of the last request from \`Sj\` that was actually served. Process \`Sj\` has an **outstanding request** exactly when \`RN_i[j] = LN[j] + 1\`.

**Algorithm**:
- *Requesting*: increment own sequence number, broadcast \`REQUEST(i, sn)\`. If a receiver holds an idle token and \`RN[j] = LN[j] + 1\` for the requester, it sends the token over.
- *Executing*: enter CS once the token arrives.
- *Releasing*: set \`LN[i] = RN_i[i]\`; for every \`Sj\` where \`RN_i[j] = LN[j] + 1\` and \`Sj\` isn't already queued, enqueue it; if \`Q\` is non-empty, dequeue the front and send it the token.

**Correctness**: mutual exclusion holds because there is only one token. No starvation, since at most \`N−1\` requests can be ahead of any process in the queue.

**Performance**: 0 messages / 0 delay if the requester already holds an idle token; otherwise ≈ \`N\` messages, synchronization delay \`0\` or \`T\`.`,
  },
  {
    heading: `Raymond's tree-based algorithm`,
    body: `Processes sit on a **spanning tree** (generally unrooted); each node only needs to know its neighbors. Instead of a token, Raymond's algorithm uses the concept of **privilege** — only one node holds it at a time (barring transit).

**HOLDER**: each node's belief about which neighbor leads toward the privilege (not necessarily who holds it now); these directions chain together toward the privileged node.

**Other variables**: \`USING\` (currently in CS?), \`REQUEST_Q\` (FIFO queue of \`self\`/neighbor requests, max size = neighbors + 1), \`ASKED\` (already sent a request upstream — prevents duplicates).

**ASSIGN_PRIVILEGE**: if the node holds privilege, isn't using it, \`REQUEST_Q\` is non-empty, and the head isn't \`self\`, it dequeues the head and sends it \`PRIVILEGE\`; if the head is \`self\`, it enters CS.

**MAKE_REQUEST**: if the node lacks privilege, \`REQUEST_Q\` is non-empty, and it hasn't already asked, it sends \`REQUEST\` upstream and sets \`ASKED = true\`.

**Four key events** (each followed by \`ASSIGN_PRIVILEGE\` + \`MAKE_REQUEST\`): wanting CS (enqueue self), receiving \`REQUEST\` (enqueue requester), receiving \`PRIVILEGE\` (\`HOLDER = self\`), exiting CS (\`USING = false\`).

Unlike Suzuki–Kasami, Raymond's algorithm uses **no sequence numbers** — message overtaking between \`REQUEST\`/\`PRIVILEGE\` doesn't break correctness.

**Correctness**: mutual exclusion (only one privilege holder), deadlock-free (HOLDER paths always lead to the privilege), starvation-free.

**Performance**: worst case \`2 × longest path\` messages per CS; for a line topology, \`2(N−1)\`; for balanced trees, \`O(log N)\` on average; under heavy load, roughly 4 messages/CS.

**Comparison (approx. messages per CS, low/high load)**: Lamport \`3(N−1)\`/\`3(N−1)\`; Ricart–Agrawala \`2(N−1)\`/\`2(N−1)\`; Maekawa \`3√N\`/\`5√N\`; Suzuki–Kasami \`N\`/\`N\`; Raymond \`2logN\`/\`4\`.`,
  },
  {
    heading: `Fault models`,
    body: `Faults are classified by **component** (process, processor, link, storage) and by **behavior**:

- **Fail-stop** — process stops, and others can detect the failure.
- **Crash** — process stops, but others don't necessarily know.
- **Receive omission** — fails to receive some messages.
- **Send omission** — fails to send some messages.
- **General omission** — a mix of send and receive omission.
- **Byzantine** — arbitrary, possibly malicious, behavior.

**Masking** fault tolerance keeps the system behaving to spec despite faults; **non-masking** allows a well-defined deviation.

**System assumptions** to fix before analyzing a protocol: failure model, sync/async communication, network connectivity, sender identification, channel reliability, authenticated vs unauthenticated messages, and the agreement variable itself.

**Synchronous** systems run in rounds (receive → compute → send, lock-step); **asynchronous** systems have no fixed round structure or delay bound.

**Authenticated vs unauthenticated messages**: with authentication (e.g. digital signatures), forgery/tampering by a faulty process is detectable; without it, a faulty process can forge messages or claim others said something they didn't.

Performance is measured in **time (rounds)**, **message traffic**, and **storage overhead**.`,
  },
  {
    heading: `Consensus and Byzantine agreement`,
    body: `**Byzantine Agreement**: one designated source has an initial value; all non-faulty processes must reach **Agreement** (same value), **Validity** (if source is non-faulty, agreed value = its value), and **Termination**.

**Consensus**: every process has its own initial value; **Agreement** (same decision), **Validity** (if all non-faulty processes start identical, that's the decision), **Termination**.

**Interactive consistency**: processes agree on an array \`A[v1..vn]\`; for non-faulty \`i\`, \`A[i] = vi\` (faulty entries are unconstrained).

Byzantine Agreement ↔ Consensus ↔ Interactive Consistency are **equivalent** — a solution to one converts to the others; the key distinction is one source (agreement) vs many initial values (consensus).

**Solvability table**:
| Failure | Synchronous | Asynchronous |
|---|---|---|
| None | Solvable | Solvable |
| Crash | Solvable | **Not solvable** |
| Byzantine | Solvable (bounded) | **Not solvable** |

Synchronous crash and Byzantine agreement both have a lower bound of \`Ω(f+1)\` rounds.

**FLP impossibility**: deterministic consensus is impossible in an asynchronous message-passing system if even one process may crash — arguably the single most important result in this unit.

**Working around FLP**: Terminating Reliable Broadcast (Validity/Agreement/Integrity/Termination, with a null message allowed if the sender crashes mid-send), **k-set consensus** (correct processes may choose different values, but at most \`k\` distinct ones overall; solvable when \`f < k\`), **ε-approximate agreement** (\`|value_i − value_j| ≤ ε\`), and **renaming** (agree on distinct names).

**Crash consensus** (synchronous, \`f\` fail-stop failures, \`f < n\`): each process broadcasts its value once, then repeatedly updates \`x = min(x, received values)\`; after \`f+1\` rounds, output \`x\`. Cost: \`f+1\` rounds, \`O(n²)\` messages/round, \`O((f+1)n²)\` total.

**Byzantine agreement bound**: \`n ≥ 3f+1\` (equivalently \`f ≤ (n−1)/3\`). E.g. \`f=1 → n≥4\`; \`f=2 → n≥7\`; \`f=3 → n≥10\`. Agreement is impossible at \`n=3, f=1\` but solvable at \`n=4, f=1\`.

**Lamport–Shostak–Pease OM(f)** (Oral Message algorithm), requiring \`n ≥ 3f+1\`:
- \`OM(0)\`: commander sends its value; each process uses what it received (default 0 if nothing).
- \`OM(f)\` for \`f>0\`: commander sends to everyone; each recipient acts as a sub-commander and runs \`OM(f−1)\` to relay its value further; finally each process takes the \`majority\` of everything it collected (default 0 if no majority).

Cost: \`f+1\` rounds; message counts explode combinatorially — e.g. \`f=1,n=4 → 9\`; \`f=2,n=7 → 156\`; \`f=3,n=10 → 3609\`; space complexity is exponential in \`f\`.`,
  },
  {
    heading: `Checkpointing and rollback recovery`,
    body: `A **fault** can cause an **error**, which can cause a **failure**. **Backward recovery** (checkpointing, logging, undo/redo logs) restores an earlier error-free state; **forward recovery** repairs the erroneous state directly.

**Rollback recovery** restores the distributed system to a consistent post-failure state using periodically saved **checkpoints**. Because processes communicate, one process's rollback can force a dependent process to roll back too — the **domino effect**, which in the worst case can cascade almost to the start of execution. A **livelock** is the degenerate case where rollbacks keep triggering further rollbacks indefinitely.

A **local checkpoint** \`C_i,k\` is the k-th saved snapshot of process \`Pi\`'s state (every process starts with \`C_i,0\`). A **global state** is the combined state of every process and every channel; it's **consistent** if it could have occurred in a failure-free run — concretely, no receive can be recorded without the matching send being reflected in the sender's state. A **consistent global checkpoint** is one checkpoint per process satisfying this.

**Message types**: **in-transit** (sent, not yet received), **lost** (send recorded, receive undone by rollback), **delayed** (receive not recorded — receiver was down or the message arrived post-rollback), **orphan** (receive recorded, send not — the mirror of "lost"), **duplicate** (created during logging/replay).

**Three checkpoint-based schemes**:
- **Uncoordinated** — each process checkpoints independently; low runtime overhead but domino-effect-prone, slow recovery, multiple checkpoints and garbage collection needed.
- **Coordinated** — processes synchronize to produce one consistent global checkpoint. **Blocking**: pause execution during checkpointing (simple, but stalls computation). **Non-blocking**: keep running, but must avoid inconsistencies from in-flight messages.
- **Communication-induced** — piggybacks coordination info on application messages; combines **autonomous** checkpoints (independent) with **forced** checkpoints (triggered before processing certain messages); no dedicated coordination messages needed. Two variants: model-based and index-based.

**Log-based recovery** combines checkpointing with logging of **nondeterministic events**, relying on the **Piecewise Deterministic (PWD)** assumption — that such events can be identified and their replay information (**determinants**) captured. A message *send* is not itself treated as nondeterministic.

- **Pessimistic logging** — determinant is stored on stable storage *before* the event's effects become visible (may block); simpler recovery, but slower failure-free execution.
- **Optimistic logging** — determinants logged asynchronously, no wait; faster failure-free execution, but complex recovery (orphan processes possible, causal dependencies must be tracked, harder garbage collection).
- **Causal logging** — combines both: like optimistic, it avoids synchronous stable-storage access except at output commit; like pessimistic, it avoids orphans and lets processes commit output independently, by tracking events that causally affected its state.

**Koo–Toueg coordinated checkpointing**: two checkpoint types — **tentative** and **permanent** (a tentative one becomes permanent only after the protocol succeeds) — in two phases: Phase 1 (initiator + everyone takes tentative checkpoints, no further sends allowed), Phase 2 (broadcast final \`DO\`/\`DISCARD\` decision). A similar two-phase pattern is used for the rollback-recovery decision itself (ask whether to restart from previous checkpoints, then broadcast the final decision).

Other named algorithms: **Juang–Venkatesan** (asynchronous checkpointing, finding a consistent checkpoint set), **Manivannan–Singhal** (quasi-synchronous, communication-induced, avoids useless checkpoints), **Peterson–Kearns** (vector time + optimistic rollback), **Helary–Mostefaoui–Netzer–Raynal** (communication-induced, avoids useless checkpoints).`,
  },
  {
    heading: `Last-minute revision sheet`,
    body: `- **Suzuki–Kasami**: outstanding request when \`RN_i[j] = LN[j]+1\`; worst-case request cost \`N\` messages; sync delay \`0\` or \`T\`.
- **Raymond**: worst case \`2 × longest path\`; line topology \`2(N−1)\`; balanced tree \`O(log N)\`; heavy load ≈ \`4\` messages/CS.
- **Crash consensus**: \`f+1\` rounds, \`O((f+1)n²)\` messages.
- **Byzantine agreement**: \`n ≥ 3f+1\`, \`f ≤ (n−1)/3\`, \`f+1\` rounds, algorithm = OM(f).
- **FLP**: asynchronous + message passing + 1 possible crash ⟹ consensus impossible.
- **k-set consensus**: solvable when \`f < k\`.
- **ε-agreement**: decided values differ by at most \`ε\`.
- **Recovery**: uncoordinated → domino effect; coordinated → consistent global checkpoint; communication-induced → piggyback + forced checkpoints.
- **Logging**: pessimistic → log first, simpler recovery; optimistic → log async, harder recovery; causal → balances both.`,
  }
  ],
  slides: [],
  mcqs: [
  {
    id: "w3-q1",
    question: `In a token-based distributed mutual exclusion algorithm, a process can enter the critical section when:`,
    options: [
        `It receives permission from a majority of processes`,
        `It has the token/privilege`,
        `It receives a timestamp from the coordinator`,
        `All other processes are idle`
    ],
    correctIndex: 1,
    explanation: `A single token grants exclusive CS access — no voting or timestamps are needed to enter once you hold it.`,
  },
  {
    id: "w3-q2",
    question: `Which of the following is used by Suzuki–Kasami to distinguish between old and new requests?`,
    options: [
        `Lamport timestamps`,
        `Vector clocks`,
        `Sequence numbers`,
        `Physical clocks`
    ],
    correctIndex: 2,
    explanation: `Suzuki–Kasami tags each REQUEST with a sequence number so stale, already-satisfied requests can be told apart from live ones.`,
  },
  {
    id: "w3-q3",
    question: `In Suzuki–Kasami's algorithm, \`RN_i[j]\` represents:`,
    options: [
        `Number of requests generated by process \`Pi\``,
        `Largest sequence number of a request from \`Pj\` known to \`Pi\``,
        `Number of times \`Pi\` entered CS`,
        `Sequence number of the token`
    ],
    correctIndex: 1,
    explanation: `RN_i[j] is process Pi's record of the highest sequence number it has seen from Pj.`,
  },
  {
    id: "w3-q4",
    question: `In Suzuki–Kasami, process \`Pj\` has an outstanding request when:`,
    options: [
        `\`RN_i[j] = LN[j]\``,
        `\`RN_i[j] < LN[j]\``,
        `\`RN_i[j] = LN[j] + 1\``,
        `\`RN_i[j] > LN[j] + 1\``
    ],
    correctIndex: 2,
    explanation: `A request from Pj is outstanding exactly when RN_i[j] = LN[j] + 1, i.e. one more request than has been served.`,
  },
  {
    id: "w3-q5",
    question: `What is the primary purpose of the \`LN\` array in the Suzuki–Kasami token?`,
    options: [
        `Store the physical clock of every process`,
        `Record the latest request number that has been served for each process`,
        `Store the number of messages received`,
        `Store the number of processes currently in CS`
    ],
    correctIndex: 1,
    explanation: `LN[j] records the sequence number of Pj's request that was most recently served, so the token holder knows who's already been satisfied.`,
  },
  {
    id: "w3-q6",
    question: `Suppose the current values are:

\`\`\`text
RN_i[j] = 5
LN[j] = 4
\`\`\`

What does this indicate?`,
    options: [
        `No request from \`Pj\` is pending`,
        `\`Pj\` has an outstanding request`,
        `\`Pj\` has already entered CS twice`,
        `The token is lost`
    ],
    correctIndex: 1,
    explanation: `RN_i[j]=5 and LN[j]=4 fits RN=LN+1, so Pj still has one pending, unserved request.`,
  },
  {
    id: "w3-q7",
    question: `If a process in Suzuki–Kasami already possesses an idle token and wants to enter the CS, the number of messages required is:`,
    options: [
        `0`,
        `1`,
        `N−1`,
        `N`
    ],
    correctIndex: 0,
    explanation: `Already holding an idle token means the process can enter CS immediately with zero messages.`,
  },
  {
    id: "w3-q8",
    question: `Why does Suzuki–Kasami guarantee mutual exclusion?`,
    options: [
        `Requests are ordered by timestamps`,
        `A majority grants permission`,
        `There is only one token`,
        `Processes use vector clocks`
    ],
    correctIndex: 2,
    explanation: `Only one token exists system-wide, so possessing it is both necessary and sufficient for exclusive entry — this directly guarantees mutual exclusion.`,
  },
  {
    id: "w3-q9",
    question: `Raymond's algorithm primarily organizes processes using:`,
    options: [
        `A ring`,
        `A tree`,
        `A complete graph`,
        `A star only`
    ],
    correctIndex: 1,
    explanation: `Raymond's algorithm arranges all processes along a spanning tree instead of broadcasting to everyone.`,
  },
  {
    id: "w3-q10",
    question: `In Raymond's algorithm, the \`HOLDER\` variable indicates:`,
    options: [
        `The process currently executing CS`,
        `The direction toward the node believed to possess the privilege`,
        `Number of outstanding requests`,
        `Number of neighbors`
    ],
    correctIndex: 1,
    explanation: `HOLDER doesn't name the privileged node directly — it points toward the neighbor that leads to it.`,
  },
  {
    id: "w3-q11",
    question: `Which variable prevents a node from repeatedly sending requests toward the privilege?`,
    options: [
        `\`USING\``,
        `\`HOLDER\``,
        `\`ASKED\``,
        `\`LN\``
    ],
    correctIndex: 2,
    explanation: `ASKED tracks whether a REQUEST has already been forwarded, preventing duplicate outgoing requests.`,
  },
  {
    id: "w3-q12",
    question: `\`REQUEST_Q\` in Raymond's algorithm is:`,
    options: [
        `A priority queue ordered by timestamps`,
        `A FIFO queue of requests`,
        `A queue containing all processes in the system`,
        `A queue containing only failed processes`
    ],
    correctIndex: 1,
    explanation: `REQUEST_Q is a simple FIFO queue holding pending requesters (self and/or neighbors).`,
  },
  {
    id: "w3-q13",
    question: `A node in Raymond's algorithm receives a \`PRIVILEGE\` message. What should happen to its \`HOLDER\` variable?`,
    options: [
        `\`HOLDER = null\``,
        `\`HOLDER = parent\``,
        `\`HOLDER = self\``,
        `\`HOLDER = requester\``
    ],
    correctIndex: 2,
    explanation: `On receiving PRIVILEGE, the node becomes the (believed) holder, so HOLDER is set to self.`,
  },
  {
    id: "w3-q14",
    question: `Consider a line topology of \`N\` processes in Raymond's algorithm. The longest path contains:`,
    options: [
        `\`N\` edges`,
        `\`N−1\` edges`,
        `\`N+1\` edges`,
        `\`log N\` edges`
    ],
    correctIndex: 1,
    explanation: `In a line of N processes, the longest path between two ends spans N−1 edges.`,
  },
  {
    id: "w3-q15",
    question: `For the line topology, the worst-case message complexity per CS execution in Raymond's algorithm is:`,
    options: [
        `\`N\``,
        `\`N−1\``,
        `\`2(N−1)\``,
        `\`3(N−1)\``
    ],
    correctIndex: 2,
    explanation: `Worst case cost is 2 × longest path; for a line that's 2(N−1).`,
  },
  {
    id: "w3-q16",
    question: `Which statement correctly compares Suzuki–Kasami and Raymond?`,
    options: [
        `Both require a spanning tree`,
        `Suzuki–Kasami uses broadcast, while Raymond uses a tree`,
        `Raymond uses sequence numbers while Suzuki–Kasami does not`,
        `Both use majority voting`
    ],
    correctIndex: 1,
    explanation: `Suzuki–Kasami relies on broadcasting REQUESTs to all processes, while Raymond routes requests along tree edges only.`,
  },
  {
    id: "w3-q17",
    question: `In a fail-stop model, when a process fails:`,
    options: [
        `It can continue sending arbitrary messages`,
        `Its failure is detectable by other processes`,
        `It behaves maliciously`,
        `Only its memory fails`
    ],
    correctIndex: 1,
    explanation: `Fail-stop means the process halts and this halt is detectable by others — unlike a plain crash.`,
  },
  {
    id: "w3-q18",
    question: `A crash failure differs from a Byzantine failure because:`,
    options: [
        `A crashed process may behave arbitrarily`,
        `A Byzantine process simply stops`,
        `Byzantine behavior can be arbitrary, while crash means the process stops functioning`,
        `There is no difference`
    ],
    correctIndex: 2,
    explanation: `Crash = the process simply stops; Byzantine = the process can behave arbitrarily, including maliciously.`,
  },
  {
    id: "w3-q19",
    question: `A process that fails to send some messages is experiencing:`,
    options: [
        `Receive omission`,
        `Send omission`,
        `Byzantine failure`,
        `Timing failure`
    ],
    correctIndex: 1,
    explanation: `Failing to send some of its own messages is a send omission.`,
  },
  {
    id: "w3-q20",
    question: `A process that fails to receive some messages is experiencing:`,
    options: [
        `Send omission`,
        `Receive omission`,
        `Crash failure`,
        `Byzantine failure`
    ],
    correctIndex: 1,
    explanation: `Failing to receive some incoming messages is a receive omission.`,
  },
  {
    id: "w3-q21",
    question: `Which fault model allows a process to behave arbitrarily?`,
    options: [
        `Crash`,
        `Fail-stop`,
        `Omission`,
        `Byzantine`
    ],
    correctIndex: 3,
    explanation: `Byzantine faults permit arbitrary, even malicious, behavior — the most severe fault model listed.`,
  },
  {
    id: "w3-q22",
    question: `Which of the following is NOT one of the standard properties of consensus?`,
    options: [
        `Agreement`,
        `Validity`,
        `Termination`,
        `Authentication`
    ],
    correctIndex: 3,
    explanation: `Consensus is defined by Agreement, Validity, and Termination — authentication is a system assumption, not a consensus property.`,
  },
  {
    id: "w3-q23",
    question: `The agreement property requires that:`,
    options: [
        `Every process chooses its own initial value`,
        `All non-faulty processes decide on the same value`,
        `Only the source decides`,
        `Faulty processes must also decide correctly`
    ],
    correctIndex: 1,
    explanation: `Agreement requires all non-faulty processes to converge on one common decision value.`,
  },
  {
    id: "w3-q24",
    question: `In consensus, validity generally requires that if all non-faulty processes start with the same value:`,
    options: [
        `The value must be rejected`,
        `The decision must equal that value`,
        `The decision must be zero`,
        `The leader's value must be selected`
    ],
    correctIndex: 1,
    explanation: `Validity says that if every non-faulty process starts with the same value, that must be the decided value.`,
  },
  {
    id: "w3-q25",
    question: `In Byzantine Agreement, the initial value is associated with:`,
    options: [
        `Every process independently`,
        `A designated source/process`,
        `The network`,
        `The token holder`
    ],
    correctIndex: 1,
    explanation: `In Byzantine Agreement, a single designated source process holds the initial value to be agreed upon.`,
  },
  {
    id: "w3-q26",
    question: `Interactive consistency requires processes to agree on:`,
    options: [
        `A single Boolean value`,
        `An array containing values corresponding to processes`,
        `The identity of the coordinator`,
        `The number of failures`
    ],
    correctIndex: 1,
    explanation: `Interactive consistency asks all processes to agree on a full array of values, one entry per process.`,
  },
  {
    id: "w3-q27",
    question: `A synchronous distributed system is characterized by:`,
    options: [
        `No assumptions about message delivery`,
        `Execution in rounds with timing assumptions`,
        `Arbitrary message delays with no bounds`,
        `No communication`
    ],
    correctIndex: 1,
    explanation: `Synchronous systems proceed in rounds with known timing/message-delay bounds.`,
  },
  {
    id: "w3-q28",
    question: `In an asynchronous system:`,
    options: [
        `All processes execute in lock-step rounds`,
        `Message delays and process speeds have no fixed known bounds`,
        `Every message arrives within one round`,
        `Failures cannot occur`
    ],
    correctIndex: 1,
    explanation: `Asynchronous systems have no fixed bound on message delay or relative process speed.`,
  },
  {
    id: "w3-q29",
    question: `The FLP impossibility result states that deterministic consensus is impossible in:`,
    options: [
        `Synchronous systems with Byzantine failures`,
        `Asynchronous message-passing systems with even one possible crash failure`,
        `Synchronous systems without failures`,
        `Shared memory systems without failures`
    ],
    correctIndex: 1,
    explanation: `FLP shows deterministic consensus can't be guaranteed in an asynchronous message-passing system if even one process might crash.`,
  },
  {
    id: "w3-q30",
    question: `Which of the following can be used to circumvent or weaken the consensus impossibility in asynchronous systems?`,
    options: [
        `\`k\`-set consensus`,
        `ε-agreement`,
        `Reliable broadcast`,
        `All of the above`
    ],
    correctIndex: 3,
    explanation: `k-set consensus, ε-agreement, and reliable broadcast are all weaker problems used to work around FLP.`,
  },
  {
    id: "w3-q31",
    question: `Consider a synchronous system with \`f\` possible crash failures. The crash consensus algorithm discussed in the lecture requires:`,
    options: [
        `\`f\` rounds`,
        `\`f+1\` rounds`,
        `\`2f\` rounds`,
        `\`n+f\` rounds`
    ],
    correctIndex: 1,
    explanation: `The crash consensus algorithm in the lecture needs f+1 rounds to tolerate f crash failures.`,
  },
  {
    id: "w3-q32",
    question: `In the crash consensus algorithm, processes update their value using:`,
    options: [
        `Maximum received value`,
        `Minimum of current and received values`,
        `Average of received values`,
        `Majority only`
    ],
    correctIndex: 1,
    explanation: `Each round, a process updates its value to the minimum of its current value and all values it received.`,
  },
  {
    id: "w3-q33",
    question: `If a crash consensus system has \`n\` processes and up to \`f\` failures, the message complexity discussed is:`,
    options: [
        `\`O(n)\``,
        `\`O(f+n)\``,
        `\`O((f+1)n²)\``,
        `\`O(log n)\``
    ],
    correctIndex: 2,
    explanation: `Over f+1 rounds with O(n²) messages per round, total message complexity is O((f+1)n²).`,
  },
  {
    id: "w3-q34",
    question: `For Byzantine agreement with unauthenticated messages, the fundamental requirement is:`,
    options: [
        `\`n ≥ 2f\``,
        `\`n ≥ 3f\``,
        `\`n ≥ 3f+1\``,
        `\`n ≥ f+1\``
    ],
    correctIndex: 2,
    explanation: `Byzantine agreement (unauthenticated) needs n ≥ 3f+1 processes to tolerate f faulty ones.`,
  },
  {
    id: "w3-q35",
    question: `If there can be at most 2 Byzantine processes, the minimum number of processes required is:`,
    options: [
        `5`,
        `6`,
        `7`,
        `8`
    ],
    correctIndex: 2,
    explanation: `For f=2, n ≥ 3(2)+1 = 7.`,
  },
  {
    id: "w3-q36",
    question: `If \`n = 10\`, the maximum number of Byzantine failures that can be tolerated under the \`n ≥ 3f+1\` condition is:`,
    options: [
        `2`,
        `3`,
        `4`,
        `5`
    ],
    correctIndex: 1,
    explanation: `n ≥ 3f+1 ⟹ f ≤ (n−1)/3; for n=10, f ≤ 3.`,
  },
  {
    id: "w3-q37",
    question: `The Lamport–Shostak–Pease algorithm for Byzantine agreement is commonly referred to as:`,
    options: [
        `RA(f)`,
        `OM(f)`,
        `SK(f)`,
        `RTB(f)`
    ],
    correctIndex: 1,
    explanation: `The Lamport–Shostak–Pease Byzantine agreement algorithm is the Oral Message algorithm, OM(f).`,
  },
  {
    id: "w3-q38",
    question: `OM(0) essentially requires:`,
    options: [
        `No communication`,
        `The commander/source sends its value and processes use the received value`,
        `Every process broadcasts twice`,
        `A majority vote among all processes`
    ],
    correctIndex: 1,
    explanation: `OM(0) is the base case: the commander sends its value directly and each process just uses what it received.`,
  },
  {
    id: "w3-q39",
    question: `In OM(f), the recursive algorithm executed after receiving a value from the commander is:`,
    options: [
        `OM(f+1)`,
        `OM(f−1)`,
        `OM(2f)`,
        `OM(0) only`
    ],
    correctIndex: 1,
    explanation: `Each process that receives the commander's value acts as a sub-commander and runs OM(f−1) to relay it further.`,
  },
  {
    id: "w3-q40",
    question: `At the final stage of OM(f), processes generally use:`,
    options: [
        `Minimum`,
        `Maximum`,
        `Majority`,
        `Random selection`
    ],
    correctIndex: 2,
    explanation: `At the end, each process takes the majority value among everything it collected.`,
  },
  {
    id: "w3-q41",
    question: `In \`k\`-set consensus, correct processes are allowed to decide:`,
    options: [
        `Exactly \`k\` values`,
        `At most \`k\` different values`,
        `At least \`k\` different values`,
        `Only one predefined value`
    ],
    correctIndex: 1,
    explanation: `k-set consensus allows correct processes to settle on at most k distinct decision values, not necessarily one.`,
  },
  {
    id: "w3-q42",
    question: `The lecture states that \`k\`-set consensus is solvable when:`,
    options: [
        `\`f > k\``,
        `\`f = k\``,
        `\`f < k\``,
        `\`f > n\``
    ],
    correctIndex: 2,
    explanation: `k-set consensus is solvable exactly when the number of faults f is less than k.`,
  },
  {
    id: "w3-q43",
    question: `In ε-approximate agreement, the decided values of correct processes must:`,
    options: [
        `Be exactly identical`,
        `Differ by no more than ε`,
        `Always be integers`,
        `Equal the source's value`
    ],
    correctIndex: 1,
    explanation: `ε-approximate agreement only requires decided values to be within ε of each other, not identical.`,
  },
  {
    id: "w3-q44",
    question: `The renaming problem requires processes to:`,
    options: [
        `Agree on the same name`,
        `Agree on necessarily distinct names`,
        `Agree on the leader`,
        `Change their IP addresses`
    ],
    correctIndex: 1,
    explanation: `The renaming problem requires processes to agree on new names that are pairwise distinct.`,
  },
  {
    id: "w3-q45",
    question: `Rollback recovery is primarily an example of:`,
    options: [
        `Forward recovery`,
        `Backward recovery`,
        `Preventive maintenance`,
        `Byzantine masking`
    ],
    correctIndex: 1,
    explanation: `Rollback recovery restores an earlier, error-free state — the defining feature of backward recovery.`,
  },
  {
    id: "w3-q46",
    question: `A checkpoint is:`,
    options: [
        `A network address`,
        `A saved state of a process`,
        `A message queue`,
        `A failure detector`
    ],
    correctIndex: 1,
    explanation: `A checkpoint is simply a saved snapshot of a process's state at some point in time.`,
  },
  {
    id: "w3-q47",
    question: `A global state of a distributed system consists of:`,
    options: [
        `Only process states`,
        `Only channel states`,
        `Process states and communication-channel states`,
        `Only checkpoint states`
    ],
    correctIndex: 2,
    explanation: `A global state combines the states of every process and every communication channel.`,
  },
  {
    id: "w3-q48",
    question: `A consistent global state must satisfy the condition that:`,
    options: [
        `Every process has identical state`,
        `Every sent message must be received`,
        `There cannot be a receive event without the corresponding send being reflected in the state`,
        `All processes must checkpoint simultaneously`
    ],
    correctIndex: 2,
    explanation: `Consistency requires that no recorded receive exists without its matching send being reflected in the sender's state.`,
  },
  {
    id: "w3-q49",
    question: `A message is called an **orphan** when:`,
    options: [
        `It has been sent but not received`,
        `Its receive is recorded but its corresponding send is not`,
        `It is duplicated`,
        `It is delayed`
    ],
    correctIndex: 1,
    explanation: `An orphan message has its receive recorded in the checkpoint but no corresponding recorded send — the mirror image of a lost message.`,
  },
  {
    id: "w3-q50",
    question: `A message that has been sent but not yet received is:`,
    options: [
        `Orphan`,
        `In-transit`,
        `Duplicate`,
        `Lost`
    ],
    correctIndex: 1,
    explanation: `A message that's been sent but not yet received is in-transit.`,
  },
  {
    id: "w3-q51",
    question: `The domino effect refers to:`,
    options: [
        `Multiple processes entering CS`,
        `Cascading rollbacks caused by failures`,
        `Duplicate messages`,
        `Byzantine agreement failure`
    ],
    correctIndex: 1,
    explanation: `The domino effect is the cascading chain of rollbacks that can ripple through dependent processes after a failure.`,
  },
  {
    id: "w3-q52",
    question: `A livelock in rollback recovery occurs when:`,
    options: [
        `No process ever rolls back`,
        `Rollback continues indefinitely without reaching a useful recovery state`,
        `All processes terminate immediately`,
        `The token is permanently lost`
    ],
    correctIndex: 1,
    explanation: `A livelock is when rollbacks keep triggering further rollbacks indefinitely without the system settling into a useful recovered state.`,
  },
  {
    id: "w3-q53",
    question: `In uncoordinated checkpointing:`,
    options: [
        `All processes checkpoint simultaneously`,
        `Each process independently decides when to checkpoint`,
        `A coordinator controls every checkpoint`,
        `Checkpoints are prohibited during execution`
    ],
    correctIndex: 1,
    explanation: `In uncoordinated checkpointing, each process picks its own checkpoint times independently, with no coordination.`,
  },
  {
    id: "w3-q54",
    question: `A major disadvantage of uncoordinated checkpointing is:`,
    options: [
        `It requires no storage`,
        `Domino effect`,
        `It cannot create checkpoints`,
        `It always blocks execution`
    ],
    correctIndex: 1,
    explanation: `Because checkpoints aren't coordinated, uncoordinated checkpointing is vulnerable to the domino effect during recovery.`,
  },
  {
    id: "w3-q55",
    question: `Coordinated checkpointing attempts to produce:`,
    options: [
        `Independent checkpoints`,
        `A consistent global checkpoint`,
        `Byzantine checkpoints`,
        `Only local checkpoints`
    ],
    correctIndex: 1,
    explanation: `Coordinated checkpointing has processes synchronize so the resulting set of checkpoints forms one consistent global checkpoint.`,
  },
  {
    id: "w3-q56",
    question: `In blocking coordinated checkpointing:`,
    options: [
        `Processes continue normally with no synchronization`,
        `Processes may be blocked while checkpointing`,
        `No checkpoints are created`,
        `Only the initiator checkpoints`
    ],
    correctIndex: 1,
    explanation: `Blocking coordinated checkpointing pauses process execution while the checkpoint is being taken, to guarantee consistency simply.`,
  },
  {
    id: "w3-q57",
    question: `Communication-induced checkpointing uses:`,
    options: [
        `Only physical clocks`,
        `Piggybacked protocol information on application messages`,
        `A central coordinator for every message`,
        `No communication`
    ],
    correctIndex: 1,
    explanation: `Communication-induced checkpointing piggybacks checkpoint-coordination info on the application's own messages rather than sending separate control messages.`,
  },
  {
    id: "w3-q58",
    question: `Communication-induced checkpointing has:`,
    options: [
        `Autonomous and forced checkpoints`,
        `Permanent and lost messages`,
        `Optimistic and pessimistic processes`,
        `Byzantine and crash checkpoints`
    ],
    correctIndex: 0,
    explanation: `It combines autonomous checkpoints (taken independently) with forced checkpoints (triggered by piggybacked info).`,
  },
  {
    id: "w3-q59",
    question: `Log-based rollback recovery combines checkpointing with logging of:`,
    options: [
        `All deterministic events only`,
        `Nondeterministic events`,
        `Network addresses`,
        `CPU instructions only`
    ],
    correctIndex: 1,
    explanation: `Log-based recovery pairs checkpointing with logging of nondeterministic events so they can be replayed.`,
  },
  {
    id: "w3-q60",
    question: `The Piecewise Deterministic (PWD) assumption assumes that:`,
    options: [
        `All events are random`,
        `Nondeterministic events can be identified and their determinants recorded`,
        `Processes never fail`,
        `Messages are always lost`
    ],
    correctIndex: 1,
    explanation: `The PWD assumption says all nondeterministic events can be identified and their determinants captured for later replay.`,
  },
  {
    id: "w3-q61",
    question: `In pessimistic logging:`,
    options: [
        `Determinants are always logged asynchronously`,
        `The application can proceed without logging`,
        `The determinant is stored before the effects of the event become visible`,
        `No stable storage is used`
    ],
    correctIndex: 2,
    explanation: `Pessimistic logging writes the determinant to stable storage before the event's effects become visible to anyone else.`,
  },
  {
    id: "w3-q62",
    question: `Which is the main advantage of pessimistic logging?`,
    options: [
        `Lower failure-free overhead`,
        `Simpler recovery`,
        `No checkpoints needed`,
        `No stable storage needed`
    ],
    correctIndex: 1,
    explanation: `By logging first, pessimistic logging keeps recovery simple since every visible effect is already safely logged.`,
  },
  {
    id: "w3-q63",
    question: `Which is the main disadvantage of pessimistic logging?`,
    options: [
        `Complex recovery`,
        `Higher failure-free overhead`,
        `Orphans are always created`,
        `It cannot recover from failures`
    ],
    correctIndex: 1,
    explanation: `That synchronous logging-before-visibility adds overhead to every event during failure-free execution.`,
  },
  {
    id: "w3-q64",
    question: `Optimistic logging assumes that:`,
    options: [
        `Logging must always complete before an event takes effect`,
        `Logging will complete before a failure occurs`,
        `Failures never happen`,
        `All events are deterministic`
    ],
    correctIndex: 1,
    explanation: `Optimistic logging assumes the log write will normally complete before any failure occurs, so it doesn't wait for it.`,
  },
  {
    id: "w3-q65",
    question: `Compared with pessimistic logging, optimistic logging generally:`,
    options: [
        `Increases failure-free overhead`,
        `Reduces failure-free overhead but complicates recovery`,
        `Eliminates the need for recovery`,
        `Prevents all failures`
    ],
    correctIndex: 1,
    explanation: `Optimistic logging trades lower failure-free overhead for a more complicated recovery process (possible orphans, etc.).`,
  },
  {
    id: "w3-q66",
    question: `Causal logging attempts to combine advantages of:`,
    options: [
        `Uncoordinated and coordinated checkpointing`,
        `Optimistic and pessimistic logging`,
        `Crash and Byzantine models`,
        `Synchronous and asynchronous systems`
    ],
    correctIndex: 1,
    explanation: `Causal logging tries to get optimistic logging's low overhead while keeping pessimistic logging's simpler, orphan-free recovery.`,
  },
  {
    id: "w3-q67",
    question: `In Suzuki–Kasami, suppose:

\`\`\`text
RN_i[j] = 7
LN[j] = 5
\`\`\`

How many requests from \`Pj\` are potentially outstanding according to the basic condition?`,
    options: [
        `0`,
        `1`,
        `2`,
        `7`
    ],
    correctIndex: 2,
    explanation: `RN_i[j]=7, LN[j]=5: the gap is 7−5=2, so under the basic RN=LN+1 view there are 2 further requests beyond the last served one.`,
  },
  {
    id: "w3-q68",
    question: `A system has 13 processes and wants to tolerate Byzantine failures under the \`n ≥ 3f+1\` condition. What is the maximum \`f\`?`,
    options: [
        `3`,
        `4`,
        `5`,
        `6`
    ],
    correctIndex: 1,
    explanation: `n ≥ 3f+1 ⟹ f ≤ (13−1)/3 = 4.`,
  },
  {
    id: "w3-q69",
    question: `A synchronous crash-consensus system tolerates up to 4 crash failures. According to the lecture's algorithm, how many rounds are required?`,
    options: [
        `3`,
        `4`,
        `5`,
        `8`
    ],
    correctIndex: 2,
    explanation: `f+1 rounds are needed; for f=4, that's 5 rounds.`,
  },
  {
    id: "w3-q70",
    question: `Which pairing is INCORRECT?`,
    options: [
        `Suzuki–Kasami → Sequence numbers`,
        `Raymond → Tree structure`,
        `FLP → Asynchronous consensus impossibility`,
        `Pessimistic logging → Asynchronous determinant logging`
    ],
    correctIndex: 3,
    explanation: `Pessimistic logging blocks synchronously and logs before the event is visible — it is not an asynchronous logging scheme, so that pairing is wrong.`,
  },
  {
    id: "w3-q71",
    question: `Which sequence correctly represents the recovery concepts from simpler to more sophisticated logging behavior?`,
    options: [
        `Optimistic → Pessimistic → Causal`,
        `Pessimistic → Optimistic → Causal`,
        `Causal → Optimistic → Pessimistic`,
        `Pessimistic → Causal → Optimistic`
    ],
    correctIndex: 1,
    explanation: `From lowest to highest overhead-avoidance/recovery-complexity trade-off: Pessimistic (safest, slowest) → Optimistic (fastest, hardest recovery) → Causal (balances both).`,
  },
  {
    id: "w3-q72",
    question: `Which statement is TRUE?`,
    options: [
        `FLP says Byzantine consensus is impossible in every synchronous system`,
        `Byzantine agreement requires \`n ≥ 3f+1\` under the assumptions discussed`,
        `Crash consensus requires \`n ≥ 3f+1\``,
        `Raymond uses broadcast to every process for every request`
    ],
    correctIndex: 1,
    explanation: `Byzantine agreement's core bound, n ≥ 3f+1, is the one statement here that matches the lecture exactly.`,
  }
  ],
  flashcards: [
  {
    id: "w3-f1",
    front: `What is the basic idea behind token-based mutual exclusion?`,
    back: `A single unique token circulates in the system; a process may enter the CS only while it possesses the token, so mutual exclusion is guaranteed by the token's uniqueness.`,
  },
  {
    id: "w3-f2",
    front: `What does Suzuki–Kasami use instead of timestamps to order requests?`,
    back: `Sequence numbers — each process's REQUEST(i, sn) carries an increasing sequence number, avoiding the need for synchronized clocks.`,
  },
  {
    id: "w3-f3",
    front: `Define RN_i[j] in Suzuki–Kasami.`,
    back: `The largest sequence number of a request from process Pj that process Pi has seen so far.`,
  },
  {
    id: "w3-f4",
    front: `Define LN[j] in the Suzuki–Kasami token.`,
    back: `The sequence number of the latest request from Pj that has already been executed (served).`,
  },
  {
    id: "w3-f5",
    front: `When does Pj have an outstanding request in Suzuki–Kasami?`,
    back: `When RN_i[j] = LN[j] + 1.`,
  },
  {
    id: "w3-f6",
    front: `What does the Suzuki–Kasami token contain?`,
    back: `A FIFO queue Q of waiting processes, and the LN array of last-served sequence numbers.`,
  },
  {
    id: "w3-f7",
    front: `Message cost of Suzuki–Kasami when the requester already holds an idle token?`,
    back: `0 messages, 0 synchronization delay.`,
  },
  {
    id: "w3-f8",
    front: `Message cost of Suzuki–Kasami when the requester doesn't hold the token?`,
    back: `Approximately N messages (broadcast REQUEST + token transfer).`,
  },
  {
    id: "w3-f9",
    front: `Why does Suzuki–Kasami guarantee no starvation?`,
    back: `At most N−1 requests can be ahead of any given process in the token queue, so it always eventually receives the token.`,
  },
  {
    id: "w3-f10",
    front: `What structure does Raymond's algorithm use to organize processes?`,
    back: `A spanning tree; only neighboring nodes need to be known.`,
  },
  {
    id: "w3-f11",
    front: `What does HOLDER represent in Raymond's algorithm?`,
    back: `The direction (a neighbor) that a node believes leads toward the privilege — not necessarily the privilege holder itself.`,
  },
  {
    id: "w3-f12",
    front: `What does the ASKED variable do in Raymond's algorithm?`,
    back: `Prevents a node from sending duplicate REQUEST messages while one is already outstanding.`,
  },
  {
    id: "w3-f13",
    front: `What is REQUEST_Q in Raymond's algorithm?`,
    back: `A FIFO queue of pending requesters (self and/or neighbors), max size = number of neighbors + 1.`,
  },
  {
    id: "w3-f14",
    front: `Worst-case message complexity of Raymond's algorithm?`,
    back: `2 × (longest path length) per CS execution.`,
  },
  {
    id: "w3-f15",
    front: `Raymond's algorithm message complexity for a line topology of N nodes?`,
    back: `2(N−1).`,
  },
  {
    id: "w3-f16",
    front: `Raymond's algorithm average message complexity under heavy load?`,
    back: `About 4 messages per CS execution.`,
  },
  {
    id: "w3-f17",
    front: `Key structural difference: Suzuki–Kasami vs Raymond?`,
    back: `Suzuki–Kasami broadcasts REQUESTs to everyone; Raymond forwards requests only along tree edges.`,
  },
  {
    id: "w3-f18",
    front: `Define fail-stop fault.`,
    back: `The process stops functioning, and other processes can detect that it has failed.`,
  },
  {
    id: "w3-f19",
    front: `Define crash fault.`,
    back: `The process stops functioning, but other processes don't necessarily know it has failed.`,
  },
  {
    id: "w3-f20",
    front: `Define Byzantine fault.`,
    back: `The process can behave arbitrarily — including maliciously — rather than simply stopping.`,
  },
  {
    id: "w3-f21",
    front: `Difference between send omission and receive omission?`,
    back: `Send omission: the process fails to send some messages. Receive omission: it fails to receive some messages.`,
  },
  {
    id: "w3-f22",
    front: `What are the three standard properties of consensus?`,
    back: `Agreement (all correct processes decide the same value), Validity (matches the correct decision under the given conditions), and Termination (every correct process eventually decides).`,
  },
  {
    id: "w3-f23",
    front: `Consensus vs Byzantine Agreement — key difference?`,
    back: `Consensus: every process starts with its own initial value. Byzantine Agreement: a single designated source holds the initial value.`,
  },
  {
    id: "w3-f24",
    front: `What does interactive consistency require?`,
    back: `Agreement on an array of values, one per process, where correct processes' entries match their own initial values.`,
  },
  {
    id: "w3-f25",
    front: `Synchronous vs asynchronous distributed systems?`,
    back: `Synchronous: execution proceeds in rounds with known timing bounds. Asynchronous: no fixed bound on message delay or process speed.`,
  },
  {
    id: "w3-f26",
    front: `State the FLP impossibility result.`,
    back: `Deterministic consensus is impossible in an asynchronous message-passing system if even one process may crash.`,
  },
  {
    id: "w3-f27",
    front: `Name three ways to work around FLP impossibility.`,
    back: `k-set consensus, ε-approximate agreement, and (terminating) reliable broadcast.`,
  },
  {
    id: "w3-f28",
    front: `How many rounds does the synchronous crash-consensus algorithm need for f failures?`,
    back: `f + 1 rounds.`,
  },
  {
    id: "w3-f29",
    front: `How do processes update their value each round in crash consensus?`,
    back: `x = min(x, all received values).`,
  },
  {
    id: "w3-f30",
    front: `Message complexity of the crash consensus algorithm?`,
    back: `O((f+1)n²).`,
  },
  {
    id: "w3-f31",
    front: `State the Byzantine agreement processor bound.`,
    back: `n ≥ 3f + 1, i.e. f ≤ (n−1)/3, for unauthenticated messages.`,
  },
  {
    id: "w3-f32",
    front: `What is OM(f), and who proposed it?`,
    back: `The Oral Message algorithm (Lamport–Shostak–Pease) for Byzantine agreement, requiring n ≥ 3f+1.`,
  },
  {
    id: "w3-f33",
    front: `What does OM(0) do?`,
    back: `The commander sends its value directly; each process uses the value it received (default 0 if none received).`,
  },
  {
    id: "w3-f34",
    front: `What does each process do in OM(f) for f > 0?`,
    back: `Acts as a sub-commander and runs OM(f−1) to relay its received value to everyone else, then takes the majority of all values collected.`,
  },
  {
    id: "w3-f35",
    front: `How many rounds does Byzantine agreement (OM(f)) require?`,
    back: `f + 1 rounds.`,
  },
  {
    id: "w3-f36",
    front: `Define k-set consensus.`,
    back: `Correct processes may decide on at most k distinct values (rather than exactly one); solvable when f < k.`,
  },
  {
    id: "w3-f37",
    front: `Define ε-approximate agreement.`,
    back: `Correct processes' decided values need not be identical, only within ε of one another.`,
  },
  {
    id: "w3-f38",
    front: `What is the renaming problem?`,
    back: `Processes must agree on new, pairwise-distinct names for themselves.`,
  },
  {
    id: "w3-f39",
    front: `Backward vs forward recovery?`,
    back: `Backward recovery restores an earlier error-free state (e.g. checkpointing/rollback); forward recovery repairs the erroneous state directly.`,
  },
  {
    id: "w3-f40",
    front: `What is a local checkpoint?`,
    back: `A saved snapshot of a single process's state at a given instant, denoted C_i,k for the k-th checkpoint of process Pi.`,
  },
  {
    id: "w3-f41",
    front: `What makes a global state consistent?`,
    back: `There is no recorded receive event whose corresponding send isn't reflected in the sender's recorded state.`,
  },
  {
    id: "w3-f42",
    front: `Define an in-transit message.`,
    back: `A message that has been sent but not yet received.`,
  },
  {
    id: "w3-f43",
    front: `Define an orphan message.`,
    back: `A message whose receive is recorded in a checkpoint but whose corresponding send is not.`,
  },
  {
    id: "w3-f44",
    front: `Define a lost message.`,
    back: `A message whose send was recorded, but the receive was undone because of a rollback.`,
  },
  {
    id: "w3-f45",
    front: `What is the domino effect?`,
    back: `Cascading rollbacks triggered across dependent processes after a failure, which in the worst case can roll the whole system back almost to the start.`,
  },
  {
    id: "w3-f46",
    front: `What is a livelock in rollback recovery?`,
    back: `A situation where one failure triggers an unending sequence of repeated rollbacks between processes, never reaching a stable recovered state.`,
  },
  {
    id: "w3-f47",
    front: `Main drawback of uncoordinated checkpointing?`,
    back: `Susceptibility to the domino effect, plus the overhead of searching for a consistent set of checkpoints and garbage-collecting old ones.`,
  },
  {
    id: "w3-f48",
    front: `Blocking vs non-blocking coordinated checkpointing?`,
    back: `Blocking pauses processes during checkpointing for easy consistency; non-blocking lets execution continue but must guard against inconsistent checkpoints from in-flight messages.`,
  },
  {
    id: "w3-f49",
    front: `How does communication-induced checkpointing avoid explicit coordination messages?`,
    back: `It piggybacks checkpoint-related protocol information on regular application messages, using autonomous and forced checkpoints.`,
  },
  {
    id: "w3-f50",
    front: `What is the Piecewise Deterministic (PWD) assumption?`,
    back: `Nondeterministic events can be identified, and the information needed to replay them (their determinants) can be logged.`,
  },
  {
    id: "w3-f51",
    front: `Pessimistic logging: mechanism and trade-off?`,
    back: `Logs a determinant to stable storage before the event's effects become visible; gives simple recovery at the cost of higher failure-free overhead (possible blocking).`,
  },
  {
    id: "w3-f52",
    front: `Optimistic logging: mechanism and trade-off?`,
    back: `Logs determinants asynchronously without waiting; lowers failure-free overhead but complicates recovery (possible orphan processes).`,
  },
  {
    id: "w3-f53",
    front: `Causal logging: what does it combine?`,
    back: `Optimistic logging's low failure-free overhead with pessimistic logging's simpler, orphan-free recovery.`,
  },
  {
    id: "w3-f54",
    front: `What are the two checkpoint types in Koo–Toueg coordinated checkpointing?`,
    back: `Tentative and permanent — a tentative checkpoint becomes permanent only after the coordination protocol succeeds.`,
  },
  {
    id: "w3-f55",
    front: `Consensus solvability: crash failures, synchronous vs asynchronous?`,
    back: `Solvable in synchronous systems; not solvable (per FLP) in asynchronous systems.`,
  },
  {
    id: "w3-f56",
    front: `Consensus solvability: Byzantine failures, synchronous vs asynchronous?`,
    back: `Solvable in synchronous systems under n ≥ 3f+1; not solvable in asynchronous systems.`,
  }
  ],
};

export default week3;