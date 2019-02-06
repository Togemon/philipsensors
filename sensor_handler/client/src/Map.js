
import React, { Component } from "react";
//import Influx from 'influx';
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';
//var hue = require("node-hue-api");
import hue from "node-hue-api";
import { Alert, Button, Collapse, DropdownItem, DropdownMenu, DropdownToggle, Form, FormGroup, Input, Label, ListGroup, ListGroupItem, Modal, ModalBody, ModalFooter, ModalHeader, Nav, Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink, UncontrolledDropdown } from 'reactstrap';
import './Map.css';

//influxDb connection

var sensorRes;

/*
const usernames = {
    "ECB5FAFFFE029285": "brXuIXS24X5yA1wD4QhlHb49f09CZPmCu2G4tTOS",
    "ECB5FAFFFE036BC2": "WUL19-Gz6h0RXq4hXNjosbhkZZ-oCMEqODRr57PO",
    "ECB5FAFFFE034C83": "arDb0JHm9drQr5kIBsg8b3pemXBfCU-vGAVzZjs1",
    "ECB5FAFFFE0346D0": "aJnU761G6iJ9VhpSupmyk9TsHXoofqJVYj5qSGKo"
  }
*/

async function influxQ(variables) {
    var variables = variables;
    var data = await axios.post('/api/influxQ', variables);
    sensorRes = data;
} 

class Map extends Component {
    componentWillMount() {
        this.getSensorData();
    }
    componentDidMount(){
        document.title = "Room Status"
        //get Data from influx
        //this.interval = setInterval(() => influxQ(), 5000)
        this.interval = setInterval(() => this.getSensorData(), 10000 )
    }
    constructor (props) {
        super(props)
        this.state = {
          navbarIsOpen: false,
          avg: '',
          sensorData: '',
          sensorData1: '',
          sensorData2: '',
          sensorData3: '',
          roomModalIsShowing: false,
          roomName: '',
          roomInfo: '',
          thisStatus: false,
        }   

        //influxQ({ "measurementCount": 10, "threshold": 2, "justData": true })
        this.navbarToggle = this.navbarToggle.bind(this);
        this.getSensorData = this.getSensorData.bind(this)
        //this.lightSwitch = this.lightSwitch.bind(this)
    }

    
    getSensorData() {
        var variables = { "measurementCount": 40, "threshold": 1, "justData": true }
        var f1 = [];
        var f2 = [];
        var f3 = [];
        influxQ(variables);
        console.log("sensorResponse: " + JSON.stringify(sensorRes));
        //console.log("Sensor data received. Interval 10s, threshold:" + sensorRes.data.threshold);
        if (sensorRes !== null, typeof sensorRes !== 'undefined') {
            for (var i = 0; i<sensorRes.data.sensorStatus.length; i++) {
                if (sensorRes.data.sensorStatus[i].name.charAt(1) === "1") {
                    f1.push(sensorRes.data.sensorStatus[i]);
                } else if (sensorRes.data.sensorStatus[i].name.charAt(1) === "2") {
                    f2.push(sensorRes.data.sensorStatus[i]);
                } else if (sensorRes.data.sensorStatus[i].name.charAt(1) === "3") {
                    f3.push(sensorRes.data.sensorStatus[i]);
                }
            }
        }
        this.setState({
            sensorData: sensorRes,
            sensorData1: f1,
            sensorData2: f2,
            sensorData3: f3
        });
    } 

    navbarToggle() {
        this.setState({
          navbarIsOpen: !this.state.navbarIsOpen
        });
    }

    modalToggleRoom = e => {
        //console.log(this.state.roomModalIsShowing);
        var name = e.target.getAttribute('name');
        var status = e.target.getAttribute('status')
        var data = { name: name };
        //var ip = e.target.getAttribute('ip') + '/api/' + usernames[id];

        if (!this.state.roomModalIsShowing) {
            axios.post("/api/getRoom", data)
                .then(response => {
                        this.setState({roomInfo: response.data})
                    })
            this.setState({
              roomName: name,
              thisStatus: status,
              roomModalIsShowing: !this.state.roomModalIsShowing,
            })
        } else {
            this.setState({
                roomModalIsShowing: !this.state.roomModalIsShowing
            })
        }
    }

    render() {
      const { roomName, roomInfo, roomModalIsShowing, sensorData, navbarIsOpen, thisStatus, sensorData1, sensorData2, sensorData3 } = this.state;
      return (
        <div className="content">
        <div>
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
                <div className="contentData">
                    <div className="header_container">
                    <h2 className="header">Reservation status</h2>
                    </div>
                    <div className="reservations">
                        <h4> First floor </h4>
                        {/*<Alert className="res1" color={ this.state.presence }> ROOM 1 </Alert>*/}
                        {!sensorData
                        ? <div className="status"><Alert color="danger" style={{width: "100%"}} > No sensor data received. </Alert></div>
                        : sensorData1 && sensorData1.map((sensor,index) => (
                            <div key={sensor.name}>
                                {sensor.presence === true 
                                ? <div className="status">
                                    <div className="name_info">
                                        <h5 style={{margin: "10px"}}>{sensor.name}</h5>
                                        <Alert className="res1" style={{"text-align": "center"}} style={{display: "inline-block"}} color="danger"> OCCUPIED </Alert>
                                    </div>
                                    <Button color="warning" className='info_button' name={sensor.name} status="OCCUPIED" onClick={ this.modalToggleRoom }> Room info </Button>
                                    </div>
                                : <div className="status">
                                    <div className="name_info">
                                        <h5 style={{margin: "10px"}}>{sensor.name}</h5>
                                        <Alert className="res1" style={{"text-align": "center"}} style={{display: "inline-block"}} color="success"> FREE </Alert>
                                    </div>
                                    <Button color="warning" className='info_button' name={sensor.name} status="FREE" onClick={ this.modalToggleRoom }> Room info </Button>
                                    </div> 
                                }
                            </div>
                        ))}
                    </div>

                    <div className="reservations">
                        <h4> Second floor </h4>
                        {/*<Alert className="res1" color={ this.state.presence }> ROOM 1 </Alert>*/}
                        {!sensorData
                        ? <div className="status"><Alert color="danger" style={{width: "100%"}} > No sensor data received. </Alert></div>
                        : sensorData2 && sensorData2.map((sensor,index) => (
                            <div key={sensor.name}>
                                {sensor.presence === true 
                                ? <div className="status">
                                    <div className="name_info">
                                        <h5 style={{margin: "10px"}}>{sensor.name}</h5>
                                        <Alert className="res1" style={{"text-align": "center"}} style={{display: "inline-block"}} color="danger"> OCCUPIED </Alert>
                                    </div>
                                    <Button color="warning" className='info_button' name={sensor.name} status="OCCUPIED" onClick={ this.modalToggleRoom }> Room info </Button>
                                    </div>
                                : <div className="status">
                                    <div className="name_info">
                                        <h5 style={{margin: "10px"}}>{sensor.name}</h5>
                                        <Alert className="res1" style={{"text-align": "center"}} style={{display: "inline-block"}} color="success"> FREE </Alert>
                                    </div>
                                    <Button color="warning" className='info_button' name={sensor.name} status="FREE" onClick={ this.modalToggleRoom }> Room info </Button>
                                    </div> 
                                }
                            </div>
                        ))}
                    </div>

                        <div className="reservations">
                        <h4> Third floor </h4>
                        {/*<Alert className="res1" color={ this.state.presence }> ROOM 1 </Alert>*/}
                        {!sensorData
                        ? <div className="status"><Alert color="danger" style={{width: "100%"}} > No sensor data received. </Alert></div>
                        : sensorData3 && sensorData3.map((sensor,index) => (
                            <div key={sensor.name}>
                                {sensor.presence === true 
                                ? <div className="status">
                                    <div className="name_info">
                                        <h5 style={{margin: "10px"}}>{sensor.name}</h5>
                                        <Alert className="res1" style={{"text-align": "center"}} style={{display: "inline-block"}} color="danger"> OCCUPIED </Alert>
                                    </div>
                                    <Button color="warning" className='info_button' name={sensor.name} status="OCCUPIED" onClick={ this.modalToggleRoom }> Room info </Button>
                                    </div>
                                : <div className="status">
                                    <div className="name_info">
                                        <h5 style={{margin: "10px"}}>{sensor.name}</h5>
                                        <Alert className="res1" style={{"text-align": "center"}} style={{display: "inline-block"}} color="success"> FREE </Alert>
                                    </div>
                                    <Button color="warning" className='info_button' name={sensor.name} status="FREE" onClick={ this.modalToggleRoom }> Room info </Button>
                                    </div> 
                                }
                            </div>
                        ))}
                    </div>

                    <div className="button_div">
                        <Button onClick={() => this.getSensorData()}> MANUAL QUERY </Button>
                    </div>
                    { roomInfo
                    ? <Modal isOpen={roomModalIsShowing} toggle={this.modalToggleRoom}>
                        <ModalHeader toggle={this.modalToggleRoom}> {roomName} </ModalHeader>
                        <ModalBody> 
                        <span style={{ color: "gray" }}> Room name: </span> {roomInfo.name} <br />
                        <span style={{ color: "gray" }}> Room seats: </span> {roomInfo.seats} <br />
                        <span style={{ color: "gray" }}> Room facilities: </span> {roomInfo.facilities.join(', ')} <br />
                        <span style={{ color: "gray" }}> Room status: </span> {thisStatus} <br />
                        </ModalBody> 
                        <ModalFooter>
                            <Button color="secondary" size="sm" onClick={this.modalToggleRoom}>Close</Button>
                        </ModalFooter> 
                    </Modal> 
                    : <Modal isOpen={roomModalIsShowing} toggle={this.modalToggleRoom}>
                        <ModalHeader toggle={this.modalToggleRoom}> Error! </ModalHeader>
                        <ModalBody> 
                        <span style={{ color: "gray" }}> No room info found! </span>
                        </ModalBody> 
                        <ModalFooter>
                            <Button color="secondary" size="sm" onClick={this.modalToggleRoom}>Close</Button>
                        </ModalFooter> 
                    </Modal> 
                    }
                </div>
            </main>
        </div>
        </div>
      );
    }
  }

export default Map
