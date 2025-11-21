# Claude Code Slash Commands 规则文档

## 目录

- [概述](#概述)
- [Slash Commands 是什么](#slash-commands-是什么)
- [内置 Slash Commands](#内置-slash-commands)
- [自定义 Slash Commands](#自定义-slash-commands)
- [Command 语法](#command-语法)
- [Command 类型](#command-类型)
- [Command 特性](#command-特性)
- [前置元数据](#前置元数据)
- [编写 Command 最佳实践](#编写-command-最佳实践)
- [测试和调试](#测试和调试)
- [与团队共享 Commands](#与团队共享-commands)
- [故障排除](#故障排除)
- [示例集合](#示例集合)
- [参考资源](#参考资源)

---

## 概述

Slash Commands 是 Claude Code 中用于控制交互式会话行为的命令系统。Commands 以 `/` 开头，可以是内置命令，也可以是自定义命令。

### 先决条件

- Claude Code 版本 1.0 或更高
- 熟悉 Markdown 语法
- 了解 YAML 格式（用于前置元数据）

---

## Slash Commands 是什么

Slash Commands 用于在交互式会话中直接控制 Claude 的行为。与 Agent Skills（模型自主调用）不同，Slash Commands 是**用户调用（user-invoked）**的——你需要明确输入命令来触发它们。

### Commands 与 Skills 的区别

| 特性 | Slash Commands | Agent Skills |
|------|---------------|--------------|
| 调用方式 | 用户明确输入 `/command` | Claude 自动识别并使用 |
| 使用场景 | 控制会话、执行特定操作 | 提供专业能力和知识 |
| 触发时机 | 用户决定何时使用 | 模型根据上下文决定 |
| 适用范围 | 会话控制、工作流执行 | 能力扩展、任务执行 |

---

## 内置 Slash Commands

Claude Code 提供了一系列内置命令，用于管理会话、配置和系统操作。

### 会话管理

#### `/clear`
清除对话历史记录。

```bash
> /clear
# 清空当前会话的所有历史消息
```

#### `/compact [instructions]`
压缩会话，可选地提供聚焦指令。

```bash
> /compact
# 压缩会话，保留关键信息

> /compact 保留与数据库相关的对话
# 有选择地压缩会话
```

#### `/rewind`
倒回会话和/或代码到之前的状态。

```bash
> /rewind
# 返回到之前的会话状态
```

### 配置和状态

#### `/config`
打开设置界面（配置选项卡）。

```bash
> /config
# 查看和修改 Claude Code 配置
```

#### `/status`
打开设置界面（状态选项卡），显示版本、模型、账户和连接信息。

```bash
> /status
# 查看当前状态和系统信息
```

#### `/model`
选择或更改 AI 模型。

```bash
> /model
# 显示可用模型并切换
```

#### `/permissions`
查看或更新工具使用权限。

```bash
> /permissions
# 管理 Claude 的工具使用权限
```

### 项目管理

#### `/init`
使用 CLAUDE.md 指南初始化项目。

```bash
> /init
# 在项目中创建 CLAUDE.md 文件
```

#### `/memory`
编辑 CLAUDE.md 记忆文件。

```bash
> /memory
# 打开并编辑项目的 CLAUDE.md
```

#### `/add-dir`
添加额外的工作目录到当前会话。

```bash
> /add-dir /path/to/directory
# 将目录添加到工作空间
```

### 代码审查和协作

#### `/review`
请求代码审查。

```bash
> /review
# 对当前更改进行代码审查
```

#### `/pr_comments`
查看拉取请求评论。

```bash
> /pr_comments
# 显示当前 PR 的评论
```

### 子代理管理

#### `/agents`
管理用于专门任务的自定义 AI 子代理。

```bash
> /agents
# 列出和管理子代理
```

### 系统和工具

#### `/doctor`
检查 Claude Code 安装的健康状况。

```bash
> /doctor
# 运行诊断检查
```

#### `/help`
获取使用帮助。

```bash
> /help
# 显示帮助信息和可用命令
```

#### `/terminal-setup`
为新行安装 Shift+Enter 键绑定（仅适用于 iTerm2 和 VSCode）。

```bash
> /terminal-setup
# 配置终端键绑定
```

#### `/vim`
进入 Vim 模式，交替使用插入和命令模式。

```bash
> /vim
# 启用 Vim 模式
```

#### `/sandbox`
启用带有文件系统和网络隔离的沙盒 Bash 工具，实现更安全、更自主的执行。

```bash
> /sandbox
# 启用沙盒模式
```

### MCP 集成

#### `/mcp`
管理 MCP（Model Context Protocol）服务器连接和 OAuth 认证。

```bash
> /mcp
# 管理 MCP 服务器
```

### 账户管理

#### `/login`
切换 Anthropic 账户。

```bash
> /login
# 登录或切换账户
```

#### `/logout`
从 Anthropic 账户注销。

```bash
> /logout
# 退出登录
```

### 使用统计

#### `/cost`
显示代币（token）使用统计信息。

```bash
> /cost
# 查看 API 使用成本
```

#### `/usage`
显示计划使用限制和速率限制状态（仅适用于订阅计划）。

```bash
> /usage
# 查看使用配额和限制
```

### 反馈

#### `/bug`
报告错误（将会话发送给 Anthropic）。

```bash
> /bug
# 提交错误报告
```

---

## 自定义 Slash Commands

自定义 Slash Commands 允许将常用提示定义为 Markdown 文件，Claude Code 可以执行这些文件。

### Commands 的存储位置

Commands 按范围组织，支持通过目录结构进行命名空间管理：

#### 项目 Commands

存储在项目仓库中，与团队共享。

**位置**：`.claude/commands/`

```bash
# 创建项目 Command
mkdir -p .claude/commands
```

**示例**：

```bash
# 创建性能优化 Command
cat > .claude/commands/optimize.md << 'EOF'
---
description: 分析代码性能并提出优化建议
---

请分析此代码的性能问题并提供优化建议：

1. 识别性能瓶颈
2. 提供具体的优化方案
3. 评估优化的预期效果
EOF
```

#### 个人 Commands

适用于所有项目的个人 Commands。

**位置**：`~/.claude/commands/`

```bash
# 创建个人 Command
mkdir -p ~/.claude/commands
```

**示例**：

```bash
# 创建安全审查 Command
cat > ~/.claude/commands/security-review.md << 'EOF'
---
description: 审查代码安全漏洞
---

请审查此代码的安全问题：

1. SQL 注入风险
2. XSS 漏洞
3. 认证和授权问题
4. 敏感数据泄露
5. 依赖安全性
EOF
```

---

## Command 语法

### 基础语法

```bash
/<command-name> [arguments]
```

- `<command-name>`：从 Markdown 文件名（不含 `.md` 扩展名）派生
- `[arguments]`：传递给 Command 的可选参数

### 示例

```bash
# 无参数
> /optimize

# 带参数
> /fix-issue 123 high

# 多个参数
> /review-pr 456 high Alice
```

---

## Command 类型

### 1. 工作流型 Command

用于执行复杂的多步骤工作流程。

**特征：**
- 包含多个阶段（Stages）
- 每个阶段有明确的约束条件
- 强调迭代和用户反馈

**示例：**

```markdown
---
description: 需求收集工作流
allowed-tools: Read, Write, UserInput
---

# 需求收集生成

Workflow Stage: Requirements Gathering

## 约束条件

**Constraints:**
- 模型必须创建 `requirements.md` 文件
- 模型必须生成初始版本
- 模型必须使用 'userInput' 工具询问用户确认
- 必须在获得明确批准后才能继续
- 模型必须继续反馈-修订循环直到获得批准

## 执行步骤

1. 分析项目需求
2. 生成需求文档初稿
3. 请求用户反馈
4. 根据反馈修订
5. 重复步骤 3-4 直到批准
```

### 2. 操作型 Command

用于执行特定的操作或任务。

**特征：**
- 明确的目标
- 具体的操作步骤
- 清晰的成功标准

**示例：**

```markdown
---
description: 生成 Git 提交消息
allowed-tools: Bash(git status:*), Bash(git diff:*)
---

# Git 提交 Command

## 上下文

- 当前 Git 状态：!`git status`
- 当前更改：!`git diff HEAD`

## 您的任务

请基于上述代码更改：

1. **分析更改内容**
   - 识别主要的更改类型和影响范围
   - 理解更改的目的和意图

2. **生成规范的提交消息**
   - 选择合适的提交类型（feat/fix/docs/style/refactor/test/chore）
   - 编写清晰具体的中文描述
   - 在详细描述中说明更改原因和影响

## 提交消息格式

```
<type>: <subject>

<body>

<footer>
```
```

### 3. 快速操作型 Command

简单快速的单一操作。

**特征：**
- 单一目标
- 快速执行
- 最少交互

**示例：**

```markdown
---
description: 格式化代码
allowed-tools: Bash(prettier:*), Bash(eslint:*)
---

# 代码格式化

运行代码格式化工具：

```bash
prettier --write .
eslint --fix .
```

完成后报告格式化的文件数量。
```

---

## Command 特性

### 1. 命名空间

通过子目录组织 Commands。子目录用于组织，并显示在 Command 描述中。

**示例结构：**

```
.claude/commands/
├── git/
│   ├── commit.md      # Command: /commit (project:git)
│   └── merge.md       # Command: /merge (project:git)
├── frontend/
│   └── component.md   # Command: /component (project:frontend)
└── backend/
    └── api.md         # Command: /api (project:backend)
```

**命名空间显示：**
- `.claude/commands/frontend/component.md` → `/component` (project:frontend)
- `~/.claude/commands/component.md` → `/component` (user)

### 2. 参数处理

使用参数占位符传递动态值。

#### `$ARGUMENTS` - 所有参数

捕获传递给 Command 的所有参数。

**Command 定义：**

```markdown
---
description: 修复指定的问题
---

# 修复问题

修复编号为 $ARGUMENTS 的问题，遵循我们的编码标准。
```

**使用：**

```bash
> /fix-issue 123 high priority
# $ARGUMENTS 变为: "123 high priority"
```

#### `$1`, `$2`, `$N` - 位置参数

使用位置参数单独访问特定参数。

**Command 定义：**

```markdown
---
description: 审查拉取请求
argument-hint: <PR编号> <优先级> <审查者>
---

# PR 审查

审查编号为 $1 的 PR，优先级为 $2，指派给 $3。
```

**使用：**

```bash
> /review-pr 456 high Alice
# $1 = "456"
# $2 = "high"
# $3 = "Alice"
```

### 3. Bash 命令执行

使用 `!` 前缀在 Command 运行前执行 Bash 命令，输出包含在 Command 上下文中。

**要求：**
- 必须在前置元数据中包含 `allowed-tools`
- 指定允许的 Bash 命令

**示例：**

```markdown
---
description: 创建 Git 提交
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*)
---

## 上下文

- 当前 Git 状态：!`git status`
- 当前 Git 差异（暂存和未暂存的更改）：!`git diff HEAD`
- 当前分支：!`git branch --show-current`
- 最近的提交：!`git log --oneline -10`

## 你的任务

根据上述更改，创建一个 Git 提交。
```

**执行流程：**
1. Command 被调用
2. 执行所有 `!` 前缀的命令
3. 命令输出插入到上下文中
4. Claude 使用完整上下文执行任务

### 4. 文件引用

使用 `@` 前缀在 Command 中包含文件内容。

**语法：**

```markdown
# 引用单个文件
审查 @src/utils/helpers.js 中的实现

# 引用多个文件
比较 @src/old-version.js 和 @src/new-version.js

# 引用特定行
审查 @src/main.js:10-20 中的代码
```

**示例：**

```markdown
---
description: 重构代码文件
---

# 代码重构

请重构以下文件：

@$1

应用以下重构原则：
1. 提取重复代码
2. 改进命名
3. 简化逻辑
4. 添加必要注释
```

**使用：**

```bash
> /refactor src/utils/helpers.js
# 自动读取并包含文件内容
```

### 5. 思考模式

Slash Commands 可以通过包含扩展思考关键字来触发扩展思考模式。

**示例：**

```markdown
---
description: 深度代码分析
---

# 深度分析

<think>
请进行深入分析，考虑以下方面：
- 架构设计
- 性能影响
- 安全风险
- 可维护性
</think>
```

---

## 前置元数据

Command 文件支持 YAML 前置元数据，用于指定 Command 的配置。

### 完整元数据格式

```yaml
---
# 基础信息
description: Command 的简要描述

# 参数提示
argument-hint: <参数1> <参数2> [可选参数]

# 工具权限
allowed-tools: 
  - Bash(git:*)
  - Read
  - Write

# 模型配置
model: claude-sonnet-4-20250514

# 调用控制
disable-model-invocation: false
disable-completion: false

# 自动模式
auto: false
---
```

### 元数据字段详解

#### `description`（推荐）

Command 的简要描述，显示在 Command 列表中。

```yaml
description: 分析代码性能并提出优化建议
```

#### `argument-hint`（可选）

提示用户 Command 期望的参数。

```yaml
argument-hint: <文件路径> [选项]
```

**示例：**
- `<PR编号> <优先级> <审查者>`
- `<branch-name>`
- `[commit-message]`

#### `allowed-tools`（可选）

Command 可以使用的工具列表。

```yaml
allowed-tools: 
  - Bash(git:*)
  - Bash(npm:*)
  - Read
  - Write
  - Grep
  - Glob
```

**工具格式：**
- `Bash(command:*)` - 允许特定 Bash 命令
- `Bash(git add:*)` - 允许 git add 的所有变体
- `Read` - 文件读取
- `Write` - 文件写入
- `Grep` - 文本搜索
- `Glob` - 文件匹配

#### `model`（可选）

指定使用特定模型执行此 Command。

```yaml
model: claude-sonnet-4-20250514
```

#### `disable-model-invocation`（可选）

阻止 `SlashCommand` 工具调用此 Command。

```yaml
disable-model-invocation: true
```

**用途：**
- 防止 Command 被模型自动调用
- 仅允许用户手动调用

#### `disable-completion`（可选）

禁用此 Command 的自动补全。

```yaml
disable-completion: true
```

#### `auto`（可选）

立即运行 Command 而不需要用户确认。

```yaml
auto: true
```

**警告：** 慎重使用，可能导致意外操作。

---

## 编写 Command 最佳实践

### 1. 遵循设计原则

#### DRY 原则（Don't Repeat Yourself）

- 避免重复的指令
- 提取公共逻辑为独立步骤
- 复用已有的模式

```markdown
# ❌ 避免
多个 Commands 包含相同的 Git 状态检查逻辑

# ✅ 推荐
创建通用的上下文获取部分，在多个 Commands 中引用
```

#### KISS 原则（Keep It Simple, Stupid）

- 保持指令简单易懂
- 避免过度复杂的设计
- 专注于核心功能

```markdown
# ❌ 过于复杂
包含 10 个步骤和多个条件分支的 Command

# ✅ 简单明了
专注于单一任务的 3-5 步骤 Command
```

#### SOLID 原则

- **单一职责**：每个 Command 专注一个功能
- **开放封闭**：对扩展开放，对修改封闭
- **接口隔离**：提供清晰的参数接口

```markdown
# ✅ 单一职责
/commit - 只处理提交
/push - 只处理推送
/deploy - 只处理部署

# ❌ 职责混乱
/commit-push-deploy - 做太多事情
```

#### YAGNI 原则（You Aren't Gonna Need It）

- 只包含当前需要的功能
- 避免过度工程化
- 保持指令的实用性

### 2. 清晰的结构

使用一致的 Command 结构：

```markdown
---
description: Command 简要描述
allowed-tools: [工具列表]
argument-hint: <参数提示>
---

# Command 标题

## 上下文
- 动态信息获取: !`命令`

## 任务描述
详细说明要执行的任务

## 执行步骤
1. 步骤 1
2. 步骤 2
3. 步骤 3

## 成功标准
- 标准 1
- 标准 2

## 注意事项
- 注意事项 1
- 注意事项 2
```

### 3. 有效的描述

描述应该简洁但信息丰富：

```yaml
# ✅ 好的描述
description: 分析 Excel 文件并生成数据可视化报告

# ✅ 好的描述
description: 根据 git diff 生成符合团队规范的提交消息

# ❌ 模糊的描述
description: 处理文件

# ❌ 过于简单
description: Git 提交
```

### 4. 合理的工具权限

只授予 Command 需要的最小权限：

```yaml
# ✅ 精确权限
allowed-tools: 
  - Bash(git status:*)
  - Bash(git diff:*)
  - Bash(git commit:*)

# ❌ 过于宽泛
allowed-tools: Bash(*:*)

# ✅ 只读操作
allowed-tools: Read, Grep, Glob

# ✅ 完整文件操作
allowed-tools: Read, Write, SearchReplace
```

### 5. 清晰的参数说明

使用 `argument-hint` 提供参数指导：

```yaml
# ✅ 清晰的参数提示
argument-hint: <issue-number> [priority]

# ✅ 可选参数
argument-hint: <file-path> [--force]

# ✅ 多个必需参数
argument-hint: <source> <destination> <mode>
```

### 6. 有效的上下文获取

使用 `!` 前缀获取动态信息：

```markdown
## 上下文

### Git 信息
- 当前状态: !`git status --short`
- 当前分支: !`git branch --show-current`
- 最近提交: !`git log --oneline -5`

### 项目信息
- 项目结构: !`tree -L 2 -I 'node_modules|.git'`
- 包信息: !`cat package.json`

### 环境信息
- Python 版本: !`python --version`
- Node 版本: !`node --version`
```

### 7. 用户交互设计

对于需要用户确认的操作：

```markdown
## 约束条件

- 模型必须使用 'userInput' 工具询问用户 "是否继续执行此操作？"
- 必须在获得明确批准后才能继续
- 模型必须继续反馈-修订循环直到获得批准
- 如果用户拒绝，模型应该停止执行
```

### 8. 错误处理

包含错误处理指令：

```markdown
## 错误处理

如果遇到错误：
1. 清晰地说明错误类型和原因
2. 提供可能的解决方案
3. 询问用户是否要重试或采取替代方案
4. 记录错误以供后续分析
```

---

## 测试和调试

### 测试清单

创建 Command 后，使用此清单验证：

- [ ] Command 文件位置正确（`.claude/commands/` 或 `~/.claude/commands/`）
- [ ] 文件名不含 `.md` 扩展名以外的特殊字符
- [ ] YAML 前置元数据语法正确
- [ ] `description` 字段清晰准确
- [ ] `allowed-tools` 配置合理（如使用）
- [ ] `argument-hint` 提供有用的参数指导（如使用）
- [ ] Bash 命令使用 `!` 前缀正确
- [ ] 文件引用使用 `@` 前缀正确
- [ ] 参数占位符（`$1`, `$ARGUMENTS`）使用正确
- [ ] Command 在实际场景中测试通过

### 调试步骤

#### 1. 验证 Command 可见性

```bash
# 列出项目 Commands
ls -la .claude/commands/

# 列出个人 Commands
ls -la ~/.claude/commands/

# 在 Claude Code 中列出 Commands
> /help
# 查看可用 Commands 列表
```

#### 2. 检查 YAML 语法

```bash
# 查看前置元数据
head -n 20 .claude/commands/my-command.md

# 验证 YAML 语法
python -c "import yaml; yaml.safe_load(open('.claude/commands/my-command.md').read().split('---')[1])"
```

#### 3. 测试 Bash 命令

单独测试 Command 中使用的 Bash 命令：

```bash
# 测试 Git 命令
git status --short
git branch --show-current

# 测试其他命令
tree -L 2 -I 'node_modules|.git'
```

#### 4. 逐步测试

从简单版本开始，逐步添加复杂性：

```markdown
# 第 1 步：基础 Command
---
description: 简单测试
---

执行基础任务。

# 第 2 步：添加上下文
---
description: 简单测试
allowed-tools: Bash(git status:*)
---

- 状态: !`git status`

执行任务。

# 第 3 步：添加参数
---
description: 简单测试
allowed-tools: Bash(git status:*)
argument-hint: <参数>
---

- 状态: !`git status`
- 参数: $1

执行任务。
```

### 调试模式

使用调试模式查看详细执行信息：

```bash
claude --debug
```

这会显示：
- Command 加载过程
- Bash 命令执行结果
- 参数替换详情
- 工具调用记录

---

## 与团队共享 Commands

### 方法 1：通过项目仓库（推荐）

#### 步骤 1：创建项目 Command

```bash
mkdir -p .claude/commands/git
cat > .claude/commands/git/commit.md << 'EOF'
---
description: 生成规范的 Git 提交消息
allowed-tools: Bash(git:*)
---

# Git 提交

## 上下文
- 当前状态: !`git status`
- 更改内容: !`git diff HEAD`

## 任务
根据上述更改生成提交消息，遵循团队规范。
EOF
```

#### 步骤 2：提交到版本控制

```bash
git add .claude/commands/
git commit -m "Add git commit command"
git push
```

#### 步骤 3：团队成员获取

```bash
git pull
# Commands 自动可用
```

### 方法 2：通过文档分享

在项目 README 或文档中记录可用 Commands：

```markdown
# 可用 Slash Commands

## Git 工作流
- `/commit` - 生成规范提交消息
- `/push` - 推送代码到远程仓库
- `/pr` - 创建拉取请求

## 代码质量
- `/review` - 代码审查
- `/optimize` - 性能优化建议
- `/security` - 安全检查

## 使用示例
```bash
# 创建提交
> /commit

# 审查代码
> /review src/main.js
```
```

### 方法 3：通过插件分发

创建包含 Commands 的 Claude Code 插件：

1. 创建插件结构
2. 将 Commands 放入 `commands/` 目录
3. 发布到插件市场
4. 团队成员安装插件

---

## 故障排除

### 问题 1：Command 未显示

**症状**：输入 `/` 后看不到自定义 Command。

**检查项：**

1. **文件位置正确？**
   ```bash
   # 项目 Commands
   ls .claude/commands/*.md
   
   # 个人 Commands
   ls ~/.claude/commands/*.md
   ```

2. **文件名正确？**
   - 使用 `.md` 扩展名
   - 避免特殊字符（除连字符外）
   - 使用小写字母

3. **YAML 语法正确？**
   ```bash
   # 检查前置元数据
   head -n 15 .claude/commands/my-command.md
   ```

### 问题 2：Command 执行失败

**症状**：Command 执行时出错。

**检查项：**

1. **Bash 命令权限？**
   ```yaml
   # 确保 allowed-tools 包含需要的命令
   allowed-tools: Bash(git:*), Bash(npm:*)
   ```

2. **Bash 命令有效？**
   ```bash
   # 单独测试命令
   git status
   npm list
   ```

3. **参数使用正确？**
   ```markdown
   # 确保参数占位符正确
   $1, $2, $ARGUMENTS
   ```

### 问题 3：上下文未加载

**症状**：`!` 命令输出未包含在上下文中。

**检查项：**

1. **`allowed-tools` 包含 Bash？**
   ```yaml
   allowed-tools: Bash(git status:*), Bash(git diff:*)
   ```

2. **命令语法正确？**
   ```markdown
   # ✅ 正确
   - 状态: !`git status`
   
   # ❌ 错误（缺少反引号）
   - 状态: !git status
   
   # ❌ 错误（错误的引号）
   - 状态: !"git status"
   ```

### 问题 4：参数未替换

**症状**：`$1` 或 `$ARGUMENTS` 未被实际值替换。

**检查项：**

1. **调用时提供参数？**
   ```bash
   # ✅ 正确
   > /my-command arg1 arg2
   
   # ❌ 错误（缺少参数）
   > /my-command
   ```

2. **参数占位符正确？**
   ```markdown
   # ✅ 正确
   处理文件: $1
   所有参数: $ARGUMENTS
   
   # ❌ 错误
   处理文件: ${1}  # 错误的语法
   ```

### 问题 5：权限被拒绝

**症状**：Command 请求执行操作但被拒绝。

**解决方案：**

1. **添加 `allowed-tools`：**
   ```yaml
   allowed-tools: 
     - Bash(command:*)
     - Read
     - Write
   ```

2. **授予更广泛的权限：**
   ```yaml
   # 允许所有 git 命令
   allowed-tools: Bash(git:*)
   
   # 允许特定命令
   allowed-tools: Bash(git status:*), Bash(git commit:*)
   ```

---

## 示例集合

### 示例 1：简单 Git 提交 Command

```markdown
---
description: 生成 Git 提交消息
allowed-tools: Bash(git:*)
---

# Git 提交

## 上下文

- 当前状态: !`git status --short`
- 更改内容: !`git diff --staged`

## 任务

根据上述更改生成提交消息：

1. 使用常规提交格式
2. 摘要不超过 50 字符
3. 包含详细说明
4. 列出主要更改
```

### 示例 2：带参数的 Issue 修复 Command

```markdown
---
description: 修复指定的 GitHub Issue
argument-hint: <issue-number> [priority]
allowed-tools: Bash(git:*), Read, Write
---

# 修复 Issue

## 参数
- Issue 编号: $1
- 优先级: $2

## 任务

修复 Issue #$1：

1. 检查 Issue 详情
2. 创建修复分支
3. 实现修复
4. 编写测试
5. 创建提交
6. 推送分支
```

### 示例 3：代码审查 Command

```markdown
---
description: 全面的代码审查
allowed-tools: Read, Grep, Glob
---

# 代码审查

## 审查文件

@$ARGUMENTS

## 审查清单

### 代码质量
- [ ] 代码可读性
- [ ] 命名规范
- [ ] 注释充分
- [ ] 错误处理

### 性能
- [ ] 算法效率
- [ ] 内存使用
- [ ] 数据库查询优化

### 安全性
- [ ] 输入验证
- [ ] SQL 注入防护
- [ ] XSS 防护
- [ ] 认证授权

### 最佳实践
- [ ] DRY 原则
- [ ] SOLID 原则
- [ ] 设计模式应用

## 输出格式

对每个方面提供：
1. 评分（1-5）
2. 发现的问题
3. 改进建议
4. 代码示例
```

### 示例 4：部署 Command

```markdown
---
description: 部署应用到生产环境
allowed-tools: Bash(*:*)
auto: false
---

# 生产部署

## ⚠️ 警告

此操作将部署到生产环境，请确认：

- [ ] 所有测试通过
- [ ] 代码已审查
- [ ] 数据库迁移已准备
- [ ] 回滚计划已就绪

## 部署前检查

- 当前分支: !`git branch --show-current`
- 最后提交: !`git log -1 --oneline`
- 未提交更改: !`git status --short`

## 部署步骤

1. 运行测试套件
2. 构建生产版本
3. 备份当前版本
4. 执行数据库迁移
5. 部署新版本
6. 运行冒烟测试
7. 监控系统状态

## 回滚计划

如果部署失败：
1. 停止新版本
2. 恢复数据库备份
3. 切换到备份版本
4. 验证系统恢复
```

### 示例 5：重构 Command

```markdown
---
description: 重构代码文件
argument-hint: <file-path>
allowed-tools: Read, Write, SearchReplace
---

# 代码重构

## 目标文件

@$1

## 重构原则

### 1. 代码清理
- 移除重复代码
- 简化复杂逻辑
- 改进命名

### 2. 结构优化
- 提取函数/方法
- 组织代码块
- 改进模块划分

### 3. 性能优化
- 优化算法
- 减少不必要的操作
- 改进数据结构

### 4. 可维护性
- 添加注释
- 改进错误处理
- 增强类型注解

## 输出

重构后的代码应该：
- 功能保持不变
- 更易读易懂
- 更易维护
- 性能不降低或有提升
```

### 示例 6：测试生成 Command

```markdown
---
description: 为代码生成单元测试
argument-hint: <source-file>
allowed-tools: Read, Write
---

# 测试生成

## 源文件

@$1

## 测试要求

### 覆盖范围
- 正常情况
- 边界情况
- 错误情况
- 异常处理

### 测试结构
```python
def test_function_name_scenario():
    """测试描述"""
    # Arrange - 准备测试数据
    
    # Act - 执行被测试代码
    
    # Assert - 验证结果
```

### 最佳实践
- 每个测试专注单一场景
- 测试名称描述清晰
- 使用有意义的断言消息
- 保持测试独立性

## 输出文件

测试文件路径: `tests/test_$1`
```

### 示例 7：文档生成 Command

```markdown
---
description: 为代码生成文档
argument-hint: <source-file>
allowed-tools: Read, Write
---

# 文档生成

## 源代码

@$1

## 文档要求

### API 文档
```python
def function_name(param1: Type1, param2: Type2) -> ReturnType:
    """
    简要描述函数功能。
    
    详细说明函数的用途、行为和注意事项。
    
    Args:
        param1: 参数1的说明
        param2: 参数2的说明
    
    Returns:
        返回值的说明
    
    Raises:
        ExceptionType: 异常情况说明
    
    Examples:
        >>> function_name(value1, value2)
        expected_result
    """
```

### 文档内容
- 功能概述
- 参数说明
- 返回值说明
- 异常说明
- 使用示例
- 注意事项

## 输出格式

生成 Markdown 格式的 API 文档。
```

---

## 参考资源

### 官方文档

- [Slash Commands - Claude 文档](https://docs.claude.com/en/docs/claude-code/slash-commands)
- [Claude Code 概述](https://docs.claude.com/en/docs/claude-code/)
- [命令参考](https://docs.claude.com/en/docs/claude-code/slash-commands)

### 相关资源

- [Agent Skills 文档](./agent-skills-rules.md)
- [Claude Code 配置](https://docs.claude.com/en/docs/claude-code/settings)
- [插件系统](https://docs.claude.com/en/docs/claude-code/plugins)

### 工具和集成

- Claude Code CLI
- Model Context Protocol (MCP)
- 子代理（Subagents）
- 代码钩子（Hooks）

---

## 附录

### A. Command 文件模板

#### 基础模板

```markdown
---
description: Command 简要描述
---

# Command 标题

## 任务说明

详细描述要执行的任务。
```

#### 完整模板

```markdown
---
description: Command 简要描述
argument-hint: <参数提示>
allowed-tools: 
  - Tool1
  - Tool2
model: claude-sonnet-4-20250514
---

# Command 标题

## 上下文

- 动态信息: !`命令`

## 参数

- 参数1: $1
- 所有参数: $ARGUMENTS

## 任务说明

### 主要步骤
1. 步骤 1
2. 步骤 2
3. 步骤 3

### 成功标准
- 标准 1
- 标准 2

## 约束条件

- 必须满足的条件
- 应该遵循的规范

## 注意事项

- 注意事项 1
- 注意事项 2
```

### B. 常用工具权限配置

```yaml
# Git 操作
allowed-tools: 
  - Bash(git status:*)
  - Bash(git diff:*)
  - Bash(git commit:*)
  - Bash(git push:*)

# Node.js 开发
allowed-tools:
  - Bash(npm:*)
  - Bash(node:*)
  - Read
  - Write

# Python 开发
allowed-tools:
  - Bash(python:*)
  - Bash(pip:*)
  - Bash(pytest:*)
  - Read
  - Write

# 只读操作
allowed-tools:
  - Read
  - Grep
  - Glob

# 完整文件操作
allowed-tools:
  - Read
  - Write
  - SearchReplace
  - Delete
```

### C. 命名约定

#### 文件命名
- 使用小写字母和连字符
- 使用描述性名称
- 示例：`commit.md`, `review-pr.md`, `deploy-prod.md`

#### Command 命名
- 简短但描述性强
- 使用动词开头（如适用）
- 示例：`/commit`, `/review`, `/deploy`, `/analyze`

#### 目录组织
```
.claude/commands/
├── git/              # Git 相关命令
│   ├── commit.md
│   ├── push.md
│   └── merge.md
├── code/             # 代码操作命令
│   ├── review.md
│   ├── refactor.md
│   └── optimize.md
└── deploy/           # 部署相关命令
    ├── staging.md
    └── production.md
```

### D. 故障排除检查清单

- [ ] Command 文件位置正确
- [ ] 文件名符合命名规范
- [ ] YAML 前置元数据语法有效
- [ ] `description` 字段清晰准确
- [ ] `allowed-tools` 配置合理
- [ ] `argument-hint` 提供有用指导
- [ ] Bash 命令使用 `!` 前缀
- [ ] 文件引用使用 `@` 前缀
- [ ] 参数占位符使用正确
- [ ] 命令在实际场景中测试通过
- [ ] 错误处理逻辑完善
- [ ] 用户交互设计合理

---

**文档版本**：v1.0.0  
**最后更新**：2025-10-31  
**参考链接**：https://docs.claude.com/en/docs/claude-code/slash-commands

