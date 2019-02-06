const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BridgeSchema = new Schema(
  {
    name: String,
    username: String,
    id: {
      type: String,
      unique: true
    },
    ip: String,
    sensors: Object,
    lights: Object,
    config: Object,
  },
  { timestamps: true }
);

// export the bridge Schema
module.exports = mongoose.model("Bridge", BridgeSchema);