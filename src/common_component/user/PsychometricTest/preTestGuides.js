/**
 * The pre-test guide, one per test: Stream Selector (classes 7 to 9) and Career
 * Selector (classes 10 to 12). Shown in the test pop-up and on the report
 * pop-up's guide tab (PreTestGuide.jsx). The wording is the team's, as given —
 * edit it here and both places change.
 */

const DOS = [
  { title: 'Environment', text: 'Take the assessment in a quiet, comfortable, and distraction-free environment.' },
  { title: 'Concentration', text: 'Attempt the assessment with complete focus and concentration.' },
  { title: 'Honesty', text: 'There are no right or wrong answers in the personality, interest, orientation, and preference-based sections. Select the response that genuinely reflects you, just be honest.' },
  { title: 'Avoid overthinking', text: 'Read each question carefully and respond naturally. Wherever possible, choose the answer that best represents your immediate and genuine feeling or idea for that question.' },
  { title: 'Time', text: 'Ensure that you have adequate uninterrupted time before starting the assessment.' },
  { title: 'Being focused', text: 'Follow the instructions provided for each section before proceeding with the questions. Then read each question carefully before answering.' },
  { title: 'Device', text: 'A laptop or desktop computer is recommended for a smooth assessment experience. Ensure that your device is adequately charged and that you have a stable internet connection. If you are planning to take the test through your phone or tablet, make sure all the notifications are turned off so you can focus on the test.' },
]

const DONTS = [
  { title: 'Avoid distractions', text: 'Attending calls, checking messages, or engaging in other activities or thoughts while taking the test.' },
  { title: 'Fear', text: 'Do not fear anyone while taking the test, as that will impact the answers negatively.' },
  { title: 'Fake', text: 'Do not fake, or try to replicate or copy the answers of others, as that will impact your answers wrongly.' },
  { title: 'Expectations', text: 'Do not select answers based on what you think your parents, teachers, friends, or others may expect from you. Your authentic response will provide a more meaningful assessment.' },
  { title: 'Mind-set', text: 'Avoid taking the assessment when you are extremely tired, stressed, distracted, or in a hurry, as that may lead to incorrect inputs.' },
  { title: 'External assistance', text: 'We want to know you and your thoughts on the questions asked, so don’t ask or depend on people around you or the internet to answer the questions, as that will lead to incorrect answers.' },
]

const APTITUDE = [
  'Ensure that you are fully focused before starting the section.',
  'Read each question carefully and manage your time effectively.',
  'Try to maintain a balance between speed and accuracy.',
  'Avoid spending excessive time on any single question.',
]

const SITTINGS = [
  { title: 'First sitting', text: 'Complete the first 3 sections with full concentration.' },
  { title: 'Break', text: 'Take a break of approximately 3–4 hours to refresh yourself.' },
  { title: 'Second sitting', text: 'Complete the remaining sections when you are again comfortable and focused.' },
]

const shared = { aptitude: APTITUDE, sittings: SITTINGS, dos: DOS, donts: DONTS }

export const PRE_TEST_GUIDES = {
  stream: {
    ...shared,
    name: 'Stream Selector Test',
    classes: 'Classes 7 to 9',
    duration: '1 hr 30 min',
    about: 'The Stream Assessment evaluates 4 key dimensions to help identify a suitable academic stream and your preferences.',
    dimensions: ['Orientation', 'Interest', 'Personality', 'Aptitude'],
  },
  career: {
    ...shared,
    name: 'Career Selector Test',
    classes: 'Classes 10 to 12',
    duration: '2 hr 30 min',
    about: 'The Career Assessment evaluates 5 key dimensions to provide a comprehensive understanding of your career-related profile.',
    dimensions: ['Orientation', 'Interest', 'Personality', 'Aptitude', 'Emotion Quotient'],
  },
}
