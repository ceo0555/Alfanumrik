## Adaptive Model Options

### 1. Attention-based Knowledge Tracing (AKT)
- **Summary**: Transformer encoder that models question sequences with positional encodings and attention over past attempts.
- **Strengths**: Captures long-term dependencies; handles irregular spacing between events.
- **Data requirements**:
  - Question/skill IDs per attempt
  - Timestamps to compute positional encodings
  - Binary or graded outcomes
- **Operational notes**:
  - Works well with ~100k+ interaction events.
  - Benefits from curriculum tags (difficulty, skill hierarchies).

### 2. Graph-based Interactive KT (GIKT)
- **Summary**: Uses question-skill bipartite graphs to propagate mastery signals; combines GNN with sequence modeling.
- **Strengths**: Incorporates relationships between items and skills; robust when multiple skills per item.
- **Data requirements**:
  - Mapping from questions to skill nodes.
  - Interaction sequences (question, outcome, timestamp).
  - Optional edge weights for difficulty.
- **Operational notes**:
  - Requires graph preprocessing; model updates when curriculum changes.
  - Ideal when curriculum alignment (question → skill) is strong.

### 3. Transformer KT (SAKT/SAINT variants)
- **Summary**: Sequence-to-sequence transformer that predicts next response; some variants use decoder-only architectures.
- **Strengths**: State of the art on many benchmarks; handles large vocabularies and multi-skill tagging.
- **Data requirements**:
  - Large-scale interaction logs (millions of events).
  - Feature-rich embeddings (question text, difficulty, metadata).
  - Consistent timestamping for positional encodings.
- **Operational notes**:
  - Compute-intensive; may require GPU training.
  - Needs regular retraining to avoid concept drift.

### 4. Classic DKT (LSTM-based)
- **Summary**: Original RNN approach; simpler to implement but weaker at representational power.
- **Strengths**: Lightweight, fast to train.
- **Data requirements**:
  - Question/skill IDs per attempt.
  - Binary outcomes.
- **Operational notes**:
  - Serves as a baseline or cold-start model.
  - Less capable of modeling long sequences or multi-skill items.

### Recommendation
1. **Short term**: Use AKT as a strong, tractable upgrade once sufficient interaction logs are collected.  
2. **Medium term**: Transition to GIKT or SAINT when curriculum graph metadata is stable and datasets are large enough.  
3. **Long term**: Experiment with meta-learning or reinforcement-learning approaches to optimize lesson selection based on mastery and engagement signals.

Regardless of the model, instrument the platform to capture:
- `interaction_events` (already in place).
- Content metadata (skills, difficulty, prerequisites).
- Engagement metrics (time-on-task, hint usage).
- Outcome labels (correctness, mastery judgments, teacher overrides).

This data foundation is essential for training, validating, and iterating on any advanced adaptive algorithm.
