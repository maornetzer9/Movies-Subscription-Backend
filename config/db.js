require('dotenv').config();
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const session = require('express-session');
const express = require('express');
const router = express();

const ORIGIN = process.env.ORIGIN;
const SECRET_KEY = process.env.SECRET_KEY;
const MONGOOSE_URI = process.env.MONGOOSE_URI;

const mongooseConnection = async (next) => {
    try
    {
        await mongoose.connect(MONGOOSE_URI);

        const name = mongoose.connection.name;
        const state = mongoose.connection.readyState;
        
        console.info({
            name,
            ORIGIN,
            connection: state === 1 ? true : false
        });
        if(next) next();
    }

    catch(err)
    {
        console.error('Error connecting to MongoDB:', err.message);
        if(next) next(err);
    }
};


// TODO: Delete mongoose session from this server and from Cinema server.
const mongooseSession = () => mongooseConnection(err => { 
    if(err)
    {
        console.error('Failed to connect to MongoDB:', err.message);
        process.exit(1);
    }
    else
    {
        router.use(session({
            secret: SECRET_KEY,
            resave: false,
            saveUninitialized: false,
            store: MongoStore.create({
                mongoUrl: MONGOOSE_URI,
                collectionName: 'session',
                ttl: 60 * 60 // 1 hour session timeout
            }),
            cookie: { maxAge: 30 * 60 * 1000 } // 30 minutes session timeout
        }))
    }
});


module.exports = mongooseSession;