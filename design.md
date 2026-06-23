# Neo-Brutalist UI - Design System

The Neo-Brutalist UI is a bold, unapologetic, and highly legible design system crafted for the **Money Flow** application. It embraces the raw aesthetics of early web design but modernizes it with high-contrast colors, thick borders, and hard shadows to create a vibrant and engaging financial management experience.

## 1. Visual Identity & Mood
- **Aesthetic**: Neo-Brutalism / High-Contrast / Playful / Raw.
- **Key Characteristics**: Thick borders (`neo-brutalist-border`), stark background colors, hard-edged shadows (no blur), and bold typography.
- **Surface Strategy**: Using stark white or light gray surfaces in light mode and near black or dark gray in dark mode, contrasted with extremely vibrant semantic colors.

## 2. Color Palette

### Base Surfaces
- **Light Mode**:
  - **Surface**: `#f8f9fa` (Off-white) - Main background.
  - **Surface Bright**: `#ffffff` (Pure White) - For elevated cards.
  - **Surface Container**: `#f0eded` - For secondary sections.
- **Dark Mode**:
  - **Surface**: `#131313` (Near Black) - Main background.
  - **Surface Bright**: `#2a2a2a` - For elevated cards.
  - **Surface Container**: `#1e1e1e` - For secondary sections.

### Semantic & Accent Colors
- **Primary (Income/Positive)**:
  - Container: `#ffe170` (Bright Yellow, Light Mode) / `#c3f400` (Lime Green, Dark Mode)
  - Text: Dark Yellow-Brown (Light) / Lime Green (Dark)
- **Tertiary (Expense/Negative)**:
  - Container: `#ffdad7` (Light Pink, Light Mode) / `#ffd7f0` (Pink, Dark Mode)
  - Text: Crimson Red (Light) / Pink (Dark)
- **Secondary (Neutral/Transfer)**:
  - Container: `#e6def8` (Lavender, Light Mode) / `#e8def8` (Light Purple, Dark Mode)

## 3. Typography
- **Primary Font**: **Plus Jakarta Sans** (Sans-serif).
- **Scale**:
  - **Display**: Massive, tightly tracked titles for hero numbers (`text-[80px]`).
  - **Headlines**: Bold, heavy weight for section headers (`font-headline-md`).
  - **Body**: Highly legible, slightly larger base size.
  - **Labels**: Small, uppercase, heavily tracked (`tracking-widest`), and bold (`font-label-bold`).

## 4. Components & Patterns

### Containers (Cards & Panels)
- **Style**: Solid background colors with thick borders (`border-2` or `border-[3px]`).
- **Shadows**: Hard shadows (`neo-brutalist-shadow`) using `box-shadow: 4px 4px 0px 0px rgba(...)` (black in light mode, lighter variants in dark mode). No blur radius.
- **Corners**: Rounded corners (`rounded-xl` or `rounded-2xl`) combined with hard shadows for a playful yet structured look.

### Buttons & Interactive Elements
- **Style**: Thick borders, vibrant backgrounds.
- **Feedback**: 
  - `hover`: Translation (move up/left) and shadow expansion.
  - `active`: Button presses down (`translate-x-1 translate-y-1`) and shadow disappears, giving a tactile "click" feel (`active-press` utility).

### Forms & Inputs
- **Inputs**: Flat, thick borders, solid background. High-contrast focus states (thickened borders or bright outlines).

## 5. Spacing & Grid
- **Layout**: CSS Grid (`grid-cols-12` for Dashboard Bento layout) and Flexbox.
- **Padding/Margin**: Generous padding (`p-6`, `p-8`) inside cards to let content breathe despite the heavy borders.

## 6. Contrast & Accessibility Rules
- Containers with vibrant backgrounds (e.g., `bg-primary-container`, `bg-white`) must always use high-contrast text (e.g., `text-black` or `text-on-primary-container`).
- Dynamic themes (Light/Dark) must ensure that borders and hard shadows adapt (dark in light mode, light in dark mode).
