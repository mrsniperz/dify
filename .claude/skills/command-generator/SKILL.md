---
name: command-generator
description: 帮助创建符合 Claude Code 规范的自定义 Slash Commands（.claude/commands/*）。自动规划 front matter、参数占位符（$ARGUMENTS/$1/$2...）、上下文注入（!`cmd`）、文件引用（@path），并最小化 allowed-tools。可直接在项目中生成或更新命令文件。
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
---

# Slash Command 生成助手

## 何时使用
- 当用户提到“创建/生成/完善 Slash Command 或命令”
- 当出现关键词：`allowed-tools`、`argument-hint`、`!` 命令注入、`@` 文件引用、`$ARGUMENTS`、`$1`
- 当需要将常用工作流固定为可复用的 `/command`

## 我会做什么（执行概要）
1. 明确命令目标、命名与命名空间（如 `.claude/commands/git/commit.md`）。
2. 设计精确的 front matter：`description`、`argument-hint`、`allowed-tools`、可选 `model` 等。
3. 规划“上下文注入”与“文件引用”：使用 `!` 和 `@` 仅包含必要信息。
4. 设计参数与占位符：使用 `$ARGUMENTS`、`$1..$N`；提供参数提示与默认值策略。
5. 编写“任务/步骤/成功标准/错误处理/注意事项”。
6. 生成命令文件内容；若未指定路径，默认写入 `.claude/commands/<name>.md`。
7. 安全写入：不存在则创建；存在则追加后缀（如 `-v2`）或在明确“覆盖/force”指令下覆盖。

## 约束条件
- 遵循 DRY/KISS/SOLID/YAGNI 原则，描述清晰简洁。
- 最小权限：只授予完成任务所需的 `allowed-tools`，避免危险命令。
- 仅在必要处使用 `!` 动态命令注入，避免冗长上下文。
- 默认不覆盖现有文件；除非用户明确要求“覆盖”或“--force”。

## 交付物
- 新建或更新的命令文件路径：`.claude/commands[/<namespace>]/<command-name>.md`
- 命令文件包含：front matter、上下文、参数、任务、步骤、成功标准、错误处理、注意事项。

## 生成流程（详细）
1. 采集需求：目标、命名（短小有力）、是否需要命名空间、预期参数与权限边界。
2. 选择命令类型：
   - 工作流型（多阶段、强约束与用户反馈）
   - 操作型（单一清晰任务）
   - 快速操作型（极简一步）
3. 设计 front matter：
   - description：简洁、精准、包含触发关键词
   - argument-hint：指明参数位置与可选性，如 `<file> [--force]`
   - allowed-tools：仅列出所需工具（例如 `Read/Write/Grep/Glob` 或 `Bash(git:*)`）
   - model（可选）：仅在确需特定模型时指定
4. 参数与占位符：
   - `$ARGUMENTS` 捕获全部参数；`$1..$N` 捕获位置参数
   - 在正文中展示解析结果，指导后续步骤
5. 上下文与引用：
   - 使用 `!` 注入必要的实时信息（如 `git status`）
   - 使用 `@` 引用源文件或配置（如 `@src/main.py:1-120`）
6. 任务/步骤/成功标准/错误处理/注意事项：
   - 明确输出物、判定条件与失败时的替代方案
7. 文件写入策略：
   - 若目标路径已存在且未显式“覆盖/force”，改写为 `<name>-v2.md` 等安全文件名

## 完整模板（建议默认）
```markdown
---
description: <用一句话概括命令的作用与使用场景；包含触发关键词>
argument-hint: <参数1> <参数2> [可选参数]
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
# model: claude-sonnet-4-20250514
---

# <命令标题>

## 上下文
- 项目结构: !`ls -la | head -n 50`
- Git 状态: !`git status --short`
- 额外文件: @$1

## 参数
- 第一个参数($1): $1
- 所有参数($ARGUMENTS): $ARGUMENTS

## 任务
请基于“上下文”完成以下目标：
1. 明确处理对象与范围
2. 执行必要的分析/变更/生成
3. 产出易于复用的结果

## 执行步骤
1. 校验参数与前置条件
2. 执行主要操作
3. 汇总并输出结果（必要时写入文件）

## 成功标准
- 输出内容结构清晰、准确完整
- 未授予不必要的工具权限
- 错误情况有明确处理与提示

## 错误处理
如果遇到错误：
1. 指出错误类型与原因
2. 提供修复建议与下一步
3. 如可重试，说明重试方式

## 注意事项
- 遵循最小权限原则
- 仅注入必要上下文，避免冗长输出
```

## 快速操作型模板（单目标、最低交互）
```markdown
---
description: <快速执行单一步骤的命令>
argument-hint: <$1 必填> [--force]
allowed-tools: Read
---

# 快速执行

## 参数
- 目标: $1
- 其他: $ARGUMENTS

## 任务
对 $1 执行快速检查或格式化等操作。

## 成功标准
- 输出简洁；无副作用；错误信息明确
```

## 操作型模板（单一清晰目标）
```markdown
---
description: <示例：根据 git diff 生成提交信息>
argument-hint: [scope]
allowed-tools: Bash(git:* )
---

# 生成提交信息

## 上下文
- 状态: !`git status --short`
- 差异: !`git diff --staged`

## 参数
- 范围(scope): $1

## 任务
生成符合团队规范的提交信息（含 subject 与 body）。
```

## 工作流型模板（多阶段、强约束）
```markdown
---
description: <示例：需求收集-评审-定稿的多阶段工作流>
argument-hint: <目标文件/目录> [选项]
allowed-tools:
  - Read
  - Write
  - Grep
---

# 工作流：规范化产出

Workflow Stage: Requirements Gathering

## 约束条件
- 必须生成初稿 -> 评审 -> 修订 -> 定稿
- 如用户未明确批准，不写入覆盖现有文件

## 执行步骤
1. 读取 $1（若提供）并生成初稿
2. 给出审查清单与问题列表
3. 根据反馈迭代直至批准
```

## 示例：带参数与占位符的命令（演示 $ARGUMENTS/$1）
```markdown
---
description: 重构指定文件并输出要点
argument-hint: <file-path> [--safe]
allowed-tools: Read
---

# 重构建议

## 参数
- 目标文件: $1
- 原始参数: $ARGUMENTS

## 上下文
@$1

## 任务
提出具体的重构建议（命名/结构/逻辑/可维护性），保持功能不变。
```

## 验证清单（写入前后）
- 文件位置正确：`.claude/commands[/<namespace>]/<name>.md`
- 文件名小写、使用连字符
- YAML 前置元数据语法有效（开闭 `---`）
- `description` 清晰准确，`argument-hint` 明确
- `allowed-tools` 精确且最小
- `!` 与 `@` 语法正确
- 占位符 `$ARGUMENTS`、`$1..$N` 使用正确

## 文件创建与安全策略
- 默认创建：`.claude/commands/<name>.md`
- 指定命名空间：`.claude/commands/<ns>/<name>.md`
- 已存在：若未收到“覆盖/force”，写入 `<name>-v2.md`

## 版本历史
- v2.0.0 (2025-10-31): 增加 name/allowed-tools；完善模板；加入占位符/上下文/引用/校验清单与安全写入策略
- v1.0.0 (初始): 基础说明与简单示例

## 参考
- Agent Skills 规则（自动发现与最小权限）：`https://docs.claude.com/en/docs/claude-code/skills`
- Slash Commands 规则（前置元数据、参数、!/@ 语法）：`https://docs.claude.com/en/docs/claude-code/slash-commands`