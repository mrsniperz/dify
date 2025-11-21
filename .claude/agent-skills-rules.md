# Claude Code Agent Skills 规则文档

## 目录

- [概述](#概述)
- [Agent Skills 是什么](#agent-skills-是什么)
- [创建 Skill](#创建-skill)
- [编写 SKILL.md](#编写-skillmd)
- [添加支持文件](#添加支持文件)
- [限制工具访问](#限制工具访问)
- [查看可用 Skills](#查看可用-skills)
- [测试 Skill](#测试-skill)
- [调试 Skill](#调试-skill)
- [与团队共享 Skills](#与团队共享-skills)
- [更新 Skill](#更新-skill)
- [删除 Skill](#删除-skill)
- [最佳实践](#最佳实践)
- [故障排除](#故障排除)
- [示例集合](#示例集合)
- [参考资源](#参考资源)

---

## 概述

Agent Skills 是 Claude Code 中用于扩展 Claude 功能的模块化能力系统。每个 Skill 由包含指令、脚本和资源的组织化文件夹组成，使 Claude 能够执行专门化的任务。

### 先决条件

- Claude Code 版本 1.0 或更高
- 熟悉 Claude Code 基础操作
- 了解 Markdown 和 YAML 语法

---

## Agent Skills 是什么

Agent Skills 将专业知识打包成可发现的能力模块。每个 Skill 包含一个 `SKILL.md` 文件，其中包含 Claude 在相关场景下会读取的指令，以及可选的支持文件（如脚本和模板）。

### Skills 的调用方式

Skills 是**模型调用（model-invoked）**的——Claude 会根据你的请求和 Skill 的描述自主决定何时使用它们。这与**用户调用（user-invoked）**的斜杠命令不同（你需要明确输入 `/command` 来触发）。

### Skills 的优势

- **扩展能力**：为特定工作流程扩展 Claude 的功能
- **团队共享**：通过 git 在团队间共享专业知识
- **减少重复**：减少重复性的提示
- **组合使用**：可组合多个 Skills 处理复杂任务
- **自动发现**：Claude 自动识别并使用相关 Skills

---

## 创建 Skill

Skills 存储为包含 `SKILL.md` 文件的目录。根据使用范围，可以创建三种类型的 Skills：

### 1. 个人 Skills（Personal Skills）

个人 Skills 在你的所有项目中可用，存储在 `~/.claude/skills/` 目录：

```bash
# 创建个人 Skill
mkdir -p ~/.claude/skills/my-skill-name
```

**适用场景：**
- 个人工作流程和偏好设置
- 正在开发的实验性 Skills
- 个人生产力工具

### 2. 项目 Skills（Project Skills）

项目 Skills 与团队共享，存储在项目的 `.claude/skills/` 目录：

```bash
# 创建项目 Skill
mkdir -p .claude/skills/my-skill-name
```

**适用场景：**
- 团队工作流程和约定
- 项目特定的专业知识
- 共享工具和脚本

项目 Skills 会提交到 git，团队成员自动获得访问权限。

### 3. 插件 Skills（Plugin Skills）

Skills 也可以来自 Claude Code 插件。插件可能会捆绑在安装插件时自动可用的 Skills。这些 Skills 的工作方式与个人和项目 Skills 相同。

---

## 编写 SKILL.md

在 Skill 目录中创建 `SKILL.md` 文件，包含 YAML 前置元数据和 Markdown 内容：

### 基础结构

```markdown
---
name: your-skill-name
description: Skill 功能的简要描述以及何时使用它
---

# Your Skill Name

## 指令说明
为 Claude 提供清晰、分步骤的指导。

## 示例
展示使用此 Skill 的具体示例。
```

### 字段要求

#### name（必需）

- **格式**：只能使用小写字母、数字和连字符
- **长度**：最多 64 个字符
- **示例**：`pdf-form-filler`, `git-commit-helper`, `code-reviewer`

```yaml
name: pdf-processing
```

#### description（必需）

- **长度**：最多 1024 个字符
- **内容**：简要描述 Skill 的功能和使用场景
- **重要性**：这是 Claude 发现何时使用 Skill 的关键字段

**描述应包含：**
1. Skill 的功能
2. 何时应该使用
3. 关键触发词汇

```yaml
description: 提取文本、填写表单、合并 PDF 文件。当处理 PDF 文件、表单或文档提取时使用。需要 pypdf 和 pdfplumber 包。
```

**好的描述示例：**

```yaml
# ✅ 明确且具体
description: 分析 Excel 电子表格，创建数据透视表，生成图表。当处理 Excel 文件、电子表格或分析 .xlsx 格式的表格数据时使用。

# ✅ 包含触发关键词
description: 生成清晰的 Git 提交消息。当编写提交消息或查看暂存更改时使用。

# ❌ 太模糊
description: 处理文件

# ❌ 缺少使用场景
description: 帮助处理数据
```

### 完整示例

```markdown
---
name: generating-commit-messages
description: 从 git diff 生成清晰的提交消息。当编写提交消息或查看暂存更改时使用。
---

# 生成提交消息

## 指令说明

1. 运行 `git diff --staged` 查看更改
2. 分析更改内容并提供建议的提交消息：
   - 摘要少于 50 个字符
   - 详细描述
   - 受影响的组件

## 最佳实践

- 使用现在时态
- 解释做了什么和为什么，而不是如何做
- 使用常规提交格式（如适用）

## 示例

### 示例 1：功能添加
```
feat: add user authentication

- Implement JWT-based authentication
- Add login and registration endpoints
- Update user model with password hashing
```

### 示例 2：Bug 修复
```
fix: resolve memory leak in data processor

- Close file handles properly after processing
- Add cleanup in error handling paths
```
```

---

## 添加支持文件

在 `SKILL.md` 旁边创建额外的文件以增强 Skill 功能：

### 推荐目录结构

```
my-skill/
├── SKILL.md           (必需)
├── reference.md       (可选文档)
├── examples.md        (可选示例)
├── scripts/           (可选脚本目录)
│   ├── helper.py
│   └── validator.sh
└── templates/         (可选模板目录)
    ├── template.txt
    └── config.json
```

### 在 SKILL.md 中引用文件

```markdown
## 高级用法

详细信息请参阅 [reference.md](reference.md)。

## 运行辅助脚本

```bash
python scripts/helper.py input.txt
```

## 使用模板

模板文件位于 `templates/template.txt`。
```

### 渐进式披露

Claude 只在需要时读取这些文件，使用渐进式披露来高效管理上下文。

---

## 限制工具访问

使用 `allowed-tools` 前置元数据字段限制 Skill 激活时 Claude 可以使用的工具：

### 基础语法

```yaml
---
name: safe-file-reader
description: 只读文件访问。当需要只读文件访问时使用。
allowed-tools: Read, Grep, Glob
---
```

### 使用场景

- **只读 Skills**：不应修改文件
- **限定范围 Skills**：例如只进行数据分析，不写入文件
- **安全敏感工作流**：需要限制功能的场景

### 工具列表示例

```yaml
# 只读访问
allowed-tools: Read, Grep, Glob

# Git 操作
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*)

# 文件操作
allowed-tools: Read, Write, SearchReplace

# 完整开发工具集
allowed-tools: 
  - Read
  - Write
  - Bash(npm:*)
  - Bash(git:*)
```

### 注意事项

- 如果未指定 `allowed-tools`，Claude 会按照标准权限模型请求使用工具的许可
- `allowed-tools` 仅在 Claude Code 中支持

---

## 查看可用 Skills

Skills 会从三个来源自动发现：

1. **个人 Skills**：`~/.claude/skills/`
2. **项目 Skills**：`.claude/skills/`
3. **插件 Skills**：随已安装插件捆绑

### 查看所有 Skills

直接询问 Claude：

```
What Skills are available?
```

或

```
List all available Skills
```

这会显示所有来源的 Skills，包括插件 Skills。

### 检查文件系统

```bash
# 列出个人 Skills
ls ~/.claude/skills/

# 列出项目 Skills（在项目目录中）
ls .claude/skills/

# 查看特定 Skill 内容
cat ~/.claude/skills/my-skill/SKILL.md
```

---

## 测试 Skill

创建 Skill 后，通过提出匹配描述的问题来测试它。

### 测试方法

**示例**：如果你的描述提到 "PDF 文件"：

```
Can you help me extract text from this PDF?
```

Claude 会根据请求自主决定使用你的 Skill——你不需要明确调用它。Skill 会根据上下文自动激活。

### 验证 Skill 激活

观察 Claude 的响应是否：
1. 使用了 Skill 中定义的指令
2. 遵循 Skill 的最佳实践
3. 应用了 Skill 的限制条件

---

## 调试 Skill

如果 Skill 未按预期工作，请遵循以下调试步骤：

### 1. 使描述更具体

**问题**：Claude 未使用你的 Skill

**解决方案**：改进描述使其包含明确的触发词汇

```yaml
# ❌ 太通用
description: 帮助处理数据

# ✅ 具体明确
description: 分析 Excel 电子表格，生成数据透视表，创建图表。当处理 Excel 文件、电子表格或分析 .xlsx 文件中的表格数据时使用。
```

### 2. 验证文件路径

```bash
# 检查个人 Skills
ls -la ~/.claude/skills/*/SKILL.md

# 检查项目 Skills
ls -la .claude/skills/*/SKILL.md

# 验证 Skill 结构
tree ~/.claude/skills/my-skill/
```

### 3. 检查 YAML 语法

确保 YAML 前置元数据有效：

```bash
# 查看前置元数据
cat SKILL.md | head -n 10
```

**确保：**
- 第 1 行有开头的 `---`
- Markdown 内容前有结束的 `---`
- 有效的 YAML 语法（无制表符，正确缩进）

```yaml
# ✅ 正确
---
name: my-skill
description: Does something useful
---

# ❌ 错误：缺少结束的 ---
---
name: my-skill
description: Does something useful

# ❌ 错误：使用了制表符
---
name:	my-skill
description: Does something useful
---
```

### 4. 查看错误信息

以调试模式运行 Claude Code 查看 Skill 加载错误：

```bash
claude --debug
```

---

## 与团队共享 Skills

### 推荐方法：通过插件分发

1. 创建包含 Skills 的插件（在 `skills/` 目录中）
2. 将插件添加到市场
3. 团队成员安装插件

详细说明请参阅"将 Skills 添加到插件"文档。

### 替代方法：通过项目仓库共享

#### 步骤 1：将 Skill 添加到项目

```bash
mkdir -p .claude/skills/team-skill
# 创建 SKILL.md 和相关文件
```

#### 步骤 2：提交到 git

```bash
git add .claude/skills/
git commit -m "Add team Skill for PDF processing"
git push
```

#### 步骤 3：团队成员自动获取 Skills

当团队成员拉取最新更改时，Skills 立即可用：

```bash
git pull
claude  # Skills 现在可用
```

### 最佳实践

- 在 git 提交消息中记录 Skill 变更
- 在团队中测试 Skills
- 为 Skills 维护版本历史
- 在项目文档中记录可用 Skills

---

## 更新 Skill

### 编辑现有 Skill

直接编辑 `SKILL.md` 文件：

```bash
# 个人 Skill
code ~/.claude/skills/my-skill/SKILL.md

# 项目 Skill
code .claude/skills/my-skill/SKILL.md
```

### 应用更新

更改在下次启动 Claude Code 时生效。如果 Claude Code 已在运行，请重启以加载更新。

### 版本管理

在 `SKILL.md` 内容中记录 Skill 版本以跟踪变更：

```markdown
# My Skill

## 版本历史
- v2.0.0 (2025-10-01): API 破坏性变更
- v1.1.0 (2025-09-15): 添加新功能
- v1.0.0 (2025-09-01): 初始版本

## 指令说明
...
```

---

## 删除 Skill

### 删除 Skill 目录

```bash
# 个人 Skill
rm -rf ~/.claude/skills/my-skill

# 项目 Skill
rm -rf .claude/skills/my-skill
git add .claude/skills/
git commit -m "Remove unused Skill"
git push
```

### 验证删除

```bash
# 列出剩余 Skills
ls ~/.claude/skills/
ls .claude/skills/
```

---

## 最佳实践

### 1. 保持 Skills 专注

一个 Skill 应解决一个能力：

**✅ 专注：**
- "PDF 表单填写"
- "Excel 数据分析"
- "Git 提交消息"

**❌ 过于宽泛：**
- "文档处理"（应拆分为单独的 Skills）
- "数据工具"（按数据类型或操作拆分）

### 2. 编写清晰的描述

在描述中包含特定触发词汇，帮助 Claude 发现何时使用 Skills：

**✅ 清晰：**

```yaml
description: 分析 Excel 电子表格，创建数据透视表，生成图表。当处理 Excel 文件、电子表格或分析 .xlsx 格式的表格数据时使用。
```

**❌ 模糊：**

```yaml
description: 处理文件
```

### 3. 与团队一起测试

让队友使用 Skills 并提供反馈：

- Skill 是否在预期时激活？
- 指令是否清晰？
- 是否缺少示例或边缘情况？

### 4. 记录 Skill 版本

在 SKILL.md 内容中添加版本历史部分：

```markdown
## 版本历史
- v2.0.0 (2025-10-01): 破坏性变更到 API
- v1.1.0 (2025-09-15): 添加新功能
- v1.0.0 (2025-09-01): 初始发布
```

这帮助团队成员了解版本间的变化。

### 5. 使用渐进式披露

不要在 SKILL.md 中包含所有信息。使用单独的文件存放：

- 详细参考文档 → `reference.md`
- 扩展示例 → `examples.md`
- 辅助脚本 → `scripts/`
- 配置模板 → `templates/`

### 6. 明确依赖关系

在描述中列出所需的包：

```yaml
description: 提取文本、填写表单、合并 PDF 文件。当处理 PDF 文件时使用。需要 pypdf 和 pdfplumber 包。
```

包必须在环境中安装后 Claude 才能使用它们。

---

## 故障排除

### 问题 1：Claude 不使用我的 Skill

**症状**：你提出相关问题但 Claude 不使用你的 Skill。

**检查项：**

1. **描述是否足够具体？**
   
   模糊描述使发现变得困难。包含 Skill 的功能和使用场景，以及用户会提到的关键词。

   ```yaml
   # ❌ 太通用
   description: 帮助处理数据

   # ✅ 具体
   description: 分析 Excel 电子表格，生成数据透视表，创建图表。当处理 Excel 文件、电子表格或 .xlsx 文件时使用。
   ```

2. **YAML 是否有效？**

   运行验证检查语法错误：

   ```bash
   # 查看前置元数据
   cat .claude/skills/my-skill/SKILL.md | head -n 15

   # 检查常见问题
   # - 缺少开头或结尾的 ---
   # - 使用制表符而非空格
   # - 未加引号的包含特殊字符的字符串
   ```

3. **Skill 是否在正确位置？**

   ```bash
   # 个人 Skills
   ls ~/.claude/skills/*/SKILL.md

   # 项目 Skills
   ls .claude/skills/*/SKILL.md
   ```

### 问题 2：Skill 有错误

**症状**：Skill 加载但未正确工作。

**检查项：**

1. **依赖是否可用？**

   Claude 会在需要时自动安装所需依赖（或请求安装许可）。

2. **脚本是否有执行权限？**

   ```bash
   chmod +x .claude/skills/my-skill/scripts/*.py
   ```

3. **文件路径是否正确？**

   在所有路径中使用正斜杠（Unix 风格）：

   ```markdown
   # ✅ 正确
   scripts/helper.py

   # ❌ 错误（Windows 风格）
   scripts\helper.py
   ```

### 问题 3：多个 Skills 冲突

**症状**：Claude 使用错误的 Skill 或在相似 Skills 间混淆。

**解决方案**：在描述中使用不同的触发词汇，帮助 Claude 选择正确的 Skill。

**改进前：**

```yaml
# Skill 1
description: 用于数据分析

# Skill 2
description: 用于分析数据
```

**改进后：**

```yaml
# Skill 1
description: 分析 Excel 文件和 CRM 导出中的销售数据。用于销售报告、管道分析和收入跟踪。

# Skill 2
description: 分析日志文件和系统指标数据。用于性能监控、调试和系统诊断。
```

---

## 示例集合

### 示例 1：简单 Skill（单文件）

**目录结构：**

```
commit-helper/
└── SKILL.md
```

**SKILL.md：**

```markdown
---
name: generating-commit-messages
description: 从 git diff 生成清晰的提交消息。当编写提交消息或查看暂存更改时使用。
---

# 生成提交消息

## 指令说明

1. 运行 `git diff --staged` 查看更改
2. 我会建议包含以下内容的提交消息：
   - 少于 50 个字符的摘要
   - 详细描述
   - 受影响的组件

## 最佳实践

- 使用现在时态
- 解释做了什么和为什么，而不是如何做
```

### 示例 2：带工具权限的 Skill

**目录结构：**

```
code-reviewer/
└── SKILL.md
```

**SKILL.md：**

```markdown
---
name: code-reviewer
description: 审查代码的最佳实践和潜在问题。当审查代码、检查 PR 或分析代码质量时使用。
allowed-tools: Read, Grep, Glob
---

# 代码审查

## 审查清单

1. 代码组织和结构
2. 错误处理
3. 性能考虑
4. 安全问题
5. 测试覆盖率

## 指令说明

1. 使用 Read 工具读取目标文件
2. 使用 Grep 搜索模式
3. 使用 Glob 查找相关文件
4. 提供详细的代码质量反馈
```

### 示例 3：多文件 Skill

**目录结构：**

```
pdf-processing/
├── SKILL.md
├── FORMS.md
├── REFERENCE.md
└── scripts/
    ├── fill_form.py
    └── validate.py
```

**SKILL.md：**

```markdown
---
name: pdf-processing
description: 提取文本、填写表单、合并 PDF 文件。当处理 PDF 文件、表单或文档提取时使用。需要 pypdf 和 pdfplumber 包。
---

# PDF 处理

## 快速开始

提取文本：

```python
import pdfplumber
with pdfplumber.open("doc.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```

表单填写请参阅 [FORMS.md](FORMS.md)。
详细 API 参考请参阅 [REFERENCE.md](REFERENCE.md)。

## 要求

包必须在环境中安装：

```bash
pip install pypdf pdfplumber
```
```

**注意**：Claude 只在需要时加载额外文件。

### 示例 4：Git 工作流 Skill

**目录结构：**

```
git-workflow/
├── SKILL.md
├── commit-templates.md
└── branch-naming.md
```

**SKILL.md：**

```markdown
---
name: git-workflow-helper
description: 帮助团队遵循 Git 工作流程最佳实践。当需要创建分支、提交或合并代码时使用。
allowed-tools: Bash(git:*)
---

# Git 工作流助手

## 分支命名约定

请参阅 [branch-naming.md](branch-naming.md) 了解详细的命名规则。

**快速参考：**
- 功能：`feature/描述`
- 修复：`fix/描述`
- 热修复：`hotfix/描述`

## 提交消息格式

请参阅 [commit-templates.md](commit-templates.md) 了解详细模板。

**基础格式：**
```
<type>: <subject>

<body>

<footer>
```

## 指令说明

1. 检查当前分支和状态
2. 验证分支名称符合约定
3. 创建结构化的提交消息
4. 在推送前确认更改
```

---

## 参考资源

### 官方文档

- [Agent Skills - Claude 文档](https://docs.claude.com/en/docs/claude-code/skills)
- [Agent Skills 概述](https://docs.claude.com/en/docs/claude-code/skills)
- [在 Agent SDK 中使用 Skills](https://docs.claude.com/en/docs/claude-agent-sdk/skills)
- [创建你的第一个 Skill](https://docs.claude.com/en/docs/claude-code/skills)
- [将 Skills 添加到插件](https://docs.claude.com/en/docs/claude-code/plugins)

### 工程博客

- [用 Agent Skills 装备真实世界的代理](https://www.anthropic.com/news/agent-skills)

### 相关工具

- Claude Code 插件系统
- Claude Agent SDK（TypeScript 和 Python）
- Model Context Protocol (MCP)

---

## 附录

### A. YAML 前置元数据完整参考

```yaml
---
# 必需字段
name: skill-name                    # Skill 名称（小写、连字符、最多 64 字符）
description: Skill 描述和使用场景    # 最多 1024 字符

# 可选字段
allowed-tools: Read, Write, Grep    # 允许的工具列表
---
```

### B. 文件命名约定

- Skill 目录：使用小写和连字符（`my-skill-name`）
- 主文件：必须命名为 `SKILL.md`（大写）
- 支持文件：使用描述性名称（`reference.md`, `examples.md`）
- 脚本：放在 `scripts/` 子目录
- 模板：放在 `templates/` 子目录

### C. 常用工具列表

| 工具名称 | 用途 | 示例 |
|---------|------|------|
| Read | 读取文件 | `allowed-tools: Read` |
| Write | 写入文件 | `allowed-tools: Write` |
| Grep | 搜索文本 | `allowed-tools: Grep` |
| Glob | 查找文件 | `allowed-tools: Glob` |
| SearchReplace | 替换文本 | `allowed-tools: SearchReplace` |
| Bash | 执行命令 | `allowed-tools: Bash(git:*)` |

### D. 故障排除检查清单

- [ ] SKILL.md 文件存在且位置正确
- [ ] YAML 前置元数据语法有效
- [ ] name 字段符合命名规范
- [ ] description 字段具体且包含触发词汇
- [ ] allowed-tools（如使用）列表正确
- [ ] 支持文件路径使用正斜杠
- [ ] 脚本有执行权限
- [ ] 依赖已安装或已记录
- [ ] 已在实际场景中测试

---

**文档版本**：v1.0.0  
**最后更新**：2025-10-31  
**参考链接**：https://docs.claude.com/en/docs/claude-code/skills

