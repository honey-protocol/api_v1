// base async func. for testing jest purpose
const add = (a: number, b: number) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (a < 0 || b < 0) {
        return reject('Number cant be negative')
      }
      resolve(a + b)
    }, 500)
  })
}

export {add}