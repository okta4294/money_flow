---
name: Phantom UI
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394e'
  surface-container-lowest: '#060d20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3e'
  surface-container-highest: '#2d3449'
  on-surface: '#dbe2fd'
  on-surface-variant: '#b9caca'
  inverse-surface: '#dbe2fd'
  inverse-on-surface: '#283044'
  outline: '#849495'
  outline-variant: '#3a494a'
  surface-tint: '#00dce5'
  primary: '#e9feff'
  on-primary: '#003739'
  primary-container: '#00f5ff'
  on-primary-container: '#006c71'
  inverse-primary: '#00696e'
  secondary: '#ddb7ff'
  on-secondary: '#490080'
  secondary-container: '#6f00be'
  on-secondary-container: '#d6a9ff'
  tertiary: '#fafaff'
  on-tertiary: '#263143'
  tertiary-container: '#d3def6'
  on-tertiary-container: '#576276'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#63f7ff'
  primary-fixed-dim: '#00dce5'
  on-primary-fixed: '#002021'
  on-primary-fixed-variant: '#004f53'
  secondary-fixed: '#f0dbff'
  secondary-fixed-dim: '#ddb7ff'
  on-secondary-fixed: '#2c0051'
  on-secondary-fixed-variant: '#6900b3'
  tertiary-fixed: '#d8e3fb'
  tertiary-fixed-dim: '#bcc7de'
  on-tertiary-fixed: '#111c2d'
  on-tertiary-fixed-variant: '#3c475a'
  background: '#0b1326'
  on-background: '#dbe2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding-desktop: 32px
  container-padding-mobile: 16px
  gutter: 24px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style
The design system adopts a **Phantom UI** aesthetic, tailored for high-end financial interfaces that require a sense of depth, precision, and technological sophistication. The brand personality is ethereal yet controlled, evoking the feeling of a glass-paneled cockpit in a futuristic environment.

The visual direction centers on **Advanced Glassmorphism**. This style moves beyond simple transparency, utilizing heavy backdrop blurs, multi-layered translucency, and light-refraction simulations. By layering "ghost" surfaces over a deep, dark abyss, we create a hierarchy based on light and clarity rather than just color. The emotional response should be one of focused calm, trust in complex data, and a premium, cutting-edge experience.

## Colors
The palette is rooted in deep space. The base environment uses **Deep Navy (#0B1326)** to provide a canvas where light can truly pop.

- **Primary (Electric Teal):** Used exclusively for high-priority data points, active states, and "glow" signatures. It represents growth and liquidity.
- **Secondary (Vivid Purple):** Used for secondary actions, sophisticated accents, and trend indicators.
- **Surface Strategy:** Surfaces are built using translucent layers. Instead of solid grays, we use varied opacities of white and navy over the background to create "tinted glass."
- **Accents:** Use glows (box-shadow with high spread and low opacity) rather than solid fills to maintain the "Phantom" light-based aesthetic.

## Typography
This design system utilizes **Inter** as a variable font to maximize legibility against complex, blurred backgrounds. 

- **Weight as Hierarchy:** Use Bold (700) for large display numbers to ensure they "punch through" the glass effects. Use Medium (500) for labels to maintain crispness.
- **Data Clarity:** For financial figures, enable tabular lining (`tnum`) to ensure columns of numbers align perfectly.
- **Contrast:** On translucent surfaces, use pure white (#FFFFFF) for primary text and a 60% white opacity for secondary/meta text to maintain a natural "etched" look.

## Layout & Spacing
The layout follows a **Fluid Grid** model with generous internal safe areas to prevent the glass refraction from making the content feel cluttered.

- **Desktop:** 12-column grid, 24px gutters, 32px side margins.
- **Tablet:** 8-column grid, 16px gutters, 24px side margins.
- **Mobile:** 4-column grid, 12px gutters, 16px side margins.

Spacing should be used to create distinct "islands" of information. Because elements have deep shadows and blurs, they require more "breathing room" (at least 24px) between containers to prevent visual overlap of their glow effects.

## Elevation & Depth
Depth is the core of this design system. It is achieved through a 3-layer approach:

1.  **The Void (Level 0):** The base background (#0B1326).
2.  **The Phantom Layer (Level 1):** Floating cards with `backdrop-blur-2xl`, a 10% white border, and a subtle inner glow (white, 5% opacity).
3.  **The Focus Layer (Level 2):** Modals or active tooltips. These have increased transparency, a more pronounced 1px border, and a deep, soft shadow (30px blur, 0.4 opacity) tinted with the Primary Electric Teal.

**Inner Glow:** Apply a `1px` inset box shadow to all glass containers to simulate light catching the edge of the glass.

## Shapes
The shape language is **Rounded**, favoring a sophisticated 0.5rem (8px) radius for standard components. Larger containers like dashboard cards should use `rounded-xl` (1.5rem) to soften the overall technical aesthetic and make the glass panes feel like polished objects. Use full "pill" rounding only for status tags or small toggle switches.

## Components

### Buttons
- **Primary:** Semi-transparent Electric Teal fill (80% opacity) with a 100% teal glow on hover. Text is dark navy (#0B1326) for maximum contrast.
- **Ghost:** Transparent background with a 1px `border-white/20`. On hover, scale 102% and increase border opacity.

### Cards
- Use `backdrop-filter: blur(40px)` and a background of `rgba(255, 255, 255, 0.03)`.
- Borders must be `1px solid rgba(255, 255, 255, 0.1)`.

### Input Fields
- Dark, recessed appearance using an inner shadow to look "carved" into the glass.
- Active state: The border transitions to Electric Teal with a subtle outer neon glow.

### Chips & Badges
- Small, pill-shaped elements with low-opacity fills of the accent color (e.g., 10% Purple) and high-contrast text.

### Interactions
- **The Scale Effect:** Any clickable element should subtly scale up (1.02x) on hover to reinforce the feeling of floating.
- **Active Glow:** When a component is "active," it should emit a soft glow of its primary color onto the layer beneath it.
