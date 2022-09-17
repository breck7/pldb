# vim ~/.bash_profile
alias ebp='vim ~/.bash_profile' # edit this file
alias rbp='source ~/.bash_profile' # reload this file (after making edits)
alias stats="sudo goaccess /var/log/nginx/access.log -o /var/www/html/nginxDaily.html --log-format=COMBINED --anonymize-ip;sudo zcat -f /var/log/nginx/access.log* | goaccess -o /var/www/html/nginxDailyAll.html --log-format=COMBINED --anonymize-ip"

# Put out fires/see what users want in realtime on nginx server
alias live="sudo goaccess /var/log/nginx/access.log -c --log-format=COMBINED"
alias liveRaw="sudo tail -f /var/log/nginx/access.log"

cd /var/www/html
liveRaw