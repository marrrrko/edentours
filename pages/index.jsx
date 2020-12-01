import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { wrapper } from '../store/store'
import { increment, decrement } from '../store/actions/counterActions'

const Index = (props) => {
  return (
    <div>
      <h1>Hello</h1>
      <button onClick={props.incrementCounter}>Increment</button>
      <button onClick={props.decrementCounter}>Decrement</button>
      <h1>{props.counter}</h1>
    </div>
  )
}

export const getStaticProps = wrapper.getStaticProps(async ({ store }) => {})

const mapStateToProps = (state) => ({
  counter: state.counter.value
})

const mapDispatchToProps = (dispatch) => {
  return {
    incrementCounter: bindActionCreators(increment,dispatch),
    decrementCounter: bindActionCreators(decrement,dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Index)
