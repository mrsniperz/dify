## Claude Code Hooks 编写指南

> 本指南基于官方“Claude Code hooks 入门指南”，并结合本项目的目录与实践约定整理而成。请在使用前通读安全注意事项。参考来源：[Claude Code hooks 入门指南](https://docs.claude.com/zh-CN/docs/claude-code/hooks-guide).

### 什么是 Hook

Claude Code hooks 是在代理工作流生命周期的关键时点触发的“用户自定义 shell 命令”。借助 hooks，你可以对代理行为进行确定性控制（如强制格式化、记录审计日志、保护敏感文件等），而不是把这些步骤仅作为提示建议。

- **执行时机**：随事件触发，自动运行，使用当前会话环境与凭据。
- **作用范围**：按工具、事件进行精确匹配，可全局（用户级）或项目级生效。
- **安全性**：与在本机直接运行脚本等价，必须严格审查 hook 内容与依赖。

### Hook 事件

常见事件及含义（摘自官方文档，详见上方参考链接）：

- **PreToolUse**：工具调用前运行；可阻止后续调用（返回非 0 退出码即视为阻止）。
- **PostToolUse**：工具调用完成后运行；常用于格式化、校验、通知。
- **UserPromptSubmit**：用户提交提示词后、Claude 处理前运行。
- **Notification**：Claude Code 发送通知时运行。
- **Stop**：Claude Code 完成一次响应时运行。
- **SubagentStop**：子代理任务完成时运行。
- **PreCompact**：即将压缩上下文时运行。
- **SessionStart**：新会话开始或恢复时运行。
- **SessionEnd**：会话结束时运行。

以上事件的输入数据结构与可控能力各不相同；具体字段与行为边界请参阅官方参考文档（见上方引用链接）。

## 快速开始（从 0 到 1）

> 摘要自官方入门流程并本地化到本项目实践。原始步骤请参考：[hooks 入门指南](https://docs.claude.com/zh-CN/docs/claude-code/hooks-guide).

### 前置

- 安装 `jq`（命令行 JSON 处理）。

### 步骤 1：打开 hooks 配置

- 在 REPL 中运行斜杠命令 `/hooks`，选择事件 `PreToolUse`。

### 步骤 2：添加匹配器（matcher）

- 选择 “+ Add new matcher…”，示例填写 `Bash`（仅在 Bash 工具调用时触发）。
- 若要匹配全部工具，使用 `*`。

### 步骤 3：添加 hook 命令

- 选择 “+ Add new hook…”，输入示例命令（记录即将运行的 Bash 命令至日志）：

```bash
jq -r '"\(.tool_input.command) - \(.tool_input.description // "No description")"' >> ~/.claude/bash-command-log.txt
```

### 步骤 4：保存配置

- 存储位置选 **User settings**（记录落到用户主目录，跨项目生效）。

### 步骤 5：验证配置

- 重新运行 `/hooks` 或检查 `~/.claude/settings.json`，配置示例如下：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '\"\\(.tool_input.command) - \\(.tool_input.description // \"No description\")\"' >> ~/.claude/bash-command-log.txt"
          }
        ]
      }
    ]
  }
}
```

### 步骤 6：测试 hook

- 让 Claude 运行简单命令（如 `ls`），然后查看日志：

```bash
cat ~/.claude/bash-command-log.txt
```

预期：出现类似 `ls - Lists files and directories` 的记录。

## 匹配器与配置存储

- **matcher 语法**：
  - 指定单个工具：如 `Bash`
  - 匹配多个工具：使用正则并列，如 `Edit|Write`
  - 匹配全部工具：`*`
- **存储位置**：
  - 用户级：`~/.claude/settings.json`（全局生效）。
  - 项目级：本仓库的 `.claude/settings.local.json`（仅对当前项目生效）。

## 常用示例

> 以下示例均来自或改编自官方指南：[hooks 入门指南](https://docs.claude.com/zh-CN/docs/claude-code/hooks-guide)。请按需拷贝到用户级或项目级设置中。

### 1) 代码格式化（TypeScript）

在每次文件编辑后自动对 `.ts` 文件运行 Prettier：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | { read file_path; if echo \"$file_path\" | grep -q '\\\\.ts$'; then npx prettier --write \"$file_path\"; fi; }"
          }
        ]
      }
    ]
  }
}
```

### 2) Markdown 格式化（自动补语言标签）

项目级配置（调用项目内脚本）：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/markdown_formatter.py"
          }
        ]
      }
    ]
  }
}
```

脚本放置于 `.claude/hooks/markdown_formatter.py`，示例内容：

```python
#!/usr/bin/env python3
"""
Markdown formatter for Claude Code output.
Fixes missing language tags and spacing issues while preserving code content.
"""
import json
import sys
import re
import os

def detect_language(code):
    s = code.strip()
    if re.search(r'^\s*[{\[]', s):
        try:
            json.loads(s)
            return 'json'
        except Exception:
            pass
    if re.search(r'^\s*def\s+\w+\s*\(', s, re.M) or re.search(r'^\s*(import|from)\s+\w+', s, re.M):
        return 'python'
    if re.search(r'\b(function\s+\w+\s*\(|const\s+\w+\s*=)', s) or re.search(r'=>|console\.(log|error)', s):
        return 'javascript'
    if re.search(r'^#!.*\b(bash|sh)\b', s, re.M) or re.search(r'\b(if|then|fi|for|in|do|done)\b', s):
        return 'bash'
    if re.search(r'\b(SELECT|INSERT|UPDATE|DELETE|CREATE)\s+', s, re.I):
        return 'sql'
    return 'text'

def format_markdown(content):
    def add_lang_to_fence(match):
        indent, info, body, closing = match.groups()
        if not info.strip():
            lang = detect_language(body)
            return f"{indent}```{lang}\n{body}{closing}\n"
        return match.group(0)

    fence_pattern = r'(?ms)^([ \t]{0,3})```([^\n]*)\n(.*?)(\n\1```)\s*$'
    content = re.sub(fence_pattern, add_lang_to_fence, content)
    content = re.sub(r'\n{3,}', '\n\n', content)
    return content.rstrip() + '\n'

try:
    input_data = json.load(sys.stdin)
    file_path = input_data.get('tool_input', {}).get('file_path', '')
    if not file_path.endswith(('.md', '.mdx')):
        sys.exit(0)
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        formatted = format_markdown(content)
        if formatted != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(formatted)
            print(f"✓ Fixed markdown formatting in {file_path}")
except Exception as e:
    print(f"Error formatting markdown: {e}", file=sys.stderr)
    sys.exit(1)
```

将其设为可执行：

```bash
chmod +x .claude/hooks/markdown_formatter.py
```

### 3) 自定义通知

在需要输入时发送桌面通知（基于 `notify-send`）：

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "notify-send 'Claude Code' 'Awaiting your input'" }
        ]
      }
    ]
  }
}
```

### 4) 文件保护（阻止敏感文件编辑）

在提交编辑/写入前阻止特定文件：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "python3 -c \"import json, sys; data=json.load(sys.stdin); path=data.get('tool_input',{}).get('file_path',''); sys.exit(2 if any(p in path for p in ['.env', 'package-lock.json', '.git/']) else 0)\""
          }
        ]
      }
    ]
  }
}
```

说明：在 **PreToolUse** 中返回非 0 退出码会阻止该工具继续执行；示例中使用 `2` 明确表示“拒绝”。

## 最佳实践与安全

- **最小权限**：仅对需要的事件和工具加 hook；避免广泛匹配 `*`。
- **脚本审计**：所有 hook 命令与脚本在注册前需审查；不信任来源禁止使用。
- **隔离与路径**：项目自带脚本建议放置在 `.claude/hooks/`，并在命令中使用 `"$CLAUDE_PROJECT_DIR"` 以确保在正确项目根运行。
- **依赖管理**：明确格式化器、`jq`、`notify-send`、`python3`、`npx` 等依赖的安装方式与版本。
- **可观察性**：为关键 hook 添加日志输出与错误处理（`set -euo pipefail`、退出码、stderr 提示）。
- **阻断策略**：在 **PreToolUse** 使用退出码阻止风险操作，并给出清晰提示信息（建议标准化错误消息）。

## 调试与排错

- 使用 `/hooks` 可视化查看与编辑配置。
- 在命令中临时加入 `tee -a /tmp/claude-hook-debug.log` 记录输入与输出。
- 使用 `jq '.'` 打印传入 JSON，便于定位字段路径（如 `.tool_input.file_path`）。
- 若 hook 无效，检查：事件是否正确、matcher 是否匹配、脚本可执行位、依赖是否存在、存储位置是否与预期一致。

## 本项目建议放置

- 脚本：置于 `.claude/hooks/` 目录（需赋予可执行权限）。
- 配置：项目级写入 `.claude/settings.local.json`；全局场景建议写入 `~/.claude/settings.json`。

## 参考

- 官方指南（强烈建议通读）：[Claude Code hooks 入门指南](https://docs.claude.com/zh-CN/docs/claude-code/hooks-guide)


