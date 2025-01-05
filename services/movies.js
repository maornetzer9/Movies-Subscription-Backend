require('dotenv').config();
const Movie = require('../models/Movies');
const axios = require('axios');
const { Responses, moviesResponses } = require('../responses/responses');

const success = Responses.success;
const error = Responses.internalError;

exports.loadingMovies = async (req) => {
    try
    {
        const movies = []
        const MOCK_MOVIES = process.env.MOCK_MOVIES_URL;

        const { data } = await axios.get(MOCK_MOVIES);

        const allMovies = await Movie.find({});

        if(allMovies.length === 0)
        {
            for( let movie of data ) 
            {
                const { name, genres, image, premiered } = movie;

                const updatedMovies = await Movie.findOneAndUpdate(
                    { name },
                    { name, genres, image: image.original, premiered },
                    { upsert: true, new: true }
                );
                movies.push(updatedMovies);
            }
        }
        else
        {
            movies.push(...allMovies);
        }

        const { code, message } = success;
        return { code, message, movies };
    }
    catch(err)
    {
        const { code, message } = error;
        console.error(err.message);
        return { code, message }
    }
};

exports.editMovie = async (req) => {
    try
    {
        const { _id, name, genres, image, premiered } = req.body;

        const isMovieExists = await Movie.exists({name});

        const { code: errorCode, message: errorMessage } = moviesResponses.movieNameTaken;
        if(isMovieExists !== null) return { code: errorCode, message: errorMessage };

        const movie = await Movie.findOneAndUpdate(
            { _id },
            { name, genres, image, premiered },
            { new: true }
        );

        const movies = await Movie.find({});

        const { code, message } = success;
        return { code, message, movie, movies };
    }
    catch(err)
    {
        const { code, message } = error;
        console.error(err.message);
        return { code, message };
    }
};

exports.addMovie = async (req) => {
    try
    {
        const { name, genres, image, premiered } = req.body;

        const isMovieExists = await Movie.findOne({name});

        const { code: errorCode, message: errorMessage } = moviesResponses.movieNameTaken;
        if(isMovieExists) return { code: errorCode, message: errorMessage };

        const movie = await new Movie({name, genres, image, premiered}).save();

        const { code, message } = success;
        return { code, message, movie };
    }
    catch(err)
    {
        const { code, message } = error;
        console.error(err.message);
        return { code, message };
    }
};

exports.deleteMovie = async (req) => {
    try
    {
        const { _id } = req.query;
        
        const movie = await Movie.deleteOne({_id});

        const { code: errorCode, message: errorMessage } = moviesResponses.movieNotDeleted;
        if(movie.deletedCount <= 0) return { code: errorCode, message: errorMessage };
        
        const movies = await Movie.find({});
        
        const { code, message } = success;
        return { code, message, movies };
    }
    catch(err)
    {
        const { code, message } = error;
        console.error(err.message);
        return { code, message };
    }
};