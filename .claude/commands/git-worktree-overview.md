---
description: Git Worktree 命令集合概览和完整实战指南
argument-hint:
allowed-tools:
  - Read
---

# Git Worktree 命令集合 - 完整实战指南

## 概述

这套命令基于真实开发工作流设计，遵循 Git ≥ 2.17 的最佳实践，提供从创建到删除的完整 worktree 生命周期管理。每个命令都整合了安全检查、错误处理和用户反馈。

## 核心优势

1. **平级目录策略**: worktree 创建在主仓库同级的独立目录，避免嵌套污染
2. **远程分支支持**: 完整支持从远程分支创建、跟踪和合并
3. **多种合并策略**: 普通合并、Squash 合并、No Fast-Forward 合并
4. **安全删除机制**: 多层安全检查，防止数据丢失
5. **完整生命周期**: 从创建到删除的端到端工作流

## 可用命令

### 1. 创建 Worktree
```bash
/git-worktree-create <branch-name> [base-branch] [--remote] [--path-custom]
```

#### 参数详解
| 参数 | 类型 | 必需 | 说明 | 示例 |
|------|------|------|------|------|
| `<branch-name>` | 字符串 | ✅ | 新分支名称 | `feature-user-authentication`、`hotfix/urgent-fix`、`experiment-new-ui` |
| `[base-branch]` | 字符串 | ❌ | 基础分支名，默认为当前分支 | `main`、`origin/main`、`develop`、`v1.0.0` |
| `--remote` | 标记 | ❌ | 基于远程分支创建，自动跟踪远程 | 用于紧急修复、基于最新远程代码 |
| `--path-custom` | 标记 | ❌ | 使用自定义路径，而非默认的 `../分支名` | 用于实验性开发：`../experiments/` |

#### 使用场景详解

**场景1：创建特性分支（常用）**
```bash
/git-worktree-create feature-payment-system
```
- 基于当前分支（如main）创建新特性分支
- 自动创建到平级目录 `../feature-payment-system`
- 适用于：日常功能开发

**场景2：从远程分支创建hotfix**
```bash
/git-worktree-create hotfix/security-patch origin/main --remote
```
- 基于最新远程主分支创建
- 自动跟踪远程分支，便于后续推送
- 适用于：紧急修复，基于最新代码

**场景3：实验性开发**
```bash
/git-worktree-create experiment-ai-integration ../experiments/ai --path-custom
```
- 将实验代码放在独立目录结构中
- 便于管理多个并行实验
- 适用于：探索性开发、概念验证

**场景4：从特定标签创建发布分支**
```bash
/git-worktree-create release/v1.1.0 v1.0.0
```
- 基于特定版本标签创建发布分支
- 适用于：版本维护、补丁开发

### 2. 合并分支
```bash
/git-worktree-merge <source-branch> [target-branch] [--squash | --no-ff] [--delete-source]
```

#### 参数详解
| 参数 | 类型 | 必需 | 说明 | 示例 |
|------|------|------|------|------|
| `<source-branch>` | 字符串 | ✅ | 要合并的源分支名 | `feature-user-authentication`、`hotfix/critical-fix` |
| `[target-branch]` | 字符串 | ❌ | 目标分支名，默认为当前分支 | `main`、`develop`、`release/v1.1.0` |
| `--squash` | 标记 | ❌ | Squash合并策略，将多个提交压缩为一个 | 保持历史整洁的小功能、快速修复 |
| `--no-ff` | 标记 | ❌ | No Fast-Forward合并，始终创建合并提交 | 重要功能里程碑、发布版本 |
| `--delete-source` | 标记 | ❌ | 合并成功后自动删除源分支 | 清理已合并的分支 |

#### 合并策略对比

| 策略 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **普通合并** | 保留完整历史，分支信息清晰 | 历史可能变得混乱 | 常规功能开发、协作分支 |
| **`--squash`** | 历史整洁、易于回滚、PR清晰 | 丢失中间提交历史 | 小功能、快速修复、实验性功能 |
| **`--no-ff`** | 明确里程碑、保留分支信息 | 历史可能冗余 | 重要功能、发布版本、hotfix |

#### 使用场景详解

**场景1：Squash合并（推荐）**
```bash
/git-worktree-merge feature-user-authentication main --squash --delete-source
```
- 将特性分支的多个提交压缩为一个提交合并到main
- 保持主分支历史线性整洁
- 自动清理已合并的源分支
- 适用于：小功能开发、快速修复、实验性功能

**场景2：No Fast-Forward合并**
```bash
/git-worktree-merge feature-important main --no-ff
```
- 始终创建合并提交，保留分支信息
- 便于追溯特定功能的完整提交链
- 不自动删除源分支，保留备份
- 适用于：重要功能里程碑、版本发布、hotfix

**场景3：普通合并（默认）**
```bash
/git-worktree-merge feature-regular develop
```
- 使用Git默认合并策略（可能是fast-forward或创建合并提交）
- 保留完整的分支历史
- 不自动删除源分支
- 适用于：常规功能开发、多人协作分支

**场景4：安全合并到开发分支**
```bash
/git-worktree-merge feature-payment-system develop
```
- 合并到开发分支而非主分支
- 经过测试后可能再次合并到main
- 适用于：大型功能的阶段性合并

**场景5：保留分支的合并**
```bash
/git-worktree-merge hotfix/security-patch main --no-ff
```
- 重要修复需要保留分支记录
- 用于审计和追溯
- 不使用 `--delete-source`，保留分支用于后续参考

### 3. 删除 Worktree
```bash
/git-worktree-delete <branch-name> [--force] [--delete-remote] [--prune]
```

#### 参数详解
| 参数 | 类型 | 必需 | 说明 | 示例 |
|------|------|------|------|------|
| `<branch-name>` | 字符串 | ✅ | 要删除的分支名 | `feature-user-authentication`、`hotfix/urgent-fix` |
| `--force` | 标记 | ❌ | 强制删除，忽略未提交更改警告 | 实验失败清理、不需要保留代码 |
| `--delete-remote` | 标记 | ❌ | 同时删除远程分支 | 完全清理hotfix分支、已推送的分支 |
| `--prune` | 标记 | ❌ | 清理残留的worktree记录 | 定期维护、深度清理 |

#### 安全机制详解

**多层安全检查**：
1. **未提交更改检查**：检测工作目录是否有未提交的更改
2. **当前分支保护**：防止删除当前活跃的分支
3. **用户确认提示**：强制删除需要用户明确确认
4. **远程分支同步**：可选的远程分支清理

**安全提示**：
- ⚠️ 使用 `--force` 前请确保代码已备份
- ⚠️ 使用 `--delete-remote` 前请确认分支已合并
- 建议优先使用普通删除，仅在必要时使用 `--force`

#### 使用场景详解

**场景1：安全删除已合并的特性分支（推荐）**
```bash
/git-worktree-delete feature-user-authentication --prune
```
- 检查分支已合并且无未提交更改
- 清理本地分支和残留的worktree记录
- 最安全的删除方式
- 适用于：完成开发后清理

**场景2：强制删除实验失败的分支**
```bash
/git-worktree-delete experiment-failed-ai --force
```
- 忽略未提交更改警告
- 快速清理实验性代码
- 不清理远程分支（实验分支通常不推送）
- 适用于：实验失败、不需要保留代码

**场景3：完全清理Hotfix分支**
```bash
/git-worktree-delete hotfix/security-patch --delete-remote --prune
```
- 清理本地分支
- 同时删除远程分支
- 清理所有残留记录
- 适用于：紧急修复完成后的彻底清理

**场景4：保留远程分支的清理**
```bash
/git-worktree-delete feature-payment-system --prune
```
- 仅清理本地worktree
- 保留远程分支（便于其他团队成员访问）
- 清理残留记录
- 适用于：需要保留远程分支代码的场景

**场景5：清理从未推送的本地分支**
```bash
/git-worktree-delete feature-local-only
```
- 简单的本地分支删除
- 无需远程清理选项
- 检查未提交更改
- 适用于：纯本地开发分支

**场景6：批量清理（结合其他命令）**
```bash
# 查看所有分支
git branch --merged main

# 删除已合并的分支（除了main）
/git-worktree-delete feature-old-feature --prune
```
- 结合Git命令进行批量清理
- 定期维护工作空间

## 完整实战流程

### 阶段1：环境准备
```bash
# 检查当前状态
git status --short
git branch --show-current
git worktree list
```

### 阶段2：创建开发分支
```bash
# 创建特性分支（基于本地 main）
/git-worktree-create feature-user-authentication

# 创建 hotfix 分支（基于远程 main）
/git-worktree-create hotfix/urgent-login-fix origin/main --remote

# 创建实验分支（自定义路径）
/git-worktree-create experiment-ai-integration ../experiments/ai --path-custom
```

### 阶段3：独立开发
```bash
# 切换到新创建的 worktree
cd ../feature-user-authentication

# 进行开发工作
# ... 开发代码 ...

# 提交更改
git add .
git commit -m "feat: 实现用户认证功能"

# 推送到远程
git push origin feature-user-authentication
```

### 阶段4：代码审查和合并
```bash
# 回到主仓库
cd /path/to/main/repo

# 合并特性分支（推荐 Squash 合并）
/git-worktree-merge feature-user-authentication main --squash

# 或者重要功能使用 No Fast-Forward
/git-worktree-merge feature-important main --no-ff --delete-source
```

### 阶段5：清理工作
```bash
# 安全删除已合并的分支
/git-worktree-delete feature-user-authentication --prune

# 完全清理 hotfix 分支（本地+远程）
/git-worktree-delete hotfix/urgent-login-fix --delete-remote --prune
```

## 高级使用模式

### 模式1：Hotfix 工作流（紧急修复）
```bash
# 1. 创建 hotfix 分支
/git-worktree-create hotfix/2025-10-31

# 2. 修复问题
cd ../hotfix/2025-10-31
# ... 修复代码 ...
git commit -m "fix: 紧急修复空指针"

# 3. 合并到 main（保留历史）
/git-worktree-merge hotfix/2025-10-31 main --no-ff

# 4. 完全清理
/git-worktree-delete hotfix/2025-10-31 --delete-remote --prune
```

### 模式2：功能开发工作流
```bash
# 1. 创建特性分支
/git-worktree-create feature-payment-integration

# 2. 开发并推送
cd ../feature-payment-integration
git push -u origin feature-payment-integration

# 3. GitHub/GitLab 创建 PR，代码审查

# 4. 合并（使用 Squash 保持历史整洁）
/git-worktree-merge feature-payment-integration develop --squash

# 5. 清理
/git-worktree-delete feature-payment-integration --prune
```

### 模式3：实验性开发
```bash
# 1. 创建实验分支（自定义路径）
/git-worktree-create experiment-new-ui ../experiments/new-ui --path-custom

# 2. 进行实验
cd ../experiments/new-ui
# ... 实验代码 ...

# 3. 如果实验成功，合并到主分支
/git-worktree-merge experiment-new-ui main --squash

# 4. 如果实验失败，强制删除
/git-worktree-delete experiment-new-ui --force
```

## Squash 合并深度指南

Squash 合并是推荐的工作流，特别适用于：

- 小功能开发
- 快速修复
- 保持主分支历史整洁

### Squash 合并流程
```bash
# 1. 执行 squash 合并
git fetch origin
git merge --squash origin/feature-branch

# 2. 提交合并结果
git commit -m "feat: 功能描述（squash from feature-branch）"

# 3. 推送
git push origin main
```

### Squash 合并的优势
- **历史整洁**: 目标分支保持线性历史
- **提交聚合**: 多个小提交合并为一个大提交
- **易于回滚**: 单一提交更容易回滚
- **PR 追溯**: 仍可通过 commit message 追溯原始分支

## 最佳实践总结

### 分支命名规范
- `feature/`: 新功能开发
- `hotfix/`: 紧急修复（带日期）
- `bugfix/`: 常规bug修复
- `experiment/`: 实验性开发

### 路径管理策略
- 使用平级目录：`../分支名`
- 实验性分支：`../experiments/实验名`
- 自定义项目使用：`../worktrees/项目名`

### 参数选择指南

#### 创建分支时的参数选择
| 场景 | 推荐参数组合 | 说明 |
|------|--------------|------|
| 日常功能开发 | `<branch-name>` | 默认参数，基于当前分支 |
| 紧急修复 | `<branch-name> origin/main --remote` | 基于最新远程主分支 |
| 实验性开发 | `<branch-name> <path> --path-custom` | 使用独立目录 |
| 版本维护 | `<branch-name> <tag>` | 基于特定标签 |

#### 合并分支时的参数选择
| 场景 | 推荐参数组合 | 原因 |
|------|--------------|------|
| 小功能开发 | `--squash --delete-source` | 保持历史整洁，自动清理 |
| 重要功能 | `--no-ff` | 保留分支信息用于追溯 |
| 常规协作 | 无额外参数 | 使用默认策略 |
| Hotfix修复 | `--no-ff --delete-source` | 重要修复需要保留记录 |

#### 删除分支时的参数选择
| 场景 | 推荐参数组合 | 说明 |
|------|--------------|------|
| 完成开发后的清理 | `--prune` | 安全删除，清理残留 |
| 实验失败清理 | `--force` | 忽略未提交更改 |
| 完全清理hotfix | `--delete-remote --prune` | 清理本地和远程 |
| 保留远程分支 | `--prune` | 仅清理本地 |

### 合并策略选择
- **Squash 合并**: 小功能、快速修复（推荐）
- **No Fast-Forward**: 重要功能、里程碑
- **普通合并**: 常规功能开发

### 安全操作清单
- [ ] 创建前检查工作目录干净
- [ ] 合并前更新目标分支
- [ ] 删除前确认无重要未提交更改
- [ ] 定期清理残留记录
- [ ] 使用 `--force` 前确保代码已备份
- [ ] 使用 `--delete-remote` 前确认分支已合并
- [ ] 实验分支使用独立目录便于管理
- [ ] 重要功能合并使用 `--no-ff` 保留历史

## 故障排除

### 常见问题
1. **路径冲突**: 检查目标目录是否已存在
2. **权限问题**: 确认对目标目录有写权限
3. **分支不存在**: 检查分支名拼写和远程分支状态
4. **合并冲突**: 使用 IDE 合并工具解决

### 辅助命令
```bash
# 查看所有 worktrees
git worktree list

# 查看分支状态
git branch -a

# 检查未推送的提交
git log --oneline --branches --not --remotes

# 清理残留记录
git worktree prune
```

## 快速参考

### 命令速查表

| 命令 | 语法 | 关键参数 |
|------|------|----------|
| **创建** | `/git-worktree-create <name> [base] [--remote] [--path-custom]` | `--remote`: 基于远程分支<br>`--path-custom`: 自定义路径 |
| **合并** | `/git-worktree-merge <source> [target] [--squash\|--no-ff] [--delete-source]` | `--squash`: 压缩合并<br>`--no-ff`: 保留分支信息<br>`--delete-source`: 自动删除源分支 |
| **删除** | `/git-worktree-delete <name> [--force] [--delete-remote] [--prune]` | `--force`: 强制删除<br>`--delete-remote`: 删除远程分支<br>`--prune`: 清理残留记录 |

### 常用组合

```bash
# 特性开发完整流程
/git-worktree-create feature-new功能
cd ../feature-new功能
# ... 开发 ...
git commit -m "feat: 新功能"
/git-worktree-merge feature-new功能 main --squash --delete-source

# Hotfix修复流程
/git-worktree-create hotfix/修复内容 origin/main --remote
cd ../hotfix/修复内容
# ... 修复 ...
git commit -m "fix: 修复问题"
/git-worktree-merge hotfix/修复内容 main --no-ff
/git-worktree-delete hotfix/修复内容 --delete-remote --prune

# 实验性开发
/git-worktree-create experiment-实验名 ../experiments/实验名 --path-custom
cd ../experiments/实验名
# ... 实验 ...
/git-worktree-delete experiment-实验名 --force  # 实验失败
# 或
/git-worktree-merge experiment-实验名 main --squash  # 实验成功
```

## 版本要求

- Git ≥ 2.17（支持 `git worktree remove` 命令）
- 支持现代终端环境
- 推荐配置 Git 默认分支名为 `main`

这套命令集合遵循现代 Git 工作流最佳实践，提供安全、高效的 worktree 管理能力。