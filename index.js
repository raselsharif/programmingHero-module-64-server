const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// middleware 
app.use(cors());
app.use(express.json())

app.get('/', async (req, res)=>{
    res.send("Bistro boss server running...");
})
app.listen(port, async(req, res)=>{
    console.log(`Server running port on: ${port}`);
})