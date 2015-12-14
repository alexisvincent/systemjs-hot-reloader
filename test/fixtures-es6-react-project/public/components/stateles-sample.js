import React from 'react'

const Test = (props) => {
  return <div onClick={() => console.log('clicked2')}>hello {props.name}</div>
}

export default Test
