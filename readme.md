# Setup My Pi

## history

### node
- curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
- nvm install v20.11.0
- nvm use lts/iron
- nvm use defaul lts/iron
- node --version
- npm --version

### smb
- sudo apt-get update
- sudo apt-get install samba samba-common-bin
- sudo cp /etc/samba/smb.conf /etc/samba/smb.conf.orig
- sudo nano /etc/samba/smb.conf
````
# add at the end

[Projects]
path = /home/suenlue/Projects
writeable = yes
create mask = 0777
directory mask = 0777
public = yes

````
- sudo smbpasswd -a suenlue
- sudo systemctl restart smbd

### pm2
- npm install pm2 -g
- pm2 start app.js --name "express_example"
- pm2 startup
    -  Speichert den Prozess in den Startup des Systems und führt dabei inital in der Konzole alles auf
- pm2 save
    - Speichert die Startup Einstellungen


### code-server
- curl -fsSL https://code-server.dev/install.sh | sh
- code-server
- nano /home/suenlue/.config/code-server/config.yaml
````
bind-addr: 0.0.0.0:8080
auth: password
password: netTrek
cert: false
````
- sudo nano /etc/systemd/system/code-server.service

````
[Unit]
Description=code-server
After=network.target

[Service]
Type=simple
User=suenlue
ExecStart=/usr/bin/code-server --auth none --bind-addr 0.0.0.0:8080
Restart=always

[Install]
WantedBy=default.target
````

- sudo systemctl enable code-server.service
- sudo systemctl start code-server.service
- sudo systemctl status code-server.service

### allow node to use bluetooth without sudo or root
- sudo apt-get update
- sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev build-essential
- npm install -g node-gyp
- sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev
- bluetoothctl
- sudo usermod -a -G bluetooth $USER
- sudo apt-get install libcap2-bin
- sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)


### lokale npm
- npm install bluetooth-serial-port
- npm install @abandonware/noble

## ssh commands

- ssh suenlue@raspberrypi.local
    - pwd in 1Pwd

## terminal commands

### raspi konfig
- sudo raspi-config
    - gemacht um inital WiFi einzustellen
    - Und RemoteVC

### shotdown
- sudo shutdown -h now

### reboot
- sudo reboot