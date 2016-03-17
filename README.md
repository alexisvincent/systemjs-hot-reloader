# systemjs-hot-reloader
connects via socket.io to an event source such as:
- [chokidar-socket-emitter](https://github.com/capaj/chokidar-socket-emitter) 
- atom plugin [jspm-dev-buddy](https://atom.io/packages/jspm-dev-buddy)

and reloads your ES6 modules as you change them. Similar to browserify hot module replacement, but running in your browser.

## Install
```
jspm i --dev systemjs-hot-reloader
```

## Usage
### JSPM 0.17.x
Described by [@guybedford](https://github.com/guybedford/) himself:  
http://jspm.io/0.17-beta-guide/hot-reloading.html
### JSPM 0.16.x
#### Connect to default event emitter  port
Use when your event emitter is available at http://localhost:5776 (the default). Include in your `index.html`:
```javascript
System.trace = true
System.import('./app.js')
```
At the top of your es6 code:
```javascript
import 'systemjs-hot-reloader/default-listener.js'
```
Maps to empty module on production builds, so no needs for any if statements. 
#### Connect to custom event emitter port
Include in your `index.html`:
```javascript
if (location.origin.match(/localhost/)) { 
  System.trace = true
  System.import('capaj/systemjs-hot-reloader').then(function(HotReloader){
    new HotReloader.default('http://localhost:8090')  // chokidar-socket-emitter port
  })
}
System.import('./app.js')
```
You can drop the if statement, but it is nice and convenient to load reloader only when on localhost. That way you can go into production without changing anything.

## Sample projects

Boilerplate set up for hot reloading modules you can fork and use with 3 simple terminal commands(git clone XXX && npm i && npm start):
- [React](https://github.com/capaj/jspm-react)
- [Mithril.js](https://github.com/capaj/jspm-mithril)
- [Angular 2](https://github.com/capaj/jspm-ng2)
- [Angular - NG6-starter](https://github.com/capaj/NG6-starter)


## Why

We're javascript programmers. We should not need to bundle our apps for development. Many folks dislike JSPM because of how slow it is. JSPM deserves another shot, because it can be faster, more robust and more reliable than most alternatives. This simple package proves it. Especially for larger codebases, SPAs and such-reliable hot reloadable modules are a necessray for meaningful feedback loop. React-transform is hacky-very often a change in a source code doesn't manifestate after a reload. Read [this article](https://medium.com/@dan_abramov/hot-reloading-in-react-1140438583bf#.6gk8gzb72) for more info on React-transform vs reloading whole modules.

## Preserving state
If you want some state to persist through hot reload, just put it in a module separate from the component. I personally use [POJOs with observation](https://github.com/mweststrate/mobservable), but you are free to use any kind of value store, as long as it sits in separate module from your reloaded component.
Another way to do this is by adding a [simple systemjs-hot-reloader-store utility](https://github.com/peteruithoven/systemjs-hot-reloader-store).

## How
When a change event is emitted on socket.io, we match a module in System._loader.moduleRecords.
If a match is found, we then aggressively delete the changed module and recursively all modules which import it directly or indirectly via other modules. This ensures we always have the latest version of code running, but we don't force the browser into unnecessary work.
Last step is to import again all modules we deleted, by calling import on the one that changed-module hierarchy will make sure all get loaded again.

## Hooks
### Reload
See example: https://github.com/capaj/systemjs-hot-reloader/pull/23#issue-119311376

### Unload
Any module, which leaves side effects in the browser and you want to hot-reload properly should export
```javascript
export function __unload(){
	// cleanup here
}
```
This is needed for example for [Angular](https://github.com/capaj/NG6-starter/blob/eb988ef00685390618b5dad57635ce80c6d52680/client/app/app.js#L42), which needs clean DOM every time it bootstraps.

This is also needed for some React components, like the Redux Provider and React Router. A crude way to force reloading of React components: 
``` javascript
export function __unload() {
  // force unload React components
  ReactDOM.unmountComponentAtNode(DOMNode);	// your container node
}
```

## Credit
Most of the credit for this awesome engineering feat should go to [Guy Bedford](https://github.com/guybedford). He paved me a way, I simply followed it.

## Contributing
Code is written in [![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

Tests are run as usual: `npm test`

1. fork it
2. write your code
3. open PR
4. lay back and if you want to speed it up, hit me up on [twitter](https://twitter.com/capajj)
