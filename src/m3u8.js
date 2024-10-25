const fs = require('fs')
const { parse } = require('csv-parse/sync')
const path = require('path')

// read the channels from csv file
const file = path.join(__dirname, '../channels.csv')
const contents = fs.readFileSync(file, 'utf8')
const channels = parse(contents, {
  columns: true,
  skip_empty_lines: true
})

// sort channels alphabetically by their name and youtube url
channels.sort((a, b) => {
  if (a.name.toLowerCase() > b.name.toLowerCase()) return 1
  if (a.name.toLowerCase() < b.name.toLowerCase()) return -1
  if (a.youtube > b.youtube) return 1
  if (a.youtube < b.youtube) return -1
  return 0
})

// write playlist to m3u8 file
const dist = path.join(__dirname, '../dist')
fs.mkdirSync(dist, { recursive: true })
const playlist = fs.createWriteStream(dist + '/index.m3u8', { flags: 'w' })

playlist.write('#EXTM3U')

const playlists = new Map()

for (const channel of channels) {
  let title = `${channel.group}`.replace(' ()', '')
  if (title === '') { title = 'Ungrouped' }

  const item = `

#EXTINF:-1 group-title="${title}" tvg-id="yt.757" tvg-name="YouTube" tvg-logo="${channel.logo}", ${channel.name}
https://livefeed1.757live.workers.dev/${channel.youtube}.m3u8`

  playlist.write(item)

  // get category playlist
  let category = `${channel.group}-${channel.language}`.toLowerCase().replaceAll(' ', '-').replace(/^(-)/, '').replace('()', '')

  if (category === '') { category = 'ungrouped' }

  let catPlaylist = playlists.get(category)

  // create if not present
  if (!catPlaylist) {
    catPlaylist = fs.createWriteStream(dist + `/${category}.m3u8`, { flags: 'w' })
    playlists.set(category, catPlaylist)

    catPlaylist.write('#EXTM3U')
  }

  catPlaylist.write(item)
}

playlist.end()
