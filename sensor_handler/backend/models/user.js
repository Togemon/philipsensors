const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const config = require('../config/config.json')
const bcrypt = require('bcrypt');
const saltRounds = 10;
//var jwt = require('jsonwebtoken');
var secret = config.secret;

const UserSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
      required: [true, "Username can't be blank"],
      index: true
    },
    password: {
        type: String,
        required: true
    }
  },
  { timestamps: true }
);
    
// Hash passwords before saving a new user
UserSchema.pre('save', function(next) {
    // Check if document is new or a new password has been set
    if (this.isNew || this.isModified('password')) {
      // Saving reference to this because of changing scopes
      const user = this;
      bcrypt.hash(user.password, saltRounds,
        function(err, hashedPassword) {
        if (err) {
          next(err);
        }
        else {
          user.password = hashedPassword;
          next();
        }
      });
    } else {
      next();
    }
});

UserSchema.methods.passwordCheck = function(password, callback){
  bcrypt.compare(password, this.password, function(err, same) {
    if (err) {
      callback(err);
    } else {
      callback(err, same);
    }
  });
}

// export the user Schema
module.exports = mongoose.model("User", UserSchema);