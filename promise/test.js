// const Promise = require('./promise')

const p = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve(1)
  }, 1000)
})
p.then(value => {
  console.log(value)
})
p.then(value => {
  console.log(value)
})
p.then(value => {
  console.log(value)
})
