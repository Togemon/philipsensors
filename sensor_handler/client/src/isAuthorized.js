import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import axios from "axios";


export default function isAuthorized(ComponentToProtect) {
  return class extends Component {
    constructor() {
      super();
      this.state = {
        loading: true,
        redirect: false,
      };
    }

    componentDidMount() {
      axios.get('/api/auth/checkToken')
        .then(res => {
          if (res.status === 200) {
            this.setState({ loading: false });
          } else {
            const error = new Error(res.error);
            //res.send(error);
          }
        })
        .catch(err => {
          console.error("Error while checking token authenticity: " +err);
          this.setState({ loading: false, redirect: true });
        });
    }

    render() {
      const { loading, redirect } = this.state;
      let view = <h1>Loading...</h1>
      if (!loading) {
        if (redirect) {
          view = <Redirect to="/login" />
        } else {
          view = <ComponentToProtect {...this.props} />
        }
      }
      return (
        <React.Fragment>
          { view }
        </React.Fragment>
      );
    }
  }
}
