How to finish enabling the Cline AI agent for this workspace

1) Install the extension

- Open VS Code -> Extensions view and search for "Cline" (saoudrizwan.claude-dev) and click Install.
- If you prefer the command-line and have the `code` CLI installed, run:

```bash
code --install-extension saoudrizwan.claude-dev
```

If `code` is not found, enable it: Command Palette -> "Shell Command: Install 'code' command in PATH".

2) Provide your API key / provider

- Open Command Palette and search for "Cline" or open Settings -> Extensions -> Cline.
- Use the extension UI to set your API provider and store your API key in VS Code Secret Storage.

3) Allow agent permissions

- When Cline first attempts to edit files or run commands it will ask for permission. Approve prompts for it to operate like an in-IDE assistant.

4) Work across multiple repos (optional)

- Add your Spring Boot repo to this workspace: File -> Add Folder to Workspace... -> select your backend repo folder.
- Save the workspace: File -> Save Workspace As... to persist the multi-root setup.

5) Troubleshooting quick tips

- If the extension doesn't appear in the Activity Bar, reload the window (Cmd/Ctrl+R) or restart VS Code.
- If you don't want to store secrets in Settings, use the extension's Secret Storage or provide credentials via environment variables when prompted.

If you want, tell me the path to your Spring Boot repo and I will add it to the workspace file (`eatscm2.code-workspace`) so both projects open together.
