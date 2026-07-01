require('dotenv').config()
const express = require('express')
const cors = require('cors')

const { MongoClient } = require('mongodb')

const app = express()
const PORT = process.env.PORT || 5001

app.use(cors())
app.use(express.json())

const MONGODB_URI = process.env.MONGODB_URI
const client = new MongoClient(MONGODB_URI)

let db

client.connect()
    .then(() => {
        console.log('Connected successfully.')
        db = client.db('task-app')
    })
    .catch(err => {
        console.error('Failed to connect:', err)
    })

app.get('/api/data', async (req, res) => {
    try {
        const collection = db.collection('tasks')
        const documents = await collection.find({}).toArray()
        res.json(documents)
    }
    catch (error) {
        console.error('Failed to query:', error)
        res.status(500).json({ 
            error: 'Database read failed.' 
        })
    }
})

app.listen(PORT, () => {
    console.log(`Server is running in development mode on port ${PORT}`);
});