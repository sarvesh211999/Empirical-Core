import { assert } from 'chai';
import {rigidChangeObjectMatch, flexibleChangeObjectMatch, levenshteinChangeObjectMatch} from './change_object_match'
import {Response} from '../../interfaces'

describe('The rigidChangeObjectMatch function', () => {

    it('Should take a response string and classify it as missing word', () => {
        const responseString:string = "My took a nap.";
        const savedResponses: Array<Response> = [
          {
            id: 1,
            text: "My dog took a nap.",
            feedback: "Good job, that's a sentence!",
            optimal: true,
            count: 1,
            question_uid: "questionOne"
          }
        ]
        const matchedResponse = rigidChangeObjectMatch(responseString, savedResponses);
        assert.equal(matchedResponse.response.id, savedResponses[0].id)
        assert.equal(matchedResponse.errorType, "MISSING_WORD");
    });

    it('Should take a response string and classify it as added word', () => {
        const responseString:string = "My lazy dog took a nap.";
        const savedResponses: Array<Response> = [
          {
            id: 1,
            text: "My dog took a nap.",
            feedback: "Good job, that's a sentence!",
            optimal: true,
            count: 1,
            question_uid: "questionOne"
          }
        ]
        const matchedResponse = rigidChangeObjectMatch(responseString, savedResponses);
        assert.equal(matchedResponse.response.id, savedResponses[0].id)
        assert.equal(matchedResponse.errorType, "ADDITIONAL_WORD");
    });

    it('Should take a response string and classify it as modified word', () => {
        const responseString:string = "My cat took a nap.";
        const savedResponses: Array<Response> = [
          {
            id: 1,
            text: "My dog took a nap.",
            feedback: "Good job, that's a sentence!",
            optimal: true,
            count: 1,
            question_uid: "questionOne"
          }
        ]
        const matchedResponse = rigidChangeObjectMatch(responseString, savedResponses);
        assert.equal(matchedResponse.response.id, savedResponses[0].id)
        assert.equal(matchedResponse.errorType, "INCORRECT_WORD");
    });
});

describe('The levenshteinChangeObjectMatch function', () => {

    it('Should take a response string and classify it as missing word', () => {
        const responseString:string = "My took a nap.";
        const savedResponses: Array<Response> = [
          {
            id: 1,
            text: "My dog took a nap.",
            feedback: "Good job, that's a sentence!",
            optimal: true,
            count: 1,
            question_uid: "questionOne"
          }
        ]
        const matchedResponse = levenshteinChangeObjectMatch(responseString, savedResponses);
        assert.equal(matchedResponse.response.id, savedResponses[0].id)
        assert.equal(matchedResponse.errorType, "MISSING_WORD");
    });

    it('Should take a response string and classify it as added word', () => {
        const responseString:string = "My lazy dog took a nap.";
        const savedResponses: Array<Response> = [
          {
            id: 1,
            text: "My dog took a nap.",
            feedback: "Good job, that's a sentence!",
            optimal: true,
            count: 1,
            question_uid: "questionOne"
          }
        ]
        const matchedResponse = levenshteinChangeObjectMatch(responseString, savedResponses);
        assert.equal(matchedResponse.response.id, savedResponses[0].id)
        assert.equal(matchedResponse.errorType, "ADDITIONAL_WORD");
    });

    it('Should take a response string and classify it as modified word', () => {
        const responseString:string = "My cat took a nap.";
        const savedResponses: Array<Response> = [
          {
            id: 1,
            text: "My dog took a nap.",
            feedback: "Good job, that's a sentence!",
            optimal: true,
            count: 1,
            question_uid: "questionOne"
          }
        ]
        const matchedResponse = levenshteinChangeObjectMatch(responseString, savedResponses);
        assert.equal(matchedResponse.response.id, savedResponses[0].id)
        assert.equal(matchedResponse.errorType, "INCORRECT_WORD");
    });
});


describe('The flexibleChangeObjectMatch function', () => {

        it('Should take a response string and classify it as missing word', () => {
            const responseString:string = "my took a nap";
            const savedResponses: Array<Response> = [
              {
                id: 1,
                text: "My dog took a nap.",
                feedback: "Good job, that's a sentence!",
                optimal: true,
                count: 1,
                question_uid: "questionOne"
              }
            ]
            const matchedResponse = flexibleChangeObjectMatch(responseString, savedResponses);
            assert.equal(matchedResponse.response.id, savedResponses[0].id)
            assert.equal(matchedResponse.errorType, "MISSING_WORD");
        });

        it('Should take a response string and classify it as added word', () => {
            const responseString:string = "my lazy dog took a nap";
            const savedResponses: Array<Response> = [
              {
                id: 1,
                text: "My dog took a nap.",
                feedback: "Good job, that's a sentence!",
                optimal: true,
                count: 1,
                question_uid: "questionOne"
              }
            ]
            const matchedResponse = flexibleChangeObjectMatch(responseString, savedResponses);
            assert.equal(matchedResponse.response.id, savedResponses[0].id)
            assert.equal(matchedResponse.errorType, "ADDITIONAL_WORD");
        });

        it('Should take a response string and classify it as modified word', () => {
            const responseString:string = "my cat took a nap";
            const savedResponses: Array<Response> = [
              {
                id: 1,
                text: "My dog took a nap.",
                feedback: "Good job, that's a sentence!",
                optimal: true,
                count: 1,
                question_uid: "questionOne"
              }
            ]
            const matchedResponse = flexibleChangeObjectMatch(responseString, savedResponses);
            assert.equal(matchedResponse.response.id, savedResponses[0].id)
            assert.equal(matchedResponse.errorType, "INCORRECT_WORD");
        });
    });

    describe('The flexibleChangeObjectMatch function', () => {

            it('Should take a response string and classify it as missing word', () => {
                const responseString:string = "my took a nap";
                const savedResponses: Array<Response> = [
                  {
                    id: 1,
                    text: "My dog took a nap.",
                    feedback: "Good job, that's a sentence!",
                    optimal: true,
                    count: 1,
                    question_uid: "questionOne"
                  }
                ]
                const matchedResponse = flexibleChangeObjectMatch(responseString, savedResponses);
                assert.equal(matchedResponse.response.id, savedResponses[0].id)
                assert.equal(matchedResponse.errorType, "MISSING_WORD");
            });

            it('Should take a response string and classify it as added word', () => {
                const responseString:string = "my lazy dog took a nap";
                const savedResponses: Array<Response> = [
                  {
                    id: 1,
                    text: "My dog took a nap.",
                    feedback: "Good job, that's a sentence!",
                    optimal: true,
                    count: 1,
                    question_uid: "questionOne"
                  }
                ]
                const matchedResponse = flexibleChangeObjectMatch(responseString, savedResponses);
                assert.equal(matchedResponse.response.id, savedResponses[0].id)
                assert.equal(matchedResponse.errorType, "ADDITIONAL_WORD");
            });

            it('Should take a response string and classify it as modified word', () => {
                const responseString:string = "my cat took a nap";
                const savedResponses: Array<Response> = [
                  {
                    id: 1,
                    text: "My dog took a nap.",
                    feedback: "Good job, that's a sentence!",
                    optimal: true,
                    count: 1,
                    question_uid: "questionOne"
                  }
                ]
                const matchedResponse = flexibleChangeObjectMatch(responseString, savedResponses);
                assert.equal(matchedResponse.response.id, savedResponses[0].id)
                assert.equal(matchedResponse.errorType, "INCORRECT_WORD");
            });
        });
