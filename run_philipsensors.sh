#!/bin/bash -e
screen -d -m -S telegraf bash -c 'telegraf --config /path/to/telegraf.cfg'
sleep 3
screen -d -m -S mongod bash -c 'sudo mongod --dbpath /path/to/mongodb'
sleep 5
screen -d -m -S sensor_handler bash -c 'cd /path/to/philipsensors/sensor_handler && npm start'
sleep 2
screen -d -m -S influxd bash -c 'influxd'
sleep 2
sudo service grafana-server start
