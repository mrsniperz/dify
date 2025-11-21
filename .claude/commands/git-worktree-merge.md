---
description: 将 worktree 分支合并到目标分支，支持多种合并策略
argument-hint: <source-branch> [target-branch] [--squash | --no-ff] [--delete-source]
allowed-tools:
  - Bash(git:*)
---

# 合并 Git Worktree 分支

## 上下文
- 当前分支: !`git branch --show-current`
- Git 状态: !`git status --short`
- 工作 tree 列表: !`git worktree list`
- 当前分支的远程跟踪: !`git rev-parse --abbrev-ref HEAD@{upstream}`
- 所有分支: !`git branch -a`

## 参数
- source-branch: $1 (要合并的源分支名)
- target-branch: $2 (可选，默认为 main 或 origin/main)
- 合并选项: $ARGUMENTS (解析 --squash、--no-ff、--delete-source 等选项)

## 你的任务

将指定分支合并到目标分支，实现以下步骤：

### 1. 预检查
- 确认源分支存在且可访问
- 确认目标分支存在且是干净状态
- 检查是否有未推送的更改
- 验证远程分支同步状态

### 2. 合并策略执行

#### 策略选择逻辑
- **普通合并** (默认)：保留完整分支历史
- **Squash 合并**：压缩分支历史为单个提交
- **No Fast-Forward**：确保合并提交独立存在

#### 具体命令
```bash
# 普通合并
git merge <source-branch>

# Squash 合并 (推荐用于小功能)
git merge --squash <source-branch>
git commit -m "feat: 合并功能描述 (squash from <source-branch>)"

# No Fast-Forward (推荐用于重要功能)
git merge --no-ff <source-branch>
```

### 3. 冲突处理

当发生合并冲突时，按以下流程处理：

#### 3.1 自动检测冲突
```bash
# 检查冲突状态
git status --porcelain | grep "^UU"
git status --porcelain | grep "^A "  # 查看新添加的冲突文件
```

#### 3.2 列出冲突文件
```bash
# 获取所有冲突文件列表
git diff --name-only --diff-filter=U
```

#### 3.3 询问用户处理策略

在检测到冲突后，**必须询问用户**如何处理冲突，提供以下选项：

**选项1: 选择保留某一方版本**
```
如何处理冲突？
1. 保留目标分支（当前分支）版本
2. 保留源分支版本
3. 手动逐一解决每个文件
4. 取消合并

请输入选项编号 (1-4):
```

**选项2: 查看冲突详情**
```
是否需要查看冲突详情？
- 显示冲突文件的差异: `git diff --name-only`
- 显示具体冲突内容: `git diff <file>`
- 继续处理
```

#### 3.4 执行选择的处理策略

**策略1: 保留目标分支版本**
```bash
# 对于每个冲突文件
git checkout --ours <conflict-file>
git add <conflict-file>

# 或者一键全部选择目标分支版本
git merge --strategy-option=ours
```

**策略2: 保留源分支版本**
```bash
# 对于每个冲突文件
git checkout --theirs <conflict-file>
git add <conflict-file>

# 或者一键全部选择源分支版本
git merge --strategy-option=theirs
```

**策略3: 手动解决**
```bash
# 1. 编辑冲突文件
# 冲突标记说明：
# <<<<<<< HEAD    - 目标分支版本
# =======         - 分隔符
# >>>>>>> branch  - 源分支版本
# 手动选择保留的内容，删除冲突标记

# 2. 添加解决后的文件
git add <conflict-files>

# 3. 查看解决状态
git status
```

**策略4: 使用合并工具**
```bash
# 使用 IDE 的合并工具（如 VS Code, IntelliJ）
# 或命令行工具
git mergetool

# 配置 mergetool（可选）
git config merge.tool vscode  # 使用 VS Code
```

#### 3.5 完成合并

**手动解决场景:**
```bash
# 1. 解决所有冲突后，添加文件
git add .

# 2. 完成合并
git commit -m "merge: 合并分支描述 (resolve conflicts)"

# 3. 查看合并结果
git log --oneline -3
```

**使用选项策略场景:**
```bash
# 自动选择版本后
git commit -m "merge: 合并分支描述 (strategy-option=ours/theirs)"
```

#### 3.6 取消合并（如果需要）
```bash
# 取消当前合并，恢复到合并前状态
git merge --abort

# 确认已恢复
git status
```

#### 3.7 冲突处理检查清单

- [ ] 检测所有冲突文件
- [ ] 明确选择处理策略
- [ ] 查看关键配置文件（如 `.env`, `package.json`）的冲突
- [ ] 逐一解决或批量处理
- [ ] 验证修改内容正确性
- [ ] 添加解决后的文件
- [ ] 提交合并结果
- [ ] 测试代码可运行

### 4. 后续操作
- 推送合并结果到远程
- 如使用 `--delete-source`，清理源分支
- 提供分支管理建议

## 实战合并流程

### 场景1：Hotfix 合并（快速修复）
```bash
# 合并 hotfix 分支到 main，保持历史
/git-worktree-merge hotfix/urgent-fix main --no-ff
```

### 场景2：小功能合并（保持整洁）
```bash
# Squash 合并小功能到 develop
/git-worktree-merge feature-small-change develop --squash
```

### 场景3：重要功能合并（保留历史）
```bash
# No FF 合并重要功能，并删除源分支
/git-worktree-merge feature-important main --no-ff --delete-source
```

### 场景4：远程分支合并
```bash
# 合并远程分支
/git-worktree-merge origin/hotfix-customer-issue main
```

## Squash 合并详细流程

Squash 合并是用户示例中重点提到的策略：

### 步骤1：执行 Squash 合并
```bash
git fetch origin
git merge --squash origin/hotfix/2025-10-31
```

### 步骤2：提交合并结果
```bash
git commit -m "fix: 紧急修复空指针（squash from hotfix/2025-10-31）"
```

### 步骤3：推送
```bash
git push origin main
```

### Squash 合并的优势
- 目标分支历史保持线性，干净
- 避免不必要的中间提交污染主分支
- 仍可通过 commit message 追溯原始分支

## 成功标准
- 成功完成合并操作
- 根据选择的策略正确执行
- 提供清晰的冲突解决指导
- 保持工作目录整洁
- 自动推送到远程（如适用）

## 注意事项
- 合并前确保目标分支是最新的
- 大型功能建议使用 squash 合并
- 重要功能建议使用 --no-ff 保留分支历史
- 删除源分支前确认合并成功