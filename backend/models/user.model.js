import mongoose, { Schema } from "mongoose"
import jwt  from "jsonwebtoken";
import bcrypt from 'bcrypt';

const UserSchema =  new mongoose.Schema({

email:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true,
},
fullName:{
    type:String,
    required:[true,'fullname is required'], 
    trim:true,
    index:true
},
avatar:{
    type: {
        public_id: String,
        url: String //cloudinary url
    },
    required: true

},

macAddress:{
    type:String,
    trim:true,
},


password:{
    type:String,
    required:[true,"Password is required"]
},
refreshToken:{
    type:String
}
},{
    timestamps:true
});   

UserSchema.pre("save", async function(next){
// if(!this.isModified("password",)) return next();  //this is also a way to do same work
    if(this.isModified("password",)){
     this.password = await bcrypt.hash(this.password,10)
     return next()
    }
})

UserSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password);
}

UserSchema.methods.genrateAccessToken= function(){                   
   
   return jwt.sign({                          
        _id:this._id,               
        email:this.email,    
        fullName:this.fullName

    },process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
    )
}
UserSchema.methods.genrateRefreshToken= function(){
    return jwt.sign({
        _id:this._id,
         
    },process.env.REFRESH_TOKEN_SECRET,{
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}




export const User=mongoose.model("User",UserSchema);



