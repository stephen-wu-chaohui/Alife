# 1. Project Identity & Architecture
**Project Name:** Alife (Abundant Life App)
**Target Audience:** Abundant Life Church (Root Group)
**Tech Stack:** * Frontend: Next.js 14 (App Router) - The application strictly utilizes the folder-based App Router and its component-centric architecture. React, Tailwind CSS, PWA (`next-pwa`).
* Backend/Cloud: Firebase (Auth, Firestore, Cloud Functions, Storage), Google Cloud Secret Manager.
* Integrations: Stripe API (Payments), YouTube Data API v3 (Sermons).
**Core Paradigm (Hybrid CQRS):**
* **Queries (Reads):** Direct Firestore Client SDK subscriptions (`onSnapshot`) for real-time UI.
* **Commands (Writes):** Strictly via Firebase Cloud Functions (RESTful API). Client-side direct writes to Firestore are FORBIDDEN via Security Rules.
**UI Components:** shadcn/ui (for accessible, customizable Tailwind components) + lucide-react (for consistent iconography).
**Rich Text Editor:** novel (Tiptap-based block editor for Notion-style experience).

# 2. Authentication & Session Management
* **Mechanism:** Firebase Phone Auth paired with **HTTP-Only Cookies**.
* **Session Lifecycle:** The Next.js Middleware MUST verify the HTTP-only cookie on every request. 
* **Guest State:** If the cookie is missing, invalid, or expired, the user is treated as a `Guest`.
* **Guest Behaviors:** Guests can only access public pages (e.g., login, church intro). They can use Phone Auth to log in (if the account exists) or trigger the registration flow to create a new Member profile.

# 3. Role-Based Access Control (RBAC) & Group Behaviors
Users can hold different roles across multiple groups simultaneously.

**A. The System Admin (Superuser)**
* **Predefined Identity:** Hardcoded Admin account mapped to phone number: `+6402102591292`.
* **Root Access:** There is a predefined root group named `"Abundant Life Church"`. The Admin implicitly holds the `leader` role for this root group AND absolute `leader` access to ALL groups and sub-groups in the system.

**B. Group Leaders (Scoped to their specific group & sub-groups)**
* **Membership Management:** Can invite users, kick members, promote a plain member to `leader` (or co-leader), and demote a `leader` to a plain member.
* **Join Policy:** Can configure the group's `joinPolicy` (Enum: `AUTO_APPROVE`, `AUTO_REFUSE`, `MANUAL_WAITLIST`). Can approve or deny pending join requests.
* **Hierarchy Management:** Can create sub-groups (groups where `parentId` is the current group's ID) and assign the initial leaders for those sub-groups.
* **Event Management:** Can create `Events` with dynamic forms for members to join.
* **Content Publishing:** Can toggle the `visibility` of Pray Requests, Devotions, or Pages. Visibility scopes are `GROUP_ONLY` (default) or `CHURCH_LEVEL` (visible to all users under the root church group).

**C. Plain Members**
* Can hold membership in multiple groups.
* Can join events within their groups.
* Can create Pray Requests, Devotions, and Pages within their group (defaulting to `GROUP_ONLY` visibility).
* Can view `CHURCH_LEVEL` content published by other groups.

# 4. Database Schema (Firestore)
Use flat structures. Always use `admin.firestore.FieldValue.serverTimestamp()` for dates.

* **`Members`** (Doc ID = Firebase Auth UID)
  * `realName`, `phoneNumber` (E.164 format)
  * `memberships`: Map/Record `{"groupId": {"role": "leader"|"member", "joinedAt": timestamp}}`

* **`Groups`** (Doc ID = Auto)
  * `name`, `parentId` (string | null)
  * `ancestors`: Array of parent IDs for rapid hierarchy queries.
  * `leaderIds`: Array of UIDs (redundant for Security Rules).
  * `joinPolicy`: 'AUTO_APPROVE' | 'AUTO_REFUSE' | 'MANUAL_WAITLIST'

* **`Content` (Prayers, Devotions, Pages)**
  * `title`, `body`, `authorUid`, `groupId`
  * `visibility`: 'GROUP_ONLY' | 'CHURCH_LEVEL'

* **`Events` & `Registrations`**
  * `Events`: `title`, `groupId`, `isPaid`, `priceNzd`, `formSchema` (Array defining dynamic fields).
  * `Registrations` (Doc ID = `{eventId}_{uid}`): `responses` (JSON map matching schema), `paymentStatus` ('pending'|'paid'|'free'), `stripeSessionId`.

* **`Sermons`** (Doc ID = YouTube Video ID)
  * Synced via cron job. `title`, `youtubeUrl`, `publishedAt`, `description`.
  * **Cron Synchronization:** A persistent `node-cron` task runs every 12 hours on the backend server. It authenticates with the YouTube Data API v3 using `YOUTUBE_API_KEY` and fetches the most recent videos from a specific `YOUTUBE_PLAYLIST_ID` (using the `playlistItems` API). The data is upserted into the `sermons` collection seamlessly using a Firestore `db.batch()` write to guarantee atomicity.

# 5. Strict Engineering Constraints (MANDATORY)
1. **The DTO Mandate:** Every Cloud Function endpoint MUST use `Zod` to validate incoming Requests (DTOs). Never trust client input.
2. **The Transaction Mandate:** Any operation modifying multiple documents (e.g., assigning a leader updates `Members` and `Groups`) MUST use `admin.firestore().runTransaction()`.
3. **Media Optimization:** Videos are strictly embedded via YouTube. Images uploaded to Firebase Storage MUST trigger a Cloud Function (using `sharp`) to generate web-optimized thumbnails.
4. **Stripe Webhooks:** Provide a secure endpoint to verify Stripe signatures and asynchronously update event registration `paymentStatus`.


# 6. UI/UX Architecture & Layout Strategy
A. **Mobile-First Ergonomics (PWA)**

**Global Bottom Tab Bar (The Public Square):** The primary navigation for mobile users must be fixed at the bottom (Thumb Zone). It exclusively displays CHURCH_LEVEL content.

**Home:** Aggregated feed of church-wide announcements, featured events, and recent prayers.

**Events:** Timeline/Calendar of all public group events.

**Church / Discover:** Static church pages, Sermon archives, and a directory of public groups.

**Profile:** Current user's dashboard (my tickets, my prayers, settings).

**Navigation Drawer (The Management Console):** A slide-out hamburger menu used for Progressive Disclosure. It houses GROUP_ONLY content and management tools.

**The items in this drawer MUST be dynamically rendered based on the user's RBAC.** Plain members see basic group info; leaders see "Create Event", "Manage Members", and "Publish Page".

B. **Desktop Adaptation**

On viewport widths md and above, the Bottom Tab Bar should transform into a sticky Left Sidebar, and the Navigation Drawer content should be integrated into a secondary context panel or admin dashboard layout.

# 7. Content Creation & Rich Text (The Novel Mandate)
A. **Block-Style Editing Only**

For Pages, Devotions, and Sermons notes, the frontend MUST use the novel editor (Tiptap/ProseMirror under the hood).

**Data Format:** The editor must output strictly structured JSON (representing block nodes). Storing raw HTML strings in Firestore is FORBIDDEN to ensure cross-platform rendering safety and flexibility.

B. **Interactive React Node Views**

The editor must support custom interactive blocks via Tiptap Node Views.

**For example, a leader typing /sermons in the editor should inject a custom React component (e.g., <RecentSermons limit={10} />) into the JSON tree. When rendered in read-only mode, Next.js will dynamically fetch and display the latest 10 sermons inside the document.**

**SSR Safety:** The novel editor component MUST be dynamically imported with `ssr: false` in Next.js to prevent hydration mismatch errors, as it relies heavily on the browser's document object.

# 8. Frontend Code Generation Guidelines
When generating Next.js client-side code:

**Separation of Concerns:** Separate data fetching logic from UI components. Use custom React hooks (e.g., useGroupEvents(groupId)) to encapsulate Firebase onSnapshot real-time listeners.

**Loading States:** Always include Skeleton loaders (via shadcn/ui skeleton component) for async queries.

**Form Handling:** Use react-hook-form integrated with @hookform/resolvers/zod to share the exact same Zod validation schemas used by the Cloud Functions.

# 9. UI Theme & Styling Constraints
A. **Color Palette (Minimalist Zinc/Neutral)**

- The application MUST use a strictly minimalist, monochrome color palette (e.g., shadcn/ui Zinc or Neutral base).

- Avoid using primary colors for structural elements. Color should ONLY be used for semantic feedback (e.g., Red for destructive actions, Green for success) or user-generated content (e.g., uploaded event cover images).

- The goal is to maximize content readability (Sermons, Prayers) and minimize visual distraction.

B. **Light / Dark Mode Strategy (System Default ONLY)**

- The application MUST strictly follow the user's operating system preference for Light or Dark mode (prefers-color-scheme).

- **DO NOT** implement a manual theme toggle button (e.g., no sun/moon icon in the UI).

- **DO NOT** store theme preferences in the database or local storage.

- When configuring next-themes with Next.js, use <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange />.


When generating code, output the Zod Schemas (DTOs) first, the Serverless API/Transaction logic second, and the Next.js React Component third.