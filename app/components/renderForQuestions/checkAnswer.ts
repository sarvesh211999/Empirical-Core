import { hashToCollection } from '../../libs/hashToCollection';
import * as _ from 'underscore'
import Question from '../../libs/question';
import DiagnosticQuestion from '../../libs/diagnosticQuestion';
import {checkSentenceCombining, checkDiagnosticQuestion} from 'quill-marking-logic'

export default function checkAnswer(question, response, responses, mode='default') {
  const fields = {
    responses: responses ? hashToCollection(responses) : [],
    questionUID: question.key,
    focusPoints: question.focusPoints ? hashToCollection(question.focusPoints): [],
    incorrectSequences: question.incorrectSequences ? hashToCollection(_.compact(question.incorrectSequences)) : [],
  };
  const newResponse = mode === 'default'
    ? checkSentenceCombining(fields.questionUID, response, fields.responses, fields.focusPoints, fields.incorrectSequences)
    : checkDiagnosticQuestion(fields.questionUID, response, fields.responses)
  return {response: newResponse};
}
