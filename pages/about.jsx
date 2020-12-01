import React from 'react'
import { connect } from 'react-redux'
import { wrapper } from '../store/store'

const About = (props) => {
  return (
    <div>
      <h1>About</h1>
      <p>Stuff</p>
    </div>
  )
}

export const getStaticProps = wrapper.getStaticProps(async ({ store }) => {})

const mapStateToProps = (state) => ({
  
})

const mapDispatchToProps = (dispatch) => {
  return {
    
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(About)
