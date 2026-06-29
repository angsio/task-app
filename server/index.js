require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()

const PORT = process.env.PORT || 5001

app.use(cors())
app.use(express.json())

app.get('/api/pulse', (req, res) => {
    res.json({
        status: "Still Alive"
    })
})

app.listen(PORT, () => {
    console.log(`Server is running in development mode on port ${PORT}`);
});