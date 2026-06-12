# Changelog - Barakha Capital

All notable changes and bug fixes implemented in this update.

## [v1.1.0] - 2026-06-12

### 🔄 Rebranding
- **Name Change**: Officially migrated the platform name from **FundTrack** to **Barakha Capital**.
- **Branding**:
  - Updated page `<title>` and metadata in `layout.js`.
  - Replaced all header and sidebar logos from `FT.` to `BC.`.
  - Cleaned up login screen branding and removed version suffixes (`v2.0` -> `Barakha Capital`).

### 📈 Chart & Timeline Fixes
- **NAV Chart Behavior**: Fixed the client performance chart to display **actual NAV values** instead of rebasing to `100` every time a timeline range (1M, 6M, 1Y, etc.) is switched.
- **Fair Comparison**: Rebased the Nifty 50 benchmark to start at the fund's initial NAV for the selected timeframe. This ensures visual alignment without distorting the actual NAV value.
- **UI Enhancements**: Added `₹` prefix to the Y-axis of the chart and updated the helper legend.

### 💼 Portfolio & Holding Fixes
- **Negative Invested Balance**: Resolved a critical mathematical edge-case where a client who fully withdrew their positions after making profits ended up with a negative invested amount (e.g., Invested: `-₹2,000`). Now, both units and invested amount are cleanly clamped to `0` upon full exit.
- **Sectors Expansion**: Expanded the available holdings sectors list from 10 to **25+ comprehensive Indian market sectors** (NBFCs, Defence & Aerospace, Auto Components, Chemicals, etc.), grouped cleanly under optgroups.

### 🎨 UI & UX Improvements
- **Dropdown Visibility**: Fixed the select option styles. Translucent backgrounds on native HTML select options made dropdown lists nearly invisible on some systems. Dropdowns now have a solid `#111616` background with clear white text and high-contrast hovered states.

### ⚡ Performance Optimization
- **Batch Database Updates**: Rewrote Yahoo Finance price sync procedures in both the manual Admin sync and the automated background cron routine. Multiple individual row updates inside a loop are now batched into a single `.upsert()` query, dramatically reducing database load and network request overhead.
