---
description: 创建新的 git worktree 和分支，默认使用项目内部 worktrees/ 目录
argument-hint: <branch-name> [base-branch] [--remote] [--path-custom]
allowed-tools:
  - Bash(git:*)
---

# 创建 Git Worktree

## 上下文

- 当前分支: !`git branch --show-current`
- Git 状态: !`git status --short`
- 所有分支: !`git branch -a`
- Worktree 列表: !`git worktree list`

## 分支命名规范

- **特性分支**: `feature/` 前缀，如 `feature/user-auth`
- **紧急修复**: `hotfix/` 前缀，如 `hotfix/security-patch`
- **Bug 修复**: `bugfix/` 前缀，如 `bugfix/login-issue`
- **优化改进**: `optimize/` 前缀，如 `optimize/performance`

## 常用场景

### 默认创建（推荐）
```bash
# 创建特性分支，默认使用 worktrees/ 目录
/git-worktree-create feature-new功能
# 执行: git worktree add -b feature-new功能 worktrees/feature-new功能

# 创建紧急修复分支
/git-worktree-create hotfix-urgent-fix
# 执行: git worktree add -b hotfix-urgent-fix worktrees/hotfix-urgent-fix
```

### 基于远程分支
```bash
# 基于远程主分支
/git-worktree-create feature-payment origin/main --remote
# 执行: git worktree add -b feature-payment worktrees/feature-payment origin/main
```

### 自定义路径
```bash
# 外部目录（用于大型重构）
/git-worktree-create big-refactor --path-custom ../big-refactor
# 执行: git worktree add -b big-refactor ../big-refactor
```

## 您的任务

根据以上信息创建新的 worktree：

1. **验证输入参数**
   - 检查分支名是否提供
   - 验证分支命名规范
   - 确定基础分支（默认 main 或 origin/main）

2. **确定路径策略**
   - 首选: `worktrees/<branch-name>` (项目内部)
   - 备选: `--path-custom` 指定的自定义路径

3. **执行创建命令**
   - 使用 `git worktree add` 创建工作树
   - 自动切换到新分支
   - 设置适当的上游跟踪关系

4. **提供操作反馈**
   - 显示 worktree 创建成功信息
   - 提供工作树路径
   - 给出后续操作建议（cd 到目录、开发、提交等）

5. **错误处理**
   - 分支已存在：提示并建议切换
   - 路径冲突：建议替代路径
   - 基础分支不存在：显示可用分支列表

请确保创建过程顺利，并为用户提供清晰的操作指导。