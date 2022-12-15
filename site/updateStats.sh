# This file is in the site/ folder because we want it on the Nginx server
goaccess /var/log/nginx/access.log -o /var/www/html/nginxDaily.html --log-format=COMBINED --anonymize-ip
zcat -f /var/log/nginx/access.log* | goaccess - -o /var/www/html/nginxDailyAll.html --log-format=COMBINED --anonymize-ip
