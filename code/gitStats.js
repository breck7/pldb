const { execSync } = require("child_process")

class GitStats {
  constructor(repoUrl, targetDir) {
    this.repoUrl = repoUrl
    this.targetDir = targetDir
  }

  clone() {
    const { repoUrl, targetDir } = this
    console.log(`Cloning into ${this.targetDir}`)
    const command = `git clone ${repoUrl} ${targetDir}`
    execSync(command, { encoding: "utf8", timeout: 60000 })
    return this
  }

  pull() {
    const { repoUrl, targetDir } = this
    console.log(`Pulling into ${this.targetDir}`)
    const command = `git pull ${repoUrl} ${targetDir}`
    execSync(command, { encoding: "utf8", timeout: 20000 })
    return this
  }

  execGitCommand(command) {
    return execSync(`git ${command}`, { encoding: "utf8", cwd: this.targetDir, maxBuffer: 10 * 1024 * 1024 })
  }

  get firstCommit() {
    const command = 'log --reverse --pretty=format:"%ad" | head -n 1'
    const output = this.execGitCommand(command)
    return new Date(output.trim()).getFullYear()
  }

  get newestCommit() {
    const command = 'log --pretty=format:"%ad" | head -n 1'
    const output = this.execGitCommand(command)
    return new Date(output.trim()).getFullYear()
  }

  get commits() {
    const command = "rev-list --all --count"
    const output = this.execGitCommand(command)
    return Number(output.trim())
  }

  get committers() {
    const command = 'log --pretty=format:"%aN <%aE>"'
    const output = this.execGitCommand(command)
    const lines = output.trim().split("\n")
    const uniqueContributors = new Set(lines)
    return uniqueContributors.size
  }

  get files() {
    const command = "ls-files | wc -l"
    const output = this.execGitCommand(command)
    return Number(output.trim())
  }

  get summary() {
    return {
      firstCommit: this.firstCommit,
      newestCommit: this.newestCommit,
      commits: this.commits,
      committers: this.committers,
      files: this.files
    }
  }
}

module.exports = { GitStats }
