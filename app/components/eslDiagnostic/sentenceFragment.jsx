import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import TextEditor from '../renderForQuestions/renderTextEditor.jsx';
import _ from 'underscore';
import ReactTransition from 'react-addons-css-transition-group';
import POSMatcher from '../../libs/sentenceFragment.js';
import fragmentActions from '../../actions/sentenceFragments.js';
import {
  submitNewResponse,
  incrementChildResponseCount,
  incrementResponseCount,
  getResponsesWithCallback,
  getGradedResponsesWithCallback
} from '../../actions/responses.js';
import icon from '../../img/question_icon.svg';
import updateResponseResource from '../renderForQuestions/updateResponseResource.js';
import { hashToCollection } from '../../libs/hashToCollection.js';
import translations from '../../libs/translations/index.js';
import translationMap from '../../libs/translations/ellQuestionMapper.js';

const key = ''; // enables this component to be used by both play/sentence-fragments and play/diagnostic

const PlaySentenceFragment = React.createClass({
  getInitialState() {
    return {
      response: this.props.question.prompt,
      checkAnswerEnabled: true,
      submitted: false,
    };
  },

  getInstructionText() {
    const textKey = translationMap[this.getQuestion().key];
    console.log(textKey);
    let text = translations.english[textKey];
    console.log(text);
    if (this.props.language !== 'english') {
      text += `<br/><br/>${translations[this.props.language][textKey]}`;
    }
    return text;
  },

  componentDidMount() {
    getGradedResponsesWithCallback(
      this.getQuestion().key,
      (data) => {
        this.setState({ responses: data, });
      }
    );
  },

  choosingSentenceOrFragment() {
    const { question, } = this.props;
    return question.identified === undefined && (question.needsIdentification === undefined || question.needsIdentification === true);
    // the case for question.needsIdentification===undefined is for sentenceFragments that were created before the needsIdentification field was put in
  },

  showNextQuestionButton() {
    const { question, } = this.props;
    const attempted = question.attempts.length > 0;
    if (attempted) {
      return true;
    } else {
      return false;
    }
  },

  getQuestion() {
    const { question, } = this.props;
    if (question.key.endsWith('-esp')) {
      question.key = question.key.slice(0, -4);
    }
    return question;
  },

  getResponses() {
    return this.state.responses;
  },

  checkChoice(choice) {
    const questionType = this.props.question.isFragment ? 'Fragment' : 'Sentence';
    this.props.markIdentify(choice === questionType);
  },

  getSentenceOrFragmentButtons() {
    // HARDCODED
    return (
      <div className="sf-button-group">
        <button className="button sf-button" value="Sentence" onClick={() => { this.checkChoice('Sentence'); }}>Complete / Completa la oración</button>
        <button className="button sf-button" value="Fragment" onClick={() => { this.checkChoice('Fragment'); }}>Incomplete / Oración incompleta</button>
      </div>
    );
  },

  handleChange(e) {
    this.setState({ response: e, });
  },

  handleAttemptSubmission() {
    if (this.state.submitted === false) {
      this.setState(
        { submitted: true, },
        this.props.nextQuestion()
      );
    }
  },

  checkAnswer() {
    if (this.state.checkAnswerEnabled && this.state.responses) {
      const key = this.getQuestion().key;
      const { attempts, } = this.props.question;
      this.setState({ checkAnswerEnabled: false, }, () => {
        const { prompt, wordCountChange, ignoreCaseAndPunc, } = this.getQuestion();
        const fields = {
          prompt,
          responses: hashToCollection(this.getResponses()),
          questionUID: key,
          wordCountChange,
          ignoreCaseAndPunc,
        };
        const responseMatcher = new POSMatcher(fields);
        const matched = responseMatcher.checkMatch(this.state.response);
        updateResponseResource(matched, key, attempts, this.props.dispatch, );
        this.props.updateAttempts(matched);
        this.setState({ checkAnswerEnabled: true, });
        this.handleAttemptSubmission();
      });
    }
  },

  renderSentenceOrFragmentMode() {
    // HARDCODED
    if (this.choosingSentenceOrFragment()) {
      return (
        <div className="container">
          <ReactTransition transitionName={'sentence-fragment-buttons'} transitionLeave transitionLeaveTimeout={2000}>
            <div className="feedback-row">
              <img className="info" src={icon} style={{ marginTop: 3, }} />
              <p>Is this a complete or an incomplete sentence?</p>
            </div>
            <div className="feedback-row">
              <img className="info" src={icon} style={{ marginTop: 3, }} />
              <p>Esta oración esta complete o incompleta?</p>
            </div>
            {this.getSentenceOrFragmentButtons()}
          </ReactTransition>
        </div>
      );
    } else {
      return (<div />);
    }
  },

  getSubmitButtonText() {
    let text = translations.english['submit button text'];
    if (this.props.language !== 'english') {
      text += ` / ${translations[this.props.language]['submit button text']}`;
    }
    return text;
  },

  renderPlaySentenceFragmentMode(fragment) {
    // HARDCODED
    const button = <button className="button student-submit" onClick={this.checkAnswer}>{this.getSubmitButtonText()}</button>;

    if (!this.choosingSentenceOrFragment()) {
      const component = (
        <div className="feedback-row">
          <img className="info" src={icon} style={{ marginTop: 3, }} />
          <p dangerouslySetInnerHTML={{ __html: this.getInstructionText(), }} />
        </div>
      );

      return (
        <div className="container">
          <ReactTransition
            transitionName={'text-editor'} transitionAppear transitionAppearTimeout={1200}
            transitionLeaveTimeout={300}
          >
            {component}
            <TextEditor value={this.state.response} handleChange={this.handleChange} disabled={this.showNextQuestionButton()} checkAnswer={this.checkAnswer} />
            <div className="question-button-group">
              {button}
            </div>
          </ReactTransition>
        </div>
      );
    }
  },

  render() {
    const fragment = this.getQuestion();
    return (
      <div className="student-container-inner-diagnostic">
        <div className="draft-js sentence-fragments prevent-selection">
          <p>{this.getQuestion().prompt}</p>
        </div>

        {this.renderSentenceOrFragmentMode()}
        {this.renderPlaySentenceFragmentMode(fragment)}
      </div>
    );
  },
});

function select(state) {
  return {
    routing: state.routing,
  };
}

export default connect(select)(PlaySentenceFragment);
