const Promise = require('./index')

const p = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve(1)
  }, 1000)
})
p.then(value => {
  console.log(value)
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(2)
    }, 1000)
  })
}).then(value => {
  console.log(value)
})
