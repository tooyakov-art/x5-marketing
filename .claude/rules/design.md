# Frontend Design Rules

Based on Anthropic's frontend-design skill. Apply when creating UI components.

## Before Coding

1. **Purpose**: What problem does this solve? Who uses it?
2. **Tone**: Pick a clear aesthetic direction
3. **Differentiator**: What makes this memorable?

## Anti-Patterns (NEVER USE)

### Typography
- ❌ Inter, Roboto, Arial, system fonts
- ❌ Generic font stacks
- ✅ Distinctive, characterful fonts
- ✅ Display font + refined body font pairing

### Colors
- ❌ Purple gradients on white
- ❌ Timid, evenly-distributed palettes
- ❌ Generic blue buttons
- ✅ Dominant color + sharp accents
- ✅ CSS variables for consistency
- ✅ Cohesive theme commitment

### Layout
- ❌ Everything centered
- ❌ Cookie-cutter card grids
- ❌ Predictable symmetric layouts
- ✅ Asymmetry, overlap, diagonal flow
- ✅ Grid-breaking elements
- ✅ Generous negative space OR controlled density

### Components
- ❌ Uniform rounded corners everywhere
- ❌ Generic shadows
- ❌ Stock icons without customization
- ✅ Intentional border-radius variation
- ✅ Contextual shadows and depth
- ✅ Custom or curated icon sets

## Motion & Animation

**High-impact moments**:
- Page load with staggered reveals (animation-delay)
- Scroll-triggered effects
- Hover states that surprise

**Implementation**:
- CSS-only for simple effects
- Framer Motion for React components
- Purposeful, not decorative

## Visual Details

Add atmosphere and depth:
- Gradient meshes
- Noise textures
- Geometric patterns
- Layered transparencies
- Custom cursors (where appropriate)
- Grain overlays

## X5 Marketing Brand

Current palette:
- Primary: Deep blue/purple gradients
- Accent: Bright highlights
- Background: Dark mode preferred

**Maintain consistency** with existing views when adding new ones.

## Complexity Matching

| Design Type | Code Approach |
|-------------|---------------|
| Maximalist | Elaborate animations, many effects |
| Minimalist | Restraint, precision, subtle details |

The key is **intentionality**, not intensity.

## Quality Standard

Every UI should feel:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with clear aesthetic POV
- Meticulously refined in every detail
