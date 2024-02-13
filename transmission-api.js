const express = require('express');
const bodyParser = require('body-parser');
const execSync = require('child_process').execSync;

//==================================================

const app = express();
const DONE_STATES = [
  "Seeding",
  "Stopped",
  "Finished",
  "Idle"
]

//==================================================
// Define the API

app.use(bodyParser.json());

// POST Magnet
app.post('/torrent', (req, res) => {
  m = req.body.magnet

  console.log(`[POST  ] /torrent - ${m}`)
  try {
    res.json(addTorrentByMagnet(m))
  } catch(err) {
    res.status(400)
    res.json(getError(err))
  }
})

// DELETE Torrent
app.delete('/torrent/:id', (req, res) => {
  id = req.params.id

  console.log(`[DELETE] /torrent/${id}`)
  try {
    res.json(deleteTorrentById(id, false))
  } catch(err) {
    res.status(400)
    res.json(getError(err))
  }
})

// DELETE Torrent
app.delete('/torrent/:id/soft', (req, res) => {
  id = req.params.id

  console.log(`[DELETE] /torrent/${id}/soft`)
  try {
    res.json(deleteTorrentById(id, true))
  } catch(err) {
    res.status(400)
    res.json(getError(err))
  }
})

// GET Torrent
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

// GET All Torrents
app.get('/', (req, res) => {
  console.log(`[GET   ] /`)
  try {
    res.json(getTorrents())
  } catch(err) {
    res.status(400)
  }
})

app.get('/restart/plex', (req, res) => {
  console.log(`[GET   ] /restart/plex`)
  try {
    res.json(restartPlex())
  } catch(err) {
    res.status(400)
  }
})

// Start Server
app.listen(3000, () => {
  console.log('server started')
})

//==================================================
// Other

function restartPlex() {
  out = execSync(`sysemctl restart plexmediaserver`).toString()
  return getOK()
}

//==================================================
// Parse transmission results

// List
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

// Add
function addTorrentByMagnet(magnet) {
  out = execSync(`transmission-remote -a "${magnet}"`).toString()
  return getOK()
}

// Get by Id
function getTorrentById(id) {
  out = execSync(`transmission-remote -t ${id} -i`).toString()
  p = (/\s\Percent Done: (.*)%\n/g).exec(out)[1]
  pF = parseFloat(p == "nan" ? 0 : p)
  s = (/\s\State: (.*)\n/g).exec(out)[1]
  return {
    "id"      : id,
    "name"    : (/\s\sName: (.*)\n/g).exec(out)[1],
    "state"   : s,
    "perc"    : pF,
    "eta"     : (/\s\ETA: (.*)\s\(.*\)\n/g).exec(out)[1],
    "location": (/\s\Location: (.*)\n/g).exec(out)[1],
    "size"    : (/\s\Total size: (.*)\s\(.*\)\n/g).exec(out)[1],
    "done"    : (pF >= 100 && DONE_STATES.includes(s))
  }
}

// Delete by Id
function deleteTorrentById(id, soft) {
  if (soft) {
    execSync(`transmission-remote -t ${id} -r`).toString()
  } else
    execSync(`transmission-remote -t ${id} --remove-and-delete`).toString()
  }
  return getOK()
}

// Delete by Id (soft)
function deleteTorrentById(id) {
  execSync(`transmission-remote -t ${id} -r`).toString()
  return getOK()
}

//==================================================
// Common Response Payloads

function getError(err) {
  return {
    "status"  : "failed",
    "message" : err.message
  }
}

function getOK() {
  return {
    "status"  : "ok"
  }
}

