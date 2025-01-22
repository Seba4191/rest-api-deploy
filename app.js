const express = require('express') // require -> commonJS
const crypto = require('node:crypto')
const cors = require('cors')
const movies = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemas/movies2.js')

const app = express()
app.use(express.json())

app.disable('x-powered-by')
app.use(cors({
  origins: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://localhost:8080',
      'http://localhost:1234',
      'https://movies.com',
      'https://midu.dev'
    ]
    if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
      return callback(null, true)
    }
    return callback(new Error('Not Allowed by CORS'))
  }

}))
app.get('/', (req, res) => {
  res.json({ message: 'hola' })
})

app.get('/movies', (req, res) => {
  const { genre } = req.query
  // con la propiedad query tenemos un objeto donde ya estan transformados todos los query params
  // los query params los pasamos mediante la url del req
  if (genre) {
    const filteredMovies = movies.filter(
      movie => movie.genre.some(g => g.toLowerCase() === genre.toLocaleLowerCase())// las comparo haciendo las dos minuscula
    )
    return res.json(filteredMovies)
  }
  res.json(movies)
})

app.get('/movies/:id', (req, res) => {
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  // movie => movie.id === id: Esta es una función de flecha que actúa como el callback de find.
  // Para cada elemento (movie) en el arreglo movies, verifica si su propiedad id es igual al id
  //  proporcionado en los parámetros de la ruta.
  if (movie) return res.json(movie)
  res.status(404).json({ message: 'Error, movie not found' })
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)

  if (!result.success) {
    // 422 Unprocessable Entity
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  // en base de datos
  const newMovie = {
    id: crypto.randomUUID(), // uuid v4
    ...result.data
  }
  // Esto no sería REST, porque estamos guardando
  // el estado de la aplicación en memoria
  movies.push(newMovie)

  res.status(201).json(newMovie)
})

app.patch('/movies/:id', (req, res) => {
  const { id } = req.params
  const result = validatePartialMovie(req.body)

  if (!result.success) return res.status(200).json({ error: JSON.parse(result.error.message) })
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex < 0) return res.status(404).json({ message: 'movie not found' })

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }
  movies[movieIndex] = updateMovie
  return res.json(updateMovie)
})

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not Found' })
  }
  movies.splice(movieIndex, 1)
  return res.json({ message: 'Movie deleted' })
})

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`)
})
