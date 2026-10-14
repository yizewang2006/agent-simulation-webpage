# Activation Algorithm Difference Report

## Executive conclusion

The web Activation runtime is connected and executes on every simulation frame. Always Active, Binary, Linear, positive-weight filtering, per-group normalization, weighted heading, and weighted speed are implemented and callable.

However, the web runtime is **not algorithmically identical** to the Java reference. Therefore, the statement “Activation is not working” is too broad, but the narrower statement “the web result does not always match the Java result” is correct.

The two differences most likely to produce visibly different simulations are:

1. Java reduces Neighbor Activation to one entity; the web version can average multiple qualifying entities.
2. When a Neighbor Action has no target, Java falls back to the agent's own value; the web version removes that Behavior from the active group.

## Code compared

### Web runtime

- `agent-simulation-react/src/models/activation.js`
- `agent-simulation-react/src/models/behavior.js`
- `agent-simulation-react/src/models/agent.js`
- `agent-simulation-react/src/utils/behaviorGroups.js`
- `agent-simulation-react/src/pages/Simulation3rdGen.jsx`

### Java reference

- `_drlecode_simulation_framework/Activation/Activation.java`
- `_drlecode_simulation_framework/activation_function/Activation_function_binary.java`
- `_drlecode_simulation_framework/activation_function/Activation_function_linear.java`
- `_drlecode_simulation_framework/Activation_getCheckingValue/NeighborChecking_Value.java`
- `_drlecode_simulation_framework/Utility/myUtility.java`
- `_drlecode_simulation_framework/core/Model.java`

## Web execution path

The current web runtime follows this path for each frame and Agent:

```text
Simulation3rdGen animation loop
→ Agent.behave()
→ getActivationInputValue()
→ calculateActivationWeight()
→ reject invalid/non-positive weight
→ calculate and validate Action value
→ build active Behavior Groups
→ normalize weights inside each group
→ weighted circular mean for Heading
→ weighted arithmetic sum for Speed
→ update dx and dy
```

Evidence:

- The animation loop calls `agent.behave(...)`: `Simulation3rdGen.jsx:1531-1537`.
- Activation input and raw weight are calculated: `agent.js:188-202`.
- Valid Behaviors are grouped and normalized: `agent.js:204-235`.
- Heading and Speed consume normalized weights: `agent.js:240-305`.

This proves that Activation is not merely saved by the form; it is part of the runtime calculation.

## Formula parity

| Function | Java | Web | Result |
|---|---|---|---|
| Always Active | Return configured weight | Return configured weight | Equivalent |
| Binary Inside | Inclusive `lower ≤ value ≤ upper` | Same | Equivalent |
| Binary Outside | Complement of inclusive range | Same | Equivalent |
| Linear Increase | Zero below lower, linear inside, capped above upper | Same | Equivalent |
| Linear Decrease | Capped below lower, linear inside, zero above upper | Same | Equivalent |
| Group normalization | `weight / sum(weights)` | Same | Equivalent when the same Behaviors enter the group |
| Heading combination | Weighted circular mean | Same mathematical method | Different precision and post-processing |
| Speed combination | Weighted arithmetic mean | Same mathematical method | Equivalent when the same Behaviors enter the group |

## Algorithm differences

### D1 — Neighbor Activation entity aggregation

**Java**

`NeighborChecking_Value.java:36-105` filters entities and produces exactly one `chosen_entity`. If multiple entities remain, it applies `Filter_method(1, 1)`, which selects the nearest entity by distance.

**Web**

`behavior.js:500-550` keeps every entity that survives the Activation filters, extracts each value, and passes all values to `calculateAverageActivationValue()`.

**Effect**

With two qualifying neighbors whose speeds are `1` and `3`:

- Java checks the speed of one selected entity.
- Web checks the average speed, `2`.

A Binary or Linear range can consequently produce a different weight even though both systems are executing correctly.

**Severity:** High.

### D2 — No target for a Neighbor Action

**Java**

When `NeighborReference` returns `NaN`, `Model.java:683-710` replaces it with the Agent's current Heading or Speed plus the Action offset. The Behavior can still participate in the final group.

**Web**

When `calculateBehaviorValue()` returns `null`, `agent.js:204-214` skips the Behavior before normalization.

**Effect**

For an active Neighbor Action with no qualifying Action entity:

- Java: use `self + offset`.
- Web: Behavior is inactive for that frame.

This is especially important for `nullActivation`: a positive fallback weight does not make a Neighbor Action run if that Action itself has no target in the web version.

**Severity:** High.

### D3 — Meaning of Heading Difference

**Java**

`myUtility.java:320-362` calculates the smallest absolute heading difference in the range `0..180`.

**Web**

`behavior.js:238-242` calculates a directed difference:

```js
(neighborHeading - selfHeading + 360) % 360
```

The output range is `0..360`.

**Example**

```text
Self heading = 10°
Neighbor heading = 350°

Java = 20°
Web  = 340°
```

The same Activation range can therefore pass in one implementation and fail in the other.

**Severity:** High.

### D4 — Meaning of Relative Bearing

**Java**

The Java checking-value code eventually applies `Math.abs(...)` and returns a magnitude, generally `0..180` (`myUtility.java:365-591`).

**Web**

`behavior.js:293-300` keeps direction and returns `0..360`.

**Effect**

The web implementation distinguishes left from right; the Java implementation generally does not. This may be a useful web capability, but it is not parity.

**Severity:** High when the test uses Relative Bearing.

### D5 — Action and Activation filters

**Java**

When both Activation and Action use Neighbor Reference, the generated Behavior shares one filter-chain object (`Behavior.java:180-192`). This is intended to keep both components on the same entity.

**Web**

The web data model stores separate arrays:

```text
behavior.filters
behavior.activation.filters
```

The two components can inspect different entity sets.

**Effect**

The Activation condition may be caused by entity A while the Action value comes from entity B.

**Severity:** Medium to high. This is a deliberate product capability only if independent filters are part of the agreed specification.

### D6 — Null Activation weight

**Java**

For a missing Neighbor value with `null_activation == true`, Java returns `activation_function.weight` (`Activation.java:434-447`).

**Web**

The web version returns a separately configured `fallbackWeight` (`activation.js:116-125`).

**Effect**

The web can use a no-entity weight different from the normal Binary weight. This is more explicit, but it differs from Java.

**Severity:** Medium.

### D7 — Supported Activation sources and properties

**Java supports**

- Always Active
- Self property
- Neighbor property
- Space property
- Numeric and category criteria
- Goals added as global entities

**Web currently supports**

- Always Active
- Self property
- Neighbor property
- Numeric measurements exposed by the UI
- Agents and obstacles in the current runtime entity array

The web version does not currently reproduce Java's Space Activation, category/zone/unreserved criteria, or global Goal path.

**Severity:** High if those Java features are part of the acceptance test; otherwise out of current scope.

### D8 — Behavior eligibility before normalization

**Java**

Java calculates Action values even when an Activation weight is zero, stores zero-weight results, and normalizes later.

**Web**

The web removes non-positive/invalid weights first, then also removes Behaviors without a valid Neighbor Action before normalization (`agent.js:202-214`).

**Effect**

For ordinary positive finite weights, removing zero-weight entries is mathematically neutral. Removing missing-Action entries is not neutral because Java has a self fallback (D2).

**Severity:** Medium; primarily a consequence of D2.

### D9 — Heading precision and motion constraints

**Java**

- Converts the final circular mean to an integer degree (`Model.java:2354-2360`).
- Applies a maximum-turn constraint afterward (`Model.java:1091-1099`).

**Web**

- Keeps floating-point radians.
- Smooths toward the weighted target.
- Then applies a maximum-turn cap (`agent.js:261-269`).

**Effect**

Even with identical Activation weights, Agent trajectories will not be exactly identical frame by frame.

**Severity:** Medium for visual comparison; not an Activation formula failure.

## Problems in the Java reference implementation

The Java code should not be treated as a bug-free numerical oracle. The following defects are present in the checked-in reference:

### J1 — Heading weight sum truncates decimals

`Model.java:2307` declares:

```java
int sum_weight = 0;
```

but Behavior weights are `double`. Compound assignment truncates fractional values on every addition.

Example:

```text
Weights 0.25 and 0.75
Java int sum_weight remains 0 → heading stays unchanged
Web double totalWeight = 1.0 → normalized weights are 0.25 and 0.75
```

This is a Java defect; the web implementation is numerically correct here.

### J2 — Incorrect NaN comparisons

`Activation.java:413` and `Activation.java:473` use:

```java
checking_value == Double.NaN
```

That expression is always false. Correct Java code must use `Double.isNaN(checking_value)`.

The web version explicitly checks `null`, `undefined`, and finite numbers.

### J3 — Filter pass state is not reset per entity

`myUtility.java:86` initializes `pass_filter` before the entity loop. Once one entity fails, later entities can inherit the false state because it is not reset at the start of each entity iteration.

The web implementation evaluates every entity independently.

### J4 — Loss of heading precision

The Java circular mean is cast to `int`, discarding fractional degrees. The web version preserves floating-point precision.

## Reproducible comparison cases

| Test | Java expected | Web expected | Interpretation |
|---|---|---|---|
| Always Active, weight `3` | Raw weight `3` | Raw weight `3` | Parity |
| Binary `[10,20]`, inside, value `15`, weight `4` | `4` | `4` | Parity |
| Linear increase `[10,20]`, slope `2`, value `15` | `10` | `10` | Parity |
| Two active weights `2` and `6` | `0.25`, `0.75` unless Java truncation affects Heading | `0.25`, `0.75` | Formula parity; Java implementation defect for fractional Heading sums |
| Two qualifying neighbors, no final Method filter | One nearest entity | Average of both values | Intentional/accidental algorithm difference |
| Neighbor Action has no target | Self value + offset | Behavior excluded | Major semantic difference |
| Heading Difference: self `10°`, neighbor `350°` | `20°` | `340°` | Major measurement difference |
| Null Activation with distinct fallback weight | Normal AF weight | Explicit fallback weight | Product extension, not parity |

## Verification performed

The following web calculations were executed directly:

```text
Always Active weight 3                    → 3
Binary inside [10,20], value 15, weight 4 → 4
Binary outside [10,20], value 25          → 0
Linear increase, slope 2, value 15        → 10
Linear increase capped at value 30        → 20
Null fallback weight 7                    → 7
Normalize raw weights 2 and 6             → 0.25 and 0.75
```

The production Vite build also completes successfully. These checks establish that the implemented AF formulas execute correctly; they do not claim Java parity for the entity-selection and fallback rules described above.

## Recommended decision

Before changing code, agree on these four rules:

1. Does Neighbor Activation use one selected entity or an average of all qualifying entities?
2. When a Neighbor Action has no target, should it fall back to `self + offset` or become inactive?
3. Are Heading Difference and Relative Bearing absolute `0..180` values or directed `0..360` values?
4. Must Action and Activation share the same filter chain, or may they use independent filters?

If strict Java parity is required, change D1-D5 first while retaining the web fixes for J1-J4. Do not copy the Java defects into the web runtime.

## Final assessment

```text
“Activation is completely disconnected or nonfunctional” → Not supported by the code or tests.

“The web Activation can produce different results from the Java algorithm” → Correct.
```

The next step is specification alignment, not a blind rewrite of the Activation formulas.
