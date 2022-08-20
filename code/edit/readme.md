# PLDB Edit

PLDB Edit is a web server and frontend end for adding and editing content
on PLDB.

## Local usage

```
git clone https://github.com/breck7/pldb
cd pldb
npm install .
./code/edit/PLDBEditServer.ts startDevServer
```

## Prod setup

https://edit.pldb.com is hosted on the smallest Digital Ocean droplet.

Follow the same setup instructions as here (stopping before Nginx installation): https://pldb.com/about-this-web-server.html

```
sudo apt-get install git
sudo curl -L https://raw.githubusercontent.com/tj/n/master/bin/n -o n
sudo bash n lts
sudo npm install -g n
sudo npm install -g ts-node
sudo npm install -g pm2
sudo npm install -g typescript
sudo npm install -g jtree
# Allow non-root to bind to 80:
exit
echo 'net.ipv4.ip_unprivileged_port_start=80' > /etc/sysctl.d/50-unprivileged-ports.conf
sysctl --system
su pldb
cd
# Generate keys
ssh-keygen -t rsa
# Get pldb
git clone git@github.com:breck7/pldb.git
cd pldb
npm install .
npm run build
cd code
tsc
# Test that it works over http
node ./code/edit/PLDBEditServer.js startDevServer 80
# Now get SSL cert for https
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo certbot certonly --standalone
mkdir ignore
sudo cp /etc/letsencrypt/live/edit.pldb.com/privkey.pem ignore
sudo cp /etc/letsencrypt/live/edit.pldb.com/fullchain.pem ignore
sudo chown pldb:pldb ignore/privkey.pem
sudo chown pldb:pldb ignore/fullchain.pem
# Now start with pm2 over http2
pm2 start ./code/edit/PLDBEditServer.js -- startProdServer
pm2 startup systemd
```

## Prod deploying

```
ssh pldb@edit.pldb.com
cd pldb
git pull
npm install .
npm run build
cd code
tsc
pm2 restart 0
```
