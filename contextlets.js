const magnet = document.activeElement.href
const host = "piplexed.local"
const port = "3000"

console.log("Sending Magnet to transmission")
fetch(`http://${host}:${port}/torrent`, {
  method: 'POST',
  body: JSON.stringify({
    "magnet": magnet
  }),
  headers: {
    'Content-Type': 'application/json'
  }

}).then((response) => {
  response.json()

}).then((data) => {
  console.log(data)

})

