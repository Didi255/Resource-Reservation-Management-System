# Decisions

## D1: Commit AI.md to the repo, under docs/
- **Date:** 2026-10-12
- **Options considered:** commit at root / gitignore / commit under docs/
- **Chosen:** commit under docs
- **Why:** The brief allows AI tools, and the file documents how I learned and decided things, so publishing it is honest and backed up
- **Trade-off accepted:** publishing it means reviewers see my gaps and teaching rules.

## D2: Feature branches with PRs for code; docs-only changes go straight to `main`
- **Date:** 2026-10-12
- **Options considered:** one long-lived `dev` branch / feature branches with PRs into `main` / `dev` plus feature branches
- **Chosen:** feature branches with PRs into `main` for code. Docs-only changes are committed directly to `main`.
- **Why:** Each PR is a reviewable unit and `main` always works. Reviewers can browse the merged PRs as a story, and the PR descriptions double as a decision log. A staging `dev` branch adds a layer of merging that a solo project doesn't need. Documentation changes are low-risk, so a branch and PR for them is ceremony without benefit.
- **Trade-off accepted:** a few extra commands per feature, and docs commits reach `main` without a separate review step. Acceptable on a solo project.
