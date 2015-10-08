# jspm-hot-reloader
connects to chokidar-socket-emitter and reloads your JS modules as you change them. Should work with any client side framework. Not just React.

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

If you don't have computers from the future, you probably dislike JSPM because of how slow it is. Well you can give JSPM another shot, because this package solves this problem right off the bat.

## How
When a change event is emitted on socket.io, we match a module in System._loader.moduleRecords.
If a match is found, we then aggressively delete all the module and recursively all modules, which import it directly or indirectly via other modules.
Last step is to import again all modules we deleted.

## Contributing
