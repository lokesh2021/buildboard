# Design System Specification: The Kinetic Minimalist

## 1. Overview & Creative North Star
This design system is built for high-velocity focus. While inspired by the functional utility of tools like Notion and Linear, our Creative North Star is **"The Digital Architect."** 

We move beyond the "template" look by treating the UI not as a flat screen, but as a structured, three-dimensional workspace. We break the rigid, boxy grid through **intentional asymmetry**—using wide gutters and varying column widths to guide the eye—and **tonal depth**. This system feels premium because it refuses to use heavy lines to define space; it uses light, air, and subtle shifts in surface temperature to create a signature, editorial flow.

---

## 2. Colors & Surface Philosophy
The palette is rooted in deep neutrals and off-whites, providing a "calm" canvas for the vibrant `primary` (#4d44e3) to act as a laser-focused call to action.

### The "No-Line" Rule
To achieve a high-end feel, **1px solid borders for sectioning are prohibited.** Boundaries must be defined through background color shifts. 
*   **Example:** A sidebar using `surface-container-low` should sit against a `background` (#fcf9f8) main content area. The transition of the color is the border.

### Surface Hierarchy & Nesting
Treat the UI as stacked sheets of fine paper. Use the tiers to define importance:
*   **Base:** `background` (#fcf9f8)
*   **Secondary Content:** `surface-container-low` (#f6f3f2)
*   **Interactive Cards:** `surface-container-lowest` (#ffffff) sitting on a `surface-container` background.
*   **Elevated Overlays:** `surface-bright` for high-contrast focus.

### The "Glass & Gradient" Rule
Standard flat colors can feel sterile. For floating menus or command palettes, use **Glassmorphism**: Apply `surface` colors at 80% opacity with a `backdrop-blur` of 12px-20px. 
For primary CTAs, apply a subtle linear gradient from `primary` (#4d44e3) to `primary_dim` (#4034d7) at a 135-degree angle. This adds "soul" and a tactile, pressed-ink quality to the button.

---

## 3. Typography: Editorial Authority
We use **Inter** for its mathematical precision and legibility. The hierarchy is designed for Markdown-heavy environments where information density is high.

*   **Display (lg/md/sm):** Used for "Zen mode" headers or landing moments. High contrast against body text creates an authoritative, editorial feel.
*   **Headline & Title:** Use `headline-sm` (1.5rem) for major section headers. Use `title-md` (1.125rem) for sub-sections.
*   **Body (lg/md/sm):** `body-md` (0.875rem) is our workhorse. Ensure a line-height of 1.6 for maximum readability in long-form notes.
*   **Labels:** Use `label-md` for metadata. These should often use the `on_surface_variant` (#5f5f5f) to recede visually, keeping the focus on the content.

---

## 4. Elevation & Depth
We eschew traditional drop shadows for **Tonal Layering**.

*   **The Layering Principle:** Place a `surface_container_lowest` card on a `surface_container_low` section. This creates a "soft lift" that feels architectural rather than artificial.
*   **Ambient Shadows:** For floating elements (Modals, Popovers), use an extra-diffused shadow: `0px 12px 32px rgba(50, 50, 50, 0.06)`. Note the tint: the shadow is a low-opacity version of `on_surface`, never pure black.
*   **The "Ghost Border" Fallback:** If accessibility requires a container boundary, use the **Ghost Border**: `outline_variant` (#b3b2b1) at **15% opacity**. It should be felt, not seen.
*   **Roundedness:** Stick to the `DEFAULT` (0.5rem / 8px) for cards and inputs. Use `lg` (1rem / 16px) for large containers to soften the "Brutalist" edge of the neutrals.

---

## 5. Components

### Buttons
*   **Primary:** Gradient `primary` to `primary_dim`. Roundedness `DEFAULT`. Text: `on_primary` (#faf6ff).
*   **Secondary:** `surface_container_high` background with `on_surface` text. No border.
*   **Tertiary:** Transparent background. Text: `primary`. On hover, shift background to `primary_container` at 30% opacity.

### Input Fields
*   **Base State:** `surface_container_lowest` background, Ghost Border (15% `outline_variant`).
*   **Focus State:** Border opacity increases to 100% `primary`. No "glow" shadows; use a 1px solid `primary` ring with a 2px offset.

### Cards & Lists
*   **Forbid Dividers:** Do not use horizontal lines between list items. Use `spacing-4` (1rem) or `spacing-6` (1.5rem) to create separation.
*   **Hover States:** In lists, indicate selection by changing the background to `surface_container_high` with a `DEFAULT` (8px) corner radius.

### Navigation Sidebar
*   Use `surface_container_low`. 
*   Active states should use a vertical "pill" marker in `primary` on the far left, but the background of the active item should be a subtle `surface_container_highest`.

---

## 6. Do's and Don'ts

### Do:
*   **Embrace Negative Space:** If a section feels crowded, increase the spacing from `spacing-4` to `spacing-8`. Whitespace is a functional tool, not a luxury.
*   **Layer Surfaces:** Always ask, "Can I define this area with a background color shift instead of a line?"
*   **Micro-Interactions:** Use `primary` for small functional accents—a loading bar, a checkbox tick, or a cursor focus.

### Don't:
*   **Don't use 100% Black:** Even in dark mode, use `inverse_surface` (#0e0e0e). Pure black kills the "paper-like" depth.
*   **Don't use Standard Shadows:** Avoid the "fuzzy grey blur" look. If it's not an Ambient Shadow (as defined in Section 4), it shouldn't be there.
*   **Don't Over-Round:** Avoid the `full` (9999px) radius except for status tags or "pill" buttons. Keep the workspace feeling structured with `DEFAULT` (8px) corners.