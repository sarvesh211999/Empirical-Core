import * as _ from 'underscore'
import constants from '../../constants';
import {stringNormalize} from 'quill-string-normalizer'
import {getTopOptimalResponse} from '../sharedResponseFunctions'
import {Response, PartialResponse, ConceptResult, WordCountChange} from '../../interfaces'
import {feedbackStrings} from '../constants/feedback_strings'
import {conceptResultTemplate} from '../helpers/concept_result_template'
import * as qpos from '../partsOfSpeechTagging';

export function partsOfSpeechMatch(response: string, responses:Array<Response>):PartialResponse|undefined {
  const correctPOSTags = getGradedResponses(responses).map(
    optimalResponse => qpos.getPartsOfSpeechTags(optimalResponse.text)
  );
  // convert user submission to POS string
  const userPOSTags = qpos.getPartsOfSpeechTags(response);
  // if user string could be converted to POS tags find response that has the same POS tags
  if (userPOSTags) {
    return  _.find(getGradedResponses(responses), (optimalResponse, index) => {
      if (optimalResponse.parent_id) {
        return false;
      } else if (correctPOSTags[index]) {
        if (JSON.stringify(correctPOSTags[index]) === JSON.stringify(userPOSTags)) {
          // this will return the response object
          return true;
        }
      }
    });
  }
}

export function partsOfSpeechChecker(responseString: string, responses:Array<Response>):PartialResponse|undefined {
  const match = partsOfSpeechMatch(responseString, responses);
  if (match) {
    return partsOfSpeechResponseBuilder(responses, match)
  }
}

export function partsOfSpeechResponseBuilder(responses:Array<Response>, match): PartialResponse {
  const res = {
    optimal: match.optimal,
    parent_id: match.id,
    author: match.author,
    feedback: match.feedback,
    concept_results: match.concept_results
  }
  return res
}

export function getGradedResponses(responses:Array<Response>) {
  // returns sorted collection optimal first followed by suboptimal
  const gradedResponses = responses.filter(response =>
    (response.optimal !== undefined) || (!response.parent_id)
  );
  return _.sortBy(gradedResponses, 'optimal').reverse();
}
