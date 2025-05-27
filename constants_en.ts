import { ValouAreaItem } from './types';

export const VALOU_AREAS_EN: ValouAreaItem[] = [
  {
    id: 'privatesLeben',
    name: 'Private Life',
    description: 'Where, how, with what and with whom do I want to live?',
    color: '#7CB342', // light green
    tipps: [
      'Living environment and housing situation (city, countryside, size)',
      'Private relationships (family, friends, partner)',
      'Daily routines and organizational factors',
      'Work-life balance'
    ]
  },
  {
    id: 'persoenlichkeitSkills',
    name: 'Personality & Skills',
    description: 'Who do I want to be? What do I stand for?',
    color: '#FFC107', // yellow
    tipps: [
      'Personality & traits (e.g. creative, structured)',
      'Values (e.g. freedom, security, sustainability)',
      'Experiences & background',
      'Capabilities & qualifications',
      'Interests & drivers'
    ]
  },
  {
    id: 'taetigkeit',
    name: 'Work & Tasks',
    description: 'Where, how, with whom and what do I work on?',
    color: '#A1887F', // light brown
    tipps: [
      'Framework conditions (working hours, workplace)',
      'Organization & rules (hierarchy, decision making)',
      'Activity & tasks (what, how, for what purpose)',
      'People & relationships at work',
      'Culture, style & communication at the workplace'
    ]
  },
  {
    id: 'stilWirkung',
    name: 'Style & Impact',
    description: 'How do I want to come across and through what?',
    color: '#EC407A', // pink
    tipps: [
      'Behavior & habits',
      'Communication & channels (in person, digital)',
      'Clothing and outer appearance',
      'Personal brand and positioning'
    ]
  },
  {
    id: 'ressourcenMittel',
    name: 'Resources & Means',
    description: 'Do I have everything in the right amount at the right time?',
    color: '#42A5F5', // blue
    tipps: [
      'Finances (income, expenses, assets)',
      'Social resources & network (support, contacts)',
      'Cultural resources (formal qualification, education)',
      'Time as a resource',
      'Tools & aids'
    ]
  },
  {
    id: 'gesundheit',
    name: 'Health',
    description: 'What do I need for my health?',
    color: '#EF5350', // red
    tipps: [
      'Physical health',
      'Mental and emotional health',
      'Health behavior: exercise, sleep, nutrition',
      'Prevention and medical care',
      'Stress management and recovery'
    ]
  }
];
