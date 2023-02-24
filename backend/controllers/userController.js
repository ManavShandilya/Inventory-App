const asyncHandler = require('express-async-handler');
const User = require('../models/userModels');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs');
const { update } = require('../models/userModels');
const Token = require('../models/tokenModels');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const generateToken  = async (id) => {
 return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: '1d'}) 
}

// Register User....
const registerUser = asyncHandler(async (req, res) => {
 const { name, email, password} = req.body;
 console.log(req.body);
 // Validation..
 if(!name || !email|| !password){
  res.status(400)
  throw new Error("Fill all the details");
 }
 if(password.length <6){
  res.status(400)
  throw new Error("Password must be atleast 6 characters");
 }
 // Check if user email already exists..
 const userExists = await User.findOne({email}); // Here we have to find in 'user' db by the name of email

 if(userExists){
  res.status(400)
  throw new Error("This email already exists");
 }

 // If user doesnt exist, create the new in the database...

 const newUser = await User.create({
  name: name,
  email: email,
  password: password,
 })

  // Generate Token....
  
  const token = await generateToken(newUser._id);
  //console.log(token);

  // Send http-only cookie..
  res.cookie('token', token,{
   path: '/',
   httpOnly: true,
   expires: new Date(Date.now() + 1000 * 86400), //  1 Day
   sameSite: "none",
   secure: true
  })

 if(newUser){
  //console.log("Inside if")
  const { password1,...remainUser} = newUser;
  //console.log(typeof(newUser))
  //console.log(newUser,token)
  const { password, ...leftUser} = remainUser._doc
  res.status(201).json({"User":leftUser,"Token":token})
  // 
  // console.log(_id,name,email,photo,phone,bio);
  // res.status(201).json(
  //  _id,
  //  name,
  //  email, 
  //  photo,
  //  phone,
  //  bio,
  //  token,
  // )
 }
 else{
  console.log("Inside else")
  res.status(400)
  throw new Error('Invalid user data')
 }

})

// Login User...

const loginUser = asyncHandler( async (req, res) => {
  const { email, password } = req.body;
  // console.log(password, "Coming from body");
  // Validation
  if(!email || !password){
   res.status(400)
   throw new Error('Please enter the complete details');
  }
  
  // check if user exists in the db....
  const user = await User.findOne({email});
  // console.log(user.password, "Coming form database");
  if(!user){
   res.status(400)
   throw new Error('This email does not exist');
  }

  //User Exists..
  //check whether the password is correct or not..
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
    // Generate Token....
  
    const token = await generateToken(user._id);
    //console.log(token);
  
    // Send http-only cookie..
    res.cookie('token', token, {
     path: '/',
     httpOnly: true,
     expires: new Date(Date.now() + 1000 * 86400), //  1 Day
     sameSite: "none",
     secure: true
    })
    //res.cookie("token",token);
    //res.cookie("token1","tokenNew");

  if(user && isPasswordCorrect){
   const { password2, ...remainUser1} = user;
   const { password, ...leftUser1} = remainUser1._doc;
   res.status(200).json({"User":leftUser1,"Token":token});
   // const { _id, name, email, photo, phone, bio} = user;
   // res.status(200).json({
   //  _id, name, email, photo, phone, bio
   // })
  }
  else{
   res.status(400)
  throw new Error('Invalid user data')
  }

})

//Logout ser

const logout = asyncHandler(async (req, res) => {
     // Send http-only cookie..
     res.cookie('token', "",{
      path: '/',
      httpOnly: true,
      expires: new Date(0),
      sameSite: "none",
      secure: true
     })
     return res.status(200).json({ message: "Successfully logged out"})
})

// Get user...

const getUser = asyncHandler( async (req, res) => {
 const user = await User.findById(req.user._id);
 if(user){
  const { password3, ...remainUser2} = user;
   const { password, ...leftUser2} = remainUser2._doc;
   res.status(200).json({"User":leftUser2});
 }
 else{
  res.status(400)
  throw new Error('Invalid user data')
 }
})


// Get Login Status..

const loginStatus = asyncHandler(async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  if(!token){
    return res.json(false);
  }

   //Verify..
   const verified = jwt.verify(token, process.env.JWT_SECRET);
   if(verified){
    return res.json(true);
   }
   return res.json(false);
})


// Update User...

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if(user){
    const { name, email, photo, phone, bio } = user;
    user.email = email;
    user.name = req.body.name || name;
    user.phone = req.body.phone || phone;
    user.photo = req.body.photo || photo;
    user.bio = req.body.bio || bio;

    const updatedUser = await user.save();
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      photo: updatedUser.photo,
      phone: updatedUser.phone,
      bio: updatedUser.bio
    })
  }else{
    res.status(404)
    throw new Error('User not found');
  }
})

// Change Password...

const changePassword = asyncHandler( async (req, res) => {
  const user = await User.findById(req.user._id);
  const {oldPassword, password} = req.body;
  if(!user){
    res.status(400);
    throw new Error("User not found");
  }
  //Validate..
  if(!oldPassword || !password){
    res.status(400);
    throw new Error("Please add old and new Password");
  }
  // Check password is correct or not..
  const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
  if (user && isPasswordCorrect){
    user.password = password;
    await user.save();
    res.status(200).send("Password changed successfully")
  }else{
    res.status(400);
    throw new Error("Old password is incorrect");
  }
})

// Forgot Password.....

const forgotPassword = asyncHandler( async (req, res) => {
  const {email} = req.body;
  const user = await User.findOne({email});

  if(!user){
    res.status(404)
    throw new Error("User not exists");
  }

  //Deelete token if exists..
  let token = await Token.findOne({userId: user._id});
  if(token){
    await token.deleteOne()
  }

  // Create Reset Token
  let resetToken = crypto.randomBytes(32).toString('hex') + user._id;
  console.log(resetToken);

  //res.send("forgot password");

  // Hash the token before saving it to db....
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  // Save token to db..
  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000), // Thirty minutes
  }).save();

  //Construct reset URL.
  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;
  console.log(resetUrl);

  const message = `
  <h2>Hello ${user.name}</h2>
  <p>Please use he URL to reset your password</p>
  <p>This reset link is valid only for 30 minutes</p>

  <a href=${resetUrl} clicktracking=off >${resetUrl}</a>

  <p>Regards...</p>
  <p>Pinvent Team</p>
  `;
  
  const subject = "Password Reset Request";
  const send_to = user.email;
  const send_from = process.env.EMAIL_USER;

  try {
   const sendmail =  await sendEmail(subject, message, send_to, send_from, send_from);
   if(sendmail){
    res.status(200).json({success: true, message: "Successfully sent the mail"})
   }
   else{
    res.status(400).json({success: false, message: "Email not sent"})
   }
}catch(err){
  res.json(err);
}})

//Reset Password..

const resetPassword = asyncHandler(async (req, res) => {
  const {password} = req.body;
  const {resetToken} = req.params;
  console.log(resetToken);
  //resetToken = resetToken.toString('hex');

  // Hash the token, and then compare to than one in db.
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  // find token in db..
  const userToken = await Token.findOne({
    token: hashedToken,
    expiresAt: {$gt: Date.now()}
  })

  //Validate
  if(!userToken){
    res.status(404)
    throw new Error("Invalid or expired token");
  }
  //Find user
  const user = await User.findOne({_id: userToken.userId});
  user.password = password;
  await user.save();
  res.status(200).json({
    message: "Password reset successfully"
  });
})

module.exports = {
 registerUser,
 loginUser,
 logout,
 getUser,
 loginStatus,
 updateUser,
 changePassword,
 forgotPassword,
 resetPassword,
}