const download = require('download'),
  progress = require('progress-stream'),
  fs = require('fs'),
  path = require('path'),
  prettyBytes = require('pretty-bytes'),
  temp = require("temp").track(),
  http = require('http'),
  https = require('https');


var d = function (url, opts) {

  return new Promise((resolve, reject) => {

    if (!typeof url == 'string') {
      throw new Error('URL entered must be a string!')
    }

    let self = this;

    this.options = Object.assign({
      dest: 'downloads/',
      verbose: true,
      progress: null
    }, opts);

    if (this.options.progress) this.options.verbose = false;

    //start spinner...
    if (this.options.verbose) {

      let ora = require('ora'),
        cliSpinners = require('cli-spinners');

      this.spinner = ora();
      this.spinner.spinner = cliSpinners.clock;
      this.spinner.start();

    }

    var stat = {
      url: url
    }

    // console.log(stat);
    return this.getStat(url)
      .then(function (stat) {
        return self.dload(stat)
      })
      .then(resolve)
      .catch(reject)

  });

}


d.prototype = {

  getStat: function (url) {
    let self = this;

    return new Promise((resolve, reject) => {

      //if size is set
      if (Number(self.options.size)) {
        let statObj = {
          url: url,
          size: self.options.size
        };

        return resolve(statObj);
      }


      if (self.options.verbose) this.spinner.info('Getting URL details...');

      var protocol;

      if (url.slice(0, 5) === 'https') protocol = https
      else protocol = http

      var req = protocol.get(url, function (res) {
        req.abort()
        // console.log(res.headers)
        let statObj = {
          url: url,
          size: Number(res.headers['content-length'])
        };

        resolve(statObj);
      });

    });

  },

  progress: function (progress) {
    let self = this;

    if (self.options.progress && typeof self.options.progress == 'function') {
      self.options.progress(progress)
    }

    // console.log(progress);
    if (self.options.verbose) {
      self.spinner.text = prettyBytes(progress.transferred) + '/' + prettyBytes(progress.size) + ' (' + Number(progress.percentage).toFixed(2) + '%) at ' + prettyBytes(progress.speed) + '/s in ' + progress.runtime + ' seconds';
      self.spinner.start();
    }

  },

  dload: function (stat) {
    let self = this;
    return new Promise((resolve, reject) => {



      if (typeof self.options.dest !== 'string' || !fs.existsSync(self.options.dest)) {
        throw new Error("The directory " + self.options.dest + " does not exist!")
      }

      let fileName = self.options.fileName || path.basename(stat.url.replace(/[\?#].+/, '')),
        downloaded_file = path.join(self.options.dest, fileName),
        progress_stream = progress({
          time: 100,
          length: stat.size
        });

      progress_stream.on('progress', function (progress) {
        progress.size = stat.size;
        self.progress(progress, stat)
      });



      //create temporary file where we stream  to
      temp.open(fileName, function (err, tempFile) {

        //create stream
        let stream = download(stat.url, self.options);

        //promise ...
        stream
          //when we are done..
          .then(function () {

            //copy file from temp files
            copyFile(tempFile.path, downloaded_file)
              .catch(function (err) {
                reject(err);
              });

            //ok we are done here...
            if (self.options.verbose) {
              self.spinner.succeed('Download complete!');
              self.spinner.info('File saved at: ' + downloaded_file);
            }

            stat.file = downloaded_file;
            resolve(stat);

          })
          //on error
          .catch(function (err) {
            //stop all progress monitoring
            closeReadStream(progress_stream);
            reject(err);
          });


        //stream
        stream.pipe(progress_stream)
          .pipe(fs.createWriteStream(tempFile.path));

      });

    });

  }

}


function copyFile(source, target) {
  return new Promise((resolve, reject) => {

    const rd = fs.createReadStream(source),
      wr = fs.createWriteStream(target);

    rd.on('error', err => reject(err));
    wr.on('error', err => reject(err));
    wr.on('close', () => resolve());
    rd.pipe(wr);

  });
};

function closeReadStream(stream) {
  if (!stream) return;
  if (stream.close) stream.close();
  else if (stream.destroy) stream.destroy();
}

module.exports = function (url, opts) {
  return new d(url, opts);
};