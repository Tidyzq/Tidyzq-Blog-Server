const queue = []

module.exports = {
  queue,
  push (task) {
    queue.push(task)
  },
  apply () {
    return Promise.all(queue.map(task => task.call(null)))
  },
}
