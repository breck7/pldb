# To install paste the contents of this file into:
# vim ~/.bash_profile
# Add the below line and uncomment it:

#Meta
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

#See what's users want in realtime on nginx server
alias listenToYourUsers="sudo tail -f /var/log/nginx/access.log"

# On edit.pldb.com on login go straight to pldb/ git repo and show git status:
# cd pldb
# gs

# On pldb.com on login go straight to /var/www/html folder and see what's going on:
# cd /var/www/html
# listenToYourUsers
