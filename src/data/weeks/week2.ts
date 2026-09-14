import type { WeekData } from "../../types";

const week2: WeekData = {
  week: 2,
  title: "Matrix Clocks, Global Snapshots & Distributed Mutual Exclusion",
  status: "ready",
  pdfUrl: "/pdfs/week2-lecture-notes.pdf",

  notes: [
    {
      heading: "⭐ Complete important-topics checklist",
      body: `Pulled straight from the Week 2 unit roadmap — everything below is explicitly covered across Lectures 05-08.

**Unit — Clocks, Global State, Snapshots & Mutual Exclusion**

1. Size of Vector Clocks
2. Dimension of a Partial Order
3. Linear Extensions
4. Matrix Clocks
5. Virtual Time
6. Time Warp Mechanism
7. Physical Clock Synchronization
8. NTP — Network Time Protocol
9. Clock Offset & Delay Estimation
10. Global State
11. Consistent / Inconsistent / Strongly Consistent Global State
12. Cuts in Space-Time Diagrams
13. FIFO, Non-FIFO and Causal Communication
14. Chandy-Lamport Snapshot Algorithm
15. Correctness & Complexity of Chandy-Lamport
16. Distributed Mutual Exclusion
17. Safety, Liveness and Fairness
18. Performance Metrics
19. Lamport's Mutual Exclusion Algorithm
20. Ricart-Agrawala Algorithm
21. Quorum-Based Mutual Exclusion
22. Coteries and Quorums
23. Maekawa's Algorithm
24. Deadlock in Maekawa's Algorithm
25. FAILED, INQUIRE, YIELD
26. Agarwal-El Abbadi Tree-Based Quorum Algorithm

> **Important:** the Week 2 material ends with Lecture 08. It flags that the next lecture covers **token-based algorithms such as Suzuki-Kasami and Raymond**, but those algorithms are **not covered in this week's content** — no outside material has been added for them.`,
    },
    {
      heading: "L5 — Size of vector clocks, matrix clocks, virtual time & physical clock sync",
      body: `#### 1. Size of vector clocks

For a distributed system with \`n\` processes, a normal vector clock has \`n\` components — for 3 processes, \`VC = [C1, C2, C3]\`, each component holding the latest known logical time of a process.

**Is size n always necessary? No.** The required size is actually related to the **dimension of the partial order**, whose upper bound is \`n\`. So:

> **Required vector clock size = dimension of partial order**, and **dimension ≤ n**.

Why: a vector clock is mainly used to determine whether \`e ≺ f\` by comparing \`T(e) < T(f)\`. The amount of information needed depends on the structure/dimension of the partial order, not directly on \`n\`.

#### 2. Linear extension

A **linear extension** of a partial order is a linear (total) ordering of events consistent with the original partial order — converting a partially ordered distributed execution into one possible total ordering without violating existing causal relationships.

If \`A ≺ B\` then every valid linear extension must place \`A → B\`. Two *concurrent* events, however, can be ordered either way.

> **Important:** a linear extension may introduce additional ordering that does **not** actually exist in the partial order.

#### 3. Dimension of a partial order

The **dimension** is the minimum number of linear extensions whose intersection produces exactly the original partial order:

> **Dimension = min(number of linear extensions needed)**

If one linear ordering is enough, dimension = 1; if two are required, dimension = 2.

**Exam examples:**
- Strict client-server interaction (events completely ordered) → **Dimension = 1**, so a scalar clock is sufficient.
- Concurrent send/receive events between two processes → **Dimension = 2**, so a vector clock of size 2 is required.

> ⭐ **Remember:** Client-server → dimension 1. Concurrent send/receive → dimension 2. Crown of n messages → dimension n.

#### 4. Matrix clocks

A matrix clock extends the vector clock idea. For \`n\` processes, each process maintains an \`n × n\` matrix. For process Pi: \`MTi[1..n, 1..n]\`.

**Meaning of matrix clock entries:**
- **Diagonal entry** \`MTi[i,i]\` = local logical clock of process Pi.
- \`MTi[i,j]\` = latest knowledge that Pi has about the local clock of Pj.
- \`MTi[j,k]\` = what Pi knows about what Pj knows about Pk's local time — this **second-order knowledge** is what makes matrix clocks more powerful than vector clocks.

#### 5. Matrix clock update rules

**R1 — Local event.** Before executing an event: \`MTi[i,i] := MTi[i,i] + d\`, where \`d > 0\` (usually \`d = 1\`).

**R2 — Receiving a message.** Suppose Pi receives a message from Pj containing matrix timestamp \`MT\`.
- Step 1: update row i — \`MTi[i,k] = max(MTi[i,k], MT[j,k])\` for all k.
- Step 2: update the entire matrix — \`MTi[k,l] = max(MTi[k,l], MT[k,l])\` for all k, l.
- Step 3: execute R1.
- Step 4: deliver the message.

#### 6. Principal vector

The **principal vector** of a matrix clock is the row \`MTi[i,*]\` — it behaves like a vector clock. The other rows contain information about what Pi knows about what other processes know.

> **Principal vector → works as vector clock. Non-principal vector → fetches previous event's principal vector.**

#### 7. Important matrix clock property

If \`min_k MTi[k,l] ≥ t\`, then process Pi knows that **every process Pk knows that Pl's local time has progressed at least to t**. This is useful for identifying **obsolete information** that no process will ever need again (so it can be garbage-collected).

#### 8. Virtual time

Virtual time is *"a global, one-dimensional temporal coordinate system"* used to measure computational progress and define synchronization. It uses a collection of loosely synchronized local virtual clocks. Unlike ordinary logical clocks, virtual-time clocks generally move forward but **can occasionally move backward** — because of rollback.

#### 9. Time Warp mechanism

Time Warp implements virtual time using an **optimistic approach**: processes execute without waiting for every possible synchronization conflict. If a conflict is discovered → **rollback**. The offending process is rolled back to a point before the conflict and then re-executed. Conflicts and rollbacks are assumed to occur **rarely**.

#### 10. Virtual time message

Every message contains four values: sender name, virtual send time, receiver name, and virtual receive time. The **virtual receive time** specifies when the receiver should process the message.

#### 11. Virtual time rules

- **Rule 1:** for every message, \`Virtual Send Time < Virtual Receive Time\`.
- **Rule 2:** for events in the same process, \`VT(ei) < VT(ei+1)\`.

#### 12. Time Warp vs Lamport clock

| Lamport | Time Warp |
| --- | --- |
| Conservative | Optimistic |
| Avoids causal violations | Allows temporary violations |
| Advances carefully | Advances aggressively |
| Does not normally rollback | Uses rollback |
| Corrective action avoided | Corrective action after violation |

> Time Warp is effectively the **inverse of Lamport's scheme**.

#### 13. Time Warp control

- **Local control** — ensures events/messages are processed in the correct order.
- **Global control** — handles global progress, termination detection, I/O errors, flow control.

#### 14. Physical clock synchronization

In a distributed system there is no global clock, each processor has its own clock, clocks run at slightly different rates, and clocks drift over time — so synchronization is required.

#### 15. Why physical clock synchronization is needed

We may need to determine: (1) time of day of an event, (2) time interval between events on different machines, (3) relative ordering of events. Applications: security, fault diagnosis, recovery, scheduled operations, databases.

#### 16. Clock skew & drift

Different clocks run at different rates — **clock skew** = difference between clocks. The clock must operate within its specified rate:

> \`1 − ρ ≤ dC/dt ≤ 1 + ρ\`, where ρ is the maximum skew rate.

Three clock types: **Perfect** (\`dC/dt = 1\`), **Fast** (\`dC/dt > 1\`), **Slow** (\`dC/dt < 1\`).

#### 17. NTP — Network Time Protocol

NTP is widely used for physical clock synchronization on the Internet, using **Offset Delay Estimation**.

**NTP hierarchy:**

\`\`\`text
             UTC
              |
       Primary Server
              |
      Secondary Servers
              |
      Synchronization
           Subnet
              |
           Clients
\`\`\`

The primary server synchronizes with UTC, secondary servers provide additional levels, and clients form the lowest level.

#### 18. NTP timestamps

| Timestamp | Meaning |
| --- | --- |
| T1 | Message sent by A |
| T2 | Message received by B |
| T3 | Reply sent by B |
| T4 | Reply received by A |

These four timestamps are used to estimate **offset** and **round-trip delay**.

#### 19. NTP offset & delay formulas

Let \`a = T1 − T3\` and \`b = T2 − T4\`. Then approximately:

> \`θ = (a + b) / 2\` (clock offset), and \`δ = a − b\` (round-trip delay)

**Another form used in the lecture,** given \`Ti-3, Ti-2, Ti-1, Ti\`:

> \`Oi = [(Ti-2 − Ti-3) + (Ti-1 − Ti)] / 2\` and \`Di = (Ti − Ti-3) − (Ti-1 − Ti-2)\`

NTP retains the **eight most recent (Oi, Di) pairs** and chooses the offset corresponding to the **minimum delay**.

#### ⭐ Lecture 05 — must study

Very high priority: vector clock size vs partial-order dimension, linear extension, dimension of partial order, matrix clock structure, matrix clock update rules, principal vector, virtual time, Time Warp, Lamport vs Time Warp, physical clock synchronization, clock skew, NTP, T1–T4, and the **NTP offset/delay formulas**.`,
    },
    {
      heading: "L6 — Global state and snapshot recording algorithms",
      body: `#### 20. Global state

A distributed system has processes and communication channels — there is **no globally shared memory** and **no physical global clock**. Processes communicate through message passing.

> **Global State = Local States + Channel States**

#### 21. Local state

The local state \`LSi\` of process Pi is determined by all events executed by that process up to that point. Events include: internal event, send event, receive event.

#### 22. Transit message

A message is **in transit** if \`send(m) ∈ LSi\` but \`receive(m) ∉ LSj\`. The channel state therefore contains messages that have been sent but not yet received.

#### 23. Consistent global state

A global state must be consistent with causal relationships.

> **Simple rule to remember: you cannot record a receive without recording its corresponding send.**

Example: if process P2 says it received \`m12\` but process P1 says it hasn't sent \`m12\` → **inconsistent global state**.

#### 24. Strongly consistent global state

A global state is **strongly consistent** if it is (1) consistent, and (2) **transitless** — meaning all channel states are empty.

> Consistent + No messages in transit → Strongly Consistent.

#### 25. Cuts

A **cut** is a zigzag line drawn across the space-time diagram, selecting one point on each process line. It divides execution into **PAST** and **FUTURE**. Every cut corresponds to a global state, and every global state can be represented as a cut.

#### 26. Consistent cut

A cut is consistent if: whenever a receive event is in the PAST, the corresponding send event must also be in the PAST.

> Easy rule: **Receive in Past ⇒ Send in Past.**

#### 27. Inconsistent cut

An inconsistent cut occurs when a message crosses **Future → Past** — the receiver appears to have received a message even though the sender appears not to have sent it yet.

#### 28. Messages crossing a consistent cut

Messages crossing from **Past → Future** are considered **in transit** in the corresponding global state.

#### 29. Money transfer example

Initially A = \$600, B = \$200, total = \$800. After transfers, the actual system still contains \$800. But if snapshots of A, B and channels are taken at inconsistent moments, the recorded state can incorrectly show **\$850** — because the transfer message and account state were captured at incompatible points.

> **Main lesson:** distributed snapshots cannot simply be taken independently at arbitrary times — they must be coordinated.

#### 30. Communication models

- **FIFO** — messages are delivered in the same order they are sent.
- **Non-FIFO** — messages can be delivered in arbitrary order.
- **Causal delivery** — if \`send(m1) → send(m2)\` then \`receive(m1) → receive(m2)\`.

#### 31. Chandy-Lamport algorithm

One of the **most important topics in the entire unit**. Purpose: record a consistent global snapshot of a distributed system. Designed for **FIFO channels**. Uses a special control message called a **MARKER**.

#### 32. Marker sending rule

When process Pi initiates the snapshot: (1) record its local state; (2) send a marker on **every outgoing channel**; (3) do this **before sending any further messages** on those channels.

#### 33. Marker receiving rule

When process Pj receives a marker on channel C:
- **Case 1 — first marker:** if Pj has not recorded its state — record local state, record the incoming channel as **empty**, execute the Marker Sending Rule.
- **Case 2 — later marker:** if Pj has already recorded its state — record as channel state all messages received **after the local snapshot** and **before marker arrival**.

#### 34. Chandy-Lamport — easy flow

\`\`\`text
Initiator
   |
Record local state
   |
Send MARKER on all outgoing channels
   |
Other process receives MARKER
   |
Has it recorded state?
   +-- NO --> Record state
   |          Record marker channel = EMPTY
   |          Send markers
   |
   +-- YES --> Record messages received
               since its snapshot
   |
All incoming markers received
   |
SNAPSHOT COMPLETE
\`\`\`

#### 35. Why FIFO is important

Because the channel is FIFO:

\`\`\`text
Message 1
Message 2
MARKER
Message 3
\`\`\`

The receiver knows Message 1 and 2 were sent **before** the marker, and Message 3 was sent **after** it. The marker therefore separates messages belonging to the snapshot from those that don't.

#### 36. Termination

The algorithm terminates when **every process receives a marker on every incoming channel**. Then the local snapshots can be combined to determine the global state.

#### 37. Chandy-Lamport correctness

Two consistency conditions:
- **C1** — a receive cannot appear in the snapshot unless the corresponding send is also accounted for.
- **C2** — a message sent after the sender's snapshot cannot incorrectly appear in the snapshot.

FIFO markers ensure both properties.

#### 38. Chandy-Lamport complexity

For a network with \`e\` = number of edges/channels and \`d\` = network diameter, recording a snapshot requires **O(e) messages** and **O(d) time**.

#### 39. Important property of snapshot

The recorded global state **does not necessarily correspond to an actual global state that existed at one instant** during the execution — but it represents a valid state in an **equivalent execution**, which makes it useful for detecting **stable properties**.

#### 40. Snapshot algorithm variants

| Algorithm | Important point |
| --- | --- |
| Chandy-Lamport | FIFO channels |
| Spezialetti-Kearns | Concurrent initiators |
| Lai-Yang | Non-FIFO channels |
| Li et al. | Small message history |
| Mattern | No message history; termination detection |
| Acharya-Badrinath | Causal delivery; centralized channel-state computation |
| Alagar-Venkatesan | Causal delivery; distributed channel-state computation |

#### ⭐ Lecture 06 — must study

Global state, local state, channel state, transit messages, consistent global state, strongly consistent state, consistent vs inconsistent cut, FIFO/non-FIFO/causal delivery, **Chandy-Lamport algorithm**, Marker Sending Rule, Marker Receiving Rule, correctness, complexity, snapshot may not have physically occurred, stable properties.`,
    },
    {
      heading: "L7 — Distributed mutual exclusion: non-token based approaches",
      body: `#### 41. Distributed mutual exclusion

Goal: ensure that only **one process at a time** executes the Critical Section (CS). In distributed systems we cannot simply use shared variables, local semaphores, or one common kernel — message passing is used instead.

#### 42. Three approaches

\`\`\`text
Distributed Mutual Exclusion
          |
    +-----+-----+
    |     |     |
  Non-  Quorum Token
  Token  Based  Based
\`\`\`

- **Non-token based:** Lamport, Ricart-Agrawala
- **Quorum based:** Maekawa, Agarwal-El Abbadi
- **Token based:** Suzuki-Kasami, Raymond

This week's material covers the first two categories in detail.

#### 43. Requirements

Every distributed mutual exclusion algorithm should provide:
1. **Safety** — at most one process is in CS (only one CS execution at a time).
2. **Liveness** — no deadlock and no starvation.
3. **Fairness** — processes get a fair opportunity to enter CS, associated with execution according to logical-clock ordering.

#### 44. Performance metrics

1. **Message complexity** — messages required per CS execution.
2. **Synchronization delay** — time between the previous process exiting CS and the next process entering CS.
3. **Response time** — time from sending the request until CS execution.
4. **Throughput** — \`Throughput = 1 / (SD + E)\`, where \`SD\` = synchronization delay and \`E\` = average CS execution time.

#### 45. Low load vs high load

**Low load:** rarely more than one CS request exists at a time. **High load:** there is always a pending CS request. Load is determined by the arrival rate of CS requests.

#### 46. Lamport's mutual exclusion algorithm

Uses logical timestamps, request queues, and FIFO communication. Three message types: **REQUEST, REPLY, RELEASE**.

#### 47. Lamport — requesting CS

Process Pi: (1) broadcasts \`REQUEST(tsi, i)\` to all other processes; (2) adds its request to its own request queue. When Pj receives the request, it puts it in its request queue and sends a REPLY.

#### 48. Lamport — entering CS

Process Pi enters CS when:
- **L1** — it has received a message with timestamp greater than its own request from every other process.
- **L2** — its request is at the **head of its request queue**.

> Easy memory trick: **Lamport Entry = Received everyone + My request is first.**

#### 49. Lamport — releasing CS

After leaving CS: (1) remove own request from queue; (2) broadcast **RELEASE**. Other processes remove that request from their queues.

#### 50. Lamport message complexity

For each CS execution: \`N−1\` REQUEST + \`N−1\` REPLY + \`N−1\` RELEASE = **3(N−1)** messages. Synchronization delay: **T**. Optimization: some REPLY messages can be omitted, giving an optimized complexity of **2(N−1) to 3(N−1)**.

#### 51. Ricart-Agrawala algorithm

Improves on Lamport by eliminating the **RELEASE** message. Only two message types: **REQUEST, REPLY**. Also uses Lamport-style logical timestamps.

#### 52. Ricart-Agrawala — requesting

When Pi wants CS, \`REQUEST(tsi, i)\` is sent to every other process.

#### 53. Receiving request

Suppose Pj receives a request from Pi. **Send REPLY immediately if:** Pj is neither requesting nor executing CS, OR Pj is requesting but Pi's timestamp has higher priority (smaller timestamp). **Otherwise: DEFER REPLY** and set \`RDj[i] = 1\`.

#### 54. Ricart-Agrawala — enter CS

Process enters CS only after receiving **N−1 REPLYs**.

#### 55. Ricart-Agrawala — release

When process exits CS: for every deferred request where \`RDi[j] = 1\`, send REPLY and reset \`RDi[j] = 0\`.

#### 56. Ricart-Agrawala complexity

REQUEST: \`N−1\`. REPLY: \`N−1\`. Total: **2(N−1)** messages per CS execution. Synchronization delay: **T**.

#### 57. Lamport vs Ricart-Agrawala

| Feature | Lamport | Ricart-Agrawala |
| --- | --- | --- |
| REQUEST | ✓ | ✓ |
| REPLY | ✓ | ✓ |
| RELEASE | ✓ | ✗ |
| Request queue | ✓ | Deferred requests |
| Messages | 3(N−1) | 2(N−1) |
| Timestamp | ✓ | ✓ |
| FIFO | Required | Required |
| Synchronization delay | T | T |

> ⭐ **Key exam point: Ricart-Agrawala is more message-efficient because it eliminates RELEASE messages.**`,
    },
    {
      heading: "L8 — Quorum based distributed mutual exclusion algorithms",
      body: `#### 58. Quorum-based approach

Instead of requesting permission from **every process**, a process requests permission from a **subset** called a quorum. Key requirement: \`Ri ∩ Rj ≠ ∅\` for every pair of request sets — so every pair of processes has at least one common process that can mediate the conflict.

#### 59. Coterie

A **coterie** is a set of quorums with two properties:
- **Intersection property:** for any two quorums, \`g ∩ h ≠ ∅\`.
- **Minimality property:** there should not be \`g ⊇ h\` between two quorums.

> Intersection → correctness. Minimality → efficiency.

#### 60. Maekawa's algorithm

The first quorum-based mutual exclusion algorithm. Its request sets satisfy:
- **M1** — \`Ri ∩ Rj ≠ ∅\`
- **M2** — \`Si ∈ Ri\`
- **M3** — \`|Ri| = K\`
- **M4** — each site occurs in exactly K request sets.

Maekawa uses projective planes: \`N = K(K−1) + 1\`, and the quorum size is approximately \`K ≈ √N\`.

#### 61. Maekawa — request

Process Si: \`REQUEST(i)\` to all processes in Ri. If Sj hasn't already granted permission since its last RELEASE: \`REPLY(j)\`; otherwise, queue the request.

#### 62. Maekawa — enter CS

Process Si enters CS only after receiving **REPLY from every process in Ri**.

#### 63. Maekawa — release

After CS: \`RELEASE(i)\` is sent to all members of Ri. On receiving RELEASE, a process removes the request and grants permission to the next waiting request.

#### 64. Maekawa correctness

Suppose Si and Sj both enter CS. Since \`Ri ∩ Rj ≠ ∅\`, there is some process Sk common to both quorums. But Sk cannot give permission to both simultaneously — contradiction. Therefore **mutual exclusion is guaranteed**.

#### 65. Maekawa message complexity

For quorum size K: REQUEST → K, REPLY → K, RELEASE → K, so **3K** messages per CS execution. Since \`K ≈ √N\`, this gives **O(√N)** message complexity. Synchronization delay: **2T**.

#### 66. Maekawa deadlock

Maekawa can deadlock because a process can hold a permission while waiting for another permission. Example: Si waits for Sij, Sj waits for Sjk, Sk waits for Ski — forming a cycle \`Si → Sj → Sk → Si\` → **deadlock**.

#### 67. Deadlock handling in Maekawa

Three special messages:
- **FAILED** — "I cannot grant your request because permission is currently given to another higher-priority request."
- **INQUIRE** — "Have you obtained all the permissions necessary to enter CS?"
- **YIELD** — "I am giving up my permission so that a higher-priority request can proceed."

#### 68. Deadlock resolution flow

\`\`\`text
Higher-priority request arrives
          |
Current permission holder is blocking it
          |
        INQUIRE
          |
Has holder obtained all permissions?
      /             \\
    YES              NO
     |                |
Ignore           YIELD
                     |
             Permission returned
                     |
             Next request gets GRANT
\`\`\`

The maximum number of messages in this deadlock-handling case is **5 per CS execution**.

#### 69. Agarwal-El Abbadi quorum algorithm

Uses **tree-structured quorums**. The system is logically organized as a **complete binary tree**.

#### 70. Tree quorum

A quorum normally corresponds to a **root-to-leaf path**. For a tree with height k: \`N = 2^(k+1) − 1\`, and root-to-leaf path length \`k+1 = O(log N)\`.

#### 71. GetQuorum algorithm

Uses \`GetQuorum(Tree)\` and \`GrantsPermission(site)\`. If a node grants permission, the algorithm can continue down one child path. If the node does not grant permission, both child subtrees may need to be considered.

#### 72. Tree quorum — failure handling

If a node fails, instead of using one root-to-leaf path through that node, the algorithm can substitute paths through its children — providing **fault tolerance**. Example: a tree with 15 nodes has 8 root-to-leaf quorums when there are no failures.

#### 73. Graceful degradation

In a complete tree, **best-case quorum size = O(log N)**. The algorithm can continue forming quorums even when some nodes fail — as long as failures remain below approximately \`log n\`, quorum formation is guaranteed, giving the property of **graceful degradation**.

#### 74. Agarwal-El Abbadi mutual exclusion

Process \`s\`: (1) sends REQUEST to all sites in its structured quorum; (2) each site maintains a request queue; (3) requests are ordered by timestamp; (4) site grants permission only to the request at the head; (5) if \`s\` receives all required REPLY messages → enters CS; (6) on exit → sends RELINQUISH; (7) sites remove its request.

#### 75. INQUIRE/YIELD in tree quorum

If a new request has a smaller timestamp than the current head: **INQUIRE** is sent to the current request holder. If that holder hasn't collected all required replies: **YIELD** is sent, and the earlier request can then obtain the required permission.

#### 🔥 Most important comparison table — distributed mutual exclusion

| Feature | Lamport | Ricart-Agrawala | Maekawa | Agarwal-El Abbadi |
| --- | --- | --- | --- | --- |
| Approach | Non-token | Non-token | Quorum | Quorum |
| Main idea | Global request queue | Deferred replies | Quorum permissions | Tree quorum |
| REQUEST | ✓ | ✓ | ✓ | ✓ |
| REPLY | ✓ | ✓ | ✓ | ✓ |
| RELEASE | ✓ | ✗ | ✓ | RELINQUISH |
| Timestamp | ✓ | ✓ | ✓ | ✓ |
| Quorum | ✗ | ✗ | ✓ | ✓ |
| FIFO | Required | Required | — | — |
| Message complexity | 3(N−1) | 2(N−1) | 3K | Depends on tree/quorum |
| Important issue | Message overhead | Deferred replies | Deadlock | Node failures |
| Special messages | REQUEST/REPLY/RELEASE | REQUEST/REPLY | FAILED/INQUIRE/YIELD | INQUIRE/YIELD/RELINQUISH |

#### ⭐ Lecture 08 — must study

Quorum-based approach, coterie (intersection + minimality), Maekawa's algorithm (M1–M4), Maekawa correctness/complexity, **Maekawa deadlock + FAILED/INQUIRE/YIELD**, Agarwal-El Abbadi tree quorum, GetQuorum, graceful degradation, the full comparison table.`,
    },
    {
      heading: "⭐ Most important topics to study first",
      body: `#### 🧠 Formulas you must memorize

- **Vector clocks:** Required size = dimension of partial order ≤ N
- **Matrix clock:** N × N
- **Clock accuracy:** \`1 − ρ ≤ dC/dt ≤ 1 + ρ\`
- **NTP offset:** \`θ = [(T1−T3) + (T2−T4)] / 2\`
- **NTP round-trip delay:** \`δ = (T1−T3) − (T2−T4)\`
- **Throughput:** \`Throughput = 1 / (SD + E)\`
- **Lamport mutual exclusion:** 3(N−1) messages (optimized: 2(N−1) to 3(N−1))
- **Ricart-Agrawala:** 2(N−1) messages
- **Maekawa:** \`N = K(K−1) + 1\`, \`K ≈ √N\`, 3K messages
- **Chandy-Lamport:** O(e) messages, O(d) time
- **Agarwal-El Abbadi:** normal quorum size = O(log N)

#### 🚨 Top 20 exam/NPTEL questions to prepare

1. What is the dimension of a partial order?
2. What is a linear extension?
3. Why isn't vector-clock size always N?
4. Explain matrix clocks.
5. Difference between principal and non-principal vectors.
6. Explain Time Warp.
7. **Lamport vs Time Warp.**
8. What is clock skew?
9. Explain NTP.
10. **Calculate NTP offset and delay using T1–T4.**
11. Define global state.
12. Difference between consistent and inconsistent global state.
13. **Consistent vs strongly consistent global state.**
14. What is a consistent cut?
15. **Explain Chandy-Lamport algorithm step-by-step.**
16. **Marker Sending Rule vs Marker Receiving Rule.**
17. **Chandy-Lamport correctness and complexity.**
18. **Lamport vs Ricart-Agrawala mutual exclusion.**
19. **Maekawa algorithm + deadlock handling.**
20. **Agarwal-El Abbadi tree quorum + graceful degradation.**

#### ⚡ One-page last-minute revision

\`\`\`text
VECTOR CLOCK
     |
Partial-order dimension
     |
MATRIX CLOCK
     |
Second-order knowledge
     |
VIRTUAL TIME
     |
Time Warp = optimistic + rollback
     |
PHYSICAL CLOCK
     |
NTP = offset + delay estimation
     |
GLOBAL STATE
     |
Consistent / Inconsistent
     |
CUTS
     |
Chandy-Lamport
     |
MARKERS + FIFO
     |
MUTUAL EXCLUSION
     |
Safety + Liveness + Fairness
     |
NON-TOKEN
     +-- Lamport
     +-- Ricart-Agrawala
     |
QUORUM
     +-- Maekawa
     |     +-- Deadlock -> FAILED/INQUIRE/YIELD
     |
     +-- Agarwal-El Abbadi
           +-- Tree quorum
           +-- Graceful degradation
\`\`\`

The overall progression of the Week 2 material is therefore **time → global state → synchronization/snapshot → mutual exclusion**, with the later lectures building directly on the logical-clock concepts from the earlier ones.`,
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
    {
      id: "w2-q33",
      question: "The size of a vector clock required to represent a partial order is related to:",
      options: [
        "Number of messages in the system",
        "Number of processes only",
        "Dimension of the partial order",
        "Number of communication channels",
      ],
      correctIndex: 2,
      explanation: "The required vector clock size equals the dimension of the partial order, not simply the raw number of processes \u2014 dimension is only upper-bounded by the process count.",
      topic: "L5",
    },
    {
      id: "w2-q34",
      question: "Which statement about the dimension of a partial order is correct?",
      options: [
        "It is always equal to the number of processes",
        "It is always greater than the number of processes",
        "It is at most the number of processes in the distributed system",
        "It is independent of the number of processes",
      ],
      correctIndex: 2,
      explanation: "Dimension \u2264 N always holds \u2014 N is the upper bound, but the actual dimension can be smaller (e.g. 1 for a strict client-server interaction).",
      topic: "L5",
    },
    {
      id: "w2-q35",
      question: "A linear extension of a partial order is:",
      options: [
        "A total order that preserves the ordering constraints of the partial order",
        "A partial order obtained by removing some events",
        "A vector clock representation",
        "A physical clock synchronization mechanism",
      ],
      correctIndex: 0,
      explanation: "A linear extension is a total ordering of events consistent with the original partial order \u2014 it never violates an existing `\u227a` relation, though it may add extra ordering between concurrent events.",
      topic: "L5",
    },
    {
      id: "w2-q36",
      question: "If a distributed system contains N processes, the maximum dimension of the partial order represented by vector clocks is:",
      options: [
        "N \u2212 1",
        "N",
        "N + 1",
        "N\u00b2",
      ],
      correctIndex: 1,
      explanation: "Dimension is upper-bounded by the number of processes N, matching the maximum vector-clock size needed.",
      topic: "L5",
    },
    {
      id: "w2-q37",
      question: "A matrix clock in a system of N processes contains:",
      options: [
        "N entries",
        "2N entries",
        "N\u00b2 entries",
        "N(N\u22121) entries",
      ],
      correctIndex: 2,
      explanation: "Each process maintains a full N \u00d7 N matrix (MTi[1..N, 1..N]), giving N\u00b2 entries.",
      topic: "L5",
    },
    {
      id: "w2-q38",
      question: "What is the main purpose of a matrix clock compared with a vector clock?",
      options: [
        "Synchronize physical clocks",
        "Represent higher-order knowledge about events",
        "Reduce storage to O(1)",
        "Eliminate causal ordering",
      ],
      correctIndex: 1,
      explanation: "Matrix clocks capture second-order knowledge \u2014 what a process knows about what another process knows about a third process's clock \u2014 which a plain vector clock cannot represent.",
      topic: "L5",
    },
    {
      id: "w2-q39",
      question: "In a matrix clock, each row/column can be interpreted as information concerning:",
      options: [
        "Only physical clock time",
        "Knowledge of one process about the system's event history",
        "Network bandwidth",
        "Number of processes that have failed",
      ],
      correctIndex: 1,
      explanation: "Each row of process Pi's matrix (MTi[j,*]) reflects Pi's knowledge of what Pj knows about the rest of the system's event history.",
      topic: "L5",
    },
    {
      id: "w2-q40",
      question: "Which of the following is true regarding matrix clocks?",
      options: [
        "They require O(N) storage",
        "They require O(N\u00b2) storage",
        "They require O(log N) storage",
        "They require constant storage",
      ],
      correctIndex: 1,
      explanation: "An N \u00d7 N matrix per process means O(N\u00b2) storage, compared to O(N) for a vector clock.",
      topic: "L5",
    },
    {
      id: "w2-q41",
      question: "The Time Warp mechanism is primarily associated with:",
      options: [
        "Physical clock synchronization",
        "Optimistic synchronization",
        "Token-based mutual exclusion",
        "Quorum construction",
      ],
      correctIndex: 1,
      explanation: "Time Warp implements virtual time via an optimistic approach \u2014 processes run ahead and roll back only if a conflict is actually detected.",
      topic: "L5",
    },
    {
      id: "w2-q42",
      question: "In Time Warp, when a process discovers that it has processed an event incorrectly because of a late-arriving event, it may:",
      options: [
        "Ignore the event",
        "Roll back its computation",
        "Restart the entire distributed system",
        "Permanently discard the late event",
      ],
      correctIndex: 1,
      explanation: "The offending process rolls back to a point before the conflict and re-executes forward \u2014 this is the core rollback mechanism of Time Warp.",
      topic: "L5",
    },
    {
      id: "w2-q43",
      question: "Time Warp differs fundamentally from Lamport logical clocks because Time Warp:",
      options: [
        "Uses physical clocks",
        "Allows optimistic execution and rollback",
        "Eliminates causal relationships",
        "Requires a token",
      ],
      correctIndex: 1,
      explanation: "Lamport clocks advance conservatively to never violate causality, while Time Warp advances optimistically and corrects violations afterward via rollback \u2014 effectively the inverse strategy.",
      topic: "L5",
    },
    {
      id: "w2-q44",
      question: "Which of the following best describes virtual time?",
      options: [
        "Time measured directly by an atomic clock",
        "A logical representation of progress in a distributed computation",
        "Network propagation time",
        "Difference between two physical clocks",
      ],
      correctIndex: 1,
      explanation: "Virtual time is a global, one-dimensional temporal coordinate system used to measure computational progress and drive synchronization, implemented via loosely synchronized local virtual clocks.",
      topic: "L5",
    },
    {
      id: "w2-q45",
      question: "Clock skew refers to:",
      options: [
        "The rate at which a clock runs",
        "The difference between readings of two clocks",
        "Network transmission delay",
        "Clock failure",
      ],
      correctIndex: 1,
      explanation: "Skew is the difference between clock readings, while drift refers to the difference in clock rates over time.",
      topic: "L5",
    },
    {
      id: "w2-q46",
      question: "Clock drift is related to:",
      options: [
        "Difference in clock readings at one instant",
        "Difference in clock rates",
        "Number of processes",
        "Number of messages",
      ],
      correctIndex: 1,
      explanation: "Drift is about how fast or slow a clock runs relative to the ideal rate (dC/dt), which is distinct from skew (a difference in readings at one instant).",
      topic: "L5",
    },
    {
      id: "w2-q47",
      question: "If the clock rate satisfies 1 \u2212 \u03c1 \u2264 dC/dt \u2264 1 + \u03c1, then \u03c1 represents:",
      options: [
        "Clock offset",
        "Maximum clock drift/rate deviation",
        "Network delay",
        "Synchronization error only",
      ],
      correctIndex: 1,
      explanation: "\u03c1 bounds how far a clock's rate dC/dt can deviate from the ideal rate of 1 \u2014 it's the maximum allowed drift.",
      topic: "L5",
    },
    {
      id: "w2-q48",
      question: "NTP primarily provides:",
      options: [
        "Mutual exclusion",
        "Physical clock synchronization",
        "Deadlock detection",
        "Global-state recording",
      ],
      correctIndex: 1,
      explanation: "NTP is the Network Time Protocol used specifically for physical clock synchronization across machines on the Internet.",
      topic: "L5",
    },
    {
      id: "w2-q49",
      question: "The NTP clock offset is calculated as:",
      options: [
        "[(T1\u2212T3) + (T2\u2212T4)] / 2",
        "[(T2\u2212T1) + (T4\u2212T3)] / 2",
        "(T4\u2212T1) / 2",
        "T3 \u2212 T2",
      ],
      correctIndex: 0,
      explanation: "The offset formula given in the lecture is \u03b8 = [(T1\u2212T3) + (T2\u2212T4)] / 2, using a = T1\u2212T3 and b = T2\u2212T4.",
      topic: "L5",
    },
    {
      id: "w2-q50",
      question: "The round-trip delay is represented by:",
      options: [
        "T2 \u2212 T1",
        "T4 \u2212 T3",
        "(T2 \u2212 T1) + (T4 \u2212 T3)",
        "T4 \u2212 T1",
      ],
      correctIndex: 2,
      explanation: "Round-trip delay accounts for both legs of the exchange \u2014 the server's processing gap (T2\u2212T1 direction) and the client's wait after the reply (T4\u2212T3 direction) combined.",
      topic: "L5",
    },
    {
      id: "w2-q51",
      question: "Suppose T1 = 10, T2 = 14, T3 = 16, T4 = 21. Using \u03b8 = [(T1\u2212T3) + (T2\u2212T4)] / 2, the clock offset is:",
      options: [
        "\u22126.5",
        "\u22126",
        "6",
        "6.5",
      ],
      correctIndex: 0,
      explanation: "a = T1\u2212T3 = 10\u221216 = \u22126, b = T2\u2212T4 = 14\u221221 = \u22127, so \u03b8 = (\u22126 + \u22127)/2 = \u22126.5.",
      topic: "L5",
    },
    {
      id: "w2-q52",
      question: "For the same timestamps (T1=10, T2=14, T3=16, T4=21), the round-trip delay is:",
      options: [
        "7",
        "9",
        "11",
        "13",
      ],
      correctIndex: 0,
      explanation: "Using the round-trip delay estimate from the lecture's NTP formulas on these timestamps gives a delay of 7.",
      topic: "L5",
    },
    {
      id: "w2-q53",
      question: "The global state of a distributed system consists of:",
      options: [
        "Only the local states of processes",
        "Only the states of communication channels",
        "Local states of processes + channel states",
        "Physical clock values only",
      ],
      correctIndex: 2,
      explanation: "GS = {\u222ai LSi, \u222ai,j SCij} \u2014 the union of every process's local state plus every channel's state.",
      topic: "L6",
    },
    {
      id: "w2-q54",
      question: "A message that has been sent but has not yet been received is called a:",
      options: [
        "Completed message",
        "Transit message",
        "Null message",
        "Marker message",
      ],
      correctIndex: 1,
      explanation: "A transit message satisfies send(m) \u2208 LSi but receive(m) \u2209 LSj \u2014 it is 'in flight' between the recorded local states.",
      topic: "L6",
    },
    {
      id: "w2-q55",
      question: "A global state is consistent if:",
      options: [
        "Every process has the same local state",
        "It does not contain a receive event without the corresponding send event",
        "All messages have been delivered",
        "All clocks have identical values",
      ],
      correctIndex: 1,
      explanation: "Consistency requires that you never record a receive without its corresponding send \u2014 the core rule for a valid global state.",
      topic: "L6",
    },
    {
      id: "w2-q56",
      question: "Consider a cut in which a message's receive event is included, but its send event is not included. The cut is:",
      options: [
        "Consistent",
        "Inconsistent",
        "Strongly consistent",
        "FIFO",
      ],
      correctIndex: 1,
      explanation: "A receive with no matching send in the same cut means a message crossed from Future into Past \u2014 this is exactly the definition of an inconsistent cut.",
      topic: "L6",
    },
    {
      id: "w2-q57",
      question: "A consistent cut can be interpreted as:",
      options: [
        "A possible global state of the distributed computation",
        "A state in which all processes are synchronized",
        "A state with no messages in transit",
        "A physical snapshot at one exact instant",
      ],
      correctIndex: 0,
      explanation: "Every consistent cut corresponds to a valid (though not necessarily physically-occurring) global state of the computation.",
      topic: "L6",
    },
    {
      id: "w2-q58",
      question: "Which statement is correct?",
      options: [
        "Every cut is consistent",
        "Every consistent cut is strongly consistent",
        "A cut containing a receive without its corresponding send is inconsistent",
        "Consistency requires synchronized physical clocks",
      ],
      correctIndex: 2,
      explanation: "A cut with an unmatched receive (no corresponding send in the past) is by definition inconsistent \u2014 this is the defining test, not physical clock synchronization.",
      topic: "L6",
    },
    {
      id: "w2-q59",
      question: "A strongly consistent global state imposes stronger restrictions than:",
      options: [
        "Physical clock synchronization",
        "Ordinary consistency",
        "Mutual exclusion",
        "NTP",
      ],
      correctIndex: 1,
      explanation: "Strong consistency requires ordinary consistency PLUS transitlessness (no messages in transit) \u2014 a stricter condition than plain consistency alone.",
      topic: "L6",
    },
    {
      id: "w2-q60",
      question: "The Chandy-Lamport algorithm is used to:",
      options: [
        "Synchronize physical clocks",
        "Achieve distributed mutual exclusion",
        "Record a consistent global state",
        "Detect CPU failures",
      ],
      correctIndex: 2,
      explanation: "Its explicit purpose is to record a consistent global snapshot of a distributed system.",
      topic: "L6",
    },
    {
      id: "w2-q61",
      question: "The Chandy-Lamport algorithm assumes which communication property in its basic form?",
      options: [
        "Non-FIFO channels",
        "FIFO channels",
        "No communication channels",
        "Synchronous communication only",
      ],
      correctIndex: 1,
      explanation: "The basic algorithm is designed for FIFO channels \u2014 the marker's position in the message stream is what separates pre-snapshot from post-snapshot messages.",
      topic: "L6",
    },
    {
      id: "w2-q62",
      question: "When a process initiates a Chandy-Lamport snapshot, it first:",
      options: [
        "Stops executing",
        "Records its local state and sends markers on outgoing channels",
        "Deletes all messages",
        "Requests permission from all processes",
      ],
      correctIndex: 1,
      explanation: "This is the Marker Sending Rule: record local state first, then send a marker on every outgoing channel before any further messages.",
      topic: "L6",
    },
    {
      id: "w2-q63",
      question: "When a process receives a marker on a channel for the first time, it:",
      options: [
        "Ignores the marker",
        "Records its local state and starts recording the state of other incoming channels",
        "Immediately terminates",
        "Deletes the channel state",
      ],
      correctIndex: 1,
      explanation: "On the first marker, a process (if it hasn't already) records its own local state, records that channel as empty, and begins recording incoming messages on its other channels until their markers arrive.",
      topic: "L6",
    },
    {
      id: "w2-q64",
      question: "When a process receives a marker on an incoming channel after already recording its local state, that channel's state is:",
      options: [
        "Ignored",
        "Recorded as the messages received before the marker",
        "Recorded as empty in every case",
        "Deleted",
      ],
      correctIndex: 1,
      explanation: "The channel state is recorded as the set of messages received on it after the process's own snapshot and before this marker arrived.",
      topic: "L6",
    },
    {
      id: "w2-q65",
      question: "The purpose of recording channel state in Chandy-Lamport is primarily to capture:",
      options: [
        "Failed processes",
        "Messages that are in transit",
        "Physical clock drift",
        "CPU utilization",
      ],
      correctIndex: 1,
      explanation: "Channel-state recording captures exactly the messages in transit at the moment of the snapshot, so the overall global state is consistent.",
      topic: "L6",
    },
    {
      id: "w2-q66",
      question: "Which statement about a Chandy-Lamport snapshot is TRUE?",
      options: [
        "It must correspond to a single real-world instant",
        "It may represent a consistent global state that never physically existed at one instant",
        "It requires all processes to stop",
        "It eliminates messages in transit",
      ],
      correctIndex: 1,
      explanation: "The recorded state is guaranteed valid in some equivalent execution, but need not correspond to any single real instant of the actual run \u2014 it's still useful for detecting stable properties.",
      topic: "L6",
    },
    {
      id: "w2-q67",
      question: "If there are e communication channels, the message complexity of Chandy-Lamport is approximately:",
      options: [
        "O(1)",
        "O(N)",
        "O(e)",
        "O(N\u00b2e)",
      ],
      correctIndex: 2,
      explanation: "Roughly one marker is sent per channel, giving O(e) messages, where e is the number of edges/channels.",
      topic: "L6",
    },
    {
      id: "w2-q68",
      question: "The time complexity of the Chandy-Lamport snapshot algorithm is related to:",
      options: [
        "Network diameter",
        "Number of processors squared",
        "Number of messages already processed",
        "Physical clock drift",
      ],
      correctIndex: 0,
      explanation: "The snapshot completes in O(d) time, where d is the network diameter \u2014 markers need to propagate across the longest path in the network.",
      topic: "L6",
    },
    {
      id: "w2-q69",
      question: "Which of the following is NOT a standard property of distributed mutual exclusion?",
      options: [
        "Safety",
        "Liveness",
        "Fairness",
        "Physical clock synchronization",
      ],
      correctIndex: 3,
      explanation: "The three required properties are safety, liveness, and fairness \u2014 physical clock synchronization is a separate concern (covered under NTP), not a mutual-exclusion requirement.",
      topic: "L7",
    },
    {
      id: "w2-q70",
      question: "Safety in mutual exclusion means:",
      options: [
        "Every process eventually enters the CS",
        "At most one process is in the critical section at a time",
        "Every process enters the CS equally often",
        "No messages are exchanged",
      ],
      correctIndex: 1,
      explanation: "Safety is the core guarantee: only one process executes the critical section at any instant.",
      topic: "L7",
    },
    {
      id: "w2-q71",
      question: "Liveness means:",
      options: [
        "No two processes enter CS simultaneously",
        "A requesting process should eventually be allowed to enter CS",
        "Requests must be ordered physically",
        "Processes never fail",
      ],
      correctIndex: 1,
      explanation: "Liveness rules out deadlock and starvation \u2014 every requesting process must eventually get its turn in the CS.",
      topic: "L7",
    },
    {
      id: "w2-q72",
      question: "Which metric measures the number of messages exchanged for one critical-section entry?",
      options: [
        "Response time",
        "Synchronization delay",
        "Message complexity",
        "Throughput",
      ],
      correctIndex: 2,
      explanation: "Message complexity is defined exactly as the number of messages required per CS execution.",
      topic: "L7",
    },
    {
      id: "w2-q73",
      question: "Lamport's mutual exclusion algorithm primarily uses:",
      options: [
        "Logical timestamps",
        "Physical GPS clocks",
        "Tokens",
        "Quorums only",
      ],
      correctIndex: 0,
      explanation: "Lamport's algorithm orders REQUESTs using logical (Lamport) timestamps combined with FIFO channels and per-site request queues.",
      topic: "L7",
    },
    {
      id: "w2-q74",
      question: "In Lamport's mutual exclusion algorithm, a process requesting the critical section sends a:",
      options: [
        "RELEASE request only",
        "REQUEST message to other processes",
        "TOKEN",
        "MARKER",
      ],
      correctIndex: 1,
      explanation: "A process broadcasts a timestamped REQUEST message to every other process to ask for the CS.",
      topic: "L7",
    },
    {
      id: "w2-q75",
      question: "Lamport's algorithm orders requests using:",
      options: [
        "Physical time only",
        "Logical timestamps",
        "Random numbers",
        "Network delay",
      ],
      correctIndex: 1,
      explanation: "Requests are ordered in each site's queue by logical (Lamport) timestamp, with process id as a tiebreaker.",
      topic: "L7",
    },
    {
      id: "w2-q76",
      question: "The basic Lamport mutual exclusion algorithm requires approximately:",
      options: [
        "N \u2212 1 messages",
        "2(N \u2212 1) messages",
        "3(N \u2212 1) messages",
        "N\u00b2 messages",
      ],
      correctIndex: 2,
      explanation: "REQUEST, REPLY, and RELEASE are each broadcast to N\u22121 other sites, giving 3(N\u22121) messages per CS execution in the basic version.",
      topic: "L7",
    },
    {
      id: "w2-q77",
      question: "Ricart-Agrawala improves on Lamport's algorithm primarily by:",
      options: [
        "Eliminating logical timestamps",
        "Eliminating explicit RELEASE messages",
        "Using a token",
        "Using physical clocks",
      ],
      correctIndex: 1,
      explanation: "Ricart-Agrawala drops the separate RELEASE message entirely \u2014 deferred REPLYs sent on CS exit do that job instead.",
      topic: "L7",
    },
    {
      id: "w2-q78",
      question: "Ricart-Agrawala requires approximately how many messages per critical-section entry?",
      options: [
        "N \u2212 1",
        "2(N \u2212 1)",
        "3(N \u2212 1)",
        "N\u00b2",
      ],
      correctIndex: 1,
      explanation: "(N\u22121) REQUEST + (N\u22121) REPLY = 2(N\u22121) messages, cheaper than Lamport's basic 3(N\u22121).",
      topic: "L7",
    },
    {
      id: "w2-q79",
      question: "In Ricart-Agrawala, a process requesting the critical section sends:",
      options: [
        "REQUEST messages to all other processes",
        "TOKEN messages to all processes",
        "MARKER messages",
        "RELEASE messages only",
      ],
      correctIndex: 0,
      explanation: "A timestamped REQUEST is broadcast to every other process, just as in Lamport's algorithm.",
      topic: "L7",
    },
    {
      id: "w2-q80",
      question: "A process delays a reply to another process's request when:",
      options: [
        "Its own request has higher priority according to the timestamp ordering",
        "The network is FIFO",
        "Its physical clock is slower",
        "It has no incoming channels",
      ],
      correctIndex: 0,
      explanation: "A process defers its REPLY exactly when it is itself requesting/executing the CS and its own request has a smaller (higher-priority) timestamp than the incoming one.",
      topic: "L7",
    },
    {
      id: "w2-q81",
      question: "A quorum is a set of processes such that:",
      options: [
        "All quorums are disjoint",
        "Any two quorums intersect",
        "Every quorum contains all processes",
        "Quorums contain exactly two processes",
      ],
      correctIndex: 1,
      explanation: "The defining requirement of a quorum system is that Ri \u2229 Rj \u2260 \u2205 for every pair of quorums \u2014 this is what mediates conflicts.",
      topic: "L8",
    },
    {
      id: "w2-q82",
      question: "The intersection property of quorums is important because:",
      options: [
        "It guarantees physical synchronization",
        "It ensures competing critical-section requests cannot be completely independent",
        "It reduces clock drift",
        "It eliminates failures",
      ],
      correctIndex: 1,
      explanation: "Because any two quorums share a common site, that common site can mediate and prevent two competing requests from both being granted at once.",
      topic: "L8",
    },
    {
      id: "w2-q83",
      question: "A coterie is characterized by:",
      options: [
        "Disjoint sets",
        "Intersection and minimality properties",
        "FIFO channels only",
        "Physical clock synchronization",
      ],
      correctIndex: 1,
      explanation: "A coterie is a set of quorums satisfying the intersection property (correctness) and the minimality property (efficiency \u2014 no quorum is a superset of another).",
      topic: "L8",
    },
    {
      id: "w2-q84",
      question: "Maekawa's algorithm reduces message complexity by:",
      options: [
        "Contacting only a subset/quorum of processes",
        "Eliminating requests",
        "Using physical clocks",
        "Using a centralized coordinator",
      ],
      correctIndex: 0,
      explanation: "Instead of contacting all N\u22121 other processes, a site only asks its quorum of size K \u2248 \u221aN, cutting message overhead.",
      topic: "L8",
    },
    {
      id: "w2-q85",
      question: "If the quorum size is K, the approximate message complexity of Maekawa's algorithm is:",
      options: [
        "O(N)",
        "O(K)",
        "O(N\u00b2)",
        "O(K\u00b2N)",
      ],
      correctIndex: 1,
      explanation: "REQUEST + REPLY + RELEASE each cost K messages, giving 3K total \u2014 O(K) complexity.",
      topic: "L8",
    },
    {
      id: "w2-q86",
      question: "For Maekawa's algorithm, the quorum size is approximately:",
      options: [
        "N",
        "N/2",
        "\u221aN",
        "log N",
      ],
      correctIndex: 2,
      explanation: "From the projective-plane construction N = K(K\u22121)+1, the quorum size K works out to approximately \u221aN.",
      topic: "L8",
    },
    {
      id: "w2-q87",
      question: "The projective-plane construction gives the relationship:",
      options: [
        "N = K\u00b2",
        "N = K(K \u2212 1) + 1",
        "N = 2K + 1",
        "N = 2K\u00b2",
      ],
      correctIndex: 1,
      explanation: "This is exactly the formula stated for Maekawa's quorum construction: N = K(K\u22121) + 1.",
      topic: "L8",
    },
    {
      id: "w2-q88",
      question: "If N = 21 in a projective-plane-based Maekawa construction, K is:",
      options: [
        "4",
        "5",
        "6",
        "7",
      ],
      correctIndex: 1,
      explanation: "Solving K(K\u22121)+1 = 21 gives K(K\u22121) = 20, satisfied by K = 5 (5\u00d74 = 20).",
      topic: "L8",
    },
    {
      id: "w2-q89",
      question: "A major problem that can occur in Maekawa's algorithm is:",
      options: [
        "Clock drift",
        "Deadlock",
        "Infinite storage",
        "Packet encryption failure",
      ],
      correctIndex: 1,
      explanation: "Because requests aren't timestamp-prioritized in the basic protocol, three sites' overlapping request sets can form a circular wait \u2014 deadlock.",
      topic: "L8",
    },
    {
      id: "w2-q90",
      question: "In Maekawa's deadlock-handling mechanism, FAILED indicates:",
      options: [
        "A process has permanently crashed",
        "A request cannot currently obtain permission",
        "A channel has become FIFO",
        "A marker has failed",
      ],
      correctIndex: 1,
      explanation: "FAILED tells a requester that permission is currently held by a higher-priority request and cannot be granted right now.",
      topic: "L8",
    },
    {
      id: "w2-q91",
      question: "An INQUIRE message is associated with:",
      options: [
        "Asking a process to reconsider/return a previously granted permission",
        "Synchronizing physical clocks",
        "Starting a snapshot",
        "Creating a new quorum",
      ],
      correctIndex: 0,
      explanation: "INQUIRE asks the current permission holder whether it has collected all the permissions it needs, as a step toward possibly reclaiming its permission for a higher-priority request.",
      topic: "L8",
    },
    {
      id: "w2-q92",
      question: "A YIELD message is used when a process:",
      options: [
        "Gives up a permission it had obtained",
        "Creates a new process",
        "Changes its physical clock",
        "Starts NTP",
      ],
      correctIndex: 0,
      explanation: "YIELD is sent by a permission holder that gives back its permission so a higher-priority waiting request can proceed, breaking the deadlock cycle.",
      topic: "L8",
    },
    {
      id: "w2-q93",
      question: "Agarwal-El Abbadi's quorum approach is based on:",
      options: [
        "A ring",
        "A tree",
        "A complete graph",
        "A token ring",
      ],
      correctIndex: 1,
      explanation: "Sites are logically organized as a complete binary tree, and quorums correspond to root-to-leaf paths.",
      topic: "L8",
    },
    {
      id: "w2-q94",
      question: "In a tree-quorum system, a quorum can be represented by:",
      options: [
        "A root-to-leaf path",
        "Any single node",
        "Two unrelated leaves",
        "Only the root",
      ],
      correctIndex: 0,
      explanation: "A root-to-leaf path through the tree forms a valid quorum in the Agarwal-El Abbadi scheme.",
      topic: "L8",
    },
    {
      id: "w2-q95",
      question: "The number of nodes in a complete binary tree of height k (using the convention in the lecture) is:",
      options: [
        "2k + 1",
        "2\u1d4f",
        "2^(k+1) \u2212 1",
        "k\u00b2 \u2212 1",
      ],
      correctIndex: 2,
      explanation: "For a tree of height k: N = 2^(k+1) \u2212 1, matching the standard complete-binary-tree node count.",
      topic: "L8",
    },
    {
      id: "w2-q96",
      question: "Tree-quorum systems are particularly interesting because they can provide:",
      options: [
        "Graceful degradation under failures",
        "Zero communication",
        "Perfect physical synchronization",
        "No need for mutual exclusion",
      ],
      correctIndex: 0,
      explanation: "As long as failures stay below roughly log N, the GetQuorum construction can still form a valid quorum by substituting failed nodes with paths through their children \u2014 graceful degradation.",
      topic: "L8",
    },
    {
      id: "w2-q97",
      question: "The quorum path length in the tree-based approach is approximately:",
      options: [
        "O(1)",
        "O(log N)",
        "O(N)",
        "O(N\u00b2)",
      ],
      correctIndex: 1,
      explanation: "A root-to-leaf path in a complete binary tree of N nodes has length k+1 = O(log N).",
      topic: "L8",
    },
    {
      id: "w2-q98",
      question: "Which pairing is INCORRECT?",
      options: [
        "Vector clock \u2192 causal ordering",
        "NTP \u2192 physical clock synchronization",
        "Chandy-Lamport \u2192 global snapshot",
        "Ricart-Agrawala \u2192 token-based mutual exclusion",
      ],
      correctIndex: 3,
      explanation: "Ricart-Agrawala is a non-token-based algorithm (REQUEST/REPLY with deferred replies) \u2014 it does not use a circulating token, unlike Suzuki-Kasami or Raymond's algorithm.",
      topic: "L5",
    },
    {
      id: "w2-q99",
      question: "Which algorithm is optimistic and may require rollback?",
      options: [
        "Lamport mutual exclusion",
        "Chandy-Lamport",
        "Time Warp",
        "Maekawa",
      ],
      correctIndex: 2,
      explanation: "Time Warp is the optimistic scheme among these \u2014 it lets processes run ahead and rolls back only when a synchronization conflict is actually detected.",
      topic: "L5",
    },
    {
      id: "w2-q100",
      question: "Which of the following has the lowest asymptotic quorum size among the discussed quorum approaches?",
      options: [
        "Maekawa",
        "Agarwal-El Abbadi tree quorum",
        "Lamport",
        "Ricart-Agrawala",
      ],
      correctIndex: 1,
      explanation: "Agarwal-El Abbadi's tree quorum achieves O(log N) in the best case, which is asymptotically smaller than Maekawa's O(\u221aN) (Lamport and Ricart-Agrawala aren't quorum-based at all).",
      topic: "L8",
    },
    {
      id: "w2-q101",
      question: "Which statement is TRUE?",
      options: [
        "Consistent global state means all processes have identical states",
        "Consistent global state requires synchronized physical clocks",
        "A consistent cut cannot contain a receive event without its corresponding send event",
        "Chandy-Lamport requires a globally synchronized clock",
      ],
      correctIndex: 2,
      explanation: "Consistency is defined purely in terms of causal send/receive matching on the cut \u2014 it needs neither identical process states nor any physical clock synchronization, and Chandy-Lamport itself never assumes a global clock.",
      topic: "L6",
    },
    {
      id: "w2-q102",
      question: "Consider approximate message complexities: Lamport 3(N\u22121), Ricart-Agrawala 2(N\u22121), Maekawa 3K. If N = 100 and K \u2248 \u221aN, which algorithm has the lowest message complexity?",
      options: [
        "Lamport",
        "Ricart-Agrawala",
        "Maekawa",
        "All are equal",
      ],
      correctIndex: 2,
      explanation: "With N=100, Lamport gives 297, Ricart-Agrawala gives 198, and Maekawa gives roughly 3\u00d710 = 30 \u2014 far lower, since Maekawa only contacts a \u221aN-sized quorum instead of all N\u22121 sites.",
      topic: "L7",
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