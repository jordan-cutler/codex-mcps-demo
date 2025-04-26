**codex-mcps-demo**

# Try it out
1. Clone the repo via `git clone https://github.com/jordan-cutler/codex-mcps-demo.git`
2. Create a `.env` file and set `ANTHROPIC_API_KEY` to your API key from the [Anthropic console](https://console.anthropic.com/settings/keys).
3. Ensure you're on Node 22. Run `nvm install 22 && nvm alias default 22 && nvm use 22`
4. Ensure you have `pnpm` installed via `npm i -g pnpm`.
5. Run `pnpm install` to install dependencies
6. Run `npm install -g @anthropic-ai/claude-code` [per instructions](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview)
7. Run `node --experimental-strip-types scripts/claudeDiagram.ts <inputFolder>`. For example, `node --experimental-strip-types scripts/claudeDiagram.ts folder-samples/slack`.
8. You should see the `outputs/` folder update as Claude runs. Once it's finished, it will output a `diagram.ai.md` file to `<inputFolder>/diagram.ai.md`. For example, [here's a commit from running it on folder-samples/slack](https://github.com/jordan-cutler/codex-mcps-demo/commit/df4fdc762bb48761d9184e92e851bf8d75db42a7)

> [!NOTE]
> From the `.claude/settings.json` file, Claude has access to bash commands. Run the script at your own risk.

# Future expansion
There is a Github action in `.github/workflows/claude-diagram.yml` which runs the Claude script on a hardcoded folder (`folder-samples/slack`). This could be modified to only pass in any folders which have changed from the most recent push. Doing this would auto-generate documentation for every changed folder in the codebase as engineers commit to it.

You may or may not want to do this for your own reasons 😄