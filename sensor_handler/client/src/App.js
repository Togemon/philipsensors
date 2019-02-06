import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { Component } from "react";
import { Alert, Button, Collapse, DropdownItem, DropdownMenu, DropdownToggle, Form,
   FormGroup, Input, Label, ListGroup, ListGroupItem, Modal, ModalBody, ModalFooter, 
   ModalHeader, Nav, Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink, UncontrolledDropdown } from 'reactstrap';
import './App.css';

//Update to match your Philips Hue bridges information after setting up the bridge. 
// Example id: "ECB5FAFFFE029333"
// Example username: "brXuIXS24X5yA1wD4QhlHb49f09CZPmCuXXXxxxx"
const usernames = {
  "<BRIDGE1_ID>": "<BRIDGE1_USERNAME>",
  "<BRIDGE2_ID>": "<BRIDGE2_USERNAME>"
}
var bridgeList = [];

//this function searches for bridges in the LAN network where the backend is running
async function getBridgeIps() {
  var bridgeList = await axios.get('/api/upnp')
  var ips = [];
  var ip;
  var id;
  for (var i = 0; i < bridgeList.data.length; i++) {
    id = bridgeList.data[i].id;
    ip = bridgeList.data[i].ip + '/api/' + usernames[id];
    ips.push(ip);
  } 
  return(ips);
}

//this function retrieves configs for each bridge
async function handleBridges() {
  var bridgeIps = await getBridgeIps();
  var bridges = [];
  await axios.all(bridgeIps.map(ip => axios.post('/api/getBridgeConfig', {ip: ip})))
    .then(
      axios.spread(function (...res){
        for (let i = 0; i < res.length; i++) {
          bridges[i] = res[i].data;
      }
      })
    );
  bridgeList = bridges;
}

class App extends Component {
  componentWillMount() {
    this.getLightSwitchStatus();
    this.getRooms();
  }

  componentDidMount(){
    document.title = "Control Panel"
  }
  constructor (props) {
    super(props)
    this.state = {
      bridges: [],
      bridgeSensors: '',
      bridgeLights: '',
      editingType: '',
      modalIsShowing: false,
      bridgeModalIsShowing: false,
      roomModalIsShowing: false,
      editingId: 0,
      editingIp: '',
      editingBridgeName: '',
      editingBridgeId: '',
      inputValue: '',
      measurementCount: 10,
      threshold: 2,
      lightSwitchStatus: 'danger',
      navbarIsOpen: false,
      rooms: '',
      roomInfo: '',
      roomName: '',
      roomSeats: 0,
      roomFacilities: '',
    }
    
    handleBridges();
    this.getBridges = this.getBridges.bind(this)
    this.modalToggle = this.modalToggle.bind(this)
    this.modalToggleBridge = this.modalToggleBridge.bind(this)
    this.getSensors = this.getSensors.bind(this)
    this.getBridges = this.getBridges.bind(this)
    this.getNewSensors = this.getNewSensors.bind(this)
    this.updateSensorConfig = this.updateSensorConfig.bind(this)
    this.updateLightConfig = this.updateLightConfig.bind(this)
    this.updateInputValue = this.updateInputValue.bind(this)
    this.updateMeasurementCount = this.updateMeasurementCount.bind(this)
    this.updateThreshold = this.updateThreshold.bind(this)
    this.lightSwitch = this.lightSwitch.bind(this)
    this.getLightSwitchStatus = this.getLightSwitchStatus.bind(this)
    this.setStatusVariables = this.setStatusVariables.bind(this)
    this.navbarToggle = this.navbarToggle.bind(this);
    this.modalToggleRoom = this.modalToggleRoom.bind(this);
    this.addRoom = this.addRoom.bind(this);
    this.deleteRoom = this.deleteRoom.bind(this);
    this.getRooms = this.getRooms.bind(this);
  }

  setStatusVariables () {
    var variables = { thresholdQ: this.state.threshold, measurementCountQ: this.state.measurementCount }
    axios.post("/api/setStatusVariables", variables)
      .then(response => console.log(JSON.stringify(response)));
  }

  getBridges () {
    handleBridges();
    var bridges = bridgeList;
    this.setState({bridges: bridges})
  }

  searchNewSensors = e => {
    const id = e.target.getAttribute('id');
    const ip = e.target.getAttribute('ip') + '/api/' + usernames[id];
    const index = e.target.getAttribute('index')
    this.setState( {editingIp: ip} );
    this.setState( {editingBridgeId: id} );
    axios.post('http://'+ip+'/sensors/')
      .then(response => console.log(JSON.stringify(response)));
  }

  getSensors = e => {
    const id = e.target.getAttribute('id');
    const ip = e.target.getAttribute('ip') + '/api/' + usernames[id];
    const index = e.target.getAttribute('index')
    this.setState( {editingIp: ip} );
    this.setState( {editingBridgeId: id} );
    var sensors = this.jsonToArray(this.state.bridges[index].sensors);
    this.setState({ bridgeSensors: sensors });
  }

  getNewSensors = e => {
    const id = e.target.getAttribute('id');
    const ip = e.target.getAttribute('ip') + '/api/' + usernames[id];
    this.setState( {editingBridgeId: id} );
    this.setState( {editingIp: ip} );
    axios.get('http://'+ip+'/sensors/new')
      .then(sensors => this.setState( { bridgeSensors: this.jsonToArray(sensors.data) } ))
      .then(console.log('BRIDGESENSORS: ' + JSON.stringify(this.state.bridgeSensors)));

  }

  searchNewLights = e => {
    const id = e.target.getAttribute('id');
    const ip = e.target.getAttribute('ip') + '/api/' + usernames[id];
    const index = e.target.getAttribute('index')
    this.setState( {editingIp: ip} );
    this.setState( {editingBridgeId: id} );
    axios.post('http://'+ip+'/lights/')
      .then(response => console.log(JSON.stringify(response)));
  }

  getLights = e => {
    const id = e.target.getAttribute('id');
    const ip = e.target.getAttribute('ip') + '/api/' + usernames[id];
    const index = e.target.getAttribute('index')
    this.setState( {editingIp: ip} );
    this.setState( {editingBridgeId: id} );  
    var lights = this.jsonToArray(this.state.bridges[index].lights);
    this.setState({ bridgeLights: lights });
  }
  
  getNewLights = e => {
    const id = e.target.getAttribute('id');
    const ip = e.target.getAttribute('ip') + '/api/' + usernames[id];
    const index = e.target.getAttribute('index')
    this.setState( {editingIp: ip} );
    this.setState( {editingBridgeId: id} );  
    axios.get('http://'+ip+'/lights/new')
      .then(lights => this.setState( { bridgeLights: this.jsonToArray(lights.data) } ))
      .then(console.log('BRIDGESENSORS: ' + this.state.bridgeLights))
  }

  updateSensorConfig2 = e => {
    const varToUpdate = e.target.getAttribute('value');
    const inputValue = this.state.inputValue;
    var update = {};
    const sensorId = parseInt(e.target.getAttribute('id'), 10) + 1;
    const ip = this.state.editingIp;
    var url = 'http://' + ip + '/sensors/' + sensorId;
    if (varToUpdate !== 'name') {
      url = url + '/config'
      update = { [varToUpdate]: parseInt(inputValue, 10) }
    } else {
      update = { [varToUpdate]: inputValue }
    }
    axios.put(url, update)
      .then(response => console.log(response));
  }

  updateSensorConfig = e => {
    const varToUpdate = e.target.getAttribute('value');
    const inputValue = this.state.inputValue;
    var update = {};
    const sensorId = parseInt(e.target.getAttribute('id'), 10) + 1;
    const ip = this.state.editingIp;
    var url = 'http://' + ip + '/sensors/' + sensorId;
    if (varToUpdate !== 'name') {
      url = url + '/config'
      update = { [varToUpdate]: parseInt(inputValue, 10) }
    } else {
      update = { [varToUpdate]: inputValue }
    }
    var data = {update: update, url: url}
    axios.post("/api/updateSensorConfig", data)
      .then(response => console.log(response));
  }

  updateLightConfig = e => {
    const varToUpdate = e.target.getAttribute('value');
    const inputValue = this.state.inputValue;
    console.log("inputValue: " + inputValue)
    var update = {};
    const sensorId = parseInt(e.target.getAttribute('id'), 10) + 1;
    const ip = this.state.editingIp;
    var url = 'http://' + ip + '/lights/' + sensorId;
    if (varToUpdate !== 'name') {
      url = url + '/config'
      update = { [varToUpdate]: parseInt(inputValue, 10) }
    } else {
      update = { [varToUpdate]: inputValue }
    }
    var data = {update: update, url: url}
    axios.post("/api/updateLightConfig", data)
      .then(response => console.log(response));
  }

  updateBridgeConfig = e => {
    var url = 'http://' + this.state.editingIp + '/config'
    var data = {update: { "name": this.state.inputValue }, url: url}
    axios.post("/api/updateBridgeConfig", data)
      .then(response => console.log(response))
  }

  addBridgeToDb = e => {
    var bridges = this.state.bridges;
    var bridge = bridges[e.target.getAttribute("index")].data;
    axios.post('/api/addBridge',bridge)
      .then(response => console.log(response))
  }

  deleteBridgeFromDb = e => {
     var id = { "id": e.target.getAttribute("id")}
    axios.post('/api/deleteBridge',id)
      .then(response => console.log(response)) 
  }

  addSensorsToDb = e => {
    var id = e.target.getAttribute("id");
    var sensors = this.state.bridgeSensors;
    var data = { "sensors": sensors, "id": id };
    axios.post('/api/addSensors', data)
      .then(response => console.log(response))
  }

  deleteSensorsFromDb = e => {
    var id = e.target.getAttribute("id");
    var sensors = {};
    var data = { "sensors": sensors, "id": id };
    axios.post('/api/deleteSensors', data)
      .then(response => console.log(response))
  }

  addLightsToDb = e => {
    var id = e.target.getAttribute("id");
    var lights = this.state.bridgeLights;
    var data = { "lights": lights, "id": id };
    axios.post('/api/addLights', data)  
      .then(response => console.log(response))
  }

  deleteLightsFromDb = e => {
    var id = e.target.getAttribute("id");
    var lights = {};
    var data = { "lights": lights, "id": id };
    axios.post('/api/deleteLights', data)
      .then(response => console.log(response))
  }

  jsonToArray (json) {
    var array = [];
    Object.keys(json).forEach(function(key){
      array.push(json[key]);
    });
    return array;
  }

  modalToggleBridge = e => {
    var id = e.target.getAttribute('id');
    var ip = e.target.getAttribute('ip') + '/api/' + usernames[id];
    var name = e.target.getAttribute('name');
    if (!this.state.bridgeModalIsShowing) {
      this.setState({
        editingBridgeId: id,
        editingIp: ip,
        editingBridgeName: name,
        bridgeModalIsShowing: !this.state.bridgeModalIsShowing,
      })
    } else {
      if (e.target.getAttribute('refresh')){
        this.setState({
          bridgeModalIsShowing: !this.state.bridgeModalIsShowing
        })
        window.location.reload();
      } else {
        this.setState({
          bridgeModalIsShowing: !this.state.bridgeModalIsShowing
        })
      }
    }
  }

  modalToggle (e, index, editingType) {
    if (!e) e = window.event;
    if (!this.state.modalIsShowing) {
      this.setState({
        editingType: editingType,
        editingId: index,
        modalIsShowing: !this.state.modalIsShowing,
      })
    } else {
      if (e.target.getAttribute('refresh')){
        this.setState({
          modalIsShowing: !this.state.modalIsShowing
        })
        window.location.reload();
      } else {
        this.setState({
          modalIsShowing: !this.state.modalIsShowing
        })
      }
    }
  }

  modalToggleRoom (e) {
    if (!e) e = window.event;
    this.setState({
        roomModalIsShowing: !this.state.roomModalIsShowing
    })
  }

  addRoom () {
    var data = { 
      name: this.state.roomName,
      seats: this.state.roomSeats,
      facilities: this.state.roomFacilities
    };
    axios.post("/api/addRoom", data)
      .then(response => console.log(response))
    window.location.reload();
  }

  deleteRoom (name) {
    var data = { name: name };
    var newRooms = this.state.rooms;
    for (var i = 0; i < newRooms.length; i++) {
      if (newRooms[i].name === name) {
        newRooms.splice(i,1);
      }
    }
    this.setState({rooms: newRooms});
    axios.post("/api/deleteRoom", data)
      .then(response => console.log(response))
  }

  getRooms () { 
    axios.post("/api/getRooms")
      .then(response => {
        this.setState({rooms: this.jsonToArray(response.data)});
        console.log(this.state.rooms);
      })
  }

  updateRoomInputName = e =>  {
    this.setState( { roomName: e.target.value });
  }

  updateRoomInputSeats = e =>  {
    this.setState( { roomSeats: parseInt(e.target.value, 10) });
  }

  updateRoomInputFacilities = e =>  {
    this.setState( { roomFacilities: e.target.value });
  }

  updateInputValue = e => {
    this.setState({inputValue: e.target.value});
  }

  updateThreshold = e => {
    this.setState({ threshold: parseInt(e.target.value, 10) }); 
  }

  updateMeasurementCount = e => {
    this.setState({ measurementCount: parseInt(e.target.value, 10)})
  }

  lightSwitch() {
    var variables = { threshold: this.state.threshold, measurementCount: this.state.measurementCount }
    axios.post("/api/lightSwitch", variables)
        .then(response => {
          if (response.data.lightswitch === "on") {
            this.setState({lightSwitchStatus: "success"});
          }           
          if (response.data.lightswitch === "off") {
            this.setState({lightSwitchStatus: "danger"});
          }
        })
  }

  getLightSwitchStatus() {
    axios.get("/api/getLightSwitchStatus")
      .then(response => {
        if (response.data.lightswitch === "on") {
          this.setState({lightSwitchStatus: "success"});
        }           
        if (response.data.lightswitch === "off") {
          this.setState({lightSwitchStatus: "danger"});
        }
      })
  }

  navbarToggle() {
    this.setState({
      navbarIsOpen: !this.state.navbarIsOpen
    });
  }

  render () {
    const { lightSwitchStatus, measurementCount, threshold, bridges, 
      bridgeSensors, editingType, bridgeLights, editingId, modalIsShowing, 
      editingIp, editingBridgeName, editingBridgeId, bridgeModalIsShowing,
      roomModalIsShowing, roomName, roomInfo, rooms, roomSeats, roomFacilities } = this.state;
    return (
      <div className = "content">
      <header>
      <div>
        <Navbar color="light" light expand="md">
          <NavbarBrand href="/">Control Panel</NavbarBrand>
          <NavbarToggler onClick={this.navbarToggle} />
          <Collapse isOpen={this.state.navbarIsOpen} navbar>
            <Nav className="ml-auto" navbar>
              <NavItem>
                <NavLink href="/map/">Room status</NavLink>
              </NavItem>
              <NavItem>
                <NavLink href="http://philipsensors.cs.aalto.fi:8880/d/-1Hl-kEmz/the-dashboard">
                Visaulized data
                </NavLink>
              </NavItem>
            </Nav>
          </Collapse>
        </Navbar>
      </div>
      </header>
      <main>
        {this.props.children}
        <div className="header_container">
            <h2 className="header"> Control Panel </h2>
        </div>
        <div className="switch_container"> 
          <div className='light_switch_container'>
            <div className='light_switch_vars'>
              <h4>Light variables</h4>
              <Input type="text" name="measurementCount" placeholder="5s measurement count"  onChange={this.updateMeasurementCount}></Input>
              <Input type="text" name="threshold" placeholder="Threshold" onChange={this.updateThreshold}></Input>
            </div>
            <div className='light_switch_button'>
              <Button onClick={this.lightSwitch} color={lightSwitchStatus}> Light switch </Button>
            </div>
          </div>
          <div className='status_switch_container'>
            <div className='status_switch_vars'>
              <h4>Map status variables</h4>
              <Input type="text" name="measurementCount" placeholder="5s measurement count"  onChange={this.updateMeasurementCount}></Input>
              <Input type="text" name="threshold" placeholder="Threshold" onChange={this.updateThreshold}></Input>
            </div>
            <div className='status_switch_button'>
              <Button onClick={this.setStatusVariables}> Set variables </Button>
            </div>
          </div>
        </div>
        <div className='bridge_button_container'>
          <Button color="primary" className='brige_button' onClick={ this.getBridges }> NUPNP - Get local bridges </Button>
        </div>
        <div className='bsl_container'>
          <div className='bridge_container'>
            <h3>Bridges: </h3>
            <ListGroup className="bridgeUl">
              {bridges.length <= 0
                ? <Alert color="danger"> No bridges. Try pressing 'Get local bridges'. </Alert>
                : bridges.map((bridge,index) => (
                    <ListGroupItem className="list_item" key={bridge.config.bridgeid}>
                      <span style={{ color: "gray" }}> Bridge name: </span> {bridge.config.name} <br />
                      <span style={{ color: "gray" }}> Bridge id: </span> {bridge.config.bridgeid} <br />
                      <span style={{ color: "gray" }}> Bridge ip: </span> {bridge.config.ipaddress} <br />
                      <div className="bridge_buttons">
                        <Button style={{ margin: "2px" }} color="primary" size="sm" onClick={this.getSensors} ip={bridge.config.ipaddress} id={bridge.config.bridgeid}  index={index}> All sensors </Button>
                        <Button style={{ margin: "2px" }} color="primary" size="sm" onClick={this.getNewSensors} ip={bridge.config.ipaddress} id={bridge.config.bridgeid} index={index}> New sensors </Button>
                        <Button style={{ margin: "2px" }} color="primary" size="sm" onClick={this.searchNewSensors} ip={bridge.config.ipaddress} id={bridge.config.bridgeid} index={index}> Scan </Button>  
                      </div>
                      <div className="bridge_buttons">
                        <Button style={{ margin: "2px" }} color="primary" size="sm" onClick={this.getLights} ip={bridge.config.ipaddress} id={bridge.config.bridgeid} index={index}> All lights </Button>
                        <Button style={{ margin: "2px" }} color="primary" size="sm" onClick={this.getNewLights} ip={bridge.config.ipaddress} id={bridge.config.bridgeid} index={index}> New lights </Button>
                        <Button style={{ margin: "2px" }} color="primary" size="sm" onClick={this.searchNewLights} ip={bridge.config.ipaddress} id={bridge.config.bridgeid} index={index}> Scan </Button>
                      </div>
                      <div className="bridge_buttons" style={{padding_top: "5px"}}>
                        <Button onClick={this.modalToggleBridge} style={{ margin: "2px" }} color="warning" size="sm" value="bridge" ip={bridge.config.ipaddress} id={bridge.config.bridgeid} index={index} name={bridge.config.name}> Edit </Button>
                      </div>
                      <div className="bridge_buttons" style={{padding_top: "5px"}}>
                        <Button onClick={this.addBridgeToDb} style={{ margin: "2px" }} color="success" size="sm" value="bridge" ip={bridge.config.ipaddress} id={bridge.config.bridgeid} index={index} name={bridge.config.name}> Add to DB </Button>
                        <Button onClick={this.deleteBridgeFromDb} style={{ margin: "2px" }} color="danger" size="sm" value="bridge" ip={bridge.config.ipaddress} id={bridge.config.bridgeid} index={index} name={bridge.config.name}> Delete from DB </Button>                     
                      </div>
                    </ListGroupItem>
                  ))}
             </ListGroup>
          </div>
          <div className='sensor_container'>
          <h3>Sensors: </h3>
          <ListGroup className="sensor_list">
            { bridgeSensors.length <= 0
              ? <Alert color="danger">No sensors. Search for local bridges to find their sensors. </Alert>
              : bridgeSensors.map((sensor,index) => (
                <ListGroupItem className="list_item" key={sensor.name}>
                  <div className="list_item_div">
                    { sensor.type === "ZLLPresence"
                    ? <div>
                      <div className="list_item_data">
                        <span style={{ color: "gray" }}> Sensor name: </span> {sensor.name} <br />
                        <span style={{ color: "gray" }}> Sensor type: </span> {sensor.type} <br />
                        <span style={{ color: "gray" }}> Sensor id: </span> {index + 1} <br />
                        <span style={{ color: "gray" }}> Presence: </span> {JSON.stringify(sensor.state.presence)} <br />
                        <span style={{ color: "gray" }}> Last updated: </span> {sensor.state.lastupdated} <br />
                        <span style={{ color: "gray" }}> Battery %: </span> {sensor.config.battery} <br />
                      </div> 
                      <div className="list_item_buttons">
                        <Button onClick={(e) => this.modalToggle(e,index,"sensor")} style={{ margin: "2px" }}  color="warning" size="sm" type={sensor.type} id={index}> Edit </Button>
                      </div> 
                    </div>
                    :
                    sensor.type === "ZLLTemperature"
                    ? <div>
                      <div className="list_item_data">
                        <span style={{ color: "gray" }}> Sensor name: </span> {sensor.name} <br />
                        <span style={{ color: "gray" }}> Sensor type: </span> {sensor.type} <br />
                        <span style={{ color: "gray" }}> Sensor id: </span> {index + 1} <br />
                        <span style={{ color: "gray" }}> Temperature: </span> {sensor.state.temperature} <br />
                        <span style={{ color: "gray" }}> Last updated: </span> {sensor.state.lastupdated} <br />
                      </div>
                      <div className="list_item_buttons">
                        <Button onClick={(e) => this.modalToggle(e, index,"sensor")} style={{ margin: "2px" }}  color="warning" size="sm" type={sensor.type} id={index}> Edit </Button>
                      </div> 
                    </div>
                    :
                    sensor.type === "Daylight"
                    ? <div>
                      <div className="list_item_data">
                        <span style={{ color: "gray" }}> Sensor name: </span> {sensor.name} <br />
                        <span style={{ color: "gray" }}> Sensor type: </span> {sensor.type} <br />
                        <span style={{ color: "gray" }}> Sensor id: </span> {index + 1} <br />
                      </div>
                      <div className="list_item_buttons">
                        <Button onClick={(e) => this.modalToggle(e,index,"sensor")} style={{ margin: "2px" }}  color="warning" size="sm" type={sensor.type} id={index}> Edit </Button>
                      </div>
                    </div>
                    :
                    sensor.type === "ZLLLightLevel"
                    
                    ?<div> 
                      <div className="list_item_data">
                        <span style={{ color: "gray" }}> Sensor name: </span> {sensor.name} <br />
                        <span style={{ color: "gray" }}> Sensor type: </span> {sensor.type} <br />
                        <span style={{ color: "gray" }}> Sensor id: </span> {index + 1} <br />
                      </div>  
                      <div className="list_item_buttons">
                        <Button onClick={(e) => this.modalToggle(e,index,"sensor")} style={{ margin: "2px" }}  color="warning" size="sm" type={sensor.type} id={index}> Edit </Button>
                      </div>
                    </div>
                    :
                    sensor.type === undefined
                    ?<div> 
                    <div className="list_item_data">
                      <span style={{ color: "gray" }}> Sensor name: </span> {sensor.name} <br />
                    </div>  
                    <div className="list_item_buttons">
                      <Button onClick={(e) => this.modalToggle(e,index,"sensor")} style={{ margin: "2px" }}  color="warning" size="sm" type={sensor.type} id={index}> Edit </Button>
                    </div>
                  </div>
                    : "No new sensors found"
                    
                    }
                  </div>
                </ListGroupItem>
              ))}
              { bridgeSensors.length <= 0
              ? ""
              : <div>
                <Button onClick={this.addSensorsToDb} style={{ margin: "2px" }} color="success" size="sm" id={editingBridgeId}> Add to DB </Button>
                <Button onClick={this.deleteSensorsFromDb} style={{ margin: "2px" }} color="danger" size="sm" id={editingBridgeId}> Delete from DB </Button>      
              </div>
              }        
              </ListGroup>
          </div>
          <div className='light_container'>
          <h3>Lights: </h3>
          <ListGroup className="light_list">
            { bridgeLights.length <= 0
              ? <Alert color="danger">No lights. Search for local bridges to find their lights. </Alert>
              : bridgeLights.map((light,index) => (
                <ListGroupItem className="list_item" key={light.name}>
                  <div className="list_item_div">
                  { light.name
                    ?<div>
                      <div className="list_item_data">
                        <span style={{ color: "gray" }}> Light name: </span> {light.name} <br />
                        <span style={{ color: "gray" }}> Light id: </span> {index + 1}  <br />
                      </div>
                      <div className="list_item_buttons">
                        <Button onClick={(e) => this.modalToggle(e,index,"light")} style={{ margin: "2px" }} color="warning" size="sm" type={light.type} id={light.id}> Edit </Button>
                      </div>
                    </div>
                    : "No new lights found"
                  }
                  </div>
                </ListGroupItem>
              ))}
              { bridgeLights.length <= 0
              ? ""
              : <div>
                <Button onClick={this.addLightsToDb} style={{ margin: "2px" }} color="success" size="sm" id={editingBridgeId}> Add to DB </Button>
                <Button onClick={this.deleteLightsFromDb} style={{ margin: "2px" }} color="danger" size="sm" id={editingBridgeId}> Delete from DB </Button>      
              </div>
              }        
            </ListGroup>
            </div>
          </div>
        <div className="room_container">
        <h3>Rooms: </h3>
          <ListGroup className="room_list">
            { rooms.length <= 0
              ? <Alert color="danger"> No rooms found. </Alert>
              : rooms.map((room,index) => (
                <ListGroupItem className="list_item" key={room.name}>
                  <div className="list_item_div2">
                  { room.name
                    ?<div>
                      <div className="list_item_data2">
                        <span style={{ color: "gray" }}> Room name: </span> {room.name} <br />
                        <span style={{ color: "gray" }}> Room seats: </span> {room.seats} <br />
                        <span style={{ color: "gray" }}> Facilities: </span> {room.facilities.join(', ')}  <br />
                      </div>
                      <div className="list_item_buttons2">
                        <Button onClick={() => this.deleteRoom(room.name)} style={{ margin: "2px" }} color="danger" size="sm"> Delete </Button>
                      </div>
                    </div>
                    : "No rooms found"
                  }
                  </div>
                </ListGroupItem>
              ))}
              <div>
                <Button onClick={(e) => this.modalToggleRoom(e)} style={{ margin: "2px" }} color="success" size="sm"> Add room </Button>
              </div>
            </ListGroup>
        </div>
        { bridgeSensors
          ? <Modal isOpen={modalIsShowing} toggle={this.modalToggle}>
            <ModalHeader toggle={this.modalToggle}> Editing: "{bridgeSensors[editingId].name}" </ModalHeader>
            
            { bridgeSensors[editingId].type === "ZLLPresence" && editingType === "sensor"
              ? <ModalBody> 
                <Form>
                  <FormGroup>
                    <Label for="name">Name</Label>
                    <div className="input_div">
                    <Input type="text" name="name" id="name" placeholder={bridgeSensors[editingId].name} onChange={this.updateInputValue}></Input>
                    <Button color="primary" onClick={this.updateSensorConfig} value="name" size="sm" id={editingId} ip={editingIp}>Update at bridge</Button>
                    </div>
                  </FormGroup>
                    <Label for="name">Sensitivity (default 2)</Label>
                    <div className="input_div">
                      <Input type="select" name="name" id="name" placeholder={JSON.stringify(bridgeSensors[editingId].config.sensitivity)} onChange={this.updateInputValue}>
                        <option>0</option>
                        <option>1</option>
                        <option>2</option>
                      </Input>
                      <Button color="primary" onClick={this.updateSensorConfig} value="sensitivity"  size="sm" id={editingId} ip={editingIp}>Update at bridge</Button>
                    </div>
                </Form>
              </ModalBody> :
              bridgeSensors[editingId].type === "ZLLTemperature" && editingType === "sensor"
              ? <ModalBody> 
              <Form>
                <FormGroup>
                  <Label for="name">Name</Label>
                  <div className="input_div">
                    <Input type="text" name="name" id="name" placeholder={bridgeSensors[editingId].name} onChange={this.updateInputValue}></Input>
                    <Button color="primary" onClick={this.updateSensorConfig} value="name" size="sm" id={editingId}  ip={editingIp}>Update at bridge</Button>
                  </div>
                </FormGroup>
              </Form>
              </ModalBody> :
              bridgeSensors[editingId].type === "Daylight" && editingType === "sensor"
              ? <ModalBody> 
              <Form>
                <FormGroup>
                  <Label for="name">Sunrise offset (default 30)</Label>
                  <div className="input_div">
                    <Input type="text" name="name" id="name" placeholder={JSON.stringify(bridgeSensors[editingId].config.sunriseoffset)} onChange={this.updateInputValue}></Input>
                    <Button color="primary" onClick={this.updateSensorConfig} value="sunriseoffset" size="sm" id={editingId} ip={editingIp}>Update at bridge</Button>              
                  </div>
                </FormGroup>
                <FormGroup>
                  <Label for="name">Sunset offset (default -30)</Label>
                  <div className="input_div">
                    <Input type="text" name="name" id="name" placeholder={JSON.stringify(bridgeSensors[editingId].config.sunsetoffset)} onChange={this.updateInputValue}></Input>
                    <Button color="primary" onClick={this.updateSensorConfig} value="sunsetoffset" size="sm" id={editingId} ip={editingIp}>Update at bridge</Button>
                  </div>
                </FormGroup>
              </Form>
              </ModalBody> :
              bridgeSensors[editingId].type === "ZLLLightLevel" && editingType === "sensor"
              ? <ModalBody> 
              <Form>
                <FormGroup>
                  <Label for="name">Name</Label>
                  <div className="input_div">
                    <Input type="text" name="name" id="name" placeholder={bridgeSensors[editingId].name} onChange={this.updateInputValue}></Input> 
                    <Button color="primary" onClick={this.updateSensorConfig} value="name" size="sm" id={editingId} ip={editingIp}>Update at bridge</Button>
                  </div>
                </FormGroup>
                <FormGroup>
                  <Label for="name">Threshold dark (default 16000)</Label>
                  <div className="input_div">
                    <Input type="text" name="name" id="name" placeholder={JSON.stringify(bridgeSensors[editingId].config.tholddark)} onChange={this.updateInputValue}></Input>
                    <Button color="primary" onClick={this.updateSensorConfig} value="tholddark" size="sm" id={editingId} ip={editingIp}>Update at bridge</Button>
                  </div>
                </FormGroup>
                <FormGroup>
                  <Label for="name">Threshold offset (default 7000)</Label>
                  <div className="input_div">
                    <Input type="text" name="name" id="name" placeholder={JSON.stringify(bridgeSensors[editingId].config.tholdoffset)} onChange={this.updateInputValue}></Input>
                    <Button color="primary" onClick={this.updateConfig} value="tholdoffset" size="sm" id={editingId} ip={editingIp}>Update at bridge</Button>
                  </div>
                </FormGroup>
              </Form>
              </ModalBody> :""
              }
            <ModalFooter>
              <Button color="secondary" size="sm" onClick={(e) => this.modalToggle(e)}>Close</Button>
              <Button color="primary" size="sm" onClick={(e) =>this.modalToggle(e)} refresh="true">Refresh</Button>
            </ModalFooter> 
          </Modal>
          : ""
          }
          { bridgeLights && editingType === "light"
          ? <Modal isOpen={modalIsShowing} toggle={this.modalToggle}>
            <ModalHeader toggle={this.modalToggle}> Editing: "{bridgeLights[editingId].name}" </ModalHeader>
              <ModalBody>
                <Form>
                  <FormGroup>
                    <Label for="name">Name</Label>
                    <div className="input_div">
                      <Input type="text" name="name" id="name" placeholder={bridgeLights[editingId].name} onChange={this.updateInputValue}></Input> 
                      <Button color="primary" onClick={this.updateLightConfig} value="name" size="sm" id={editingId} ip={editingIp}>Update at bridge</Button>
                    </div>
                  </FormGroup>
                </Form>
              </ModalBody>
              <ModalFooter>
                <Button color="secondary" size="sm" onClick={(e) => this.modalToggle(e)}>Close</Button>
                <Button color="primary" size="sm" onClick={(e) => this.modalToggle(e)} refresh="refresh">Refresh</Button>
              </ModalFooter> 
              </Modal>
              : ""
        }
          <Modal isOpen={bridgeModalIsShowing} toggle={this.modalToggleBridge}>
            <ModalHeader toggle={this.modalToggleBridge}> Editing: "{editingBridgeName}" </ModalHeader>
             <ModalBody> 
              <Form>
                <FormGroup>
                  <Label for="name">Name</Label>
                  <div className="input_div">
                   <Input type="text" name="name" id="name" placeholder={editingBridgeName} onChange={this.updateInputValue}></Input>
                   <Button color="primary" onClick={this.updateBridgeConfig} value="name" size="sm" id={editingBridgeId} ip={editingIp}>Update bridge</Button>
                  </div>
                </FormGroup>
              </Form>
            </ModalBody> 
            <ModalFooter>
              <Button color="secondary" size="sm" onClick={this.modalToggleBridge}>Cancel</Button>
              <Button color="primary" size="sm" onClick={this.modalToggleBridge} refresh="true">Refresh</Button>
            </ModalFooter> 
          </Modal>
          
          <Modal isOpen={roomModalIsShowing} toggle={this.modalToggleRoom}>
            <ModalHeader toggle={this.modalToggleRoom}> Add new room </ModalHeader>
              <ModalBody>
                <Form>
                  <FormGroup>
                    <Label for="name">Name</Label>
                    <div className="input_div">
                      <Input type="text" name="name" id="name" placeholder="Room name" onChange={this.updateRoomInputName}></Input> 
                    </div>
                  </FormGroup>
                  <FormGroup>
                  <Label for="name">Seats</Label>
                  <div className="input_div">
                    <Input type="number" min="1" step="1" name="seats" id="seats" placeholder="Seat amount" onChange={this.updateRoomInputSeats}></Input> 
                  </div>
                </FormGroup>
                <FormGroup>
                  <Label for="name">Facilities</Label>
                  <div className="input_div">
                    <Input type="text" name="facilities" id="facilities" placeholder="Facilities (comma separated)" onChange={this.updateRoomInputFacilities}></Input> 
                  </div>
                </FormGroup>
                <Button color="primary" onClick={this.addRoom} value="name" size="sm">Add</Button>
                </Form>
              </ModalBody>
              <ModalFooter>
                <Button color="secondary" size="sm" onClick={(e) => this.modalToggleRoom(e)}>Close</Button>
              </ModalFooter> 
          </Modal>
 
        </main>

      </div>
    )
  }
}

export default App
