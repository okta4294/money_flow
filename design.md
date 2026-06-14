# Phantom UI - Design System

Phantom UI is a futuristic, high-fidelity design system crafted for the **Money Flow** application. It blends modern fintech aesthetics with glassmorphism, neon accents, and a deep space-inspired color palette to create a premium, immersive financial management experience.

## 1. Visual Identity & Mood
- **Aesthetic**: Futuristic Fintech / Cyber-Glow / Glassmorphism.
- **Key Characteristics**: Deep contrast, multi-layered transparency (glass), vibrant primary accents, and subtle animations.
- **Surface Strategy**: Using deep navy backgrounds to reduce eye strain while making data "pop" with neon highlights.

## 2. Color Palette

### Base Surfaces
- **Surface**: `#0b1326` (Deep Navy) - The foundation of the dark mode.
- **Surface Bright**: `#31394e` - Used for elevated containers and interactive cards.
- **Surface Container Lowest**: `#060d20` - For deep background layers.

### Brand & Accents
- **Primary (Electric Teal)**: `#00f5ff` - Used for growth, positive balances, and primary CTAs. Includes a `drop-shadow` glow effect for high emphasis.
- **Secondary (Vivid Purple)**: Used for AI features, "Financial Roasting," and navigational highlights.
- **Error (Sunset Red)**: Used for expenses, negative trends, and critical alerts.

## 3. Typography
- **Primary Font**: **Inter** (Sans-serif).
- **Scale**:
  - **Display**: Large, bold titles for high-level figures (e.g., total balance).
  - **Headlines**: Semi-bold, used for section titles and card headers.
  - **Body**: Regular weight for lists and secondary info, optimized for legibility against dark backgrounds.
  - **Labels**: Small, often uppercase or medium weight for metadata and navigation.

## 4. Components & Patterns

### Containers (Glassmorphism)
- **Style**: Background blur (`backdrop-blur-xl`), subtle white borders (`border-white/10`), and semi-transparent fills.
- **Shadows**: Soft, deep shadows to create depth without feeling heavy.

### Navigation
- **Mobile (BottomNavBar)**: 5-item fixed bar with Home, History, Categories, Accounts, and Debt. Active state features a neon glow and icon scale-up.
- **Desktop (SideNavBar)**: Persistent sidebar with clear iconography and a "Glassy" active state highlight.

### Buttons & CTAs
- **Primary**: Full-width or large pill shapes with `#00f5ff` background or border and a neon outer glow.
- **Secondary**: Transparent background with a subtle border or glass effect.

### Form Fields
- **Inputs**: Minimalist borders, dark backgrounds, and integrated iconography. Focused states trigger a teal highlight.

## 5. Spacing & Grid
- **Scale**: 8px base grid (ROUND_EIGHT).
- **Mobile Margins**: 16px to 24px gutter.
- **Desktop Margins**: 32px to 48px standard margin.
- **Stacking**: Consistent vertical spacing between cards (12px - 16px).

## 6. Interaction Principles
- **Feedback**: Scale transitions on press, subtle opacity shifts on hover.
- **Hierarchy**: Financial figures are always the highest contrast element on the screen.
