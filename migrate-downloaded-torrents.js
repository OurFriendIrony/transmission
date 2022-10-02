const fs = require('fs').promises
const path = require('path')
const shell = require('shelljs')

//==================================================

const src_new_media = "/home/steve/media/new"
const dest_tv = "/home/steve/media/tvshows"
const dest_movie = "/home/steve/media/films"
const ext = ["avi", "mkv", "mp4", "srt", "mpg"]

//==================================================

async function walk(dir, fileList = []) {
  const files = await fs.readdir(dir)
  for (const file of files) {
    const stat = await fs.stat(path.join(dir, file))
    if (stat.isDirectory()) {
      fileList = await walk(path.join(dir, file), fileList)
    } else {
      payload = {}
      payload["file"] = file
      payload["src"] = dir

      regex = /(?<name>.*)[S|s](?<season>\d{2})[E|e](?<episode>\d{2}).*/
      m = file.match(regex)
      if (m == null) {
        payload["dest"] = dest_movie
      } else {
        series = m.groups['name'].replace(/["."]/g,' ').trim()
        season = parseInt(m.groups['season'])
        payload["dest"] = `${dest_tv}/${series}/Season ${season}`
      }
      payload["ext"] = file.split(".").pop()
      payload["garbage"] = !ext.includes(payload["ext"])
      fileList.push(payload)
    }
  }

  return fileList
}

//==================================================

walk(src_new_media).then((resources) => {
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

