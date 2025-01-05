const express = require('express');
const { loadingMoviesController, editMovieController, addMovieController, deleteMovieController } = require('../controllers/movies');

const router = express.Router();

router.get('/',           loadingMoviesController );
router.post('/add',       addMovieController      );
router.put('/edit',       editMovieController     );
router.delete('/delete',  deleteMovieController   );

module.exports = { moviesRouter: router };