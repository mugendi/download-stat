## Download files while displaying download status

This (promise-based) module handles simple downloads and displays download status. DownloadStat wraps around the popular [download](https://www.npmjs.com/package/download) module.


### Install
 ``` npm install --save download-stat```

### Get to downloading...
```javascript
const downloadStat = require('download-stat');

var url = 'http://YOUR-DOWNLOAD-URL';

var options = {
    //where downloaded files are to be saved. Note, this must be an existing path!
    dest : 'downloads/',

    //Do you want to print download progress on console? Default = true
    verbose : true,

    //name that you want the file to be saved in
    fileName : 'fileName.jpg',

    //Overide the inbuild progress function with your own
    progress : function (progress) {
        console.log(progress);
    }

}

//NOTE: 'verbose' & 'progress' options are optional
downloadStat(url, options)
    .then(console.log)
    .catch(console.error);
    
```

## API

### ```downloadStat(url, options)```

Download Stat options are as follows:
- **dest** : where downloaded files are to be saved. Note, this must be an existing path!
- **fileName** : *Optional.* A name that will be allocated to the file upon saving to disk. 
- **verbose** : *Optional.* Do you want to print download progress on console? *Default is true.*
- **progress** : *Optional.* A function that overides the inbuild progress function with your own. By default, [ora](https://www.npmjs.com/package/ora) is used to log download status on the console.

### Other options
You can pass any other [got](https://www.npmjs.com/package/got) options with the options object. Example:

```javascript
{
    dest : 'downloads/',
    timeout : 10000,
    retries : 2
}
```









