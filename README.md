# jspm-hot-reloader
connects to [chokidar-socket-emitter](https://github.com/capaj/chokidar-socket-emitter) and reloads your ES6 modules as you change them. Should work with any client side framework. Not just React.

## Install
```
jspm i github:capaj/jspm-hot-reloader
```

## Usage
Put this in your index.html(or anywhere really)
```javascript

if (location.origin.match(/localhost/)) { 
  System.import('capaj/jspm-hot-reloader').then(function(HotReloader){
    new HotReloader.default('http://localhost:8090')  // chokidar-socket-emitter port
  })
}
```
You can drop the if statement, but it is nice and convenient to load reloader only for when on localhost.

## Examples

Boilerplate projects set up for fast&efficent hot reloading you can fork and use at will:
- [Angular - NG6-starter](https://github.com/capaj/NG6-starter)
- [React](https://github.com/capaj/jspm-react)
- Angular 2 - coming soon
- Aurelia - coming soon
- Mithril.js - coming soon

## Why

We're Javascript programmers. We should not be building our apps for development. Many folks dislike JSPM because of how slow it is. JSPM deserves another shot, because it can be faster, more robust and more reliable than any existing alternative. This simple package proves it. Webpack hot reloading tools pale in comparison. Especially for larger codebases, SPAs and such-reliable hot reloadable modules are a crucial development tool.

## How
When a change event is emitted on socket.io, we match a module in System._loader.moduleRecords.
If a match is found, we then aggressively delete the changed module and recursively all modules which import it directly or indirectly via other modules. This ensures we always have the latest version of code running, but we don't force the browser into unnecessary work.
Last step is to import again all modules we deleted, by calling import on the one that changed-module hierarchy will make sure all get loaded again.

## Unload hook
Any module, which has dangerous side effects and you want to hot-reload should export
```javascript
export function __unload(){
	// cleanup here
}
```
This is needed for example for [Angular](https://github.com/capaj/NG6-starter/blob/eb988ef00685390618b5dad57635ce80c6d52680/client/app/app.js#L42), which needs clean DOM every time it bootstraps.

## Credit
Most of the credit for this awesome engineering feat should go to [Guy Bedford](https://github.com/guybedford). He paved me a way, I simply followed it.

## Contributing
Code is written in [![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

Tests are run as usual:`npm test`

1. fork it
2. write your code
3. open PR
4. lay back and if you want to speed it up, hit me up on [twitter](https://twitter.com/capajj)
