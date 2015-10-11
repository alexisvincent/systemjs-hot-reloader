# jspm-hot-reloader
connects to [chokidar-socket-emitter](https://github.com/capaj/chokidar-socket-emitter) and reloads your ES6 modules as you change them. Should work with any client side framework. Not just React.

## Install
```
jspm i github:capaj/jspm-hot-reloader
```

## Usage
Put this in your index.html(or anywhere really)
```javascript
System.import('jspm-hot-reloader').then(function(HotReloader){
  new HotReloader.default('http://localhost:8090')  //your chokidar-socket-emitter port
})
```
## Why

We're Javascript programmers. We should not be building our apps for development. Many folks dislike JSPM because of how slow it is. JSPM deserves another shot, because it can be faster, more robust and more reliable than any existing alternative. This simple package proves it. Webpack hot reloading tools pale in comparison. Especially for larger codebases, SPAs and such-jspm hot reloading modules are a crucial development tool.

## How
When a change event is emitted on socket.io, we match a module in System._loader.moduleRecords.
If a match is found, we then aggressively delete the changed module and recursively all modules which import it directly or indirectly via other modules. This ensures we always have the latest version of code running, but we don't force the browser into unnecessary work.
Last step is to import again all modules we deleted, by calling import on the one that changed-module hierarchy will make sure all get loaded again.

## Credit
Most of the credit for this awesome engineering feat should go to [Guy Bedford](https://github.com/guybedford). He paved me a way, I simply followed it.

## Contributing
Code is written in [![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

Tests are run as usual:`npm test`

1. fork it
2. write your code
3. open PR
4. lay back and if you want to speed it up, hit me up on [twitter](https://twitter.com/capajj)
