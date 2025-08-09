# Learn Anything. 🌊

> This project is built purely for educational and research purposes, for commercial uses please purchase a LICENSE.

> ⚠️ Project is experimental and not intended for daily use or production use yet.

DevTool to learn anything with AI.

## 🚀 Local Installation

To install the `lean` command locally and make it available system-wide:

```bash
npm run install:local
```

After installation, restart your terminal or run:

```bash
source ~/.zshrc  # or ~/.bashrc depending on your shell
```

Then you can use the `lean` command anywhere:

```bash
lean --help
lean ask "How does machine learning work?"
lean explain "quantum computing"
lean chat
lean # same as 'lean chat'
```

## 📖 Usage

The `lean` command provides several ways to interact with AI for learning:

- `lean ask <query>` - Get direct answers to your questions.
- `lean explain <topic>` - Get detailed explanations of complex topics.
- `lean teach <topic>` - Get structured learning content like a book chapter.
- `lean analyze <query>` - Perform multi-step reasoning and analysis.
- `lean chat [topic]` - Start an interactive conversation.
- `lean setup` - Configure your API keys and preferences.

## 🛠️ Development

For development, you can run the CLI directly:

```bash
npm install
npx tsx src/cli.ts --help
```
