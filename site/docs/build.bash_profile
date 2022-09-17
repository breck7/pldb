# vim ~/.bash_profile
alias ebp='vim ~/.bash_profile' # edit this file
alias rbp='source ~/.bash_profile' # reload this file (after making edits)

#Git
alias gs="git status"
alias gp="git pull"
alias ga="git add ."
alias gb="git branch"
alias gg="git commit -m 'checkpoint'"
alias squash="git merge --squash"
alias branches="git branch --sort=-committerdate"
alias gr="git reset --soft HEAD~1" # Reset one commit back
alias gru="git reset 'HEAD@{1}'" # Undo reset
alias qa="git commit -m 'qa'"

cd pldb
gs