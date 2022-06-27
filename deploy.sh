echo "Rsyncing the contents of pldb.pub/ to the /var/www/html folder on the PLDB server"
rsync -vr pldb.pub/* pldb@pldb.pub:/var/www/html/