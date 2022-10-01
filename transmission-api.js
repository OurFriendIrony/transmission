const express = require('express');
const bodyParser = require('body-parser');
const execSync = require('child_process').execSync;

const app = express();

app.use(bodyParser.json());

app.post('/torrent', (req, res) => {
  m = req.body.magnet

  console.log(`[POST  ] /torrent - ${m}`)
  try {
    addTorrentByMagnet(m)
    res.send()
  } catch(err) {
    res.status(400)
    res.json(getError(err))
  }
})

app.delete('/torrent/:id', (req, res) => {
  id = req.params.id

  console.log(`[DELETE] /torrent/${id}`)
  try {
    deleteTorrentById(id)
    res.send()
  } catch(err) {
    res.status(400)
    res.json(getError(err))
  }
})

app.get('/torrent/:id', (req, res) => {
  id = req.params.id

  console.log(`[GET   ] /torrent/${id}`)
  try {
    res.json(getTorrentById(id))
  } catch(err) {
    res.status(400)
    res.json(getError(err))
  }
})

app.get('/', (req, res) => {
  console.log(`[GET   ] /`)
  try {
    res.json(getTorrents())
  } catch(err) {
    res.status(400)
  }
})

app.listen(3000, () => console.log('server started'));

// ###########################################

function getTorrents() {
  out = execSync(`transmission-remote -l | sed -e '1d' -e '$d' | awk '{print $1}' | sed -e 's/[^0-9]*//g'`).toString()
  ids = out.split("\n")
  ids.pop()

  arr=[]
  ids.forEach((id) => {
    arr.push(getTorrentById(id))
  })
  return arr
}

function addTorrentByMagnet(magnet) {
  out = execSync(`transmission-remote -a "${magnet}"`).toString()
}

function getTorrentById(id) {
  out = execSync(`transmission-remote -t ${id} -i`).toString()
  return {
    "id": id,
    "name":(/\s\sName: (.*)\n/g).exec(out)[1],
    "state":(/\s\State: (.*)\n/g).exec(out)[1],
    "perc":(/\s\Percent Done: (.*)\n/g).exec(out)[1],
    "eta":(/\s\ETA: (.*)\n/g).exec(out)[1]
  }
}

function deleteTorrentById(id) {
  execSync(`transmission-remote -t ${id} -r`).toString()
}

function getError(err) {
  return {
    "status"  : "failed",
    "message" : err.message
  }
}

