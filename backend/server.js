const dotenv = require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const userRouter = require('./routes/userRoute')
const cookieParser = require('cookie-parser');

const app = express();


//Middleware..
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());

//Routes Middleware..
app.use('/api/users', userRouter);

//Routes..
app.get('/', (req, res) => {
 res.send('Home')
})

//error middleware
  
app.use((err, req, res, next) => {
 const statusCode = res.statusCode ? res.statusCode : 500;
 res.status(statusCode);
 res.json({
  message: err.message,
  stack: process.env.NODE_ENV === 'development' ? err.stack : null
 })
 next();
});



const PORT = process.env.PORT || 5000;

//connect to mongodb

mongoose.connect(process.env.MONGO_URI).then(() => {
 app.listen(PORT, () => console.log(`Server is Listening at port ${PORT}`));
}).catch((err) => console.log(err));


