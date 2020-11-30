const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')
const User = require('../models/user')

const initialBlog = [{
  title : 'To kill a Mockingbird',
  author:'Harper Lee',
  url:'https://en.wikipedia.org/wiki/To_Kill_a_Mockingbird',
  likes:'13',
  user : '5fc4d9bbc738894358fdfe4a'
},{
  title : 'Hunger Games',
  author : 'Suzanne Collins',
  url : 'https://en.wikipedia.org/wiki/The_Hunger_Games_(novel)',
  likes :'34',
  user : '5fc4b5ffc32e7f0fe4d9ed5c'
}
]

beforeEach(async () => {
  await Blog.deleteMany({})

  const blogObjects = initialBlog.map(blog => new Blog(blog))

  const promiseArray = blogObjects.map(blog => blog.save())
  await Promise.all(promiseArray)
})

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('there are two blogs', async () => {
  const response = await api.get('/api/blogs')
  expect(response.body).toHaveLength(2)
})

test('unique identifier property', async () => {
  const response = await api.get('/api/blogs')
  const blogId = response.body.map(blog => blog.id)
  expect(blogId).toBeDefined()
})

test('a valid blog can be added', async () => {
  const uid = '5fc4dae6e62e632d64af6a7d'
  const userForToken = {
    username: 'root',
    id: uid
  }
  const token = jwt.sign(userForToken, process.env.SECRET)

  const newBlog = {
    title : 'Advance Computing Principles',
    author : 'Ann Freddy',
    url :'http://booksstore.com',
    likes : 12
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `bearer ${token}`)
    .send(newBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const blogsEnd = await Blog.find({})
  expect(blogsEnd).toHaveLength(initialBlog.length + 1)

  const title = blogsEnd.map(n => n.title)
  expect(title).toContain('Advance Computing Principles')
})

test('verify likes property', async () => {
  const uid = '5fc4dae6e62e632d64af6a7d'
  const userForToken = {
    username: 'root',
    id: uid
  }
  const token = jwt.sign(userForToken, process.env.SECRET)

  const newBlog = {
    title : 'Book of Algebra',
    author : 'Mohan Lal',
    url :'http://analyticbooks.com'
  }
  await api
    .post('/api/blogs')
    .set('Authorization', `bearer ${token}`)
    .send(newBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const blogsEnd = await Blog.find({})

  const nolikes = blogsEnd.map(b => b.likes)
  expect(nolikes).toContain(0)
})

test('verify title and url property', async () => {
  const uid = '5fc4dae6e62e632d64af6a7d'
  const userForToken = {
    username: 'root',
    id: uid
  }
  const token = jwt.sign(userForToken, process.env.SECRET)
  const newBlog = {
    author : 'David Bench',
    likes: 23
  }
  await api
    .post('/api/blogs')
    .set('Authorization', `bearer ${token}`)
    .send(newBlog)
    .expect(400)

  const blogsAtEnd = await Blog.find({})
  expect(blogsAtEnd).toHaveLength(initialBlog.length)
})

test('delete a blog', async () => {
  const uid = '5fc4dae6e62e632d64af6a7d'
  const userForToken = {
    username: 'root',
    id: uid
  }
  const token = jwt.sign(userForToken, process.env.SECRET)
  const blogs = await Blog.find({})
  const blogToDelete = blogs[1]

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .set('Authorization', `bearer ${token}`)
    .expect(204)

  const blogAtEnd = await Blog.find({})
  expect(blogAtEnd).toHaveLength(initialBlog.length -1)

  const title = blogAtEnd.map(blog => blog.title)
  expect(title).not.toContain(blogToDelete.title)
})

test('update a valid blog', async () => {
  const blogs = await Blog.find({})
  const blogToUpdate = blogs[0]

  const uBlog = {
    title : 'To kill a Mockingbird',
    author:'Harper Lee',
    url:'https://en.wikipedia.org/wiki/To_Kill_a_Mockingbird',
    likes:'76'
  }

  await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send(uBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const blogsEnd = await Blog.find({})
  const blogup= blogsEnd[0]

  expect(blogup.likes).toEqual(76)

})

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const userAtStart = await User.find({})
    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await User.find({})
    expect(usersAtEnd).toHaveLength(userAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await User.find({})

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('`username` to be unique')

    const usersAtEnd = await User.find({})
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })
})

afterAll(() => {
  mongoose.connection.close()
})
