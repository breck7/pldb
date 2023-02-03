# This file is in the site/ folder because we want it on the Nginx server
goaccess /root/pldb/ignore/access.log -o /root/pldb/site/trafficToday.html --log-format=COMBINED --anonymize-ip
zcat -f /root/pldb/ignore/access.log* | goaccess - -o /root/pldb/site/trafficTrends.html --log-format=COMBINED --anonymize-ip
