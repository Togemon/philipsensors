const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RoomSchema = new Schema(
  {
    name: {
        type: String,
        required: true,
        unique: true
    },
    seats: Number,
    facilities: [],
  },
  { timestamps: true }
);

// export the room Schema
module.exports = mongoose.model("Room", RoomSchema);