---
name: kubectl
description: Reference for running kubectl commands. Use whenever kubectl is mentioned or the user asks to run a kubectl command, check pods, get resources, or interact with a Kubernetes cluster directly via CLI.
---

# kubectl

`KUBECONFIG` is set in the environment — kubectl will pick up the config automatically.

## Available Contexts

- `romulus` — identity, storage, DevOps, home services
- `pantheon` — GPU/AI workloads, CI/CD, media

## Context Flag Placement

Always place `--context` **after** the subcommand and resource, not after `kubectl`:

```
# correct
kubectl get pods --context=romulus
kubectl logs my-pod --context=pantheon

# wrong
kubectl --context=romulus get pods
```
