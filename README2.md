# systemjs-hot-reloader
[![npm version](https://badge.fury.io/js/systemjs-hot-reloader.svg)](https://badge.fury.io/js/systemjs-hot-reloader)
[![Build Status](https://travis-ci.org/alexisvincent/systemjs-hot-reloader.svg?branch=master)](https://travis-ci.org/alexisvincent/systemjs-hot-reloader)

Hot Module Replacement (HMR) for SystemJS. As you modify your source, `systemjs-hot-reloader` will add, remove, or swap out modules in the running application, without a page refresh (significantly speeding up development time).

`systemjs-hot-reloader` **MUST** be used in conjunction with event source such as:
- [systemjs-tools](https://github.com/alexisvincent/systemjs-tools) - smart development server
- [chokidar-socket-emitter](https://github.com/capaj/chokidar-socket-emitter) - simple file watcher
- [jspm-dev-buddy](https://atom.io/packages/jspm-dev-buddy) - atom plugin

`systemjs-hot-reloader` is a thin layer on top of [systemjs-hmr](https://github.com/alexisvincent/systemjs-hmr), which provides the meat of the reloading logic. If you are a library author looking to integrate HMR into your library or want a better understanding of how HMR works in SystemJS then check it out.

## Usage
Install with your client-side package manager (choose one)
- `jspm install --dev npm:systemjs-hot-reloader`
- `yarn add --dev systemjs-hot-reloader`
- `npm install --save-dev systemjs-hot-reloader`

`systemjs-hot-reloader` **MUST** run before your application code otherwise SystemJS
won't know how to resolve your app's `@hot` imports.

Assuming your app entry point is `app.js`, wrap your import statement so that you first load `systemjs-hot-reloader`.

```html
<script>
    System.import('systemjs-hot-reloader').then((connect) => {
        connect()
        System.import('app.js')
    })
</script>
```

`connect` can be passed a number of custom options. To initialise a custom connection

```html
<script>
    System.import('systemjs-hot-reloader').then((connect) => {
        connect({ host: '//localhost:1234' })
        System.import('app.js')
    })
</script>
```

Until SystemJS does automatically, you need to tell SystemJS how to handle
the `@hot` imports when building your app. To do this, add the following to
your jspm config file.

```js
{
  ...
  "map": {
    ...
    "@hot": "@empty"
  }
}
```

`systemjs-hot-reloader` will automatically set `SystemJS.trace = true`, so you no longer
need to set this manually, as with previous versions.

### Production
In production, `systemjs-hot-reloader` maps to an empty module so you can leave
the `systemjs-hot-reloader` import in your `index.html`.

## State Hydration and Module Unloading
As described [here](https://github.com/alexisvincent/systemjs-hmr#state-hydration-and-safe-unloads), state hydration is handled in the following way.

```javascript
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
although stable it is likely not to remain for much longer, for the reasons described in the thread.

## React
If you also want the added benefit of your react component state persisting across
reloads, you can use [Dan Abramov's](https://github.com/gaearon) excellent [react-hot-loader](https://github.com/gaearon/react-hot-loader) project, in conjunction with this one.

`react-hot-loader` functions as a babel transform for your react apps, so we need to add it as a babel plugin.

Install with your client-side package manager (choose one)
- `jspm install --dev npm:react-hot-loader`
- `yarn add --dev systemjs-hot-reloader`
- `npm install --save-dev systemjs-hot-reloader`

... TODO Should probably just send a PR to https://github.com/gaearon/react-hot-loader/tree/next/docs

## Example Projects
- [React](https://github.com/capaj/jspm-react)
- [Inferno](https://github.com/capaj/jspm-inferno)
- [Mithril.js](https://github.com/capaj/jspm-mithril)
- [Angular 2](https://github.com/capaj/jspm-ng2)
- [Angular - NG6-starter](https://github.com/capaj/NG6-starter)

## Contributing
I've tried to keep both this, and [systemjs-hmr](https://github.com/alexisvincent/systemjs-hmr) as beginner friendly as possible with lots of comments. So please feel free to browse the code and contribute back to the project.

## Credit
This project and the first HMR implementation was originally written by [@capaj](https://github.com/capaj), and none of this would have been possible without [Guy Bedford](https://github.com/guybedford).

