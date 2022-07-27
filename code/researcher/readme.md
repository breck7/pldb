# PLDB Researcher

PLDB Researcher is a web server and frontend end for adding and editing content
on PLDB.

## Local usage

```
git clone https://github.com/breck7/pldb
cd pldb
npm install .
./code/researcher/PLDBResearcherServer.ts startDevServer
```

## Prod setup

https://researcher.pldb.pub is hosted on the smallest Digital Ocean droplet.

Follow the same setup instructions as here (stopping before Nginx installation): https://pldb.pub/about-this-web-server.html

```
sudo apt-get install git
sudo curl -L https://raw.githubusercontent.com/tj/n/master/bin/n -o n
sudo bash n lts
sudo npm install -g n
sudo npm install -g ts-node
sudo npm install -g pm2
sudo npm install -g typescript
# Allow non-root to bind to 80:
exit
echo 'net.ipv4.ip_unprivileged_port_start=80' > /etc/sysctl.d/50-unprivileged-ports.conf
sysctl --system
su pldb
cd
# Generate keys
ssh-keygen -t rsa
# Get pldb
git clone git@github.com:pldbbot/pldb.git
cd pldb
npm install .
tsc
# Test that it works over http
node ./code/researcher/PLDBResearcherServer.js startDevServer 80
# Now get SSL cert for https
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo certbot certonly --standalone
mkdir ignore
sudo cp /etc/letsencrypt/live/researcher.pldb.pub/privkey.pem ignore
sudo cp /etc/letsencrypt/live/researcher.pldb.pub/fullchain.pem ignore
sudo chown pldb:pldb ignore/privkey.pem
sudo chown pldb:pldb ignore/fullchain.pem
# Now start with pm2 over http2
pm2 start ./code/researcher/PLDBResearcherServer.js -- startProdServer
pm2 startup systemd
```

## Prod deploying

```
ssh pldb@researcher.pldb.pub
cd pldb
git pull
tsc
pm2 restart 0
```
