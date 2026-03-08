# CLAUDE.md

Please follow the guidelines and project structure defined in ./AGENTS.md

For Cursor and other agents: Refer to .cursor/rules/ for detailed configuration.

Always use Context7 MCP when I need library/API documentation, code generation, setup or configuration steps.

## Design Context

### Users
Individual health enthusiasts tracking their own wearable data from multiple devices (Whoop, Apple Watch, Garmin, Oura, etc.). They open the dashboard to understand their body — sleep quality, recovery, heart health, activity. They are data-literate but not developers. Context: checking health status on desktop, usually morning or evening.

### Brand Personality
**Futuristic. Precise. Empowering.**

The interface should feel like a personal biometric command center — you are in control of your biology. Data is presented with authority and clarity, never with anxiety or clinical coldness. The tone is confident and forward-looking, like technology from 5 years in the future that you get to use today.

### Aesthetic Direction
- **Theme**: Dark-only. "Electric Neon" / "HealthOS" design system
- **Palette**: Near-black backgrounds (#1A1A20), neon cyan (#00E5FF) as primary, magenta (#FF33AA) as secondary, electric purple (#9933FF) as accent. Signal-specific colors for health metrics (indigo for sleep, emerald for activity, amber for recovery, pink for heart)
- **Typography**: Inter with OpenType features (cv02, cv03, cv04, cv11). Tabular nums for data. 10px uppercase tracking-wider for labels. Bold large numbers for hero metrics
- **Surfaces**: Glass-panel morphism (rgba backdrop-blur with subtle cyan border glow). No solid white cards. Depth through transparency layers, not shadows
- **Data viz**: Ring/arc progress indicators, spark lines, gradient fills. Glow effects on active data. Animated number tickers for live feel
- **Motion**: Framer Motion for staggered reveals, spring physics on progress bars, pulse-dot animations for "live" indicators. Subtle — never distracting
- **Icons**: Lucide React exclusively. No emoji in UI (use Lucide equivalents)
- **3D**: Three.js biometric avatar with floating data markers. Sci-fi scan aesthetic with corner brackets and sweep animations
- **References**: Whoop app (dark, performance-focused, recovery/strain), Apple Health + Oura (clean ring scores, elegant data viz)
- **Anti-references**: No generic SaaS dashboards (white cards, corporate blue). No medical/clinical aesthetic (hospital-green, sterile whites). No cluttered fitness-app feel

### Design Principles

1. **Data is the hero** — Every pixel serves the number. Large, bold metric values with subtle supporting context. If a component doesn't make data clearer, remove it.

2. **Dark with purpose** — Black isn't absence, it's a canvas. Use darkness to make neon data pop. Glass panels create depth. Glow effects signal importance, not decoration.

3. **Confidence over anxiety** — Present health data as empowering, not alarming. Green/cyan for positive states. Neutral language. Scores feel like achievements, not diagnoses.

4. **Source transparency** — Always show where data comes from (Whoop, Apple Health, Garmin). SourceBadge on every metric. Users trust data they can trace.

5. **Progressive density** — Signal cards at the top for at-a-glance. Detailed metric grids below for drill-down. The overview should be scannable in 3 seconds, explorable in 30.
