const config = require('./config.json')
const Mastodon = require('mastodon')
const Turndown = require('turndown')
const Shaarli = require('shaarli-client')

const masto = new Mastodon(config.mastodon)
const turndown = new Turndown()
const h2p = require('html2plaintext')
const shaarli = new Shaarli(config.shaarli.url, config.shaarli.secret)

const titleLength = 100

masto.get('favourites', {'limit': 40})
  .then((res) => {
    let data = res.data.reverse()
    let aux = function (k) {
      sendStatus(data[k], () => {
        k++
        if (k < data.length) {
          aux(k)
        }
      })
    }
    aux(0)
  })

let sendStatus = function (status, next) {
  let description = turndown.turndown(status.content)
  let title = h2p(status.content).substring(0, titleLength)
  let params = {
    'description': description,
    'private': false,
    'tags': [],
    'title': title,
    'url': status.url
  }
  shaarli.postLink(params, (err, res) => {
    if (err) {
      if (err.message === 'got 409 response') {
        console.log('link already added: ' + status.url)
      } else {
        throw err
      }
    } else {
      console.log('link added: ' + status.url)
    }

    next()
  })
}
