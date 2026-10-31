# Little Later — Brand & Design System Guidelines (v1.1)

Welcome to the official **Little Later** brand kit. Everything in this folder is organized so you can build the **Little Later website**, Play Store listing, and marketing materials with the exact same visual language as the app.

---

## 1. Brand Story & Voice (For Your Website)

* **Tagline:** *Save the Idea. Remind yourself Later.*
* **Founder Story ("Why I built Little Later"):**
  > "I started Little Later because I was always the person saving reels, links, recipes, and posts across Instagram, YouTube, and LinkedIn—only to completely forget about them when I actually needed them. Bookmarks become graveyards. Little Later turns saved links into gentle, well-timed nudges and collaborative spaces with friends."
* **Brand Personality:** Calm, tactile, warm, and intentional. Nothing shouts for attention—secondary elements rest quietly at 60–72% opacity until touched.

---

## 2. Color System (Dark Mode Default)

Little Later uses **Deep Midnight Dark Mode** as its primary identity, with a crisp **Soft Daylight Mode** option.

| Role | Token | Dark Mode (Default) | Light Mode | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **App Canvas** | `--ll-bg-canvas` | `#08111E` | `#E6EFFA` | Outer page / website background |
| **Primary Screen BG** | `--ll-bg-phone` | `#0B1626` | `#F1F6FC` | Main screen container |
| **Card Surface** | `--ll-surface-card` | `#132235` | `#FFFFFF` | Saved link, reminder & to-do cards |
| **Elevated Surface** | `--ll-surface-elevated` | `#17273B` | `#FAFCFF` | Collaborator bars, guest cards |
| **Capsule Surface** | `--ll-surface-capsule` | `#1A2B42` | `#E6EFF9` | Filter pills, split folder buttons |
| **Primary Ink** | `--ll-ink-primary` | `#F4F7FB` | `#132033` | Headings, active labels, bold copy |
| **Secondary Ink** | `--ll-ink-secondary` | `#9BB0C9` | `#516885` | Subtitles, timestamps, notes |
| **Brand Blue** | `--ll-brand-blue` | `#4282DB` | `#28599F` | Primary CTAs, active capsules |
| **Deep Royal Blue** | `--ll-brand-blue-deep` | `#2E64B0` | `#1E4682` | Gradient start, active borders |
| **Mascot Warm Amber** | `--ll-brand-amber` | `#F4B936` | `#F4B936` | Mascot folder body & italic *Idea* accent |
| **Collab Mint** | `--ll-brand-mint` | `#56CCA9` | `#0E6348` | Collaborator avatars & live badges |
| **Collab Coral** | `--ll-brand-coral` | `#FF7597` | `#B84A69` | Friend avatars & Love folder accent |

### Sculptural 3D Folder Gradients
* **Work Folder:** `linear-gradient(155deg, #3A5BA0 0%, #243B6B 100%)`
* **Love Folder:** `linear-gradient(155deg, #B84A69 0%, #7E2B45 100%)`
* **Hobby Folder:** `linear-gradient(155deg, #2A8C72 0%, #195947 100%)`
* **Custom Folder:** `linear-gradient(155deg, #7B52AB 0%, #4B2E70 100%)`

---

## 3. Typography & The 1.6× Hierarchy Rule

* **Primary UI Font:** `Plus Jakarta Sans` (Fallback: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif`)
* **Expressive Accent Font (for the word *"Idea"*):** `Instrument Serif` or italic serif in warm gold (`#FFE17D`)
* **The 1.6× Golden Rule:**
  Every secondary/supportive text element is **~1.6× smaller** than its paired primary heading, uses **font-weight 400 (Light/Regular)**, and sits at **65%–70% opacity**:
  * **Screen Title:** `28px` (`800` weight) → **Screen Subtitle / Lede:** `12.5px` (`400` weight, `68%` opacity)
  * **Section Heading:** `20px` (`750` weight) → **"See all" / Action Link:** `12.5px` (`600` weight, `65%` opacity)
  * **Card Title:** `16px` (`700` weight) → **Card Meta / Source:** `10px` (`500` weight, `65%` opacity)

---

## 4. Core UI & Interaction Principles

1. **Quiet Unselected Capsules (70–75% Text/Icon Opacity):**
   Unselected filter chips (`All`, `To Do`, `Reminder`, `Saved`), folder picker pills, and reminder time chips never shout. Their inner text and icons sit at `0.72` opacity and brighten to `1.0` with a subtle spring pop when selected.
2. **Unified Card Footer (`Open` Left · `Done` Right):**
   Every Saved Link, Reminder, and To-Do List card shares the exact same footer layout (`Open` on the left, `Done` on the right) with date/status pills (`Unscheduled` or scheduled timestamp) above the footer.
3. **Sculptural Matte Folders with Touch-to-Bloom:**
   Folder cards show only the **Folder Name + Item Count** in the top-left and a circular **Edit icon button** in the top-right. At rest, folders sit slightly compact (`scale(0.965)`, `saturate(0.78)`). On touch/hover, the active folder blooms (`scale(1.035)`, `saturate(1.18)`) with full gradient richness.
4. **Google Keep–Style Collaborative Folders (v1.1):**
   Folders remain personal by default. Inside any folder, the bottom bar splits into **Share folder** (left) and **Add as collab** (right). Once collaborators are invited, everyone can drop links, reminders, to-dos, and short notes, and each user can toggle **Remind me: On / Off** per task.
5. **Spring Physics & Haptics:**
   Use `cubic-bezier(0.34, 1.56, 0.64, 1)` for swipe-to-complete tracks, pull-down top refresh spinner, and button presses.

---

## 5. Folder Contents

* `brand-book.html` — Interactive visual Brand & Design System explorer (open in any browser to click-to-copy colors, CSS, and SVGs).
* `little-later-tokens.css` — Drop-in CSS variables for your website.
* `design-tokens.json` — JSON tokens for Figma or Tailwind/React setups.
* `icons/` — All 29 custom 1.9px rounded-stroke SVG icons (`24×24`).
* `assets/` — High-resolution mascot PNGs (`little-later-mascot-v2.png`, `little-later-mascot.png`) and vector badge (`mascot-folder-badge.svg`).
