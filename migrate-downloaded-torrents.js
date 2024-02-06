const fs    = require('fs').promises
const path  = require('path')
const shell = require('shelljs')
const fetch = require('node-fetch');

//==================================================

const HOST  = "192.168.1.47"
const PORT  = "3000"
const SLEEP = 60

const DEST_TV       = "/opt/media/tvshows"
const DEST_FILM     = "/opt/media/films"
const VALID_EXTENSIONS = [
  ".avi",
  ".mkv",
  ".mp4",
  ".srt",
  ".mpg"
]

//==================================================

// GET list of all torrents
async function getTorrents() {
  const response = await fetch(`http://${HOST}:${PORT}/`);
  return await response.json()
}

// DELETE torrent by Id
async function rmTorrent(id) {
  const response = await fetch(`http://${HOST}:${PORT}/torrent/${id}`, {
    method: "DELETE"
  });
  return await response.json()
}

// 'walk' identifies all resources in a given directory
async function walk(entry, fileList = []) {
  const stat = await fs.stat(entry)

  if (stat.isDirectory()) {
    // Target is a directory, recurse through it's children
    const children = await fs.readdir(entry)
    for (const child of children) {
      nextEntry = path.join(entry, child)
      fileList = await walk(nextEntry, fileList)
    }
  } else {
    // Target is a file, parse it
    const f = await path.parse(entry)

    payload = {}
    payload["file"]     = f.base
    payload["ext"]      = f.ext
    payload["garbage"]  = !VALID_EXTENSIONS.includes(payload["ext"])
    payload["src"]      = f.dir

    // Identify if this is a film or tvshow
    regex = /(?<name>.*)[S|s](?<season>\d{2})[E|e](?<episode>\d{2}).*/
    m = payload["file"].match(regex)
    if (m == null) {
      payload["dest"] = DEST_FILM.toLowerCase()
    } else {
      series = m.groups['name'].replace(/["."]/g,' ').trim()
      season = parseInt(m.groups['season'])
      payload["dest"] = `${DEST_TV}/${series}/Season ${season}`.toLowerCase()
    }
    fileList.push(payload)
  }

  return fileList
}

function process(torrent){
  walk(`${torrent["location"]}/${torrent["name"]}`).then((resources) => {
    resources.forEach((resource) => {
      if (resource["garbage"]){
        shell.rm(`${resource["src"]}/${resource["file"]}`)
        console.log(`[DELETED] ${resource["file"]}`)
      } else {
        shell.mkdir('-p', resource["dest"])
        shell.mv(`${resource["src"]}/${resource["file"]}`, `${resource["dest"]}/${resource["file"]}`)
        console.log(`[MOVED  ] ${resource["file"]} => ${resource["dest"]}`)
      }
    })
    shell.exec(`sudo chown -R pi:pi "${DEST_TV}"`)
    shell.exec(`sudo chown -R pi:pi "${DEST_FILM}"`)
    shell.exec(`sudo chmod -R g+w "${DEST_TV}"`)
    shell.exec(`sudo chmod -R g+w "${DEST_FILM}"`)
  })
}

//==================================================
// Main Process Loop

setInterval(() => {
  getTorrents()
    .then((torrents) => {
      torrents.forEach((torrent) => {
        if (torrent["done"]) {
          rmTorrent(torrent["id"])
            .then(() => {
              process(torrent)
            })
        }
      })
    })
}, SLEEP * 1000);

//==================================================
