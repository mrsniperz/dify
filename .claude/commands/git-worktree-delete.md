---
description: 安全删除 git worktree 和分支，支持多种清理选项
argument-hint: <branch-name> [--force] [--delete-remote] [--prune]
allowed-tools:
  - Bash(git:*)
---

# 删除 Git Worktree

## 上下文
- 所有 worktrees: !`git worktree list`
- 当前分支: !`git branch --show-current`
- 所有分支: !`git branch -a`
- 远程跟踪分支: !`git branch -r`
- 未推送的提交: !`git log --oneline --branches --not --remotes`

## 参数
- branch-name: $1 (要删除的分支名)
- --force: $2 (可选，强制删除，跳过安全检查)
- --delete-remote: $3 (可选，同时删除远程分支)
- --prune: $4 (可选，清理残留的 worktree 记录)

## 你的任务

安全删除指定的 worktree 和分支，实现以下步骤：

### 1. 预删除检查
- 确认目标分支存在
- 检查是否在当前分支（不允许删除当前分支）
- 检查是否有未提交的更改
- 检查是否有未推送到远程的提交

### 2. 安全验证
如果未使用 `--force` 标志：
- 有未提交更改：要求处理（提交/暂存/丢弃）
- 有未推送提交：询问是否推送到远程
- 要求明确确认删除操作

### 3. 执行删除
```bash
# 删除 worktree (Git ≥ 2.17)
git worktree remove <path>

# 清理残留记录（如需要）
git worktree prune

# 删除本地分支
git branch -d <branch-name> 2>/dev/null || git branch -D <branch-name>

# 删除远程分支（如需要）
git push origin --delete <branch-name>
```

### 4. 验证清理
- 确认 worktree 已从列表中移除
- 验证分支已删除
- 报告清理结果

## 删除策略

### 策略1：安全删除（推荐）
```bash
# 默认模式，会进行安全检查
/git-worktree-delete feature-completed
```

### 策略2：强制删除
```bash
# 跳过安全检查，丢弃所有更改
/git-worktree-delete experiment-branch --force
```

### 策略3：完全清理
```bash
# 删除本地和远程分支，清理残留记录
/git-worktree-delete hotfix/urgent-fix --delete-remote --prune
```

## 安全保护机制

### 保护当前分支
不允许删除当前所在的分支，避免工作目录损坏。

### 未提交更改保护
```bash
# 检查工作目录状态
git status --porcelain

# 检查未推送的提交
git log --oneline --branches --not --remotes
```

### 用户确认机制
- 显示要删除的分支信息
- 列出相关的未提交更改
- 要求明确确认："确认删除 branch-name 分支？(y/N)"

## 清理工作树最佳实践

根据用户实战流程示例：

### 步骤1：删除 worktree
```bash
git worktree remove ../hotfix
```

### 步骤2：清理残留记录
```bash
git worktree prune
```

### 步骤3：删除远程分支（可选）
```bash
git push origin --delete hotfix/2025-10-31
```

## 实战示例

### 场景1：删除已合并的特性分支
```bash
# 安全删除已完成的特性分支
/git-worktree-delete feature-user-auth --prune
```

### 场景2：清理实验分支
```bash
# 强制删除实验分支，丢弃所有更改
/git-worktree-delete experiment-new-ui --force
```

### 场景3：完全清理 hotfix 分支
```bash
# 删除本地和远程 hotfix 分支
/git-worktree-delete hotfix/2025-10-31 --delete-remote --prune
```

### 场景4：批量清理
```bash
# 清理所有残留记录
/git-worktree-delete --prune
```

## 成功标准
- 成功删除指定的 worktree
- 安全处理未提交的更改
- 正确清理本地分支
- 如需要，删除远程分支
- 提供完整的清理报告

## 注意事项
- 删除操作不可撤销，请谨慎确认
- 强制删除会丢失未提交的更改
- 删除远程分支前确认团队协作状态
- 定期使用 `--prune` 清理残留记录