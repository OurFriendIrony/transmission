const fs    = require('fs').promises
const path  = require('path')
const shell = require('shelljs')

//==================================================

const SRC_NEW_MEDIA = "/home/steve/media/new"
const DEST_TV       = "/home/steve/media/tvshows"
const DEST_FILM     = "/home/steve/media/films"
const VALID_EXTENSIONS = [
  "avi",
  "mkv",
  "mp4",
  "srt",
  "mpg"
]
const TRANSMISSION_STATES = [
  "Seeding",
  "Stopped",
  "Finished",
  "Idle"
]

//==================================================

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

//==================================================



walk(SRC_NEW_MEDIA).then((resources) => {
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

