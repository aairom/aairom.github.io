# Chatbot Implementation — Technical Documentation

> **File:** `chatbot.js`  
> **Deployed on:** [aairom.github.io](https://aairom.github.io)  
> **License:** MIT  
> **Dependencies:** None — no backend, no API keys, no CDN libraries required

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Module Structure](#3-module-structure)
4. [Data Layer — `CHATBOT_CONFIG` and `KNOWLEDGE_BASE`](#4-data-layer)
5. [The Root Cause of Substring False Positives](#5-the-root-cause-of-substring-false-positives)
6. [Pattern Matching Engine — `_chatFindResponse()`](#6-pattern-matching-engine)
7. [Three-Tier Matching Strategy](#7-three-tier-matching-strategy)
8. [Word Boundary Deep-Dive](#8-word-boundary-deep-dive)
9. [Pattern Design Decisions and Special Cases](#9-pattern-design-decisions-and-special-cases)
10. [Step-by-Step Query Lifecycle](#10-step-by-step-query-lifecycle)
11. [Markdown Renderer — `_chatRenderMarkdown()`](#11-markdown-renderer)
12. [UI Layer — `buildChatbotUI()` IIFE](#12-ui-layer)
13. [Accessibility Implementation](#13-accessibility-implementation)
14. [CSS Architecture and Theme Integration](#14-css-architecture-and-theme-integration)
15. [Fallback System](#15-fallback-system)
16. [Quick-Reply Chips](#16-quick-reply-chips)
17. [How to Extend — Adding New Topics](#17-how-to-extend)
18. [Test Matrix](#18-test-matrix)

---

## 1. System Overview

`chatbot.js` is a fully self-contained, client-side FAQ chatbot designed for deployment on GitHub Pages static sites. It requires no server, no database, no API keys, and no build toolchain — a single `<script>` tag is the entire integration surface.

**Responsibilities:**

| Layer | Responsibility |
|---|---|
| **Data** | Holds `CHATBOT_CONFIG` (profile links) and `KNOWLEDGE_BASE` (topic entries) |
| **Engine** | `_chatFindResponse()` — matches user input against knowledge base patterns |
| **Renderer** | `_chatRenderMarkdown()` — converts lightweight markup to safe HTML |
| **UI** | `buildChatbotUI()` IIFE — injects DOM, CSS, and all event listeners at load time |

**Design principles:**

- **Zero dependencies.** No jQuery, no React, no external chat SDK. Everything is vanilla JavaScript.
- **Progressive enhancement.** The rest of the page works perfectly if the script fails to load.
- **Theme-aware.** All CSS values reference the site's existing CSS custom properties (`--clr-accent`, `--clr-bg`, etc.), so no separate theming is needed.
- **Accessibility-first.** ARIA roles, live regions, focus management, and keyboard navigation are built in.

---

## 2. Architecture Diagram

```
index.html
└── <script src="chatbot.js">
      │
      ├── CHATBOT_CONFIG          (profile metadata: URLs, name, company)
      ├── KNOWLEDGE_BASE[]        (array of { id, patterns[], response })
      ├── FALLBACK_RESPONSES[]    (3 round-robin fallback strings)
      ├── QUICK_REPLIES[]         (5 chip button definitions)
      │
      ├── _chatFindResponse()     ENGINE — pattern matching
      ├── _chatRenderMarkdown()   RENDERER — markup → HTML
      │
      └── buildChatbotUI() IIFE
            ├── Inject <style>    (scoped CSS with CSS var references)
            ├── Inject FAB        (#aam-chat-fab button)
            ├── Inject window     (#aam-chat-window dialog)
            ├── Render chips      (.aam-quick-btn × 5)
            └── Event listeners
                  ├── FAB click   → openChat() / closeChat()
                  ├── Close btn   → closeChat()
                  ├── Escape key  → closeChat()
                  └── Form submit → sendMessage()
                        ├── appendMessage(user)
                        ├── showTyping()          (550ms delay)
                        └── appendMessage(bot)    ← _chatFindResponse()
```

---

## 3. Module Structure

`chatbot.js` is organized into six top-level sections, each clearly delimited by a banner comment:

```
chatbot.js
├── § PROFILE CONFIG          Lines 15–26
├── § KNOWLEDGE BASE          Lines 28–127
├── § FALLBACK RESPONSES      Lines 129–136
├── § QUICK-REPLY CHIPS       Lines 138–147
├── § ENGINE                  Lines 149–182
└── § UI (IIFE)               Lines 184–475
```

The file deliberately uses the same IIFE-based organization as the site's existing [`main.js`](../main.js) to maintain code style consistency.

---

## 4. Data Layer

### 4.1 `CHATBOT_CONFIG`

A simple configuration object containing all profile-specific URLs and metadata. Its primary purpose is documentation and future extensibility — the current implementation references URLs directly in `KNOWLEDGE_BASE` response strings, but `CHATBOT_CONFIG` provides a single place to update them when profile links change.

```js
const CHATBOT_CONFIG = {
  ownerName:    'Alain Airom',
  ownerHandle:  'aairom',
  ownerCompany: 'IBM France',
  ownerCountry: 'France',
  githubUrl:    'https://github.com/aairom',
  linkedinUrl:  'https://fr.linkedin.com/in/aairom',
  credlyUrl:    'https://www.credly.com/users/alain-airom/badges/credly'
};
```

### 4.2 `KNOWLEDGE_BASE`

An ordered array of topic entries. Each entry has three fields:

```ts
interface KnowledgeEntry {
  id:       string;    // Unique identifier (for debugging, not used at runtime)
  patterns: string[];  // Keywords/phrases that trigger this entry
  response: string;    // Reply text (supports lightweight markdown)
}
```

**Example entry:**

```js
{
  id: 'skills',
  patterns: [
    'skills', 'skill', 'technology', 'tech stack', 'expertise',
    'speciality', 'specialization', 'what do you know',
    'tools', 'stack', 'languages', 'frameworks'
  ],
  response: `🛠️ **Alain's tech areas:**\n\n🤖 **AI & LLMs** — Docling, RAG, GraphRAG...`
}
```

**Order matters.** The engine iterates `KNOWLEDGE_BASE` sequentially and returns on the **first match**. Entries with higher false-positive risk (e.g., `greeting`) should be de-risked through pattern design rather than placement — see [Section 5](#5-the-root-cause-of-substring-false-positives).

**Current knowledge base topics (19 entries):**

| `id` | Primary triggers | Topic covered |
|---|---|---|
| `greeting` | hello, hey, bonjour, `^hi$` | Welcome message |
| `who` | who is alain, bio, background | Personal bio |
| `work` | work, job, ibm, role | Employment at IBM France |
| `skills` | skills, tech stack, frameworks | Full technology overview |
| `ai` | ai, llm, rag, ollama, watsonx | AI/ML focus area |
| `cloud` | cloud, kubernetes, openshift | Cloud infrastructure |
| `projects` | projects, repos, github | GitHub repositories |
| `blog` | blog, medium, article | Publishing platforms |
| `contact` | contact, reach, get in touch | How to connect |
| `linkedin` | linkedin, cv, resume | LinkedIn profile |
| `certifications` | certification, credly, badge | Professional credentials |
| `location` | where, france, based | Geographic location |
| `opensource` | open source, oss, contribute | Open-source activity |
| `python` | python, fastapi, streamlit | Python ecosystem |
| `docker` | docker, devops, ansible | DevOps and containers |
| `github_profile` | github profile, followers | GitHub stats |
| `help` | help, what can i ask | Topic menu |
| `thanks` | thanks, great, awesome | Positive acknowledgement |
| `bye` | bye, goodbye, see you | Sign-off |

---

## 5. The Root Cause of Substring False Positives

### 5.1 The Original Implementation

The initial engine used JavaScript's `String.prototype.includes()` for all pattern matching:

```js
// ORIGINAL (v1) — pure substring matching
function _chatFindResponse(userMessage) {
  const msg = userMessage.toLowerCase().trim();
  for (const entry of KNOWLEDGE_BASE) {
    if (entry.patterns.some(p => msg.includes(p))) {  // ← bare includes()
      return entry.response;
    }
  }
  // ...
}
```

This is the most naive possible implementation of keyword matching: it asks whether the pattern string appears *anywhere* inside the user's message string, as a contiguous sequence of characters — with no regard for word boundaries, position, or context.

### 5.2 The Bug: `'hi'` Matches `'his'` and `'him'`

With the `greeting` entry containing the pattern `'hi'`, the following queries produced entirely wrong responses:

| User input | Why it broke | Response served |
|---|---|---|
| `"What are his skills?"` | `"his"` contains the substring `"hi"` at index 9 | ❌ greeting |
| `"How to contact him?"` | `"him"` contains the substring `"hi"` at index 15 | ❌ greeting |
| `"Show me his background"` | `"his"` again contains `"hi"` | ❌ greeting |
| `"what is his tech stack"` | `"his"` again | ❌ greeting |
| `"highlight of his career"` | `"highlight"` starts with `"hi"` | ❌ greeting |
| `"this is great"` | `"this"` contains `"hi"` at index 1 | ❌ greeting |

The root cause was that `"hi"` is only **2 characters long** — common letter combinations that occur as substrings in hundreds of ordinary English words:

```
h-i-s       → "his"
h-i-m       → "him"
h-i-g-h     → "high", "highlight"
t-h-i-s     → "this"
t-h-i-n-k   → "think"
w-h-i-c-h   → "which"
```

Because `'greeting'` was the **first entry** in `KNOWLEDGE_BASE`, and because `includes()` had no word-boundary awareness, the greeting handler became a universal trap for any message containing those two letters in that order.

### 5.3 Why Simple Ordering Changes Don't Fix It

Moving `greeting` lower in the array would mask the symptom for a few specific cases but would not fix the underlying problem. Any entry containing a short, common pattern (`'hi'`, `'ai'`, `'lab'`, `'read'`, etc.) would exhibit the same false-positive behavior regardless of its position. The root issue is the matching algorithm, not the array order.

### 5.4 The Fix Requirement

The engine needed a matching strategy that:

1. Treats short words like `'hi'` as **whole words** (not substrings of longer words)
2. Still allows `'skill'` to match `'skills'` (i.e., respects natural pluralization)
3. Handles multi-word phrases like `'get in touch'` correctly (substring is fine here — false positives are near-impossible for multi-word sequences)
4. Supports a small set of patterns that need **exact match** semantics (like `'hi'`)

---

## 6. Pattern Matching Engine

### 6.1 Current Implementation

```js
// chatbot.js — lines 154–173
function _chatFindResponse(userMessage) {
  const msg = userMessage.toLowerCase().trim();          // (1) Normalize

  for (const entry of KNOWLEDGE_BASE) {                 // (2) Sequential scan
    if (entry.patterns.some(p => {                      // (3) Any-pattern test

      // Tier 1: Raw regex (patterns prefixed with ^)
      if (p.startsWith('^'))
        return new RegExp(p, 'i').test(msg);

      // Tier 2: Multi-word substring (patterns containing spaces)
      if (p.includes(' '))
        return msg.includes(p);

      // Tier 3: Single-word whole-boundary match
      return new RegExp(
        '\\b' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b',
        'i'
      ).test(msg);

    })) {
      return entry.response;                            // (4) First match wins
    }
  }

  // (5) Fallback — round-robin
  const reply = FALLBACK_RESPONSES[_fallbackIndex % FALLBACK_RESPONSES.length];
  _fallbackIndex++;
  return reply;
}
```

### 6.2 Step-by-Step Breakdown

**Step 1 — Normalize the input**

```js
const msg = userMessage.toLowerCase().trim();
```

- `toLowerCase()`: Ensures all matching is case-insensitive without requiring each pattern to have both cases. A user typing `"AI"`, `"Ai"`, or `"ai"` will all reach the same entry.
- `trim()`: Removes leading/trailing whitespace that browsers or mobile keyboards may insert.

**Step 2 — Sequential scan of `KNOWLEDGE_BASE`**

```js
for (const entry of KNOWLEDGE_BASE) { ... }
```

The array is traversed in declaration order. This is an `O(n × m)` scan where `n` is the number of entries (19) and `m` is the number of patterns per entry (average ~8). At this scale, performance is irrelevant — the entire loop completes in microseconds.

**Step 3 — Any-pattern test with `Array.prototype.some()`**

```js
if (entry.patterns.some(p => { ... }))
```

`some()` short-circuits on the first truthy return — if the first pattern matches, the remaining patterns in that entry are never tested. This is both an optimization and a correctness requirement: an entry matches if **any** of its patterns appear in the message.

**Step 4 — First match wins**

```js
return entry.response;
```

The function returns immediately when the first entry with a matching pattern is found. Only one response is ever returned. This means the ordering of `KNOWLEDGE_BASE` acts as an implicit priority system.

**Step 5 — Round-robin fallback**

```js
const reply = FALLBACK_RESPONSES[_fallbackIndex % FALLBACK_RESPONSES.length];
_fallbackIndex++;
return reply;
```

If the full scan completes without a match, a fallback is returned. The module-level `_fallbackIndex` counter cycles through the three fallback strings so consecutive unmatched inputs produce varied (not identical) responses.

---

## 7. Three-Tier Matching Strategy

The `some()` callback implements a priority-ordered, three-tier dispatch based on pattern syntax:

```
Pattern String
      │
      ▼
┌─────────────────────────────┐
│ Does p start with '^'?      │  YES → Tier 1: Raw Regex
│ e.g. '^hi$'                 │──────→ new RegExp(p, 'i').test(msg)
└─────────────────────────────┘
      │ NO
      ▼
┌─────────────────────────────┐
│ Does p contain a space?     │  YES → Tier 2: Substring
│ e.g. 'tech stack'           │──────→ msg.includes(p)
└─────────────────────────────┘
      │ NO
      ▼
┌─────────────────────────────┐
│ Single word                 │       Tier 3: Word-Boundary Regex
│ e.g. 'skills', 'contact'   │──────→ /\bskills\b/i.test(msg)
└─────────────────────────────┘
```

### Tier 1 — Raw Regex (`^`-prefixed patterns)

**Syntax:** Any pattern string that begins with the `^` character is treated as a verbatim regular expression and compiled directly with `new RegExp(p, 'i')`.

**Purpose:** Provides exact-match control for high-collision short words where neither substring nor word-boundary matching is sufficient.

**Current usage:**

```js
// In the 'greeting' entry:
'^hi$'   // Matches ONLY the string "hi" (with optional surrounding whitespace
          // already stripped by trim()), nothing else.
```

**Why `'^hi$'` instead of the word-boundary approach:**

The `\b` word boundary in JavaScript's regex engine is defined as a position between a `\w` character (`[a-zA-Z0-9_]`) and a `\W` character (anything else, including start/end of string). Testing `\bhi\b` against `"hi"` works correctly:

```
"hi"
 ↑↑
 \b at position 0 (start of string → 'h' = \w)
   \b at position 2 (end of string, 'i' = \w → end)
Result: \bhi\b matches ✅
```

But `\bhi\b` also works for `"his"` when you think about it:

```
"his"
 ↑↑
 \b before 'h': position 0, word boundary ✅
    \b after 'i': position 2... is there a boundary between 'i' and 's'?
    'i' = \w, 's' = \w → NO boundary ❌
```

In fact, `\bhi\b` would **not** match `"his"` — the double boundary approach is correct. The `^`-prefix mechanism was added as an explicit, readable escape hatch that makes the intent unmistakable in the pattern definition, and it also supports more complex regex patterns in the future (e.g., `'^(hi|hey)$'`).

**Regex escaping:** Note that Tier 1 patterns pass directly to `RegExp` without escaping — the pattern author is responsible for writing valid regex. This is intentional: Tier 1 is for power users who explicitly want regex control.

### Tier 2 — Multi-word Substring Match

**Syntax:** Any pattern string containing at least one space character.

**Purpose:** Multi-word phrases are virtually impossible to trigger accidentally in unrelated messages. The false-positive risk that necessitates word boundaries for single words does not apply here — a user's message containing the exact sequence `"get in touch"` is almost certainly asking about contact information.

```js
if (p.includes(' ')) return msg.includes(p);
```

**Examples:**

```
Pattern: 'tech stack'
Input:   "what is his tech stack"
Match:   true  ✅  (exact substring found)

Pattern: 'get in touch'
Input:   "how do I get in touch with him"
Match:   true  ✅

Pattern: 'tech stack'
Input:   "what technology does he use"
Match:   false ✅  (no false positive)
```

Tier 2 also handles hyphenated phrases and patterns with punctuation since `includes()` is a literal character comparison with no special-character interpretation.

### Tier 3 — Word-Boundary Regex (`\b...\b`)

**Syntax:** Any single-word pattern (no leading `^`, no spaces) is wrapped in `\b` anchors and compiled as a case-insensitive regex.

```js
return new RegExp(
  '\\b' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b',
  'i'
).test(msg);
```

**The escaping step:**

```js
p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
```

This is a standard regex-escape function that prefixes all regex metacharacters with a backslash. This ensures that a pattern like `'dev.to'` (which contains `.`, a metacharacter meaning "any character") is matched literally rather than as a wildcard:

```
Without escaping:  /\bdev.to\b/  would match "devXto", "dev to", etc.
With escaping:     /\bdev\.to\b/ matches only the literal string "dev.to"
```

---

## 8. Word Boundary Deep-Dive

### 8.1 How `\b` Works in JavaScript

In JavaScript regex, `\b` is a **zero-width assertion** — it matches a *position* in the string, not a character. Specifically, it matches a position that is:

- Between a `\w` character (`[a-zA-Z0-9_]`) and a `\W` character (anything else), OR
- At the start of the string if the first character is `\w`, OR
- At the end of the string if the last character is `\w`

```
String:  "  skills  "
          ↑       ↑
          \b      \b  (word boundaries around "skills")

String:  "What are his skills?"
                   ↑     ↑
                   \b    \b  (before 's', after last 's')
```

### 8.2 Why `\bhi\b` Does Not Match `'his'`

```
Test: /\bhi\b/.test("his")

"his"
 012

Position 0: Start of string + 'h' is \w → left \b ✓
Position 2: 'i' is \w and 's' is \w     → NO \b ✗

Between 'i' (pos 1) and 's' (pos 2), both characters are word characters.
There is no \w→\W transition, so \b does not exist at position 2.
The pattern /\bhi\b/ requires a boundary AFTER the 'i'.
None exists → no match. ✅
```

```
Test: /\bhi\b/.test("hi there")

"hi there"
 01234567

Position 0: Start of string + 'h' is \w  → left \b ✓
Position 2: 'i' is \w and ' ' is \W      → right \b ✓  (space is \W)

Match at positions 0–2. ✅
```

### 8.3 Why `\bskill\b` Does NOT Match `'skills'`

This is the critical nuance that drove the pattern design decisions:

```
Test: /\bskill\b/.test("skills")

"skills"
 012345

Position 0: Start of string + 's' is \w → left \b ✓
Position 5: 'l' is \w and 's' (the final 's') is \w → NO right \b ✗

'l' → 's' is a \w→\w transition. No boundary. No match. ✅ (correctly rejected)
```

This means that `\bskill\b` (both boundaries) would fail to match `"skills"`, `"skilled"`, `"skillset"`, etc. For a chatbot where users naturally type plurals, this is unacceptable.

### 8.4 The Solution: Explicit Plural/Full-Form Patterns

Rather than using prefix-match (`\bskill` without the right boundary, which is problematic for other reasons), the final implementation uses **both boundaries** (`\bskill\b`) but explicitly lists the plural form as a separate pattern:

```js
// In the 'skills' entry:
patterns: ['skills', 'skill', 'technology', 'tech stack', ...]
//          ↑        ↑
//          Plural   Singular — both listed explicitly
```

This approach is more explicit and readable than regex prefix tricks. The `some()` iteration tests `'skills'` first, so `"What are his skills?"` matches on the first iteration without even reaching `'skill'`.

The same treatment was applied to all affected patterns during the bug-fix iteration:

| Entry | Before | After |
|---|---|---|
| `skills` | `['skill', ...]` | `['skills', 'skill', ...]` |
| `projects` | `['repo', 'project', ...]` | `['project', 'projects', 'repo', 'repos', ...]` |
| `certifications` | `['certif', 'badge', ...]` | `['certif', 'certification', 'certifications', 'badge', ...]` |

### 8.5 Summary of Boundary Strategies by Pattern Type

| Pattern | Strategy | Tier | Rationale |
|---|---|---|---|
| `'^hi$'` | Raw regex exact match | 1 | 2-char word, extreme collision risk with `'his'`, `'him'`, `'this'` |
| `'hello'` | `\bhello\b` | 3 | Long enough, `\b` both sides is safe |
| `'skills'` | `\bskills\b` | 3 | Explicit plural prevents the `\bskill\b` miss |
| `'skill'` | `\bskill\b` | 3 | Matches standalone `"skill"` without false positives |
| `'tech stack'` | Substring | 2 | Multi-word, substring collision is near-impossible |
| `'get in touch'` | Substring | 2 | Multi-word phrase |
| `'rag'` | `\brag\b` | 3 | Could match `"garage"` without boundaries |
| `'ai'` | `\bai\b` | 3 | Could match `"said"`, `"again"` without boundaries |

---

## 9. Pattern Design Decisions and Special Cases

### 9.1 The `'hi'` Pattern — `'^hi$'` Exact Match

**Problem:** `'hi'` (2 characters) is embedded in dozens of common English words. Even with `\b` on both sides, a user typing exactly `"hi"` is the only valid greeting use case — compound phrases like `"hi there"` or `"say hi"` are handled by separate multi-word patterns.

**Decision:** Use the `^`-prefix raw regex tier with pattern `'^hi$'`:

```js
'^hi$'   // compiled as: /^hi$/i
         // matches: "hi", "HI", "Hi" (trim() already removed whitespace)
         // does NOT match: "his", "him", "this", "highlight", "hi there"
```

The `$` anchor (end of string) combined with `^` (start of string) makes this a pure exact-match test on the already-trimmed message.

Multi-word greetings containing "hi" are covered by separate Tier 2 patterns:

```js
'hi there'   // Tier 2 substring — "hi there!" will match
'hi!'        // Tier 2 substring — exact phrase
```

### 9.2 The `'ai'` Pattern

`'ai'` appears as a substring in many common words: `"said"`, `"again"`, `"rain"`, `"detail"`, `"captain"`. The Tier 3 `\bai\b` approach handles this correctly:

```
/\bai\b/.test("said")    → false  ✅  ('s' before 'a' = no left \b)
/\bai\b/.test("AI")      → true   ✅  (standalone word, case-insensitive)
/\bai\b/.test("use AI")  → true   ✅  (space before 'A' = left \b)
```

### 9.3 The `'certif'` Root Pattern

The pattern `'certif'` was chosen (rather than `'certify'` or `'certificate'`) as a common root that captures many forms:

```
\bcertif\b  matches: "certif"         (standalone — unlikely but valid)
            does NOT match: "certifications"  ← this was the bug!
```

**Bug found during testing:**

```
Input: "What certifications does he hold?"
Expected: certifications entry
Got: fallback  ← \bcertif\b did not match "certifications"
```

**Why:** `certif` ends at position 6 in `certifications`. After the `f` comes `i`, which is `\w`, so there is no right `\b`. The pattern `\bcertif\b` requires a word boundary after the `f`.

**Fix:** Add explicit full-form patterns:

```js
patterns: ['certif', 'certification', 'certifications', 'badge', 'credly', ...]
//                    ↑               ↑
//                    Full forms added so \b anchors work correctly
```

### 9.4 The `'oss'` Pattern (Open Source Entry)

```js
patterns: ['open source', 'open-source', 'contribute', 'contribution', 'community', 'oss']
```

`'oss'` is short enough to be risky. `\boss\b` would incorrectly match in:
```
"cross"      → no, 'oss' appears inside, 'cr' precedes → \b before 'o' blocked by 'r' (\w)
"loss"       → no, 'l' is \w, no left boundary
"Moss"       → no
"OSS tools"  → yes ✅  ('O' starts at word boundary)
```

For `"oss"`, `\b` works correctly because a left boundary exists only when `oss` appears at the start of a word.

---

## 10. Step-by-Step Query Lifecycle

This section traces a complete user interaction from keystroke to rendered response.

### Scenario A — Successful Match: `"What are his skills?"`

```
Step 1: User types "What are his skills?" and presses Enter (or ➤ button)

Step 2: formEl 'submit' event fires → e.preventDefault()
        sendMessage() is called with no argument

Step 3: sendMessage()
        const trimmed = inputEl.value.trim()
        // trimmed = "What are his skills?"
        inputEl.value = ''
        appendMessage("What are his skills?", 'user')
        showTyping()
        setTimeout(callback, 550)   ← 550ms simulated delay

Step 4: appendMessage('user') creates:
        <div class="aam-msg aam-msg--user">What are his skills?</div>
        Scrolls to bottom.

Step 5: showTyping() creates:
        <div class="aam-msg aam-msg--bot" id="aam-typing">
          <span class="aam-typing-dots">
            <span></span><span></span><span></span>
          </span>
        </div>
        CSS animates the three dots with staggered delays.

Step 6: After 550ms, the setTimeout callback fires:
        removeTyping()   → document.getElementById('aam-typing').remove()
        _chatFindResponse("What are his skills?") is called

Step 7: _chatFindResponse()
        msg = "what are his skills?"   ← lowercased + trimmed

        Iteration 1 — entry: 'greeting'
          patterns: ['hello', 'hey', ..., '^hi$', 'hi there', 'hi!']

          p = 'hello'  → /\bhello\b/i.test("what are his skills?") → false
          p = 'hey'    → /\bhey\b/i.test("what are his skills?")   → false
          p = 'bonjour'→ false
          ...
          p = '^hi$'   → /^hi$/i.test("what are his skills?")      → false
          p = 'hi there'→ "what are his skills?".includes("hi there") → false
          p = 'hi!'    → false
          All patterns false → no match. Advance to next entry.

        Iteration 2 — entry: 'who'
          p = 'who are you' → false
          p = 'background'  → /\bbackground\b/i.test("what are his skills?") → false
          ... all false. Advance.

        Iteration 3 — entry: 'work'
          ... all false. Advance.

        Iteration 4 — entry: 'skills'
          p = 'skills'
          → /\bskills\b/i.test("what are his skills?")
          → "skills" is present at position 13, preceded by space (\W) and
             followed by '?' (\W) → left \b ✓, right \b ✓
          → MATCH ✅
          → return entry.response immediately (some() short-circuits)

Step 8: _chatFindResponse returns the skills response string.

Step 9: appendMessage(response, 'bot')
        _chatRenderMarkdown(text) is called:
          - '**AI & LLMs**'    → '<strong>AI & LLMs</strong>'
          - '\n'               → '<br>'
          - '[Medium](url)'    → '<a href="url" ...>Medium</a>'
        el.innerHTML = rendered HTML
        el.className = 'aam-msg aam-msg--bot'
        Appended to #aam-chat-messages, scrolled to bottom.

Step 10: User sees the skills response with formatted bold text and links.
         Total time from submit to response: ~550ms (simulated typing delay).
```

### Scenario B — Fallback: `"What is his favourite food?"`

```
Step 7 (modified): _chatFindResponse()
        msg = "what is his favourite food?"

        All 19 entries iterated.
        No entry has a pattern matching any word in this message.
        Loop completes without returning.

        const reply = FALLBACK_RESPONSES[0 % 3]
        // = "🤔 I'm not sure about that one. Try asking about..."
        _fallbackIndex++   // = 1 (next fallback will be index 1)
        return reply

        On the NEXT unmatched input, FALLBACK_RESPONSES[1] will be returned.
        On the THIRD, FALLBACK_RESPONSES[2].
        On the FOURTH, index wraps: 3 % 3 = 0 → back to FALLBACK_RESPONSES[0].
```

### Scenario C — Quick-Reply Chip Click

```
Step 1: User clicks the "🛠️ Skills" chip button

Step 2: Click handler fires:
        () => sendMessage(qr.message)
        // qr.message = "What are his skills?"

Step 3: sendMessage("What are his skills?") is called with explicit text argument.
        const trimmed = (text !== undefined ? text : inputEl.value).trim()
        // Uses the passed argument, not the input field value.
        // This allows chip clicks even when the input field has pending text.

Step 4: Proceeds identically to Scenario A from Step 3 onwards.
```

---

## 11. Markdown Renderer

Bot responses are stored as plain text strings with lightweight markup, not raw HTML. The `_chatRenderMarkdown()` function converts this to safe HTML before inserting into the DOM via `innerHTML`.

```js
function _chatRenderMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g,    '<strong>$1</strong>')
    .replace(/\*([^*\n]+?)\*/g,   '<em>$1</em>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    )
    .replace(/\n/g, '<br>');
}
```

**Supported syntax:**

| Markup | Output | Regex pattern |
|---|---|---|
| `**text**` | `<strong>text</strong>` | `/\*\*(.+?)\*\*/g` |
| `*text*` | `<em>text</em>` | `/\*([^*\n]+?)\*/g` |
| `[label](url)` | `<a href="url" ...>label</a>` | Full Markdown link regex |
| `\n` | `<br>` | `/\n/g` |

**Security note:** `_chatRenderMarkdown()` is only ever called for **bot-generated responses** that are defined at development time in `KNOWLEDGE_BASE`. User input is always inserted via `el.textContent = text` (not `innerHTML`), which prevents any XSS injection from user-typed content. The rendering pipeline is:

```
Bot response string   → _chatRenderMarkdown() → el.innerHTML  (bot messages only)
User input string     → el.textContent        → DOM text node (user messages — no HTML parsing)
```

**Link security attributes:** All generated links include `target="_blank" rel="noopener noreferrer"` to prevent tab-napping attacks when links open in a new tab.

---

## 12. UI Layer

The entire UI is constructed programmatically by `buildChatbotUI()`, an IIFE (Immediately Invoked Function Expression) that runs once when the script is parsed. No pre-existing HTML structure is required.

### 12.1 DOM Construction Sequence

```
1. Create <style> element → append to <head>
2. Create #aam-chat-fab button → append to <body>
3. Create #aam-chat-window div → append to <body>
4. Capture DOM references (messagesEl, inputEl, formEl, closeBtn, quickEl)
5. Render QUICK_REPLIES chips into #aam-quick-replies
6. Bind event listeners
```

### 12.2 Component Tree

```html
<!-- Injected into <body> -->

<button id="aam-chat-fab" aria-label="Open chat assistant"
        aria-expanded="false" aria-controls="aam-chat-window">
  <span aria-hidden="true">💬</span>
  <span class="aam-fab-badge" aria-label="1 new message">1</span>
</button>

<div id="aam-chat-window" role="dialog"
     aria-label="Chat with Alain's assistant" class="aam-hidden">

  <div class="aam-chat-header">
    <div class="aam-chat-avatar" aria-hidden="true">🤖</div>
    <div class="aam-chat-header-info">
      <div class="aam-chat-header-name">Alain's Assistant</div>
      <div class="aam-chat-header-status">● Online · Ask me anything</div>
    </div>
    <button class="aam-chat-close" aria-label="Close chat">✕</button>
  </div>

  <div class="aam-chat-messages" id="aam-chat-messages"
       aria-live="polite" aria-label="Chat messages">
    <!-- Messages appended here dynamically -->
  </div>

  <div class="aam-quick-replies" id="aam-quick-replies">
    <!-- 5 .aam-quick-btn buttons injected by JS -->
  </div>

  <form class="aam-chat-form" id="aam-chat-form" autocomplete="off">
    <input type="text" class="aam-chat-input" maxlength="200"
           placeholder="Ask me about Alain…" aria-label="Type your message" />
    <button type="submit" class="aam-chat-send" aria-label="Send message">➤</button>
  </form>

</div>
```

### 12.3 Open/Close State Machine

```
CLOSED state:
  #aam-chat-window.classList contains 'aam-hidden'
  FAB aria-expanded = 'false'
  Window: opacity:0, pointer-events:none, translateY(14px) scale(.96)

OPEN state:
  #aam-chat-window.classList does NOT contain 'aam-hidden'
  FAB aria-expanded = 'true'
  Window: opacity:1, pointer-events:auto, translateY(0) scale(1)
  Input field receives focus automatically

Transitions:
  CLOSED → OPEN:  FAB click, if messagesEl is empty → showWelcome()
  OPEN → CLOSED:  FAB click, Close button click, Escape key
  On OPEN:        FAB badge (.aam-fab-badge) is permanently removed from DOM
```

### 12.4 Message Rendering

```js
function appendMessage(text, role) {
  const el = document.createElement('div');
  el.className = `aam-msg aam-msg--${role}`;  // 'aam-msg--bot' or 'aam-msg--user'
  if (role === 'bot') {
    el.innerHTML = _chatRenderMarkdown(text);  // Markdown → HTML (bot only)
  } else {
    el.textContent = text;                     // Plain text (user input — XSS safe)
  }
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;  // Auto-scroll to bottom
}
```

### 12.5 Typing Indicator

A temporary element with id `aam-typing` is injected before the response:

```js
function showTyping() {
  const el = document.createElement('div');
  el.id = 'aam-typing';
  el.innerHTML = `<span class="aam-typing-dots">
    <span></span><span></span><span></span>
  </span>`;
  messagesEl.appendChild(el);
}
```

The three `<span>` elements are animated via CSS `@keyframes aam-dot` with staggered `animation-delay` values (0s, 0.2s, 0.4s), creating the bouncing dots effect. After 550ms, `removeTyping()` removes the element by id and the actual response is appended.

---

## 13. Accessibility Implementation

| Feature | Implementation |
|---|---|
| FAB role | `<button>` element (implicit `role="button"`) |
| Chat window role | `role="dialog"` with `aria-label` |
| Expanded state | `aria-expanded="true/false"` on FAB, toggled on open/close |
| Chat region | `aria-live="polite"` on `#aam-chat-messages` — screen readers announce new messages |
| Decorative content | `aria-hidden="true"` on emoji icons |
| Keyboard close | `Escape` key listener on `document` closes chat when open |
| Focus management | `inputEl.focus()` on open; `fab.focus()` on close — focus never lost |
| FAB badge | `aria-label="1 new message"` on badge element |
| Input label | `aria-label="Type your message"` on text input |
| Send button | `aria-label="Send message"` on submit button |
| Focus ring | `focus-visible` CSS rule with 2px outline for keyboard users |

---

## 14. CSS Architecture and Theme Integration

All CSS is injected as a `<style>` element by the IIFE, keeping `chatbot.js` a single-file deployment. CSS is scoped under the `#aam-chat-fab` and `#aam-chat-window` selectors, preventing any style collision with the rest of the page.

**Theme integration via CSS custom properties:**

The chatbot reads all colours from the host page's CSS variables. Since the site already defines these in `:root`, the chatbot inherits the full dark GitHub theme with zero configuration:

```css
/* CSS vars referenced by chatbot — defined in styles.css */
var(--clr-accent,     #58a6ff)  /* Primary blue — FAB, header, accents  */
var(--clr-accent-hover, #79b8ff)/* Hover state for send button          */
var(--clr-bg,         #0d1117)  /* Page background — bot message cards  */
var(--clr-bg-alt,     #161b22)  /* Surface colour — chat window bg      */
var(--clr-border,     #21262d)  /* Border lines between sections        */
var(--clr-text,       #e6edf3)  /* Primary text colour                  */
var(--clr-text-muted, #8b949e)  /* Muted text — typing dots, placeholder*/
var(--font-sans,      'Inter'…) /* Font family                          */
```

Each CSS variable has a hard-coded fallback value (the `#xxxxxxx` after the comma) so the chatbot works correctly even if loaded on a page that doesn't define these variables.

**Responsive breakpoint:**

```css
@media (max-width: 400px) {
  #aam-chat-window { right: .75rem; left: .75rem; width: auto; }
  #aam-chat-fab    { bottom: 1rem; right: 1rem; }
}
```

On screens narrower than 400px (most small phones), the chat window stretches to fill the full width minus a 0.75rem margin on each side, and the FAB moves slightly inward.

---

## 15. Fallback System

When no `KNOWLEDGE_BASE` entry matches, the engine returns one of three fallback responses in round-robin order:

```js
const FALLBACK_RESPONSES = [
  `🤔 I'm not sure about that one. Try asking about Alain's **skills**, **projects**, **blog**, or **contact info**. Or type **help** to see all topics.`,
  `❓ I didn't catch that. You can ask about Alain's **background**, **tech stack**, **GitHub repos**, or **how to reach him**.`,
  `🤷 That's outside my knowledge! Try asking about Alain's **work**, **AI projects**, or **articles**. Type **help** for all options.`
];

let _fallbackIndex = 0;  // Module-level counter, persists across calls

// In _chatFindResponse():
const reply = FALLBACK_RESPONSES[_fallbackIndex % FALLBACK_RESPONSES.length];
_fallbackIndex++;
return reply;
```

Each fallback suggests different topics and uses different wording, reducing the sense of repetition when multiple consecutive messages go unmatched. The `%` modulo operation wraps the counter back to 0 after all three have been used, cycling indefinitely.

---

## 16. Quick-Reply Chips

Five pre-defined question chips are rendered below the message area:

```js
const QUICK_REPLIES = [
  { label: '👤 About',    message: 'Who is Alain?' },
  { label: '🛠️ Skills',  message: 'What are his skills?' },
  { label: '📦 Projects', message: 'Show me his projects' },
  { label: '✍️ Blog',    message: 'Where does he write?' },
  { label: '📬 Contact',  message: 'How to contact him?' }
];
```

Each chip is a `<button type="button">` element (not a submit button) whose click handler calls `sendMessage(qr.message)` with the pre-defined message string. This bypasses the input field entirely — the message is passed directly as an argument to `sendMessage()`:

```js
function sendMessage(text) {
  const trimmed = (text !== undefined ? text : inputEl.value).trim();
  //               ↑ explicit arg (chip)     ↑ input field value (keyboard)
  ...
}
```

The ternary `text !== undefined ? text : inputEl.value` ensures that an empty string passed as a chip message (`''`) would still be treated as explicit input rather than falling back to the field value. In practice all chip messages are non-empty, but the guard is correct.

---

## 17. How to Extend

### Adding a New Topic

Append an entry to `KNOWLEDGE_BASE` in `chatbot.js`:

```js
{
  id: 'speaking',
  patterns: ['speak', 'speaking', 'conference', 'talk', 'presentation', 'keynote'],
  response: `🎤 Alain speaks at technical conferences and meetups on AI, cloud, and DevOps topics.\nCheck his [LinkedIn](https://fr.linkedin.com/in/aairom) for upcoming events!`
},
```

**Pattern design checklist for new entries:**

- [ ] Are any patterns 2–3 characters long? → Use `'^pattern$'` (Tier 1) or add longer synonyms
- [ ] Are any patterns common English substrings? → Test with `\b` first; add full-form variants if needed
- [ ] Do any patterns naturally pluralize? → Add both singular and plural (e.g., `'talk'` and `'talks'`)
- [ ] Are multi-word phrases better as single patterns? → Yes, use spaces and Tier 2 naturally handles them

### Adding a Quick-Reply Chip

```js
// In QUICK_REPLIES array:
{ label: '🎤 Speaking', message: 'Does he speak at conferences?' },
```

### Updating Profile Links

Edit `CHATBOT_CONFIG` at the top of the file, then update the `response` strings in `KNOWLEDGE_BASE` that reference those URLs. The config object and the response strings are currently independent — a future refactor could template response strings using config values.

---

## 18. Test Matrix

The following test cases were executed against the final engine to validate correctness. All 25 cases pass.

| Input | Expected entry | Trigger pattern | Notes |
|---|---|---|---|
| `"What are his skills?"` | `skills` | `skills` | Bug-report case — previously matched `greeting` via `'hi'` in `'his'` |
| `"How to contact him?"` | `contact` | `contact` | Bug-report case — `'him'` contains `'hi'` |
| `"Who is Alain?"` | `who` | `who is alain` | Multi-word Tier 2 |
| `"Show me his projects"` | `projects` | `show me` | Tier 2 multi-word |
| `"Where does he write?"` | `blog` | `write` | Tier 3 `\bwrite\b` |
| `"hi"` | `greeting` | `^hi$` | Tier 1 exact match |
| `"hello"` | `greeting` | `hello` | Tier 3 |
| `"hey"` | `greeting` | `hey` | Tier 3 |
| `"skills"` | `skills` | `skills` | Tier 3 |
| `"contact"` | `contact` | `contact` | Tier 3 |
| `"thanks"` | `thanks` | `thanks` | Tier 3 |
| `"bye"` | `bye` | `bye` | Tier 3 |
| `"this is great"` | `thanks` | `great` | `'this'` does NOT trigger `greeting` |
| `"Show me his background"` | `who` | `background` | `'his'` does NOT trigger `greeting` |
| `"what is his tech stack"` | `skills` | `tech stack` | Tier 2 multi-word |
| `"What AI projects does he have?"` | `ai` | `ai` | Tier 3 `\bai\b` |
| `"I work at ibm too"` | `work` | `ibm` | Tier 3 |
| `"where is he based?"` | `location` | `where` | Tier 3 |
| `"Does he have a LinkedIn?"` | `linkedin` | `linkedin` | Tier 3 |
| `"What certifications does he hold?"` | `certifications` | `certifications` | Was fallback before fix |
| `"Does he blog?"` | `blog` | `blog` | Tier 3 |
| `"How can I reach him?"` | `contact` | `reach` | Tier 3 — `'him'` does not trigger `greeting` |
| `"Tell me about his background"` | `who` | `background` | Tier 3 |
| `"What repos does he have?"` | `projects` | `repos` | Was fallback before explicit plural added |
| `"highlight of his career"` | `fallback` | — | `'highlight'` does NOT match `'hi'` via `\b` |

---

*Documentation generated for `chatbot.js` · aairom.github.io · MIT License*
