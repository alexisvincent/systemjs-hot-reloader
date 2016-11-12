# systemjs-hot-reloader [next]
Simple HMR for SystemJS build on top of [alexisvincent/systemjs-hmr](https://github.com/alexisvincent/systemjs-hmr).

## Overview
systemjs-hot-reloader has been refractored to run off of [alexisvincent/systemjs-hmr](https://github.com/alexisvincent/systemjs-hmr).
systemjs-hmr is a new project with the goal of building HMR primitives into the core SystemJS project. The current behaviour/code has been relocated
to this new project and new behaviour is being built in parallel.

This new version has a number of benefits over the current approach, namely:
- faster reloads
- more consistent reloads
- support for circular dependencies
- better state hydration
- better external tooling support (via configuration and low level API's)

## Limitations
- Since systemjs-hot-reloader no longer controls the reload process, it emits fewer events (most people don't use these anyway)
- At the moment the new version only supports SystemJS 19. Compatibility will be added soon for < v0.19 and the upcoming v20 release.

## Install
```
jspm i --dev systemjs-hot-reloader
```

## Usage
System.trace must be enabled. To do this, add `trace: true` to your config. 

systemjs-hmr needs to load before any modules are imported (different to current behaviour).
To get this right, in your HTML file where you import your app, first import the hot reloader.

```javascript
System.import('systemjs-hot-reloader/next/default-listener.js')
// or if you want a custom event emitter port 
System.import('capaj/systemjs-hot-reloader/next/hot-reloader.js').then(function(HotReloader){
    new HotReloader.default('http://localhost:8090')  // chokidar-socket-emitter port
})

// then 
System.import('app/app.js')
```

## State Hydration and Module Unloading
As described [here](https://github.com/alexisvincent/systemjs-hmr#state-hydration-and-safe-unloads), state hydration is handled in the following way.

```
// You can import the previous module instance from '@hot'
// During the first load, module == false
import { module } from '@hot'

/** 
* When a new version of a module is imported it will probably want to 
* reinitialize it's own state based on the state of the previous version.
* Since all exports of the previous instance are available, you can 
* simply export any state you might want to persist.
*/
export const _state = module ? module._state : {}

/**
 * You can safely unload/unmount/cleanup anything by exporting an unload function
 * and then calling it whenever you reload (if module is something other then false)
 */
export const __unload = () => {
    console.log('Unload something (unsubscribe from listeners, disconnect from socket, etc...)')
    // force unload React components
    ReactDOM.unmountComponentAtNode(DOMNode);	// your container node
}

if(module)
    module.__unload()
```

There is also an alternative state hydration technique described [here](https://github.com/alexisvincent/systemjs-hmr/issues/2#issuecomment-258653791), however,
although stable it is likely not to remain for much longer (unless someone convinces me otherwise), for the reasons described in the thread. 