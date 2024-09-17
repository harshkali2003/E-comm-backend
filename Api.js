require("dotenv").config();
const multer = require("multer");
const express = require("express");
const cors = require("cors");
const path = require("path");
const Jwt = require("jsonwebtoken")


const User = require("./SchemaOne");
const AddProduct = require("./SchemaTwo");
const Subscriber = require("./SchemaThree");
const Feedback = require("./SchemaFour");
const Contact = require('./SchemaFive')
let paymentModel = require('./SchemaSix')
const jwtKey = process.env.JWT_KEY
const Crypto = require('crypto')
const Razorpay = require('razorpay')

const app = express();

app.use(express.json());
app.use(cors());

const razorpay = new Razorpay({
  key_id:process.env.RAZORPAY_KEY_ID,
  key_secret : process.env.RAZORPAY_SECRET
})

app.post('/user/payment' , async (req , resp) =>{
  const {amount} = req.body

  const option = {
    amount : Number(amount*100),
    currency : "INR",
    receipt : `Receipt# ${Crypto.randomBytes(10).toString("hex")}`,
    payment_capture : 1,
  }

  try{
    const response = await razorpay.orders.create(option)
    const {id,amount,receipt} = response

    resp.send({
      OrderId:id,
      amount,
      receipt
      })
  }
  catch(err){
    resp.json(err)
  }
})

app.post('/user/paymentVerify' , async (req , resp)=>{
  const { razorpay_order_id , razorpay_payment_id , razorpay_signature} = req.body

  let mysign = `${razorpay_order_id}| ${razorpay_payment_id}`

  let expectedSignature = Crypto
  .createHmac("sha256" , process.env.RAZORPAY_SECRET)
  .update(mysign)
  .digest("hex");

  const isAuthenticate = razorpay_signature == expectedSignature

  if(isAuthenticate){
    resp.redirect(`http://localhost:5173//paymentSuccess?reference=${razorpay_payment_id}`)
  }else{
    resp.redirect('http://localhost:5173//paymentFail')
  }
})

app.post("/register", async (req, resp) => {
  let data = new User(req.body);
  let result = await data.save();
  result = result.toObject();
  delete result.password;

  if (result) {
    Jwt.sign({result} , jwtKey , {expiresIn:"1h"} , (err , token) =>{
      if(err){
        resp.send("ERROR")
      }else{
        resp.send({result , auth : token});
      }
    })
  } else {
    resp.send("ERROR 404 User not Found");
  }
});

app.post("/logUser", async (req, resp) => {
  if (req.body.email && req.body.password) {
    let data = await User.findOne(req.body).select("-password");
    if (data) {
      Jwt.sign({data} , jwtKey , {expiresIn:"1h"} , (err , token) =>{
        if(err){
          resp.send("ERROR")
        }else{
          resp.send({data , auth : token});
        }
      })
    } else {
      resp.send("ERROR 404 User not Found");
    }
  } else {
    resp.send("ERROR 404 User not Found");
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/Image");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const Upload = multer({ storage });

app.post("/addProduct",verifyToken, Upload.single("file"), async (req, resp) => {
  let data = new AddProduct(req.body);
  let result = await data.save();
  if (result) {
    resp.send(result);
  } else {
    resp.send("ERROR 404 NOT FOUND");
  }
});

app.delete("/addProduct/:id", verifyToken , async (req, resp) => {
  let data = await AddProduct.deleteOne({ _id: req.params.id });
  if (data) {
    resp.send(data);
  } else {
    resp.send("ERROR 404");
  }
});

app.get("/products",verifyToken, async (req, resp) => {
  let data = await AddProduct.find({});
  if (data.length > 0) {
    resp.send(data);
  } else {
    resp.send("ERROR 404");
  }
});

app.post("/subscribe", verifyToken, async (req, resp) => {
  let data = new Subscriber(req.body);
  let result = await data.save();
  if (result) {
    resp.send(result);
  } else {
    resp.send("ERROR 404");
  }
});

app.post("/feedback",verifyToken , async (req, resp) => {
  let data = new Feedback(req.body);
  let result = await data.save();
  if (result) {
    resp.send(result);
  } else {
    resp.send("ERROR 404");
  }
});

app.get("/search/:key",verifyToken, async (req, resp) => {
  let data = await AddProduct.find({
    $or: [
      { name: { $regex: req.params.key } },
      { amount: { $regex: req.params.key } },
      { desc: { $regex: req.params.key } },
      { cat: { $regex: req.params.key } },
    ],
  });

  resp.send(data);
});


function verifyToken(req , resp , next){
  let token = req.headers['authorization']
  if(token){
    token = token.split(' ')[1]
    Jwt.verify(token , jwtKey , (err , valid)=>{
      if(err){
        resp.send("Please Provide a valid token")
      }else{
        next()
      }
    })
  }else{
    resp.send("Please Provide a Valid Token with Header")
  }
}

app.post('/contact' , verifyToken , async (req , resp)=>{
  let data = await Contact(req.body)
  let result = await data.save()
  if(result){
    resp.send(result)
  }
  else{
    resp.send("ERROR 404")
  }
})



app.listen(process.env.PORT);
