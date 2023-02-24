const asyncHandler = require('express-async-handler');
const User = require('../models/userModels');
const jwt = require('jsonwebtoken');

const protect = asyncHandler(async (req, res, next) => {
  try {
   const token = req.headers.authorization.split(" ")[1];
   if(!token){
    res.status(401);
    throw new Error("Not authorised");
   }
   //Verify..
   const verified = jwt.verify(token, process.env.JWT_SECRET);
   //Get id from token
   const user = await User.findById(verified.id).select("-password");
   
   if(!user){
    res.status(401);
    throw new Error("User not found");
   }
   req.user = user;
   next();
  } catch (error) {
   res.status(401);
    throw new Error("Not authorised");
  }
})

module.exports = protect;