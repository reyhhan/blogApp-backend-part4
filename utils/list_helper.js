const _ = require('lodash')

const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {

  const array = blogs.map(blog => blog.likes)
  const likeCount = array.reduce((sum,item) => {
    return sum + item
  },0)

  return blogs.length === 0
    ? 0
    : likeCount
}

const favouriteBlog = (blogs) => {
  const maxCount = Math.max(...blogs.map(blog => blog.likes))
  const selectBlog = blogs.find(blog => blog.likes === maxCount)

  const mostLikesBlog = {
    title : selectBlog.title,
    author : selectBlog.author,
    likes : selectBlog.likes
  }
  return mostLikesBlog
}

const mostBlogs = (blogs) => {
  const getAuthors = blogs.map(b => b.author)

  let tally = _.reduce(getAuthors, (total, next) => {
    total[next] = (total[next] || 0) + 1
    return total
  }, {})

  let arrayOfObjects = Object.keys(tally).map(key => ({ author: String(key), blogs: tally[key] }))
  const maxCount = Math.max(...arrayOfObjects.map(blog => blog.blogs))
  const selectBlog = arrayOfObjects.find(blog => blog.blogs === maxCount)

  const mostBlogs = {
    author : selectBlog.author,
    blogs : selectBlog.blogs
  }
  return mostBlogs
}

module.exports = {
  dummy,
  totalLikes,
  favouriteBlog,
  mostBlogs
}