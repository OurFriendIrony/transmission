const fs    = require('fs').promises
const path  = require('path')
const shell = require('shelljs')
const fetch = require('node-fetch');

//==================================================

const HOST  = "192.168.1.184"
const PORT  = "3000"
const SLEEP = 60

const DEST_TV       = "/home/steve/media/tvshows"
const DEST_FILM     = "/home/steve/media/films"
const VALID_EXTENSIONS = [
  "avi",
  "mkv",
  "mp4",
  "srt",
  "mpg"
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
async function walk(dir, fileList = []) {
  const files = await fs.readdir(dir)
  for (const file of files) {

    const stat = await fs.stat(path.join(dir, file))

    if (stat.isDirectory()) {
      // Directory - recurse
      fileList = await walk(path.join(dir, file), fileList)

    } else {
      payload = {}
      payload["file"]     = file
      payload["ext"]      = file.split(".").pop()
      payload["garbage"]  = !VALID_EXTENSIONS.includes(payload["ext"])
      payload["src"]      = dir

      // Identify if this is a film or tvshow
      regex = /(?<name>.*)[S|s](?<season>\d{2})[E|e](?<episode>\d{2}).*/
      m = file.match(regex)
      if (m == null) {
        payload["dest"] = DEST_FILM
      } else {
        series = m.groups['name'].replace(/["."]/g,' ').trim()
        season = parseInt(m.groups['season'])
        payload["dest"] = `${DEST_TV}/${series}/Season ${season}`
      }

      // Add to identified resources
      fileList.push(payload)
    }
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
  })
}

//==================================================
// Main Process Loop

setInterval(() => {
  getTorrents()
    .then((torrents) => {
    console.log("spam")
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
