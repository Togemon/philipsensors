const mongoose = require("mongoose");
const axios = require('axios');
const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");
const Bridge = require("./models/bridge");
const User = require("./models/user");
const Room = require("./models/room");
const Influx = require('influx');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const isAuthorized = require('./middleware');
const config = require('./config/config.json');
const secret = config.secret;
let huejay = require('huejay');


//Variables
const API_PORT = 3001;
const app = express();
const router = express.Router();
var measurementCountQ = 50;
var thresholdQ = 1;

//Update to match your Philips Hue bridges information after setting up the bridge. 
// Example id: "ECB5FAFFFE029333"
// Example username: "brXuIXS24X5yA1wD4QhlHb49f09CZPmCuXXXxxxx"
const usernames = {
  "<BRIDGE1_ID>": "<BRIDGE1_USERNAME>",
  "<BRIDGE2_ID>": "<BRIDGE2_USERNAME>"
}

// this is our MongoDB database
const dbRoute = "mongodb://localhost:27017/sensordb";

// connect backend with the mongoDB database
mongoose.connect(
  dbRoute,
  { useNewUrlParser: true }
);

let db = mongoose.connection;

// lightSwitchingVariables
let lightSwitchRunning = false;
let lightSwitchStatus = "off";
//var threshold = 2;
//var measurementCount = 10;

// Set up influxDB 
const influx = new Influx.InfluxDB({
  host: 'localhost:8086',
  database: 'test',
  schema: [
      {
          measurement: 'http',
          fields: { 
            'state_presence': Influx.FieldType.INTEGER
          },
          tags: [
             'name' 
          ]
      }
  ]
})

// check that the influxDB exists
influx.getDatabaseNames()
  .then(names => {
    if (!names.includes('test')) {
      return influx.createDatabase('test');
    }
  })
  .catch(err => {
    console.error('Error creating influxDB!')
  })


db.once("open", () => console.log("connected to the database"));

// checks if connection with the database is successful
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// (optional) only made for logging and
// bodyParser, parses the request body to be a readable json format
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(logger("dev"));

// This function does the automatic light controlling.
function lightSwitch(variables) {
  Bridge.find({}, function(err, bridges) {
    if (err) console.log(err)
    var lights;//bridges[0].lights;
    var bridgeIp;
    //var username;
    var threshold;
    var measurementCount;
    var name;
    threshold = variables.threshold;
    measurementCount = variables.measurementCount;
    influx.query(
      `
      SELECT "state_presence","name","url" FROM http 
      GROUP BY "name"
      ORDER BY time DESC
      LIMIT ${measurementCount}
      `
    ) 
      .then(result => {
        for (var l = 0; l < bridges.length; l++) {
          lights = bridges[l].lights; 
          bridgeIp = bridges[l].ip;
          for (var i = 0; i < result.length/measurementCount; i++) {
            var sum = 0;
            for (var j = 0; j < measurementCount; j++) {
              sum += parseInt(result[j + i* measurementCount].state_presence, 10);
              name = result[j + i*measurementCount].name;
            }
            Object.keys(lights).forEach(function(k) {
              if (lights[k].name === name) {
                var id = parseInt(k,10)+1;
                if (sum >= threshold) {
                  axios.put("http://"+bridgeIp+"/lights/"+id+"/state", {"hue": 65280, "sat": 254})
                } else {
                  axios.put("http://"+bridgeIp+"/lights/"+id+"/state", {"hue": 25500, "sat": 254})
                }
              }
            }); 
          }
        }
      })
  });
}

// This method simply sends the client a boolean stating wether the automatic light controlling is on.
router.get("/getLightSwitchStatus", (req,res) => {
  res.json({lightswitch: lightSwitchStatus});
})

// This method controls the measuerementCountQ and thresholdQ variables used by influxQ function.
router.post("/setStatusVariables", (req,res) => {
  measurementCountQ = req.body.measurementCountQ;
  thresholdQ = req.body.thresholdQ;
  res.json({measurementCountQ, thresholdQ});
})

// This method is an on/off switch for the automatic light controlling with presence data.
router.post("/lightSwitch", isAuthorized, (req,res) => {
  if (lightSwitchRunning === false) {
    var variables = req.body;
    lightSwitchRunning = setInterval(() => lightSwitch(variables),5000);
    lightSwitchStatus = "on"
    res.json({lightswitch: lightSwitchStatus, variables: variables});
  } else {
    clearInterval(lightSwitchRunning);
    lightSwitchRunning = false;
    lightSwitchStatus = "off"
    res.json({lightswitch: lightSwitchStatus, variables: variables});
  }
})

// This method searches the local area network for HUE bridges and sends them to the client.
router.get("/upnp", isAuthorized, (req,res) => {
  huejay.discover()
  .then(bridges => {
    res.json(bridges);
  })
  .catch(error => {
    res.json(error.message);
  });
})

router.post("/getBridgeConfig", isAuthorized, (req,res) => {
  axios.get('http://' + req.body.ip)
    .then(config => {
      res.json(config.data)
    })
    .catch(error => {
      res.json(error.message);
    })
})

// this query is used for the "map" page. It can be queried for the recent status of the sensors. 
// Affecting variables: measurementCountQ: number of last 5 second frames observed. Each frame has "state_presence=0 or 1"
// Affecting variables: thresholdQ: number of "state_presence=1" measurements in the batch (determined by measurementCountQ)
// required to conclude the space is in use. 
// In a small room with <2 people with little movement a measurementCount of atleast 40 is proposed, with a threshold of 1.
router.post("/influxQ", (req, res) => {
  var threshold = thresholdQ;
  var measurementCount = measurementCountQ;
  Bridge.find({}, function(err, bridges) {
    if (err) return res.json({ success: false, error: err });
    var index = 0;
    var lights;
    var bridgeIp;
    var name;

    influx.query(
      `
      SELECT "state_presence","name" FROM http 
      GROUP BY "name"
      ORDER BY time DESC
      LIMIT ${measurementCount}
      `
    ) 
      .then(result => {
        var response = [];
        for (var l = 0; l < bridges.length; l++) {
            lights = bridges[l].lights;
            bridgeIp = bridges[l].ip;
          for (var i = 0; i < result.length/measurementCount; i++) {
            var sum = 0;
            for (var j = 0; j < measurementCount; j++) {
              sum += parseInt(result[j + i*measurementCount].state_presence, 10);
              name = result[j + i*measurementCount].name;
              url = result[j + i*measurementCount].url
            }      
            if (sum >= threshold) {
              response[index] = {"name": name, "url": url, "presence": true}
              index++;
            } else {
              response[index] = {"name": name, "url": url, "presence": false} 
              index++;
            }
            if (!req.body.justData)  {
              Object.keys(lights).forEach(function(k) {
                if (lights[k].name === name) {
                  var id = parseInt(k,10)+1;
                  if (sum >= threshold) {
                    axios.put("http://"+bridgeIp+"/lights/"+id+"/state", {"hue": 65280, "sat": 254})
                  } else {
                    axios.put("http://"+bridgeIp+"/lights/"+id+"/state", {"hue": 25500, "sat": 254})
                  }
                }
              }); 
            }
          }
        }
        res.json({sensorStatus: response, measurementCount: measurementCount, threshold: threshold, result_length: result.length})
      })
      .catch(err1 => {res.status(500).send("the whole thing is buggers" + err1)})
  });
})

// update config of a give bridge
router.post("/updateBridgeConfig", isAuthorized, (req,res) => {
  axios.put(req.body.url, req.body.update)
    .then(response => res.send(response))
});

// update config of a given light for a given bridge
router.post("/updateLightConfig", isAuthorized, (req,res) => {
  axios.put(req.body.url, req.body.update)
    .then(response => res.send(response))
});

// update config of a given sensor for a given bridge
router.post("/updateSensorConfig", isAuthorized, (req,res) => {
  axios.put(req.body.url, req.body.update)
    .then(response => res.send(response))
});

// fetch all available bridges in db
router.get("/getBridge", isAuthorized, (req, res) => {
  Bridge.find((err, bridge) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, Bridge: bridge });
  });
});

// fetch room by name
router.post("/getRoom", (req,res) => {
  Room.findOne({ name: req.body.name }, function(err, room) { 
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching room by name.'});
    } else {
      res.json(room)
    }
  })
})

//fetch all rooms
router.post("/getRooms", (req,res) => {
  Room.find((err, rooms) => { 
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching all rooms.'});
    } else {
      res.json(rooms)
    }
  })
})

// add sensor information and configuration for a specific bridge.
router.post("/addSensors", isAuthorized, (req, res) => {
  Bridge.findOneAndUpdate({ id: req.body.id}, {sensors: req.body.sensors}, err => { 
    if (err) return res.send(err);
    return res.json({ success: true, event: "sensors added for bridge: "+ req.body.id });
  });
});

// remove sensor information and configuration for a specific bridge
router.post("/deleteSensors", isAuthorized, (req, res) => {
  Bridge.findOneAndUpdate({ id: req.body.id}, {sensors: req.body.sensors}, err => { 
    if (err) return res.send(err);
    return res.json({ success: true, event: "sensors deleted for bridge: " + req.body.id });
  });
});

// add light information and configuration for a specific bridge.
router.post("/addLights", isAuthorized, (req, res) => {
  Bridge.findOneAndUpdate({ id: req.body.id}, {lights: req.body.lights}, err => { 
    if (err) return res.send(err);
    return res.json({ success: true, event: "lights added for bridge: "+ req.body.id });
  });
});

// remove light information and configuration for a specific bridge
router.post("/deleteLights", isAuthorized, (req, res) => {
  Bridge.findOneAndUpdate({ id: req.body.id}, {lights: req.body.lights}, err => { 
    if (err) return res.send(err);
    return res.json({ success: true, event: "lights deleted for bridge: " + req.body.id });
  });
});

// this deletes a bridge from the database
router.post("/deleteBridge", isAuthorized, (req, res) => {
  Bridge.findOneAndDelete({id: req.body.id} , err => {
    if (err) return res.send(err);
    return res.json({ success: true, event: "bridge deleted: " +req.body.id });
  });
});

// this adds a new bridge in the database
router.post("/addBridge", isAuthorized, (req, res) => {
  let bridge = new Bridge();
  if ((!req.body.config.bridgeid) || !req.body.config.ipaddress) {
    return res.json({
      success: false,
      error: "INVALID INPUTS"
    });
  }
  var id = req.body.config.bridgeid;
  bridge.ip = req.body.config.ipaddress + '/api/' + usernames[id];
  bridge.id = id
  bridge.name = req.body.config.name;
  bridge.config = req.body;
  bridge.sensors = req.body.sensors;
  bridge.lights = req.body.lights;
  bridge.save(err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, event: "bridge added: " + req.body.config.bridgeid, ip: bridge.ip });
  });
});

// This method adds a room to the database
router.post("/addRoom", isAuthorized, (req, res) => {
  let room = new Room();
  if ((!req.body.name) || (!req.body.seats) || (!req.body.facilities)) {
    return res.json({
      success: false,
      error: "INVALID INPUTS"
    });
  }
  room.name = req.body.name;
  room.seats = req.body.seats;
  room.facilities = req.body.facilities.split(',')
  room.save(err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, event: "room added: " + req.body.name});
  });
});

// This method deletes a room with a given name from the database
router.post("/deleteRoom", isAuthorized, (req, res) => {
  Room.findOneAndDelete({name: req.body.name} , err => {
    if (err) return res.send(err);
    return res.json({ success: true, event: "Room deleted: " +req.body.name });
  });
});


// user functions: register and auth
// register a new user for the control panel
router.post('/auth/register', function(req, res) {
  const { username, password } = req.body;
  const user = new User({ username, password });
  user.save(function(err) {
    if (err) {
      res.status(500)
        .send({status: "Error while registering.", Error: err});
    } else {
      res.status(200).send("Registration succesfull!");
    }
  });
});

// authenticate a user
router.post('/auth/authenticate', function(req, res) {
  const { username, password } = req.body;
  User.findOne({ username }, function(err, user) {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error, try again.'});
    } else if (!user) {
      res.status(401).json({ error: 'Incorrect auth data'});
    } else {
      user.passwordCheck(password, function(err, same) {
        if (err) {
          res.status(500).json({ error: 'Server error, try again.'});
        } else if (!same) {
          res.status(401).json({ error: 'Incorrect auth data'});
        } else {
          // Issue token for the username
          const payload = { username };
          const token = jwt.sign(payload, secret, { expiresIn: '10h' });
          res.cookie('token', token, { httpOnly: true }).sendStatus(200);
        }
      });
    }
  });
});

// check the validity of a token sent by a client
router.get('/auth/checkToken', isAuthorized, function(req, res) {
  res.sendStatus(200);
});

// append /api for our http requests
app.use("/api", router);

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
