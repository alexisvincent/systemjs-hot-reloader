import React from 'react'
import ReactDOM from 'react-dom/server'
import injectTapEventPlugin from 'react-tap-event-plugin'
import Home from './routes/home'
// Needed for onTouchTap
// Can go away when react 1.0 release
// Check this repo:
// https://github.com/zilverline/react-tap-event-plugin
injectTapEventPlugin()

let output = ReactDOM.renderToString((
  <Home/>
))

console.log(output)
