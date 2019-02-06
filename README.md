# Philip Sensors

Philips Hue based occupancy monitoring system. 

Used for gathering and presenting presence/reservation data gathered with Philips Hue family sensors. 

The system also includes a bulb implementation, where a bulb with the same name as a sensor will change its color according to the presence status of the sensor.

## Getting Started

TODO:

Setting up the Philips hardware (i.e. creating usernames for the bridges): 
Follow the steps at: https://developers.meethue.com/develop/get-started-2/ (Requires creating an account)

Configure files: /philipsensors/sensor_handler/client/src/App.js and /philipsensors/sensor_handler/backend/server.js
Should be configured to include the correct "<ID> : <USERNAME>" in the usernames json. 
All the HTTP requests require the username as part of the URL. Future work: This could be implemented in a better way.

Configure telegraf /philipsensors/data_handler/telegraf/telegraf.cfg 
should be configured to include the correct URLs for each sensor.

Create an admin user for the control panel. An example HTTP requests for the authorization can be found in:
/philipsensors/requests_and_queries



The system's parts can be run in the following way:

    run telegraf (in screen or as service)
        telegraf --config ~/philipsensors/data_handler/telegraf/telegraf.cfg
    run influxdb
        influxd
    run mongodb (in screen or as service)
        mongod --dbpath ~/path/to/mongodb
    run grafana
        sudo service grafana-server start

    npm start in "sensor_handler" folder runs both front and backend.

A bash script (run_philipsensors.sh) that runs the whole system is also included. Using it requires copnfiguring the paths. It might also require further configuring. It is designed to be used mainly during development.

Usage :
```
	./run_philipsensors.sh
```
(requires administrator privileges)
   

## Prerequisites
```
    telegraf
    influxdb
    MongoDB
    Grafana
```
```
    Specific npm packages:
        - huejay: Philips hue library for Node: mainly for bridge 
        UPNP discovery (huejay.discover()). 
        - influx@next: Pulling data from influxDB in the backend
```

## Installing
```
    pull code :
        git clone git@version.aalto.fi:juoppet1/philipsensors.git
    under /sensor_handler/:
        npm install
```



## Built With
```
    Node.js     
        - Backend: controlling the sensor system configurations and 
        managing data between frontend and influxDB
    MongoDB     
        - Database: Configuration storage: Room information, 
        Philips Hue hardware configuration storage, user/auth
    React       
        - Frontend
    InfluxDB    
        - Database: Data storage: sensor presence/reservation data.
    telegraf    
        - Data broker between philips bridges and influxdb
    Grafana     
        - Visualizing data from influxDB.
```



## Authors
Tuomas Juopperi - Aalto University

## License
This project is licensed under the MIT License.

Copyright 2019 Tuomas Juopperi

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Acknowledgments
Thanks to Aalto University and all the people who helped me and were involved in this project. 
Thank YOU!
