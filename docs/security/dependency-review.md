# Dependency review

JavaScript and Rust dependencies are locked. CI runs high-severity pnpm audit, Rust checks and gitleaks. Updates require the full test/build suite. These are internal point-in-time controls, not an independent audit.
