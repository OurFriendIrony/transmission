const magnet = document.activeElement.href
const host = "192.168.1.47"
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

