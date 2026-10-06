Cline (IDE agent) — Quick setup

1) Install the extension

 - From VS Code Extensions view, search for "Cline" and install `saoudrizwan.claude-dev`.
 - Or from a terminal (if `code` CLI is available):

```bash
code --install-extension saoudrizwan.claude-dev
```

2) Enable/configure Cline for this workspace

- Open Settings -> Extensions -> Cline and provide your preferred model/provider and API key.
- The extension may accept an API key via the Settings UI or using VS Code's Secret Storage. Do NOT paste secrets into chat.

3) Using Cline across multiple repos (Angular + Spring Boot)

- Use a multi-root workspace to work on both repos at once:
  - In VS Code: File -> Add Folder to Workspace... -> choose this Angular folder and your Spring Boot repo folder.
  - Then File -> Save Workspace As... and save a `.code-workspace` file (example provided).

4) If the extension exposes CLI or project config, follow its docs (open extension page for details).

5) Security note

- Use VS Code Secret Storage or OS environment variables to store API keys; avoid committing keys to git.

If you want, I can create the multi-root workspace file and a starter `.vscode/settings.json` with non-sensitive defaults.
