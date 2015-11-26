import React from 'react'
import Stateless from '../components/stateles-sample'

export default class Home extends React.Component {
  constructor (...props) {
    super(...props)
  }

  render () {
    return <div>
      <h2>Home route</h2>
      <Stateless name='stranger'/>
      <p>you can try editing it as you like to test this out</p>

    </div>
  }
}
