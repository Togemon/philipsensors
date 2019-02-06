import React, { Component } from 'react';
import axios from "axios";
import './Login.css';



export default class Login extends Component {
  constructor(props) {
    super(props)
    this.state = {
      username : '',
      password: ''
    };
  }

  handleInputChange = (event) => {
    const { value, name } = event.target;
    this.setState({
      [name]: value
    });
  }

  onSubmit = (e) => {
    e.preventDefault();
    //var loginData = {username: "test", password: "wat123"} 
    var loginData = this.state
    //console.log(loginData);
    axios.post('/api/auth/authenticate', loginData)
      .then(res => {
        if (res.status === 200) {
          this.props.history.push('/');
        } else {
          const error = new Error(res.error);
          throw error;
        }
      })
      .catch(err => {
        console.error(err);
        alert('Error logging in!');
      });
  }


  render() {
    return (
      <div className="content">
        <form onSubmit={this.onSubmit}>
          <h1>Login</h1>
          <h4>Control Panel access requires authorization!</h4>
          <input
            type="text"
            name="username"
            placeholder="Enter username"
            value={this.state.username}
            onChange={this.handleInputChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Enter password"
            value={this.state.password}
            onChange={this.handleInputChange}
            required
          />
        <input type="submit" value="Submit"/>
        </form>
      </div>
    );
  }
}
