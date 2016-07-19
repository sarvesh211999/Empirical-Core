import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import QuestionSelect from '../questionSelect/questionSelect.jsx'

const Diagnostics = React.createClass({
  getInitialState() {
    // TODO This should just use state
    return {
      title: '',
    }
  },
  changeTitle(event) {
    this.setState({title: event.target.value})
  },
  render() {
    if (!this.props.concepts.hasreceiveddata || !this.props.questions.hasreceiveddata) {
      return (<p>Loading...</p>)
    }
    return (
      <section className="section">
        <div className="container">
          <h1 className="title">
            <Link to={"/admin/diagnostics"}>
              <button
                className="button is-primary"
              >
                &#8592; Back
              </button>
            </Link>
          </h1>
          <div>
            <ul className="menu-list">
              Diagnostics are a series of questions where each question has
              up to two questions succeeding it:
              <li>
                -- No succeeding questions means this question is terminal and
                after answering it the student will be given their results.
              </li>
              <li>
                -- One succeeding question is a linear scenario: upon answering
                the question the student will go to the next question.
              </li>
              <li>
                -- Two succeeding questions is a branching scenario: each of
                the two questions are labeled as either optimal or
                sub-optimal and the diagnostic will choose the next question
                based on the student's success at the current question.
              </li>
            </ul>
          </div>
          <div className="columns">
            <div className="column is-half">
              <label className="label">Title</label>
              <input
                className="input"
                placeholder="Diagnostic title"
                value={this.state.title}
                onChange={this.changeTitle}
              />
            </div>
          </div>
          <QuestionSelect showSubQuestions={true} />
        </div>
      </section>
    )
  }
})

function select(state) {
  return {
    concepts: state.concepts,
    routing: state.routing,
    questions: state.questions,
  }
}

export default connect(select)(Diagnostics)
