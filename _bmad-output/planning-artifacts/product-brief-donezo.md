---
title: "Product Brief: Donezo"
status: "complete"
created: "2026-04-01"
updated: "2026-04-01"
inputs:
  - "_bmad-output/planning-artifacts/prd-donezo.md"
  - "_bmad-output/planning-artifacts/initial_prd-validation-report.md"
  - "initial_docs/initial_prd.md"
---

# Product Brief: Donezo

## Executive Summary

Research shows users in stripped-down task environments complete 84% of their tasks. The same users in feature-rich environments complete 49%. The personal productivity software market has built a paradox: more tools, lower completion rates. Todoist, TickTick, Notion, and their competitors have spent the last decade racing to add features — AI scheduling, natural language parsing, habit trackers, integrations, priority matrices — until the apps designed to help people get things done became the things getting in the way of getting things done.

Donezo is a corrective. A web-based personal task manager that does exactly four things — create a task, see your tasks, mark one done, delete one — and does them with zero friction, zero sign-up, and zero setup. Open the browser, start adding tasks. Close the browser, come back tomorrow, they're still there. That's the entire product.

This isn't a feature gap waiting to be filled. It's a deliberate positioning in a market moving toward minimalism, at a moment when users are canceling subscriptions and pruning apps, and when "just let me write down what I need to do" is the most common complaint about the tools that were built to solve exactly that problem.

---

## The Problem

Task management tools have become productivity theater. The average user of a modern todo app spends more time organizing their tasks — creating projects, assigning priorities, picking due dates, setting up views — than completing them. Studies suggest users in stripped-down task environments complete 84% of their tasks; the same users in feature-rich environments complete 49%.

The root causes are well-documented and recurring in user reviews of every major competitor:

- **Onboarding friction.** Apps that require account creation, project setup, or tutorial completion before capturing a first task lose users at the door. The moment that should be "I have something I need to do" becomes "I have to configure a system first."
- **Decision fatigue.** When an app offers five ways to organize a task, users spend cognitive energy on the organization instead of the work. Optionality is a cost, not a feature.
- **Subscription pressure.** Simple utilities are being monetized as services. Users increasingly refuse to pay monthly fees for tools that do one thing — and rightly so. Free, open-source tools that do less but do it reliably are winning back users who are done paying for complexity.
- **Complexity creep.** Features designed for power users pollute the interface for everyone else. The majority of users need a list that persists. They don't need a Pomodoro timer embedded in their task card.

No existing web-native tool owns the "open and start immediately, no account required" position for personal task management. That space is available.

---

## The Solution

Donezo is a single-page web application with four user-facing capabilities:

1. **Add a task** — type a description, press Enter or click a button, it appears in your list
2. **View your tasks** — your full list is visible the moment you open the app
3. **Complete a task** — click to mark done; visual styling distinguishes completed from active
4. **Delete a task** — remove tasks you no longer need; empty state handles the end gracefully

Tasks include a description, completion status, and creation timestamp. They are stored locally in the browser (localStorage) — no server, no account, no sync. Close and reopen the same browser and your tasks are waiting. The interface handles loading, empty, and error states without silent failures or broken experiences. It works on any modern desktop or mobile browser.

Nothing else. Intentionally.

---

## What Makes This Different

**Zero onboarding.** No account, no email, no setup wizard, no tutorial. The app is the interface. This is not a limitation — it is the product. Every todo app eventually adds authentication; Donezo starts without it as a deliberate choice, not a roadmap gap.

**Opinionated minimalism.** The feature set is constrained by design. Users cannot add due dates, priorities, or tags. This isn't a missing feature — it's a guarantee that the app will never become a procrastination tool. Four actions, done well.

**Web-native with no install.** Any browser, any device, any OS. No download, no app store approval required, no update prompts. The browser is the runtime.

**Built for growth.** Despite its minimal surface, Donezo's architecture is identity-agnostic at its core — task storage and retrieval are designed so that authentication and multi-user collaboration can be layered in without redesigning the foundation. Minimal now; expandable by design.

**Timing.** A documented "productivity backlash" is underway in 2025. Users are pruning home screens, canceling subscriptions, and choosing tools that solve one problem decisively. AI-powered feature arms races among incumbents are pushing complexity upward, widening the gap for a deliberately simple alternative. The market is primed.

---

## Who This Serves

**Primary:** Individuals who need to capture and track personal tasks without committing to a system. This is the person who has tried Todoist, abandoned it after the free trial, and gone back to a Notes app or a sticky note. They are not productivity enthusiasts — they are people with things to do who want the lowest-friction path to not forgetting them.

**Secondary:** Developers, designers, and technical users. Donezo is free and open-source — the codebase is a clean, production-quality full-stack reference implementation. Engineers who use the product also have access to the code, which drives word-of-mouth in the technical community and creates a contribution funnel for future development.

**Not served (v1):** Teams, collaborators, users with complex task hierarchies, project managers, or anyone who needs reminders, deadlines, or integrations. Those users have good options. Donezo is not competing for them — and that's a feature of the product strategy, not a gap in it.

---

## Success Criteria

**User experience:**
- A new user completes all four core actions (add, view, complete, delete) without documentation or guidance on first session
- Tasks persist correctly across browser refreshes and new sessions
- All UI state transitions (add, complete, delete) reflect within 300ms for the 95th percentile
- Application renders correctly on desktop (1024px+) and mobile (375px+)

**Product:**
- Zero required onboarding steps before first task is captured
- Empty, loading, and error states present and handled gracefully across all operations
- WCAG 2.1 AA accessibility baseline met (keyboard navigable; 4.5:1 contrast minimum)

**Growth signal (post-launch):**
- Repeat visits without prompting (users returning on their own)
- Session-to-task ratio (users who open the app create at least one task)
- Word-of-mouth sharing (direct traffic as a percentage of total)

---

## Scope

**Version 1 — shipping now:**
Create, view, complete, delete, persist. Responsive. Polished edge states. No account required. Browser support: latest 2 versions of Chrome, Firefox, Safari, and Edge on desktop and mobile.

**Explicitly out of scope for v1:**
User accounts, authentication, multi-user collaboration, task prioritization, due dates and deadlines, push or email notifications, task categories and tags, sorting and filtering, integrations.

These are not rejected — they are sequenced. The v1 architecture supports adding authentication and collaboration without redesigning the core.

---

## Roadmap Thinking

Donezo is free and open-source. There is no monetization target — the product succeeds by being useful, trusted, and community-maintained.

If v1 gains traction — measured by repeat usage, GitHub stars, and word-of-mouth — the natural expansion path follows user demand:

- **v2:** Optional account creation; tasks sync across devices; existing local tasks can be claimed into an account
- **v3:** Shared lists; household or small-team collaboration; still deliberate about feature scope
- **Community:** Public repository invites contributions, forks, and adaptations; the open-source model turns users into collaborators

The deliberate minimalism of v1 is the wedge. The open-source model is the distribution engine. The trust built through a tool that does exactly what it says and nothing else is the foundation everything else is built on.
