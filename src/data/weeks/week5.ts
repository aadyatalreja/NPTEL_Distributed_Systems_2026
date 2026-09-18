import type { WeekData } from "../../types";

const week5: WeekData = {
  week: 5,
  title: "Termination Detection, Message Ordering & Self-Stabilization",
  status: "ready",
  pdfUrl: "/pdfs/week5-lecture-notes.pdf",

  notes: [
  {
    heading: `The termination detection problem`,
    body: `**Termination detection** asks whether a distributed computation has *completely finished*. It is hard because no process has complete knowledge of the global state, there is no global clock, and an **idle process can become active again** the moment a message arrives.

A distributed computation is terminated exactly when **every process is idle AND there are no messages in transit**. Formally, at time \`t0\`:

$$(\\forall i: p_i(t_0) = idle) \\land (\\forall i,j: c_{ij}(t_0) = 0)$$

where \`p_i(t)\` is the state of process \`Pi\` and \`c_ij(t)\` is the number of messages in transit from \`Pi\` to \`Pj\`.`,
  },
  {
    heading: `Active vs idle processes`,
    body: `| State | Meaning |
|---|---|
| **Active** | Performing local computation |
| **Idle** | Temporarily finished; can be reactivated by a message |

Rules of the model:
- Active -> Idle can happen at **any** time (spontaneously).
- Idle -> Active happens **only on receiving a message**.
- Only **active** processes can send messages.
- **Either** state can receive messages.

**Exam trap:** *all processes idle does NOT mean termination* — a message may still be in transit, and it will reactivate its receiver.`,
  },
  {
    heading: `Basic vs control messages`,
    body: `**Basic messages** belong to the underlying application computation. **Control messages** belong to the termination-detection algorithm itself.

A termination detection algorithm must not (1) indefinitely delay the underlying computation, and (2) require additional communication channels beyond those the computation already uses.`,
  },
  {
    heading: `Huang's distributed snapshot algorithm`,
    body: `The idea: when a process becomes **idle**, it sends a **snapshot request** to other processes and also takes its own local snapshot. Other processes decide whether to accept that request. If **all** processes take a snapshot for the same request, the request is *successful* and the collected local snapshots form a consistent **global snapshot**, from which termination can be read off.

**Assumptions:** a logical bidirectional channel between every pair of processes, reliable channels, **non-FIFO** delivery, and arbitrary but **finite** message delay.`,
  },
  {
    heading: `Logical clocks in Huang's algorithm`,
    body: `Each process keeps a logical clock \`x\`, initially \`0\`, and increments it **whenever it becomes idle**:

$$x = x + 1$$

Message forms:
- Basic message: \`B(x)\`
- Snapshot request: \`R(x, i)\` — logical time \`x\` and process id \`i\`

Requests are compared **lexicographically** on the pair \`(x, k)\`: \`(x,k) > (x',k')\` if \`x > x'\`, or \`x = x'\` and \`k > k'\`. The process that terminates *last* ends up with the largest clock value, so every process will eventually take a snapshot for **its** request — which is what makes detection work.`,
  },
  {
    heading: `Weight Throwing algorithm`,
    body: `Proposed by **Shing-Tsaan Huang (1989)**. A total weight of

$$1$$

is distributed among the **controlling agent**, the **active processes**, the **basic messages in transit**, and the **control messages in transit**. The total is *always* 1 — this is **weight conservation**.

Initially the controlling agent holds everything: \`W_c = 1\`, and every process weight is 0.`,
  },
  {
    heading: `How weight throwing works`,
    body: `A process holding weight \`W\` that sends a basic message **splits** its weight:

$$W = W_1 + W_2, \\quad W_1 > 0, \\; W_2 > 0$$

It keeps \`W1\` and attaches \`W2\` to the message. Note both halves must be **strictly positive** — no one ever gives away all of its weight in a basic message.

**On receipt:** the receiver adds the arriving weight, \`W = W + DW\`.

**On becoming idle:** the process sends *all* of its weight to the controlling agent as a control message \`C(DW = W)\`, then sets \`W = 0\`.

**Termination is declared** by the controlling agent when:

$$W_c = 1$$`,
  },
  {
    heading: `Weight throwing: invariants and correctness`,
    body: `**Invariant I1** — total weight is conserved:

$$W_c + \\sum W = 1$$

(summed over active processes, basic messages, and control messages).

**Invariant I2** — every weight held outside the controlling agent is strictly positive: \`W > 0\`.

**Why it is correct:** if \`W_c = 1\` then by I1 the remaining weights sum to 0; by I2 each of those is positive, so there can be **none of them at all** — no active process and no message in transit. Hence \`A ∪ B = ∅\` and the computation has terminated (**no false detection**). Conversely, because message delay is finite, after real termination the agent eventually receives all outstanding control weight and reaches 1 (**detection is finite**).`,
  },
  {
    heading: `Spanning-tree-based termination detection`,
    body: `A fixed spanning tree is imposed on the processes with \`P0\` as the **root**. Leaves report termination to their parents; a parent reports upward once all its children have reported *and* it is itself idle; eventually the information reaches the root.

The root concludes termination when (1) it is itself idle and (2) all of its children have reported termination.`,
  },
  {
    heading: `The simple token algorithm and why it breaks`,
    body: `**Simple version:** every leaf starts with a token. A terminated leaf sends its token to its parent; a parent waits for tokens from **all** children and, once it has also terminated, forwards a token to its own parent. When the root has tokens from all children it declares termination.

**The flaw:** a process may become idle, send its token up, then **receive a message and become active again**. Its parent already believes that subtree is quiescent, so the root can falsely conclude termination.

> A token saying "I was idle" does **not** guarantee that the process will *stay* idle.`,
  },
  {
    heading: `Topor's corrected algorithm`,
    body: `Topor fixes the flaw using **white/black processes**, **white/black tokens**, and a **Repeat** signal.

Initially all processes and tokens are **white**. A process that **sends a message turns black**. If a black process later terminates, it sends a **black token** to its parent and then reverts to white.

A **black token** tells the parent: *message-passing activity happened somewhere in my subtree*, so earlier termination information may no longer be valid. The root, on receiving a black token, sends a **Repeat** signal down toward the leaves, and the whole token round restarts.

**Final termination condition:** the root declares termination only when it is **white**, **idle**, and has received a **white token from every child**.

**Complexity:** best case \`O(N)\`, worst case \`O(NM)\`, where \`N\` = number of processes and \`M\` = number of computation messages.`,
  },
  {
    heading: `Why message ordering matters`,
    body: `Messages can arrive in orders that differ from the order in which they were sent, and delivery order changes distributed-program behaviour. Four paradigms are studied, from weakest to strongest guarantee: **non-FIFO (asynchronous)**, **FIFO**, **causal order**, **synchronous order**.

An **A-execution** (asynchronous execution) is one where the causality relation is a **partial order** — the least restrictive model in the hierarchy.`,
  },
  {
    heading: `FIFO, causal, and synchronous ordering`,
    body: `**FIFO:** if one sender sends \`M1\` then \`M2\` to the same receiver, the receiver must deliver \`M1\` before \`M2\`. It constrains only *same sender -> same receiver* pairs.

**Causal ordering:** if

$$send(M_1) \\prec send(M_2)$$

then at **every common destination**,

$$deliver(M_1) \\prec deliver(M_2)$$

i.e. a causally later message can never be delivered before a causally earlier one.

**Synchronous execution:** sender and receiver perform a **handshake**; communication is treated as instantaneous under the modified causality definition.`,
  },
  {
    heading: `The ordering hierarchy (most tested item)`,
    body: `$$SYNC \\subset CO \\subset FIFO \\subset A$$

Read left to right as **weakening** restrictions: Synchronous is the most constrained set of executions, Asynchronous the least.

**Memory trick: S -> C -> F -> A** (Synchronous, Causal, FIFO, Asynchronous). Every synchronous execution is causal, every causal execution is FIFO, every FIFO execution is asynchronous.`,
  },
  {
    heading: `Group communication: unicast, broadcast, multicast`,
    body: `| Mode | Meaning |
|---|---|
| **Unicast** | one sender -> one receiver |
| **Broadcast** | one sender -> **all** processes |
| **Multicast** | one sender -> a **selected subset/group** |

**Closed group:** the sender **is** a member of the recipient group. **Open group:** the sender **may be outside** the recipient group. This distinction is frequently tested and also decides which multicast algorithms apply.`,
  },
  {
    heading: `Raynal–Schiper–Toueg (RST) algorithm`,
    body: `RST implements **causal ordering** of messages. A message carries information about the messages that causally preceded it; the receiver uses that information to decide whether the message is **safe to deliver** yet, or must be held back.

Assumptions: **FIFO channels**, safety, and liveness given no failures and finite propagation time. The lecture states the information overhead in terms of \`n^2\` integers of process/message information. RST is a **communication-history-based** algorithm and works with **open groups**.`,
  },
  {
    heading: `Total ordering`,
    body: `**Total ordering** requires that all recipients deliver **common** messages in exactly the same order: if \`Pi\` delivers \`Mx\` before \`My\`, then every other process receiving both must also deliver \`Mx\` before \`My\`.

| Causal order | Total order |
|---|---|
| Preserves causality | Same delivery order everywhere |
| Concurrent messages may be ordered differently at different processes | Common messages forced into one global order |
| About causal relationships | About global agreement on order |

The two are independent notions: neither implies the other automatically.`,
  },
  {
    heading: `Centralized total-order algorithm`,
    body: `A **central coordinator** fixes the order. A process wanting to multicast \`M\` sends it to the coordinator; the coordinator relays incoming messages to all group members, and **FIFO channels** preserve the relay order, so everyone sees the same sequence.

**Complexity:** two message hops, and \`n\` messages per broadcast for \`n\` processes in the stated model.

**Drawbacks:** single point of failure, and the coordinator becomes a congestion bottleneck.`,
  },
  {
    heading: `Three-phase distributed total-order algorithm`,
    body: `Implements **total order** (and also causal order) for **closed groups** without a coordinator.

**Phase 1 — initial proposal.** The sender multicasts \`M\` with a **unique tag** and its **local timestamp** to group members.

**Phase 2 — proposal / revision.** Each receiver updates its priority, generates a **revised (proposed) timestamp**, places the message in \`temp_Q\` marked **undeliverable**, and returns its proposed timestamp to the sender. The sender waits for all proposals and computes

$$FinalTS = \\max(ProposedTS)$$

**Phase 3 — final timestamp.** The sender multicasts \`FINAL_TS\`. Each receiver finds the message by its tag, replaces the tentative timestamp with the final one, marks it **deliverable**, re-sorts \`temp_Q\`, and — if the message is now at the **head** of \`temp_Q\` **and** deliverable — moves it to \`delivery_Q\`.

**Complexity:** \`3(n-1)\` messages for \`n-1\` destinations, with a delay of **3 message hops**.`,
  },
  {
    heading: `Multicast source–destination classifications`,
    body: `| Type | Meaning |
|---|---|
| **SSSG** | Single Source, Single Group |
| **MSSG** | Multiple Sources, Single Group |
| **SSMG** | Single Source, Multiple Groups |
| **MSMG** | Multiple Sources, Multiple Groups (groups may **overlap**) |

SSSG, SSMG and MSSG are the easy cases (MSSG can use a centralized algorithm). **MSMG** is the hard one and is handled by a semi-centralized **propagation-tree** approach.`,
  },
  {
    heading: `Propagation trees and meta-groups`,
    body: `A **meta-group** is a set of processes having **exactly the same group membership**. A distinguished node in each meta-group acts as its **manager**. For each user group \`Gi\`, one meta-group is designated the **primary meta-group**, written

$$PM(G_i)$$

Meta-groups are then organized into a **propagation forest/tree**, which routes multicasts for the multiple-source, multiple-group case.`,
  },
  {
    heading: `Application-level multicast algorithm classes`,
    body: `Five classes:

1. **Communication-history-based** — uses causal history to decide delivery. Example: **RST**. Open groups.
2. **Privilege-based** — a **token** holder is allowed to send/order. Examples: **Totem**, **On-demand**. Typically closed groups.
3. **Moving sequencer** — a token/sequencer role **moves** between processes and assigns sequence numbers. Examples: **Chang–Maxemchuk**, **Pinwheel**.
4. **Fixed sequencer** — a simplification of the moving sequencer; one fixed node sequences. Examples: **propagation tree**, **ISIS**, **Amoeba**, **Phoenix**.
5. **Destination agreement** — destinations agree on ordering themselves, either **timestamp-based** or **agreement-based**.`,
  },
  {
    heading: `What is self-stabilization?`,
    body: `Introduced by **Dijkstra in 1974**. A **self-stabilizing** system, starting from an **arbitrary** (possibly corrupt) state, eventually reaches a **legitimate** state on its own and then stays legitimate — with **no external intervention**.

The classic intuition: children told to form a circle. Whatever their initial positions, they keep adjusting until a proper circle exists, and once it does, it persists.

A **legitimate** state satisfies the correctness predicate; an **illegitimate** state does not. For a token ring, legitimate means exactly the required single privilege exists; illegitimate examples are *no token* or *multiple tokens*.`,
  },
  {
    heading: `System model and configuration`,
    body: `The system is \`n\` state machines/processors, drawn as nodes of a graph with edges as communication links. Two communication models: **message passing** and **shared memory**.

A **configuration** is a complete description of the system at a point in time. Under message passing it includes every processor's state plus the contents of every channel queue:

$$C = (s_1, s_2, \\ldots, s_n, q_{1,2}, q_{1,3}, \\ldots, q_{i,j}, \\ldots)$$

where \`q_ij\` holds messages sent from \`Pi\` to \`Pj\` but not yet received.

**Static network:** topology fixed. **Dynamic network:** links/nodes may fail and recover — self-stabilization then requires that after the **final** failure the system gets enough time to stabilize, with the topology assumed to stay connected.`,
  },
  {
    heading: `Shared memory model and the central daemon`,
    body: `Processors communicate through shared registers. Two atomicity notions:

- **Composite atomicity** — read all input variables, do the state transition, write all output variables, as **one** atomic step.
- **Read/write atomicity** — only a single read **or** a single write of communication variables per atomic step.

A **daemon/scheduler** decides which process executes. Under a **central daemon**, **at most one processor takes a step at a time** — this is the setting of Dijkstra's original token ring.`,
  },
  {
    heading: `Formal definition: closure + convergence`,
    body: `A system \`S\` is self-stabilizing with respect to a predicate \`P\` if it satisfies:

1. **Closure** — once \`P\` holds, it continues to hold under subsequent execution (legitimate stays legitimate).
2. **Convergence** — starting from **any** arbitrary global state, the system reaches \`P\` within a **finite** number of transitions.

$$\\textbf{Self-Stabilization} = \\textbf{Closure} + \\textbf{Convergence}$$

**Don't mix them up:** convergence *gets you there*, closure *keeps you there*.`,
  },
  {
    heading: `Stabilization vs self-stabilization, reachable set, transient failure`,
    body: `Generalized (Arora–Gouda) stabilization uses two predicates: \`Q\` = allowed starting states, \`P\` = legitimate states. The system satisfies \`Q -> P\` if **closure** on \`P\` holds and execution from any \`Q\`-state **converges** to \`P\`.

**Self-stabilization is the special case \`Q = TRUE\`:**

$$\\text{Self-stabilization} = TRUE \\rightarrow P$$

The **reachable set** is the set of states reachable by normal execution from legitimate starting states; it is considered safe and is **closed** under program execution.

A **transient failure** is temporary and non-persistent: it may corrupt local process state or channel/shared-memory contents, changing system state without permanently changing system *behaviour*. Self-stabilization is precisely the tool for recovering from these.`,
  },
  {
    heading: `Design issues for self-stabilizing algorithms`,
    body: `Know this as a list:

1. Number of states in each unit
2. Uniform vs non-uniform algorithms
3. Central vs distributed daemon
4. Reducing the number of states in a token ring
5. Shared memory models
6. Mutual exclusion
7. Cost of self-stabilization`,
  },
  {
    heading: `Dijkstra's self-stabilizing token ring`,
    body: `\`n\` finite-state machines arranged in a **directed ring**. A machine holding a **privilege** is allowed to change its state; exercising it is called a **move**. If several machines are privileged at once, the **central daemon** picks one.

The desired legitimate state has **exactly one privileged machine** — this is **mutual exclusion**: only that machine may enter its critical section, after which the privilege/token circulates.

**Four legitimate-state requirements:**
1. **No deadlock** — at least one privilege always exists.
2. **Closure** — a move from a legal state yields another legal state.
3. **No starvation** — in an infinite execution every machine gets the privilege **infinitely often**.
4. **Reachability** — for any two legal states there is a sequence of moves from one to the other.`,
  },
  {
    heading: `Dijkstra's state counts and the K >= n solution`,
    body: `Dijkstra gave solutions for a directed ring where each machine has \`K\` states, with

$$K \\ge n, \\quad K = 4, \\quad K = 3$$

**Ghosh** later proved at least **3 states** are necessary, so \`K_min = 3\`. All the solutions assume at least one **exceptional machine**.

**K >= n rules.** Let \`S\` = own state, \`L\` = left neighbour's state, \`R\` = right neighbour's state.
- **Exceptional machine:** if \`L = S\` then \`S := (S + 1) mod K\`.
- **Other machines:** if \`L ≠ S\` then \`S := L\`.

**How the token moves:** ordinary machines copy their left neighbour whenever they differ, so eventually all machines become equal. Then the exceptional machine sees \`L = S\`, changes state, creating a privilege in the next machine, and the privilege propagates around the ring — a single circulating token.`,
  },
  {
    heading: `Dijkstra's K = 3 solution`,
    body: `States \`S ∈ {0, 1, 2}\`, with **two exceptional machines**: machine \`0\` (**bottom**) and machine \`n-1\` (**top**).

- **Bottom machine:** if \`(S + 1) mod 3 = R\` then \`S := (S - 1) mod 3\`.
- **Top machine:** if \`L = R\` and \`(L + 1) mod 3 ≠ S\` then \`S := (L + 1) mod 3\`.
- **Other machines:** if \`(S + 1) mod 3 = L\` then \`S := L\`; or if \`(S + 1) mod 3 = R\` then \`S := R\`.

Execution of this algorithm demonstrates all four properties: **no deadlock** (a privilege always exists), **closure** (legal -> legal), **no starvation** (every machine gets opportunities to move), and **reachability** between legal states. Hence the ring stabilizes.`,
  },
  {
    heading: `Week 5 quick-reference tables`,
    body: `**Termination detection algorithms:** Huang snapshot -> collect local snapshots with logical clocks · Weight throwing -> conserved weight, \`W_c = 1\` · Spanning tree -> propagate up the tree · Topor -> white/black tokens + Repeat.

**Message ordering:** Asynchronous -> partial-order causality · FIFO -> same sender's order preserved · Causal -> causally earlier delivered earlier · Synchronous -> handshake. Hierarchy: \`SYNC ⊂ CO ⊂ FIFO ⊂ A\`.

**Group communication:** unicast 1->1 · broadcast 1->all · multicast 1->subset · closed group = sender inside · open group = sender may be outside.

**Multicast classes:** history-based (RST) · privilege-based (Totem, On-demand) · moving sequencer (Chang–Maxemchuk, Pinwheel) · fixed sequencer (ISIS, Amoeba, Phoenix, propagation tree) · destination agreement.

**Self-stabilization:** closure (legitimate stays legitimate) + convergence (arbitrary -> legitimate) · generalized \`Q -> P\` · self-stabilization \`TRUE -> P\` · central daemon = one step at a time.

**Key formulas/facts:** weight invariant \`W_c + ΣW = 1\` · Topor best \`O(N)\`, worst \`O(NM)\` · \`FinalTS = max(ProposedTS)\` · three-phase \`3(n-1)\` messages, 3 hops · centralized total order = 2 hops, single point of failure · \`K_min = 3\`, K=3 has two exceptional machines, K>=n has one.

**One-line summary:** Lecture 15 = Termination -> idle + no messages in transit -> Huang snapshot -> Weight throwing -> Spanning tree -> Topor. Lecture 16 = Ordering paradigms -> SYNC/CO/FIFO/A -> Group communication -> RST -> Total order -> 3-phase -> Multicast classes. Lecture 17 = Self-stabilization -> closure + convergence -> Dijkstra token ring -> K>=n vs K=3.`,
  },
  ],

  slides: [],
  mcqs: [
  {
    id: "w5-q1",
    question: `Which condition correctly represents termination of a distributed computation?`,
    options: [
        `All processes are idle`,
        `All channels are empty`,
        `All processes are idle and no messages are in transit`,
        `At least one process is idle and all messages are delivered`,
    ],
    correctIndex: 2,
    explanation: `Termination requires both conditions simultaneously: every process idle AND no messages in transit. Either one alone is insufficient.`,
    topic: "Termination Detection",
  },
  {
    id: "w5-q2",
    question: `Which statement about an idle process is correct?`,
    options: [
        `An idle process can never become active again`,
        `An idle process can become active only after receiving a message`,
        `An idle process can spontaneously become active`,
        `An idle process can send basic messages at any time`,
    ],
    correctIndex: 1,
    explanation: `Active -> idle can happen spontaneously, but idle -> active happens only on message receipt. Only active processes may send messages.`,
    topic: "Termination Detection",
  },
  {
    id: "w5-q3",
    question: `P1, P2 and P3 are all idle, but one basic message is in transit from P1 to P3. Has the computation terminated?`,
    options: [
        `Yes, because all processes are idle`,
        `Yes, because only one message remains`,
        `No, because a message is still in transit`,
        `Cannot be determined`,
    ],
    correctIndex: 2,
    explanation: `Classic trap: all processes idle is NOT termination. The in-transit message will reactivate P3 on arrival.`,
    topic: "Termination Detection",
  },
  {
    id: "w5-q4",
    question: `Which of the following is a characteristic of a basic message?`,
    options: [
        `Used only for termination detection`,
        `Used for the actual computation`,
        `Used to take snapshots`,
        `Used to establish logical clocks`,
    ],
    correctIndex: 1,
    explanation: `Basic messages belong to the underlying distributed computation; control messages belong to the termination-detection algorithm.`,
    topic: "Termination Detection",
  },
  {
    id: "w5-q5",
    question: `In Huang's distributed snapshot algorithm, a process takes a local snapshot when:`,
    options: [
        `It becomes active`,
        `It receives a basic message`,
        `It receives a snapshot request`,
        `The controller sends a termination signal`,
    ],
    correctIndex: 2,
    explanation: `Snapshots are triggered by snapshot requests; if every process takes a snapshot for the same request, the request is successful and forms a global snapshot.`,
    topic: "Termination Detection",
  },
  {
    id: "w5-q6",
    question: `In Huang's algorithm, a snapshot request is represented as:`,
    options: [
        `B(x)`,
        `R(x,i)`,
        `T(i,x)`,
        `S(x,i)`,
    ],
    correctIndex: 1,
    explanation: `R(x,i) carries logical time x and process id i. B(x) is the form of a basic message.`,
    topic: "Termination Detection",
  },
  {
    id: "w5-q7",
    question: `In Huang's algorithm, the logical clock of a process is incremented when the process:`,
    options: [
        `Sends every basic message`,
        `Receives every message`,
        `Becomes idle`,
        `Becomes active`,
    ],
    correctIndex: 2,
    explanation: `x = x + 1 happens on becoming idle, which is why the last process to terminate ends up with the largest clock value.`,
    topic: "Termination Detection",
  },
  {
    id: "w5-q8",
    question: `Requests in Huang's algorithm are compared using:`,
    options: [
        `FIFO order`,
        `Physical time`,
        `Lexicographic ordering of (x,k)`,
        `Random ordering`,
    ],
    correctIndex: 2,
    explanation: `(x,k) > (x',k') iff x > x', or x = x' and k > k' — a lexicographic comparison of (logical time, process id).`,
    topic: "Termination Detection",
  },
  {
    id: "w5-q9",
    question: `The Weight Throwing algorithm is based on the principle of:`,
    options: [
        `Token circulation`,
        `Weight conservation`,
        `FIFO message delivery`,
        `Timestamp synchronization`,
    ],
    correctIndex: 1,
    explanation: `Total weight across the controlling agent, active processes and in-transit messages is always exactly 1.`,
    topic: "Weight Throwing",
  },
  {
    id: "w5-q10",
    question: `In the Weight Throwing algorithm, the total initial weight is:`,
    options: [`0`, `N`, `1`, `100`],
    correctIndex: 2,
    explanation: `The controlling agent starts with W_c = 1 and all process weights are 0.`,
    topic: "Weight Throwing",
  },
  {
    id: "w5-q11",
    question: `A process with weight W sends a basic message. What happens to its weight?`,
    options: [
        `It keeps all of W`,
        `It sends all of W`,
        `It splits W into two positive parts`,
        `It doubles W`,
    ],
    correctIndex: 2,
    explanation: `W = W1 + W2 with W1 > 0 and W2 > 0; the process keeps W1 and attaches W2 to the message.`,
    topic: "Weight Throwing",
  },
  {
    id: "w5-q12",
    question: `When an active process becomes idle in the Weight Throwing algorithm, it:`,
    options: [
        `Keeps its weight`,
        `Sends all its weight to the controlling agent`,
        `Sends its weight to all neighbours`,
        `Divides its weight equally among neighbours`,
    ],
    correctIndex: 1,
    explanation: `It sends a control message C(DW = W) carrying all of its weight to the controlling agent and sets its own weight to 0.`,
    topic: "Weight Throwing",
  },
  {
    id: "w5-q13",
    question: `Which condition causes the controller to declare termination?`,
    options: [`W_c = 0`, `W_c > 0`, `W_c = 1`, `W_c = N`],
    correctIndex: 2,
    explanation: `The agent declares termination exactly when its weight returns to the full conserved total, W_c = 1.`,
    topic: "Weight Throwing",
  },
  {
    id: "w5-q14",
    question: `Which invariant is maintained by the Weight Throwing algorithm?`,
    options: [
        `W_c - ΣW = 1`,
        `W_c + ΣW = 1`,
        `W_c × ΣW = 1`,
        `W_c = 0`,
    ],
    correctIndex: 1,
    explanation: `Invariant I1: the agent's weight plus all weight held by active processes and in-transit messages always sums to 1.`,
    topic: "Weight Throwing",
  },
  {
    id: "w5-q15",
    question: `Invariant I2 states that:`,
    options: [
        `Every process must have zero weight`,
        `Every weight outside the controller is positive`,
        `The controller always has zero weight`,
        `Every message has equal weight`,
    ],
    correctIndex: 1,
    explanation: `All weights held outside the controlling agent are strictly positive — which is what makes W_c = 1 imply nothing is left outside.`,
    topic: "Weight Throwing",
  },
  {
    id: "w5-q16",
    question: `Why does W_c = 1 imply that the computation has terminated?`,
    options: [
        `Because all processes have crashed`,
        `Because the controller owns all conserved weight`,
        `Because all channels are FIFO`,
        `Because all processes have the same clock value`,
    ],
    correctIndex: 1,
    explanation: `By I1 the remaining weights sum to 0; by I2 each remaining weight would be positive, so there can be no active process and no message in transit.`,
    topic: "Weight Throwing",
  },
  {
    id: "w5-q17",
    question: `In a spanning-tree-based termination detection algorithm, a leaf process reports termination to:`,
    options: [
        `The root directly`,
        `Its parent`,
        `Every process`,
        `The controller only`,
    ],
    correctIndex: 1,
    explanation: `Reports travel one level at a time: leaf -> parent -> grandparent -> ... -> root.`,
    topic: "Spanning Tree & Topor",
  },
  {
    id: "w5-q18",
    question: `In the simple token-based termination algorithm, what causes the major problem?`,
    options: [
        `Token duplication`,
        `A process can become active again after sending its termination token`,
        `FIFO ordering`,
        `Root failure`,
    ],
    correctIndex: 1,
    explanation: `A token only says the process WAS idle; a later message can reactivate it while its parent already believes the subtree is quiescent.`,
    topic: "Spanning Tree & Topor",
  },
  {
    id: "w5-q19",
    question: `Why can the simple token algorithm falsely detect termination?`,
    options: [
        `Tokens can be lost`,
        `A subtree can appear terminated even though a later message reactivates a process`,
        `The root never receives tokens`,
        `Processes cannot become idle`,
    ],
    correctIndex: 1,
    explanation: `The reported state is stale — reactivation after reporting is invisible to the parent, so the root may wrongly conclude termination.`,
    topic: "Spanning Tree & Topor",
  },
  {
    id: "w5-q20",
    question: `Topor's corrected algorithm uses:`,
    options: [
        `Red/green processes`,
        `White/black processes and tokens`,
        `Blue/yellow tokens`,
        `Logical clocks only`,
    ],
    correctIndex: 1,
    explanation: `White/black colouring of processes and tokens, plus a Repeat signal, is Topor's fix for stale termination reports.`,
    topic: "Spanning Tree & Topor",
  },
  {
    id: "w5-q21",
    question: `In Topor's algorithm, a process becomes black when:`,
    options: [
        `It receives a token`,
        `It sends a message`,
        `It becomes idle`,
        `It receives a Repeat signal`,
    ],
    correctIndex: 1,
    explanation: `Sending a message means the process may have reactivated someone else, so it turns black to record that activity.`,
    topic: "Spanning Tree & Topor",
  },
  {
    id: "w5-q22",
    question: `If a black process terminates, it sends:`,
    options: [
        `A white token to its child`,
        `A black token to its parent`,
        `A Repeat signal to the root`,
        `A snapshot request`,
    ],
    correctIndex: 1,
    explanation: `It passes a black token upward and then reverts to white.`,
    topic: "Spanning Tree & Topor",
  },
  {
    id: "w5-q23",
    question: `What is the purpose of the Repeat signal in Topor's algorithm?`,
    options: [
        `To restart the entire computation`,
        `To indicate that previous termination information may no longer be valid`,
        `To synchronize logical clocks`,
        `To transfer weight`,
    ],
    correctIndex: 1,
    explanation: `A black token reaching the root means message activity occurred, so the root sends Repeat down to the leaves to restart the token round — not to restart the computation itself.`,
    topic: "Spanning Tree & Topor",
  },
  {
    id: "w5-q24",
    question: `Topor's termination detection algorithm has which complexity according to the lecture?`,
    options: [
        `Best O(1), worst O(N)`,
        `Best O(N), worst O(NM)`,
        `Best O(M), worst O(N)`,
        `Best O(N²), worst O(M)`,
    ],
    correctIndex: 1,
    explanation: `N = number of processes, M = number of computation messages; repeated rounds in the worst case give O(NM).`,
    topic: "Spanning Tree & Topor",
  },
  {
    id: "w5-q25",
    question: `Which ordering is the least restrictive?`,
    options: [
        `FIFO ordering`,
        `Causal ordering`,
        `Synchronous ordering`,
        `Asynchronous/non-FIFO ordering`,
    ],
    correctIndex: 3,
    explanation: `Asynchronous executions only require causality to be a partial order — the weakest constraint in the hierarchy.`,
    topic: "Message Ordering",
  },
  {
    id: "w5-q26",
    question: `Which ordering hierarchy is correct?`,
    options: [
        `FIFO ⊂ CO ⊂ SYNC ⊂ A`,
        `SYNC ⊂ CO ⊂ FIFO ⊂ A`,
        `A ⊂ FIFO ⊂ CO ⊂ SYNC`,
        `CO ⊂ SYNC ⊂ FIFO ⊂ A`,
    ],
    correctIndex: 1,
    explanation: `Memory trick S -> C -> F -> A: Synchronous ⊂ Causal ⊂ FIFO ⊂ Asynchronous, restrictions weakening left to right.`,
    topic: "Message Ordering",
  },
  {
    id: "w5-q27",
    question: `FIFO ordering guarantees that:`,
    options: [
        `All processes receive messages in exactly the same order`,
        `Messages from the same sender are delivered in their sending order`,
        `Messages from different senders are ordered`,
        `Messages are delivered instantaneously`,
    ],
    correctIndex: 1,
    explanation: `FIFO constrains only a single sender-receiver pair; it says nothing about messages from different senders (that would be total ordering).`,
    topic: "Message Ordering",
  },
  {
    id: "w5-q28",
    question: `Process P sends M1 and then M2 to Q. Under FIFO ordering, which statement must hold?`,
    options: [
        `Q can deliver M2 before M1`,
        `Q must deliver M1 before M2`,
        `M1 and M2 must have the same timestamp`,
        `M1 must be delivered to every process before M2`,
    ],
    correctIndex: 1,
    explanation: `Same sender, same receiver, so send order is preserved at delivery.`,
    topic: "Message Ordering",
  },
  {
    id: "w5-q29",
    question: `Causal ordering guarantees that if send(M1) precedes send(M2), then a common destination must:`,
    options: [
        `Send M1 before M2`,
        `Deliver M2 before M1`,
        `Deliver M1 before M2`,
        `Discard M2`,
    ],
    correctIndex: 2,
    explanation: `A causally later message may never be delivered before the message it causally depends on.`,
    topic: "Message Ordering",
  },
  {
    id: "w5-q30",
    question: `Which ordering is stronger than FIFO according to the hierarchy in the lecture?`,
    options: [
        `Asynchronous ordering`,
        `Causal ordering`,
        `None`,
        `Unicast ordering`,
    ],
    correctIndex: 1,
    explanation: `CO ⊂ FIFO: causal ordering implies FIFO and is therefore the stronger constraint.`,
    topic: "Message Ordering",
  },
  {
    id: "w5-q31",
    question: `Synchronous communication differs from asynchronous communication because:`,
    options: [
        `Messages are always lost`,
        `Sender and receiver participate in a handshake`,
        `Messages cannot be multicast`,
        `Logical clocks are not used`,
    ],
    correctIndex: 1,
    explanation: `The handshake makes communication effectively instantaneous under the modified causality definition.`,
    topic: "Message Ordering",
  },
  {
    id: "w5-q32",
    question: `One sender sends a message to exactly one receiver. This is:`,
    options: [`Broadcast`, `Multicast`, `Unicast`, `Meta-group communication`],
    correctIndex: 2,
    explanation: `Unicast is a one-to-one transmission.`,
    topic: "Group Communication",
  },
  {
    id: "w5-q33",
    question: `One sender sends a message to all processes. This is:`,
    options: [`Unicast`, `Broadcast`, `Multicast`, `Group agreement`],
    correctIndex: 1,
    explanation: `Broadcast targets every process in the system; multicast targets a selected subset.`,
    topic: "Group Communication",
  },
  {
    id: "w5-q34",
    question: `A sender sends a message to a selected subset of processes. This is:`,
    options: [`Broadcast`, `Unicast`, `Multicast`, `Synchronous communication`],
    correctIndex: 2,
    explanation: `Multicast = one to a specific group, i.e. a subset of all processes.`,
    topic: "Group Communication",
  },
  {
    id: "w5-q35",
    question: `In a closed group:`,
    options: [
        `The sender must be outside the group`,
        `The sender is part of the recipient group`,
        `No sender exists`,
        `Only the coordinator can send`,
    ],
    correctIndex: 1,
    explanation: `Closed = sender is a member. The three-phase total-order algorithm is stated for closed groups.`,
    topic: "Group Communication",
  },
  {
    id: "w5-q36",
    question: `In an open group:`,
    options: [
        `The sender may be outside the recipient group`,
        `The sender must always be a group member`,
        `Only one recipient exists`,
        `Messages cannot be ordered`,
    ],
    correctIndex: 0,
    explanation: `Open groups allow non-members to multicast to the group; RST works with open groups.`,
    topic: "Group Communication",
  },
  {
    id: "w5-q37",
    question: `The Raynal–Schiper–Toueg (RST) algorithm primarily addresses:`,
    options: [`Deadlock detection`, `Causal ordering`, `Mutual exclusion`, `Leader election`],
    correctIndex: 1,
    explanation: `RST is a causal-ordering (causal multicast) algorithm in the communication-history-based class.`,
    topic: "Group Communication",
  },
  {
    id: "w5-q38",
    question: `The RST algorithm assumes:`,
    options: [
        `Non-FIFO channels only`,
        `FIFO channels`,
        `Synchronous channels only`,
        `No communication channels`,
    ],
    correctIndex: 1,
    explanation: `RST assumes FIFO channels, along with safety and liveness given no failures and finite propagation times.`,
    topic: "Group Communication",
  },
  {
    id: "w5-q39",
    question: `The main idea of causal multicast is to:`,
    options: [
        `Deliver messages randomly`,
        `Attach causal information so receivers can determine safe delivery`,
        `Eliminate timestamps`,
        `Use only physical clocks`,
    ],
    correctIndex: 1,
    explanation: `Each message carries information about the messages that causally preceded it; the receiver holds it back until those have been delivered.`,
    topic: "Group Communication",
  },
  {
    id: "w5-q40",
    question: `Total ordering requires:`,
    options: [
        `Every process to receive every message`,
        `All recipients to deliver common messages in exactly the same order`,
        `FIFO channels only`,
        `Synchronous communication only`,
    ],
    correctIndex: 1,
    explanation: `Total order is about global agreement on the delivery order of messages received in common — not about everyone receiving everything.`,
    topic: "Total Ordering",
  },
  {
    id: "w5-q41",
    question: `In a centralized total-order algorithm, the coordinator primarily:`,
    options: [
        `Deletes messages`,
        `Determines the order and relays messages`,
        `Stops all processes`,
        `Generates process IDs`,
    ],
    correctIndex: 1,
    explanation: `Senders route messages through the coordinator, which relays them; FIFO channels then preserve that single relay order everywhere.`,
    topic: "Total Ordering",
  },
  {
    id: "w5-q42",
    question: `A major drawback of centralized total ordering is:`,
    options: [
        `No message ordering`,
        `Single point of failure and coordinator bottleneck`,
        `It cannot support groups`,
        `It requires no communication`,
    ],
    correctIndex: 1,
    explanation: `All traffic funnels through one node, which can fail or become congested.`,
    topic: "Total Ordering",
  },
  {
    id: "w5-q43",
    question: `In the three-phase distributed total-order algorithm, the first phase involves:`,
    options: [
        `Delivering the message immediately`,
        `The sender multicasting the message with a unique tag and local timestamp`,
        `The coordinator broadcasting a final timestamp`,
        `Deleting temp_Q`,
    ],
    correctIndex: 1,
    explanation: `Phase 1 is the initial proposal: message + unique tag + sender's local timestamp, multicast to the group.`,
    topic: "Total Ordering",
  },
  {
    id: "w5-q44",
    question: `During the second phase of the three-phase algorithm, receivers:`,
    options: [
        `Immediately deliver the message`,
        `Propose/revise timestamps and place the message in temp_Q`,
        `Remove the message from the queue`,
        `Send a Repeat signal`,
    ],
    correctIndex: 1,
    explanation: `Receivers update priority, generate a revised timestamp, queue the message in temp_Q as undeliverable, and return the proposal to the sender.`,
    topic: "Total Ordering",
  },
  {
    id: "w5-q45",
    question: `The final timestamp is selected as:`,
    options: [
        `Minimum proposed timestamp`,
        `Average proposed timestamp`,
        `Maximum proposed timestamp`,
        `The sender's original timestamp`,
    ],
    correctIndex: 2,
    explanation: `FinalTS = max(ProposedTS) — taking the maximum guarantees the final value is at least as large as every receiver's proposal.`,
    topic: "Total Ordering",
  },
  {
    id: "w5-q46",
    question: `A message placed in temp_Q is initially marked:`,
    options: [`Deliverable`, `Undeliverable`, `Deleted`, `Finalized`],
    correctIndex: 1,
    explanation: `It stays undeliverable until the final timestamp arrives in phase 3.`,
    topic: "Total Ordering",
  },
  {
    id: "w5-q47",
    question: `After receiving the final timestamp, a receiver:`,
    options: [
        `Deletes the message`,
        `Marks it deliverable and sorts the queue`,
        `Sends another proposal`,
        `Changes the sender`,
    ],
    correctIndex: 1,
    explanation: `It finds the message by its tag, replaces the tentative timestamp, marks it deliverable, and re-sorts temp_Q.`,
    topic: "Total Ordering",
  },
  {
    id: "w5-q48",
    question: `A message can move from temp_Q to delivery_Q when:`,
    options: [
        `It is at the head of temp_Q and is deliverable`,
        `It has the smallest process ID`,
        `It was sent first physically`,
        `The sender requests deletion`,
    ],
    correctIndex: 0,
    explanation: `Both conditions are needed — head of the sorted queue AND marked deliverable — which is what produces the same order at every process.`,
    topic: "Total Ordering",
  },
  {
    id: "w5-q49",
    question: `The three-phase distributed total-order algorithm uses approximately how many messages for n-1 destinations?`,
    options: [`n-1`, `2(n-1)`, `3(n-1)`, `n²`],
    correctIndex: 2,
    explanation: `One multicast, one round of proposals back, one multicast of the final timestamp: 3(n-1).`,
    topic: "Total Ordering",
  },
  {
    id: "w5-q50",
    question: `The three-phase algorithm requires how many message hops of delay?`,
    options: [`1`, `2`, `3`, `4`],
    correctIndex: 2,
    explanation: `Three hops, one per phase — compared with two hops for the centralized algorithm.`,
    topic: "Total Ordering",
  },
  {
    id: "w5-q51",
    question: `SSSG stands for:`,
    options: [
        `Single Source, Single Group`,
        `Single Source, Shared Group`,
        `Single System, Single Group`,
        `Single Source, Single Gateway`,
    ],
    correctIndex: 0,
    explanation: `The classification names describe the source count and the group count.`,
    topic: "Multicast Classification",
  },
  {
    id: "w5-q52",
    question: `MSSG represents:`,
    options: [
        `Multiple Sources, Single Group`,
        `Multiple Systems, Single Gateway`,
        `Multiple Sources, Shared Groups`,
        `Multiple Senders, Single Gateway`,
    ],
    correctIndex: 0,
    explanation: `MSSG is still easy to handle — a centralized algorithm suffices.`,
    topic: "Multicast Classification",
  },
  {
    id: "w5-q53",
    question: `SSMG represents:`,
    options: [
        `Single Source, Multiple Groups`,
        `Single System, Multiple Groups`,
        `Shared Source, Multiple Groups`,
        `Single Source, Managed Group`,
    ],
    correctIndex: 0,
    explanation: `One sender transmitting to several groups.`,
    topic: "Multicast Classification",
  },
  {
    id: "w5-q54",
    question: `MSMG stands for:`,
    options: [
        `Multiple Sources, Multiple Groups`,
        `Multiple Systems, Multiple Gateways`,
        `Multiple Senders, Managed Groups`,
        `Multiple Sources, Meta Groups`,
    ],
    correctIndex: 0,
    explanation: `The hard case, handled by a semi-centralized propagation-tree approach.`,
    topic: "Multicast Classification",
  },
  {
    id: "w5-q55",
    question: `Which classification allows multiple sources and multiple groups, where groups may overlap?`,
    options: [`SSSG`, `MSSG`, `SSMG`, `MSMG`],
    correctIndex: 3,
    explanation: `Overlapping group membership is exactly what makes MSMG require propagation trees and meta-groups.`,
    topic: "Multicast Classification",
  },
  {
    id: "w5-q56",
    question: `A meta-group is:`,
    options: [
        `A group containing only failed processes`,
        `A set of processes having the same group membership`,
        `A group of coordinators only`,
        `A temporary multicast group`,
    ],
    correctIndex: 1,
    explanation: `All members of a meta-group belong to exactly the same set of user groups; a distinguished node acts as its manager.`,
    topic: "Multicast Classification",
  },
  {
    id: "w5-q57",
    question: `The primary meta-group associated with group Gi is denoted:`,
    options: [`PM(Gi)`, `MG(Gi)`, `PG(Gi)`, `Meta(Gi)`],
    correctIndex: 0,
    explanation: `PM(Gi) is the meta-group selected as primary for user group Gi in the propagation tree.`,
    topic: "Multicast Classification",
  },
  {
    id: "w5-q58",
    question: `Which is an example of a communication-history-based multicast approach?`,
    options: [`RST`, `Totem`, `ISIS`, `Pinwheel`],
    correctIndex: 0,
    explanation: `RST uses causal history attached to messages. Totem is privilege-based, ISIS fixed-sequencer, Pinwheel moving-sequencer.`,
    topic: "Multicast Classification",
  },
  {
    id: "w5-q59",
    question: `Privilege-based multicast algorithms generally use:`,
    options: [`A token`, `A database`, `A physical clock`, `A snapshot`],
    correctIndex: 0,
    explanation: `The token holder has the privilege to send/order, typically within closed groups.`,
    topic: "Multicast Classification",
  },
  {
    id: "w5-q60",
    question: `Totem and On-demand are associated with:`,
    options: [
        `Fixed sequencer`,
        `Privilege-based approach`,
        `Moving sequencer`,
        `Communication-history-based approach`,
    ],
    correctIndex: 1,
    explanation: `Both are privilege-based (token-holder) algorithms used with closed groups.`,
    topic: "Multicast Classification",
  },
  {
    id: "w5-q61",
    question: `Chang–Maxemchuk and Pinwheel are examples of:`,
    options: [
        `Fixed sequencer algorithms`,
        `Moving sequencer algorithms`,
        `Destination agreement algorithms`,
        `Snapshot algorithms`,
    ],
    correctIndex: 1,
    explanation: `The sequencer role moves between processes, which assigns sequence numbers as it goes.`,
    topic: "Multicast Classification",
  },
  {
    id: "w5-q62",
    question: `ISIS is associated with:`,
    options: [
        `Fixed sequencer approach`,
        `Moving sequencer approach`,
        `Weight throwing`,
        `Token ring stabilization`,
    ],
    correctIndex: 0,
    explanation: `ISIS, Amoeba, Phoenix and propagation trees are the fixed-sequencer examples — a simplification of the moving sequencer.`,
    topic: "Multicast Classification",
  },
  {
    id: "w5-q63",
    question: `A state satisfying predicate P in a self-stabilizing system is called:`,
    options: [`Illegal state`, `Legitimate/safe state`, `Dead state`, `Transient state`],
    correctIndex: 1,
    explanation: `Legitimate states are those satisfying the correctness predicate; everything else is illegitimate.`,
    topic: "Self-Stabilization",
  },
  {
    id: "w5-q64",
    question: `A state that does not satisfy P is called:`,
    options: [`Legitimate`, `Safe`, `Illegitimate/unsafe`, `Stable`],
    correctIndex: 2,
    explanation: `For a token ring, examples are having no token or having multiple tokens.`,
    topic: "Self-Stabilization",
  },
  {
    id: "w5-q65",
    question: `Which two properties are fundamental to self-stabilization?`,
    options: [
        `FIFO and causality`,
        `Closure and convergence`,
        `Broadcast and multicast`,
        `Safety and encryption`,
    ],
    correctIndex: 1,
    explanation: `Self-stabilization = closure + convergence. Both are required; neither alone suffices.`,
    topic: "Self-Stabilization",
  },
  {
    id: "w5-q66",
    question: `Closure means:`,
    options: [
        `Every arbitrary state eventually becomes legitimate`,
        `Once the system enters a legitimate state, it remains legitimate`,
        `Every process must terminate`,
        `All messages are delivered in FIFO order`,
    ],
    correctIndex: 1,
    explanation: `Closure keeps you there; convergence gets you there. Option A describes convergence.`,
    topic: "Self-Stabilization",
  },
  {
    id: "w5-q67",
    question: `Convergence means:`,
    options: [
        `Starting from any state, the system reaches a legitimate state in finite transitions`,
        `Once legitimate, the system remains legitimate`,
        `All processes execute simultaneously`,
        `All messages are delivered immediately`,
    ],
    correctIndex: 0,
    explanation: `Convergence is about reaching legitimacy from an arbitrary start, in a finite number of steps.`,
    topic: "Self-Stabilization",
  },
  {
    id: "w5-q68",
    question: `Generalized stabilization (Arora and Gouda) is written as:`,
    options: [`P → Q`, `Q → P`, `P ↔ Q`, `TRUE ← P`],
    correctIndex: 1,
    explanation: `Q is the predicate on allowed starting states and P the legitimate states, so the system satisfies Q → P.`,
    topic: "Self-Stabilization",
  },
  {
    id: "w5-q69",
    question: `Self-stabilization is the special case of generalized stabilization where:`,
    options: [`P = FALSE`, `Q = TRUE`, `Q = FALSE`, `P = TRUE`],
    correctIndex: 1,
    explanation: `Q = TRUE means any starting state whatsoever is allowed, giving TRUE → P.`,
    topic: "Self-Stabilization",
  },
  {
    id: "w5-q70",
    question: `A reachable set is:`,
    options: [
        `States reachable from legitimate starting states under normal execution`,
        `All possible states`,
        `Only illegitimate states`,
        `States produced by failures`,
    ],
    correctIndex: 0,
    explanation: `The reachable set is considered safe and is closed under program execution.`,
    topic: "Self-Stabilization",
  },
  {
    id: "w5-q71",
    question: `A transient failure is best described as:`,
    options: [
        `A permanent hardware failure`,
        `A temporary failure that changes system state but not necessarily system behaviour`,
        `A deliberate shutdown`,
        `A permanent network partition`,
    ],
    correctIndex: 1,
    explanation: `It may corrupt local state or channel contents but does not persist — precisely what self-stabilization recovers from.`,
    topic: "Self-Stabilization",
  },
  {
    id: "w5-q72",
    question: `Dijkstra's self-stabilizing system consists of:`,
    options: [
        `A tree of processes`,
        `A ring of finite-state machines`,
        `A fully connected graph`,
        `A centralized controller`,
    ],
    correctIndex: 1,
    explanation: `n finite-state machines arranged in a directed ring, with at least one exceptional machine.`,
    topic: "Dijkstra Token Ring",
  },
  {
    id: "w5-q73",
    question: `In Dijkstra's token-ring algorithm, a privilege is:`,
    options: [
        `A message sent to the root`,
        `The ability of a machine to change its state based on a Boolean predicate`,
        `A failure notification`,
        `A timestamp`,
    ],
    correctIndex: 1,
    explanation: `Holding a privilege means the machine's predicate over its own and its neighbours' states is true, so it may make a move.`,
    topic: "Dijkstra Token Ring",
  },
  {
    id: "w5-q74",
    question: `If multiple machines are privileged, the central daemon:`,
    options: [
        `Executes all simultaneously`,
        `Chooses which privileged machine moves next`,
        `Removes all privileges`,
        `Terminates the system`,
    ],
    correctIndex: 1,
    explanation: `Under a central daemon at most one processor takes a step at a time.`,
    topic: "Dijkstra Token Ring",
  },
  {
    id: "w5-q75",
    question: `The desired legitimate state in Dijkstra's token ring contains:`,
    options: [
        `No privileged machines`,
        `Exactly one privileged machine`,
        `Exactly two privileged machines`,
        `All machines privileged`,
    ],
    correctIndex: 1,
    explanation: `Exactly one privilege = exactly one token, which is mutual exclusion.`,
    topic: "Dijkstra Token Ring",
  },
  {
    id: "w5-q76",
    question: `Why is exactly one privilege desirable?`,
    options: [
        `It provides mutual exclusion`,
        `It prevents communication`,
        `It guarantees FIFO channels`,
        `It eliminates all messages`,
    ],
    correctIndex: 0,
    explanation: `Only the privileged machine may enter its critical section; the privilege then circulates around the ring.`,
    topic: "Dijkstra Token Ring",
  },
  {
    id: "w5-q77",
    question: `Which is NOT one of the legitimate-state requirements listed in the lecture?`,
    options: [`No deadlock`, `Closure`, `No starvation`, `All processes must terminate`],
    correctIndex: 3,
    explanation: `The four requirements are no deadlock, closure, no starvation, and reachability. Termination is not among them — the token circulates forever.`,
    topic: "Dijkstra Token Ring",
  },
  {
    id: "w5-q78",
    question: `The no-starvation requirement means:`,
    options: [
        `Every machine gets privilege infinitely often during infinite execution`,
        `Every machine gets privilege exactly once`,
        `Only the exceptional machine gets privilege`,
        `No process can change state`,
    ],
    correctIndex: 0,
    explanation: `Fairness: in an infinite run no machine is permanently bypassed.`,
    topic: "Dijkstra Token Ring",
  },
  {
    id: "w5-q79",
    question: `The reachability requirement states that:`,
    options: [
        `Every state must be reachable from every other state`,
        `Given any two legal states, there must be a sequence of moves between them`,
        `Only illegal states must be reachable`,
        `The system must terminate`,
    ],
    correctIndex: 1,
    explanation: `Reachability is stated between legal states, not over the whole state space.`,
    topic: "Dijkstra Token Ring",
  },
  {
    id: "w5-q80",
    question: `In Dijkstra's K >= n solution, the state of a machine is denoted:`,
    options: [`S`, `P`, `T`, `K`],
    correctIndex: 0,
    explanation: `S = own state, L = left neighbour's state, R = right neighbour's state.`,
    topic: "Dijkstra Token Ring",
  },
  {
    id: "w5-q81",
    question: `For the exceptional machine in the K >= n solution, the rule is:`,
    options: [
        `If L ≠ S, then S := L`,
        `If L = S, then S := (S + 1) mod K`,
        `If R = S, then S := L`,
        `Always increment S`,
    ],
    correctIndex: 1,
    explanation: `The exceptional machine acts when it matches its left neighbour, breaking uniformity by incrementing modulo K.`,
    topic: "Dijkstra Token Ring",
  },
  {
    id: "w5-q82",
    question: `For non-exceptional machines in the K >= n solution:`,
    options: [
        `If L ≠ S, then S := L`,
        `If L = S, then increment S`,
        `Always copy R`,
        `Never change state`,
    ],
    correctIndex: 0,
    explanation: `Ordinary machines simply copy the left neighbour whenever they differ from it.`,
    topic: "Dijkstra Token Ring",
  },
  {
    id: "w5-q83",
    question: `In the K >= n algorithm, when all machines have the same state:`,
    options: [
        `The system permanently deadlocks`,
        `The exceptional machine changes its state`,
        `All machines change simultaneously`,
        `The root terminates`,
    ],
    correctIndex: 1,
    explanation: `Uniformity makes L = S true at the exceptional machine, which increments and thereby creates a privilege that propagates around the ring.`,
    topic: "Dijkstra Token Ring",
  },
  {
    id: "w5-q84",
    question: `The K = 3 solution uses how many states per machine?`,
    options: [`2`, `3`, `4`, `n`],
    correctIndex: 1,
    explanation: `Three states, which Ghosh later proved to be the minimum possible.`,
    topic: "Dijkstra Token Ring",
  },
  {
    id: "w5-q85",
    question: `In the K = 3 solution, the state set is:`,
    options: [`{0,1}`, `{1,2,3}`, `{0,1,2}`, `{0,...,n}`],
    correctIndex: 2,
    explanation: `States are taken modulo 3, so {0,1,2}.`,
    topic: "Dijkstra Token Ring",
  },
  {
    id: "w5-q86",
    question: `The K = 3 solution described in the lecture has:`,
    options: [
        `No exceptional machines`,
        `One exceptional machine`,
        `Two exceptional machines`,
        `Three exceptional machines`,
    ],
    correctIndex: 2,
    explanation: `Two — in contrast with the K >= n solution, which uses one.`,
    topic: "Dijkstra Token Ring",
  },
  {
    id: "w5-q87",
    question: `The two exceptional machines in the K = 3 solution are:`,
    options: [
        `Machines 1 and 2`,
        `Bottom machine 0 and top machine n-1`,
        `Two random machines`,
        `All leaf machines`,
    ],
    correctIndex: 1,
    explanation: `Machine 0 is the bottom machine and machine n-1 the top machine, each with its own transition rule.`,
    topic: "Dijkstra Token Ring",
  },
  {
    id: "w5-q88",
    question: `For ordinary machines in the K = 3 algorithm, a move may occur when:`,
    options: [
        `(S+1) mod 3 = L or (S+1) mod 3 = R`,
        `L = R = S only`,
        `S = 0 only`,
        `L ≠ R only`,
    ],
    correctIndex: 0,
    explanation: `It copies whichever neighbour satisfies the condition: S := L in the first case, S := R in the second.`,
    topic: "Dijkstra Token Ring",
  },
  {
    id: "w5-q89",
    question: `Which result is associated with Ghosh's work mentioned in the lecture?`,
    options: [
        `A minimum of 2 states is sufficient`,
        `A minimum of 3 states is required`,
        `A minimum of n states is required`,
        `No finite number of states works`,
    ],
    correctIndex: 1,
    explanation: `Ghosh proved the 3-state lower bound, making Dijkstra's K = 3 solution optimal in state count.`,
    topic: "Dijkstra Token Ring",
  },
  {
    id: "w5-q90",
    question: `Which statement correctly distinguishes closure and convergence?`,
    options: [
        `Closure gets the system into a legitimate state; convergence keeps it there`,
        `Closure keeps legitimate states legitimate; convergence brings arbitrary states to legitimacy`,
        `Both mean exactly the same thing`,
        `Closure applies only to communication; convergence only to termination`,
    ],
    correctIndex: 1,
    explanation: `Option A is the two properties swapped — a very common trap.`,
    topic: "Mixed / Trap Questions",
  },
  {
    id: "w5-q91",
    question: `A system reaches a legitimate state but a later transition takes it to an illegitimate state. Which property is violated?`,
    options: [`Convergence`, `Closure`, `Reachability`, `No starvation`],
    correctIndex: 1,
    explanation: `Closure demands legitimate → legitimate under every subsequent move.`,
    topic: "Mixed / Trap Questions",
  },
  {
    id: "w5-q92",
    question: `A system stays legitimate once legitimate, but some arbitrary initial states never become legitimate. Which property is violated?`,
    options: [`Closure`, `Convergence`, `FIFO ordering`, `Reachability`],
    correctIndex: 1,
    explanation: `Closure holds; convergence from arbitrary states fails, so the system is not self-stabilizing.`,
    topic: "Mixed / Trap Questions",
  },
  {
    id: "w5-q93",
    question: `Which pair is correctly matched?`,
    options: [
        `Weight Throwing — Self-stabilization`,
        `RST — Causal ordering`,
        `Topor — Total ordering`,
        `Dijkstra — Termination detection`,
    ],
    correctIndex: 1,
    explanation: `Weight throwing is termination detection, Topor is termination detection, Dijkstra is self-stabilization.`,
    topic: "Mixed / Trap Questions",
  },
  {
    id: "w5-q94",
    question: `Which pair is correctly matched?`,
    options: [
        `Topor — Termination detection`,
        `Dijkstra — Causal multicast`,
        `RST — Self-stabilization`,
        `Huang — Total ordering`,
    ],
    correctIndex: 0,
    explanation: `Topor corrects the spanning-tree termination-detection algorithm using white/black tokens.`,
    topic: "Mixed / Trap Questions",
  },
  {
    id: "w5-q95",
    question: `Which of the following is NOT sufficient by itself to conclude termination?`,
    options: [
        `All processes are idle`,
        `All channels are empty`,
        `The controller has collected all weight`,
        `All processes are idle and all messages are delivered`,
    ],
    correctIndex: 0,
    explanation: `An in-transit message can still reactivate an idle process, so idleness alone proves nothing.`,
    topic: "Mixed / Trap Questions",
  },
  {
    id: "w5-q96",
    question: `A message sent by P1 causally precedes one sent by P2. Under causal ordering, if P3 delivers both:`,
    options: [
        `P3 may deliver them in any order`,
        `P3 must deliver the causally earlier message first`,
        `P3 must discard the second message`,
        `FIFO ordering determines the order regardless of causality`,
    ],
    correctIndex: 1,
    explanation: `Causal order constrains delivery at every common destination, even across different senders — which plain FIFO does not.`,
    topic: "Mixed / Trap Questions",
  },
  {
    id: "w5-q97",
    question: `Which of the following represents increasing strength of ordering constraints?`,
    options: [
        `A → FIFO → CO → SYNC`,
        `SYNC → CO → FIFO → A`,
        `CO → SYNC → FIFO → A`,
        `FIFO → A → CO → SYNC`,
    ],
    correctIndex: 1,
    explanation: `Per the lecture's hierarchy SYNC ⊂ CO ⊂ FIFO ⊂ A, option B is the sequence to memorize.`,
    topic: "Mixed / Trap Questions",
  },
  {
    id: "w5-q98",
    question: `Which algorithm uses conservation of a numerical quantity to detect termination?`,
    options: [`Topor`, `RST`, `Weight Throwing`, `Dijkstra`],
    correctIndex: 2,
    explanation: `The conserved quantity is the total weight of 1, distributed among the agent, processes and messages.`,
    topic: "Mixed / Trap Questions",
  },
  {
    id: "w5-q99",
    question: `Which algorithm uses white and black tokens/processes?`,
    options: [`Huang`, `Topor`, `RST`, `Dijkstra`],
    correctIndex: 1,
    explanation: `Topor's colouring scheme plus Repeat signals fixes the simple spanning-tree token algorithm.`,
    topic: "Mixed / Trap Questions",
  },
  {
    id: "w5-q100",
    question: `Which concept is most directly associated with Dijkstra's token-ring algorithm?`,
    options: [`Self-stabilization`, `Total ordering`, `Weight conservation`, `Snapshot detection`],
    correctIndex: 0,
    explanation: `Dijkstra introduced self-stabilization in 1974 with exactly this token-ring example.`,
    topic: "Mixed / Trap Questions",
  },
  ],

  flashcards: [
  {
    id: "w5-f1",
    front: `What is the exact condition for termination of a distributed computation?`,
    back: `Every process is idle AND there are no messages in transit: (∀i: p_i = idle) ∧ (∀i,j: c_ij = 0).`,
  },
  {
    id: "w5-f2",
    front: `Why is "all processes are idle" not enough to declare termination?`,
    back: `A message may still be in transit; on arrival it reactivates its receiver, so the computation resumes.`,
  },
  {
    id: "w5-f3",
    front: `When can a process go active -> idle, and idle -> active?`,
    back: `Active -> idle can happen at any time; idle -> active only on receiving a message.`,
  },
  {
    id: "w5-f4",
    front: `Which processes are allowed to send messages?`,
    back: `Only active processes. Messages may be received by either active or idle processes.`,
  },
  {
    id: "w5-f5",
    front: `Basic vs control messages?`,
    back: `Basic = the actual distributed computation; control = the termination-detection algorithm.`,
  },
  {
    id: "w5-f6",
    front: `What two requirements must a termination detection algorithm satisfy?`,
    back: `It must not indefinitely delay the underlying computation, and must not require additional communication channels.`,
  },
  {
    id: "w5-f7",
    front: `Main idea of Huang's distributed snapshot algorithm?`,
    back: `An idle process sends snapshot requests and takes its own local snapshot; if all processes snapshot for that request, the collected local snapshots form a global snapshot revealing termination.`,
  },
  {
    id: "w5-f8",
    front: `What channel assumptions does Huang's snapshot algorithm make?`,
    back: `Logical bidirectional channels between every pair, reliable, NON-FIFO, with arbitrary but finite delay.`,
  },
  {
    id: "w5-f9",
    front: `When is the logical clock x incremented in Huang's algorithm, and what are the message forms?`,
    back: `x = x + 1 whenever the process becomes idle. Basic message = B(x); snapshot request = R(x,i).`,
  },
  {
    id: "w5-f10",
    front: `How are requests (x,k) compared in Huang's algorithm?`,
    back: `Lexicographically: (x,k) > (x',k') if x > x', or x = x' and k > k'. The last process to terminate has the largest clock.`,
  },
  {
    id: "w5-f11",
    front: `Who proposed the Weight Throwing algorithm and in what year?`,
    back: `Shing-Tsaan Huang, 1989.`,
  },
  {
    id: "w5-f12",
    front: `What is the total weight in the Weight Throwing algorithm, and how is it initially held?`,
    back: `Total = 1, always. Initially the controlling agent has W_c = 1 and every process has weight 0.`,
  },
  {
    id: "w5-f13",
    front: `What happens to a process's weight when it sends a basic message?`,
    back: `It splits W = W1 + W2 with both parts strictly positive, keeps W1 and sends W2 with the message.`,
  },
  {
    id: "w5-f14",
    front: `What does a process do with its weight when it becomes idle?`,
    back: `It sends all of it to the controlling agent as C(DW = W) and sets its own weight to 0.`,
  },
  {
    id: "w5-f15",
    front: `State invariants I1 and I2 of the Weight Throwing algorithm.`,
    back: `I1: W_c + ΣW = 1 (weight is conserved). I2: every weight held outside the controlling agent is strictly positive.`,
  },
  {
    id: "w5-f16",
    front: `Why does W_c = 1 imply termination?`,
    back: `By I1 all remaining weight sums to 0; by I2 any remaining weight would be positive; so there is no active process and no message in transit.`,
  },
  {
    id: "w5-f17",
    front: `What two correctness guarantees does weight throwing give?`,
    back: `No false termination detection, and detection within finite time after actual termination (message delay is finite).`,
  },
  {
    id: "w5-f18",
    front: `In spanning-tree termination detection, when does the root declare termination?`,
    back: `When the root itself is idle and all of its children have reported termination.`,
  },
  {
    id: "w5-f19",
    front: `Describe the simple token algorithm on a spanning tree.`,
    back: `Leaves start with tokens; a terminated leaf sends its token to its parent; a parent forwards upward once it has tokens from all children and has itself terminated; the root concludes when all children's tokens arrive.`,
  },
  {
    id: "w5-f20",
    front: `What is the flaw in the simple token algorithm?`,
    back: `A process can send its token, then receive a message and become active again — its parent still thinks the subtree is quiescent, so the root can falsely detect termination.`,
  },
  {
    id: "w5-f21",
    front: `What three mechanisms does Topor's algorithm add?`,
    back: `White/black processes, white/black tokens, and a Repeat signal from the root.`,
  },
  {
    id: "w5-f22",
    front: `When does a process turn black in Topor's algorithm, and when does it turn white again?`,
    back: `It turns black when it sends a message; it turns white again after sending a black token to its parent.`,
  },
  {
    id: "w5-f23",
    front: `What does a black token tell the parent?`,
    back: `That message-passing activity occurred somewhere in that subtree, so earlier termination information may no longer be valid.`,
  },
  {
    id: "w5-f24",
    front: `What does the Repeat signal do?`,
    back: `The root sends it down to the leaves so the whole token round restarts — it does not restart the computation.`,
  },
  {
    id: "w5-f25",
    front: `Topor's final termination condition?`,
    back: `The root is white, the root is idle, and the root has received a white token from every child.`,
  },
  {
    id: "w5-f26",
    front: `Topor's message complexity?`,
    back: `Best case O(N), worst case O(NM), with N processes and M computation messages.`,
  },
  {
    id: "w5-f27",
    front: `What is an A-execution?`,
    back: `An asynchronous execution in which the causality relation is a partial order — the least restrictive ordering paradigm.`,
  },
  {
    id: "w5-f28",
    front: `What does FIFO ordering guarantee?`,
    back: `Messages from the same sender to the same receiver are delivered in the order they were sent. Nothing about different senders.`,
  },
  {
    id: "w5-f29",
    front: `State the causal ordering condition.`,
    back: `If send(M1) ≺ send(M2), then at every common destination deliver(M1) ≺ deliver(M2).`,
  },
  {
    id: "w5-f30",
    front: `What characterizes synchronous execution?`,
    back: `A handshake between sender and receiver; communication is treated as instantaneous under the modified causality definition.`,
  },
  {
    id: "w5-f31",
    front: `State the message ordering hierarchy and the memory trick.`,
    back: `SYNC ⊂ CO ⊂ FIFO ⊂ A. Trick: S -> C -> F -> A; restrictions weaken left to right.`,
  },
  {
    id: "w5-f32",
    front: `Unicast vs broadcast vs multicast?`,
    back: `Unicast = one to one; broadcast = one to all; multicast = one to a selected subset (group).`,
  },
  {
    id: "w5-f33",
    front: `Open group vs closed group?`,
    back: `Closed: the sender is a member of the recipient group. Open: the sender may be outside the group.`,
  },
  {
    id: "w5-f34",
    front: `What does the RST algorithm implement, and what does it assume?`,
    back: `Causal ordering of multicast messages; it assumes FIFO channels, with safety and liveness given no failures and finite propagation times.`,
  },
  {
    id: "w5-f35",
    front: `Define total ordering.`,
    back: `All recipients deliver messages they receive in common in exactly the same order.`,
  },
  {
    id: "w5-f36",
    front: `Causal order vs total order — one line each.`,
    back: `Causal order preserves cause-and-effect relationships; total order forces all common messages into one identical global delivery order everywhere.`,
  },
  {
    id: "w5-f37",
    front: `How does the centralized total-order algorithm work, and what are its drawbacks?`,
    back: `Senders route messages through a coordinator that relays them; FIFO channels preserve the relay order. Drawbacks: single point of failure and coordinator congestion. Two message hops, n messages per broadcast.`,
  },
  {
    id: "w5-f38",
    front: `Name the three phases of the distributed total-order algorithm.`,
    back: `1) Sender multicasts M with unique tag + local timestamp. 2) Receivers propose revised timestamps, queue M in temp_Q as undeliverable. 3) Sender multicasts FinalTS; receivers mark deliverable, sort, and move the head to delivery_Q.`,
  },
  {
    id: "w5-f39",
    front: `How is the final timestamp computed in the three-phase algorithm?`,
    back: `FinalTS = max(ProposedTS) over all the receivers' proposals.`,
  },
  {
    id: "w5-f40",
    front: `When does a message move from temp_Q to delivery_Q?`,
    back: `When it is at the head of the sorted temp_Q AND it has been marked deliverable.`,
  },
  {
    id: "w5-f41",
    front: `Message and delay complexity of the three-phase total-order algorithm?`,
    back: `3(n-1) messages for n-1 destinations, and a delay of 3 message hops. It also implements causal ordering, for closed groups.`,
  },
  {
    id: "w5-f42",
    front: `What do SSSG, MSSG, SSMG and MSMG stand for?`,
    back: `Single Source Single Group; Multiple Sources Single Group; Single Source Multiple Groups; Multiple Sources Multiple Groups (groups may overlap).`,
  },
  {
    id: "w5-f43",
    front: `Which multicast classification is hardest, and how is it handled?`,
    back: `MSMG — handled by a semi-centralized propagation-tree approach using meta-groups.`,
  },
  {
    id: "w5-f44",
    front: `What is a meta-group, and what is PM(Gi)?`,
    back: `A meta-group is a set of processes with exactly the same group membership, with a distinguished manager node. PM(Gi) is the primary meta-group chosen for user group Gi.`,
  },
  {
    id: "w5-f45",
    front: `Name the five classes of application-level multicast algorithms.`,
    back: `Communication-history-based, privilege-based, moving sequencer, fixed sequencer, and destination agreement.`,
  },
  {
    id: "w5-f46",
    front: `Give an example algorithm for each multicast class.`,
    back: `History-based: RST. Privilege-based: Totem, On-demand. Moving sequencer: Chang–Maxemchuk, Pinwheel. Fixed sequencer: ISIS, Amoeba, Phoenix, propagation tree. Destination agreement: timestamp-based or agreement-based.`,
  },
  {
    id: "w5-f47",
    front: `Who introduced self-stabilization, and when?`,
    back: `Dijkstra, in 1974.`,
  },
  {
    id: "w5-f48",
    front: `Define a self-stabilizing system in one sentence.`,
    back: `Starting from an arbitrary state, it eventually reaches a legitimate state by itself and stays there, with no external intervention.`,
  },
  {
    id: "w5-f49",
    front: `Self-stabilization = ?`,
    back: `Closure + Convergence. Closure: legitimate stays legitimate. Convergence: any arbitrary state reaches legitimacy in finitely many transitions.`,
  },
  {
    id: "w5-f50",
    front: `Write generalized stabilization and self-stabilization in predicate form.`,
    back: `Generalized: Q → P (Q = allowed start states, P = legitimate states). Self-stabilization is the case Q = TRUE, i.e. TRUE → P.`,
  },
  {
    id: "w5-f51",
    front: `What is the reachable set?`,
    back: `The states reachable by normal execution from legitimate starting states; it is safe and closed under program execution.`,
  },
  {
    id: "w5-f52",
    front: `What is a transient failure?`,
    back: `A temporary, non-persistent fault that may corrupt local state or channel/shared-memory contents, changing system state without permanently changing system behaviour.`,
  },
  {
    id: "w5-f53",
    front: `What does a configuration include in the message-passing model?`,
    back: `The state of every processor plus the contents of every communication queue: C = (s1,...,sn, q_1,2, q_1,3, ..., q_i,j, ...).`,
  },
  {
    id: "w5-f54",
    front: `Composite atomicity vs read/write atomicity?`,
    back: `Composite: read all inputs, transition, write all outputs as one atomic step. Read/write: only a single read OR a single write of communication variables per step.`,
  },
  {
    id: "w5-f55",
    front: `What does a central daemon do?`,
    back: `It schedules execution so that at most one processor takes a step at a time, and picks which privileged machine moves when several are privileged.`,
  },
  {
    id: "w5-f56",
    front: `List the design issues for self-stabilizing algorithms.`,
    back: `Number of states per unit; uniform vs non-uniform algorithms; central vs distributed daemon; reducing states in a token ring; shared memory models; mutual exclusion; cost of self-stabilization.`,
  },
  {
    id: "w5-f57",
    front: `What are "privilege" and "move" in Dijkstra's token ring?`,
    back: `A privilege is permission (via a Boolean predicate over own and neighbours' states) to change state; exercising it is a move.`,
  },
  {
    id: "w5-f58",
    front: `What are the four legitimate-state requirements in Dijkstra's system?`,
    back: `No deadlock (a privilege always exists), closure (legal -> legal), no starvation (every machine is privileged infinitely often), and reachability (any legal state reachable from any other).`,
  },
  {
    id: "w5-f59",
    front: `What does a legitimate state of Dijkstra's token ring look like?`,
    back: `Exactly one privileged machine — a single token, giving mutual exclusion.`,
  },
  {
    id: "w5-f60",
    front: `What state counts did Dijkstra give, and what is the proven minimum?`,
    back: `K >= n, K = 4 and K = 3. Ghosh proved at least 3 states are required, so K_min = 3.`,
  },
  {
    id: "w5-f61",
    front: `State the K >= n rules.`,
    back: `Exceptional machine: if L = S then S := (S+1) mod K. Other machines: if L ≠ S then S := L.`,
  },
  {
    id: "w5-f62",
    front: `How does the token appear in the K >= n solution?`,
    back: `Ordinary machines copy their left neighbour until all states are equal; then the exceptional machine sees L = S, increments, and the resulting privilege propagates around the ring as a single circulating token.`,
  },
  {
    id: "w5-f63",
    front: `State the K = 3 rules.`,
    back: `Bottom (machine 0): if (S+1) mod 3 = R then S := (S-1) mod 3. Top (machine n-1): if L = R and (L+1) mod 3 ≠ S then S := (L+1) mod 3. Others: if (S+1) mod 3 = L then S := L; if (S+1) mod 3 = R then S := R.`,
  },
  {
    id: "w5-f64",
    front: `How many exceptional machines do the K >= n and K = 3 solutions have?`,
    back: `K >= n: one exceptional machine. K = 3: two — the bottom machine 0 and the top machine n-1.`,
  },
  ],
};

export default week5;