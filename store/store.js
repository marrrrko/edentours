import { createStore } from 'redux'
import { createWrapper, HYDRATE } from 'next-redux-wrapper'
import counterReducer from './reducers/counterReducer'
import { combineReducers } from 'redux'

const defaultReducer = (state = { tick: 'init' }, action) => {
  switch (action.type) {
    case HYDRATE:
      // Attention! This will overwrite client state! Real apps should use proper reconciliation.
      return { ...state, ...action.payload }
    case 'TICK':
      return { ...state, tick: action.payload }
    default:
      return state
  }
}

const rootReducer = combineReducers({
  defaultReducer,
  counter: counterReducer
})

const makeStore = (context) => {
  return createStore(rootReducer)
}

export const wrapper = createWrapper(makeStore, { debug: true })
