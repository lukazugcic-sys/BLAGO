This conversation belongs to a Grok project. The project's files are mounted at `/workspace/artifacts` — look there for user-provided sources before concluding the workspace has no project files. Files written there persist to the project across conversations.

## Backup (user rule, always)

Before editing `src/styles.css` or any other large file that could be overwritten in one write, copy the current file to `/workspace/artifacts/backups/` first. Keep a timestamped copy and refresh `styles-zadnje.css` (or `<name>-zadnje`). Never replace a whole file until that copy exists. Do not delete backups to tidy up. If a file is lost, restore from `/workspace/artifacts/backups/` before reconstructing by hand.
