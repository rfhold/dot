---
description: Execute a plan in sequential phases using spawned tasks
---

For each phase, spawn a general task with detailed, specific instructions. Analyze dependencies between phases to determine execution order — phases that are independent of each other can be run in parallel, but phases that depend on the output or side effects of earlier phases must wait until their dependencies are complete.
