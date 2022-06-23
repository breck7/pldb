echo "Rsyncing the contents of codelani.com/ to the /var/www/html folder on the CodeLani server"
rsync -vr codelani.com/* root@codelani.com:/var/www/html/