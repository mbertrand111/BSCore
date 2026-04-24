# UX RULES — BSCore

## 1. Scope

These rules apply to:
- All admin and backoffice interfaces built with Socle+
- All module admin sections
- All form-heavy or data-management screens

Public-facing visual design remains fully project-specific. These rules govern interaction patterns and interface behavior — not visual style.

---

## 2. Core Principles

### Non-technical users first
Admin interfaces are used by content editors, business owners, and operations staff — not developers. Design for the person who knows their domain but has no mental model of the underlying system.

### Calm and clear over clever
Avoid animations, transitions, and visual effects that don't communicate state. Prefer plain, readable layouts over dense dashboards. Information density should match the task, not the designer's aesthetic.

### Predictable over powerful
A user should always be able to predict what will happen before they click. Surprise is a UX failure. Consistency across screens is worth more than per-screen optimization.

### Explicit actions
Labels on buttons describe the action precisely. "Save" is acceptable for generic saving. "Publish post", "Delete customer", "Send invoice" are better. Avoid "Submit", "OK", "Yes" without context.

---

## 3. Navigation

- Navigation structure reflects the user's mental model of their tasks, not the technical module structure.
- Active section is always visually indicated.
- Breadcrumbs on all pages deeper than the first level. Format: `Section > Subsection > Item name`.
- Navigation does not change based on what a user is doing. No "context-sensitive" navs that shift around.
- Mobile admin navigation collapses gracefully. Touch targets are minimum 44×44px.

---

## 4. Forms

### Layout
- One column for most forms. Two columns only when fields are genuinely paired (first name + last name).
- Labels above fields, always. Never placeholder-only labels (they disappear on input and hurt accessibility).
- Field descriptions (help text) below the field, in smaller, muted text.
- Group related fields visually. Use clear section headings for long forms.
- Required fields: mark them consistently. Either mark all required fields with `*`, or mark all optional fields with `(optional)` — never mix both.

### Validation
- Validate on blur (when the user leaves a field) for immediate feedback. Also validate on submit.
- Show inline validation errors directly below the relevant field. Never show all errors only at the top of the form.
- Error messages are specific and actionable: "Email address is required", "Title must be under 200 characters", "Start date must be before end date". Never "Invalid input" alone.
- Do not clear a field's value when showing a validation error. Preserve what the user typed.
- Green success states on valid fields are optional. Red error states on invalid fields are mandatory.

### Submission
- Disable the submit button after first click to prevent double submission. Re-enable on error.
- Show a loading state during submission. Spinner on the button or a page-level loading indicator.
- On success: show a clear success message. For list screens, return to the list. For edit screens, stay on the form with a success toast.
- On error: keep the form filled. Show the error clearly. Do not navigate away.

---

## 5. Interface States

Every screen that loads or mutates data must handle all four states:

### Loading
- Show a skeleton screen or a spinner. Never a blank white page.
- For inline actions (save, delete), show a loading indicator on the triggering element.

### Empty
- Empty lists and screens must have an explicit empty state message.
- Include a call to action where appropriate: "No posts yet. Create your first post →"
- Never show an empty table with just column headers and no rows and no explanation.

### Error
- When a page fails to load, show a clear error message with a retry option.
- When an action fails, show the error in context (inline or toast), not just a console error.
- Error messages are human-readable. "Could not load posts. Please try again." Not "HTTP 500".

### Success
- Confirm that an action succeeded. Use a toast notification for non-blocking success (e.g., "Post saved").
- For critical confirmations (e.g., "Email sent to 400 subscribers"), use a more prominent success state.

---

## 6. Destructive Actions

Any action that deletes, permanently removes, or cannot be undone requires explicit confirmation.

Rules:
- A confirmation dialog appears before execution.
- The dialog names the item being affected: "Delete post 'Summer Collection 2024'?" — not "Delete this item?".
- The confirm button is red and labeled with the action: "Delete post". Not "OK" or "Yes".
- The cancel button is the default focus. Pressing Enter or Space should not accidentally confirm deletion.
- Never trigger destructive actions on single click without confirmation.
- For bulk operations (delete 50 records), require typing a confirmation phrase or count if the impact is high.

---

## 7. Feedback and Notifications

- Toast notifications for non-blocking feedback (saved, updated, copied).
- Toasts appear consistently in the same position (top-right or bottom-right).
- Toasts auto-dismiss after 4–6 seconds. Include a manual close button.
- Success toasts: green or neutral. Error toasts: red. Warning toasts: yellow.
- Never use browser `alert()` or `confirm()` in admin interfaces.
- For critical errors (session expired, permission denied), show a modal or a full-page error — not just a toast.

---

## 8. Tables and Lists

- Tables have clear column headers.
- Each row has a clear primary action (edit or view). Triggered by clicking the row or a dedicated button.
- Destructive actions (delete) are secondary and visually de-emphasized.
- Pagination is visible and includes: current page, total items, items-per-page selector.
- Sortable columns indicate sort direction clearly.
- Filters and search are above the table, not hidden in a sidebar.
- When a filter returns no results, show the empty state — not just an empty table.

---

## 9. Accessibility Baseline

These are minimum requirements, not a full WCAG audit:

- All interactive elements are keyboard-navigable (Tab, Enter, Space, Arrow keys where appropriate).
- Focus state is always visible. Never `outline: none` without an alternative.
- All form fields have associated `<label>` elements (not just `placeholder`).
- All images have `alt` attributes. Decorative images use `alt=""`.
- Color is never the only indicator of state (error, success, selected). Always pair with text or icon.
- Contrast ratio: minimum 4.5:1 for body text, 3:1 for large text (WCAG AA).
- Screen reader: headings structure the page logically. `aria-label` on icon-only buttons.
- Modal dialogs trap focus while open and return focus to the trigger on close.

---

## 10. Responsive Design

- Admin interfaces must be usable on tablets (minimum 768px wide). Full desktop optimization is the priority.
- Public-facing pages must be fully responsive down to 375px (iPhone SE baseline).
- Touch targets minimum 44×44px on touch-capable screens.
- Tables that cannot fit narrow screens must scroll horizontally, not overflow.
- Never rely on hover-only interactions for critical functionality. Hover is an enhancement, not a requirement.

---

## 11. Language and Labels

- Interface language is clear, direct, and non-technical.
- Use the user's domain vocabulary, not system/developer vocabulary.
  - "Publish" not "Set status to active"
  - "Remove from list" not "Delete relationship record"
  - "Scheduled for" not "Queued at timestamp"
- Avoid jargon unless it is standard in the user's professional context.
- Date and time formats match the user's locale. Never show raw ISO timestamps to end users.
- Numeric formats (currency, large numbers) use locale-appropriate separators.
