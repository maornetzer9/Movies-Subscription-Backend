require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { moviesRouter } = require('./routes/movies');
const { membersRouter } = require('./routes/members');
const mongooseSession = require('./config/db');

const app = express();
const PORT = 3001;
const corsOptions = { ORIGIN: process.env.ORIGIN };

mongooseSession((err) => {
    if (err) 
    {
        console.error('Failed to connect to MongoDB:', err.message);
        process.exit(1);
    } 
});


app.use( express.json() );
app.use( express.urlencoded({ extended: false }) );
app.use( cors( corsOptions ) )

app.use('/movies',        moviesRouter);
app.use('/members',       membersRouter);

app.listen(PORT, () => console.info(`Server is running on PORT: ${PORT}`))