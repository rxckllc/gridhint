Please review this SEO/AEO audit plan for a Next.js application designed to capture daily NYT word game traffic. Provide your critique and any additional best practices we might have missed, especially regarding AEO (Answer Engine Optimization) and Schema.org.

Here is the plan:

### Part 1: Technical SEO & Architecture

**The Good:**
*   **Static Manifest Sitemaps:** Your `sitemap.ts` dynamically pulling the `updatedAt` from your JSON manifests is brilliant. This guarantees Google sees an exact timestamp of when the update ran.
*   **Next.js App Router & Static Export:** Using `output: 'export'` ensures sub-second TTFB.
*   **Stale Data Handling:** Your `isStale` check is a great UX feature.

**The Gaps (Critical Fixes):**
*   **Missing `metadataBase`:** In `src/app/layout.tsx`, there is no `metadataBase` defined. Next.js cannot resolve relative canonical URLs to absolute URLs without `metadataBase`.
*   **Archive Indexing:** `sitemap.ts` ignores the dynamic `[date]` routes for past puzzles, missing long-tail traffic.

### Part 2: AEO (Answer Engine Optimization)

**The Good:**
*   **Homepage Schema:** `FAQPage` and `SearchAction` schema on the homepage are solid.
*   **Semantic HTML:** Logical hierarchy makes it easy for LLMs to parse.

**The Gaps (Critical Fixes):**
*   **Missing Daily Page Schema:** Daily Connections, Wordle, and Spelling Bee pages have zero JSON-LD schema.
*   **No Q&A Format on Daily Pages:** AI overviews trigger on natural language questions. Daily pages should use explicit H2s like "What is the Connections Hint for Today?".

### Part 3: Content & "Blue Ocean" Strategy

**The Strategy:**
Solvers like Word Ladder Solver, Word Pattern Solver, and Hangman Solver have less competition.

**The Gaps (Critical Fixes):**
*   **Thin Content on Solver Pages:** Solvers need surrounding editorial content to rank (e.g., 500+ words).
*   **Cross-Linking:** Missing aggressive internal linking from high-traffic NYT daily pages to permanent solvers.

### Part 4: The Export & Action Plan

#### Priority 1: Fix the Next.js Canonical & Metadata Issue
Update `src/app/layout.tsx` to include `metadataBase: new URL("https://gridhint.com")`.

#### Priority 2: Implement "Daily Event" & "FAQ" Schema on Puzzle Pages
Add JSON-LD to `WordleTodayPage`, `ConnectionsHintsPage`, and `SpellingBeeTodayPage`.
*   Add `NewsArticle` or `Article` schema with `datePublished` and `dateModified`.
*   Add `FAQPage` schema to the daily pages answering questions about today's puzzle.

#### Priority 3: Expose Historical Data in the Sitemap
Update `sitemap.ts` to include the last 30 days of historical `[date]` routes.

#### Priority 4: AEO Natural Language Headers
Inject dynamic dates directly into `H1` and `H2` tags (e.g., `NYT Wordle Hints and Answer for {puzzle.date}`).

#### Priority 5: Dominate the "Zero-Competitor" Games
*   Add 500+ words of evergreen content to utility pages.
*   Add `SoftwareApplication` schema (as `BrowserApplication`) to utility pages.

#### Priority 6: Indexation Strategy
Use IndexNow and a Google Search Console API ping to force indexation the moment the 5:00 AM ET fetch completes.
