import mongoose from "mongoose";

const ButtonName = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.ObjectId,
		ref: "User",
        required:true,
	},

    buttonName: [
        {
          data: {
            type: String,
            required: true,
          },
          name: {
            type: String,
            default: "",
          },
        },
      ],

});
export const UserButtonName = mongoose.model("Button", ButtonName);
