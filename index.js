const express = require('express');
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// middleware 
app.use(cors());
app.use(express.json())

const uri = process.env.DB_URL ;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const database = client.db("bistroBoss");
    const menuCollection = database.collection("menus");
    const userCollection = database.collection("users");
    const cartCollection = database.collection("carts");
    const paymentCollection = database.collection("payments");

    // payment stripe
  
    app.post('/create-payment-intent', async(req, res)=>{
    const {price} = req.body;
    // console.log("Body",price);
    const amount = parseInt(price*100)
    // console.log('amount', amount);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      payment_method_types: ["card"],
    })
    res.send({
      clientSecret: paymentIntent.client_secret
    })
    })

    // get menus
    app.get('/menus', async(req, res)=>{
        const menus = await menuCollection.find().toArray()
        res.send(menus)
    })
// get single menu item
app.get('/menu/:id', async(req, res)=>{
  const id = req.params.id;
  const filter = {_id:new ObjectId(id)};
  const result = await menuCollection.findOne(filter);
  res.send(result)
})
// update menu item
app.patch('/update-item/:id', async(req,res)=>{
  const id = req.params.id;
  const item = req.body;
  const filter = {_id: new ObjectId(id)}
  const updateItem = {
    $set:{
          ...item
    }
  }
  const result = await menuCollection.updateOne(filter, updateItem)
  res.send(result)
})
    //post users
    app.post('/user', async(req, res)=>{
    const user = req.body;
    // is user Existing
    const query = {email: user.email};
    const existingUser = await userCollection.find(query);
    if(existingUser){
      return res.send({Message: "User already exist", insertedId: null})
    } 
    const result = await userCollection.insertOne(user);
    res.send(result)
    }) 
// get users
app.get("/users", async(req, res)=>{
    const users = await userCollection.find().toArray();
    res.send(users)
})
// delete a user
app.delete('/user/:id', async(req,res)=>{
  const id = req.params.id;
  console.log(id);
  const filter = {_id: new ObjectId(id)};
  const result = await userCollection.deleteOne(filter);
  res.send(result)
})
// update user role
app.put('/user/:id',async(req,res)=>{
  const id = req.params.id;
  const filter = {_id: new ObjectId(id)};
  const option ={upsert: true};
  const update = {
    $set:{
      role: "admin"
    }
  }
  const result = await userCollection.updateOne(filter,update,option)
  res.send(result)
})
// post item
app.post('/add-item', async(req,res)=>{
  const item = req.body;
  const result = await menuCollection.insertOne(item);
  res.send(result)
})
// delete a item
app.delete('/delete-item/:id', async(req,res)=>{
  const id = req.params.id;
  const filter = {_id: new ObjectId(id)};
  const result = await menuCollection.deleteOne(filter);
  res.send(result)
})
// add to cart
app.post('/add-cart', async(req,res)=>{
const item = req.body; 
const result = await cartCollection.insertOne(item)
res.send(result)
})
// get all cart
app.get('/carts', async(req,res)=>{
const result = await cartCollection.find().toArray()
res.send(result)
})
// delete cart
app.delete('/cart-delete/:id',async(req, res)=>{
const id = req.params.id;
const filter = {_id:new ObjectId(id)};
const result = await cartCollection.deleteOne(filter);
res.send(result)
})
// post payment & delete from cart
app.post('/payment',async(req, res)=>{
  const payment = req.body;
  const paymentResult = await paymentCollection.insertOne(payment);
  const query = {_id:
  {
    $in: payment.cartId.map(id => new ObjectId(id))
  }
  }
  const deleteResult = await cartCollection.deleteMany(query);
  // console.log(query);
  res.send({paymentResult, deleteResult})
})
// get payments
app.get('/payments',async(req,res)=>{
  const payments = await paymentCollection.find().toArray()
  res.send(payments)
})
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', async (req, res)=>{
    res.send("Bistro boss server running...");
})
app.listen(port, async(req, res)=>{
    console.log(`Server running port on: ${port}`);
})