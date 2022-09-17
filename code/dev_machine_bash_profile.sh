# Git
alias gs="git status"
alias gg="git commit -m 'checkpoint'"
alias ga="git add .; gs"
alias gp="git pull"
alias gc="git commit -m"
alias qa="git add .;git commit -m 'QA'"
alias gr="git reset --soft HEAD~1"
alias gru="git reset 'HEAD@{1}'"
alias squash="git merge --squash"
alias branches="git branch --sort=-committerdate"

# Npm
alias x="npm run"

# Mac
alias bigfiles="du -a . | sort -n -r | head -n 30"
alias serve="python -m SimpleHTTPServer 80"
alias wifipow="/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -s"
alias s="open -a /Applications/Sublime\ Text.app/"
alias ezp="s ~/.zprofile"
alias rzp='source ~/.zprofile' # reload this file (after making edits)

# PDP Servers
alias marconi="ssh pldb.com"
alias build="ssh build.pldb.com"
alias george="ssh cancerdb.com"
