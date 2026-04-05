# Security Policy

## Supported Versions

| Version | Support Status |
|---------|---------------|
| 0.9.x (current) | Full support — security and bug fixes |
| < 0.9 | No longer supported |

## Reporting a Vulnerability

**Do not open a public GitHub Issue for security vulnerabilities.**

Report security issues privately via [GitHub Security Advisories](https://github.com/ek33450505/forge/security/advisories/new).
This keeps the details confidential until a fix is released.

### What to include

- Forge version (visible in the app title bar or `tauri.conf.json`)
- Operating system and version
- The component involved (PTY backend, IPC handler, frontend, dependency)
- Steps to reproduce
- Potential impact assessment

### Response timeline

| Severity | Acknowledgement | Target remediation |
|----------|-----------------|--------------------|
| Critical | 48 hours | 14 days |
| High | 48 hours | 30 days |
| Medium/Low | 5 business days | Next release |

We will keep you updated throughout the remediation process and credit you in the release notes unless you prefer to remain anonymous.

---

## Threat Model

Forge is a native desktop terminal emulator. The following areas are in scope for security review:

### PTY boundary

Forge spawns a PTY (pseudoterminal) process per session using `portable-pty`. The PTY runs with the same OS permissions as the user who launched Forge. There is no sandboxing of commands executed within the terminal — this is by design for a general-purpose terminal emulator. Vulnerabilities that allow unexpected privilege escalation or shell escape outside the expected PTY context are in scope.

### IPC security

The Tauri frontend communicates with the Rust backend via Tauri's IPC channel. All IPC commands exposed via `#[tauri::command]` are listed in `src-tauri/src/lib.rs`. Vulnerabilities that allow the frontend renderer (or injected scripts) to invoke IPC commands outside the declared capability set are in scope. See `src-tauri/capabilities/` for the declared capability manifest.

### Dependency chain

Forge depends on `portable-pty`, `rusqlite`, Tauri v2, and the Node/npm dependency graph. Vulnerabilities in these upstream dependencies that have a realistic exploitation path through Forge should be reported here so we can coordinate upgrades. Purely theoretical upstream CVEs with no exploitation path may be tracked as issues rather than advisories.

---

## Out of Scope

The following are not in scope for this security policy:

- Social engineering attacks
- Physical access attacks
- Vulnerabilities in the Claude API or Claude Code itself — report to [Anthropic](https://www.anthropic.com/security)
- Vulnerabilities in Tauri, portable-pty, or other third-party dependencies that do not have a realistic exploitation path through Forge — report to those projects directly
- Commands executed by the user within the terminal (the terminal is intentionally unrestricted)

## Disclosure Policy

We follow [responsible disclosure](https://en.wikipedia.org/wiki/Responsible_disclosure). Once a fix is available, we will:

1. Release the patched version
2. Publish a security advisory with CVE (if applicable)
3. Credit the reporter (with permission)
