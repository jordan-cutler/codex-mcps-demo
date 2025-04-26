**codex-mcps-demo**

# Try it out
1. Clone the repo via `git clone https://github.com/jordan-cutler/codex-mcps-demo.git`
2. Ensure you're on Node 22. Run `nvm install 22 && nvm alias default 22 && nvm use 22`
3. Ensure you have `pnpm` installed via `npm i -g pnpm`.
4. Run `pnpm install` to install dependencies
5. Run `npm install -g @anthropic-ai/claude-code` [per instructions](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview)
6. Run `node --experimental-strip-types scripts/claudeDiagram.ts <inputFolder>`. For example, `node --experimental-strip-types scripts/claudeDiagram.ts folder-samples/slack`.
7. You should see the `outputs/` folder update as Claude runs. Once it's finished, it will output a `diagram.ai.md` file to `<inputFolder>/diagram.ai.md`. For example, [here's a commit from running it on folder-samples/slack](https://github.com/jordan-cutler/codex-mcps-demo/commit/df4fdc762bb48761d9184e92e851bf8d75db42a7)
