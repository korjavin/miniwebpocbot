/// <reference path="../pb_data/types.d.ts" />

migrate((db) => {
  // Create Users collection
  const usersCollection = new Collection({
    name: 'users',
    type: 'base',
    system: false,
    schema: [
      {
        name: 'telegram_id',
        type: 'number',
        system: false,
        required: true,
        unique: true,
        options: {
          min: null,
          max: null,
        },
      },
      {
        name: 'name',
        type: 'text',
        system: false,
        required: true,
        options: {
          min: null,
          max: 100,
        },
      },
      {
        name: 'balance',
        type: 'number',
        system: false,
        required: true,
        options: {
          min: 0,
          max: null,
          default: 1000,
        },
      },
    ],
    indexes: ['CREATE UNIQUE INDEX idx_unique_telegram_id ON users (telegram_id)'],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  });

  // Create Questions collection
  const questionsCollection = new Collection({
    name: 'questions',
    type: 'base',
    system: false,
    schema: [
      {
        name: 'question_text',
        type: 'text',
        system: false,
        required: true,
        options: {
          min: null,
          max: null,
        },
      },
      {
        name: 'options',
        type: 'json',
        system: false,
        required: true,
      },
      {
        name: 'status',
        type: 'select',
        system: false,
        required: true,
        options: {
          values: ['open', 'closed'],
          maxSelect: 1,
        },
      },
      {
        name: 'correct_option',
        type: 'text',
        system: false,
        required: false,
        options: {
          min: null,
          max: null,
        },
      },
    ],
    indexes: [],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  });

  // Create Bets collection
  const betsCollection = new Collection({
    name: 'bets',
    type: 'base',
    system: false,
    schema: [
      {
        name: 'user',
        type: 'relation',
        system: false,
        required: true,
        options: {
          collectionId: usersCollection.id,
          cascadeDelete: false,
          minSelect: null,
          maxSelect: 1,
          displayFields: ['name'],
        },
      },
      {
        name: 'question',
        type: 'relation',
        system: false,
        required: true,
        options: {
          collectionId: questionsCollection.id,
          cascadeDelete: false,
          minSelect: null,
          maxSelect: 1,
          displayFields: ['question_text'],
        },
      },
      {
        name: 'selected_option',
        type: 'text',
        system: false,
        required: true,
        options: {
          min: null,
          max: null,
        },
      },
      {
        name: 'amount',
        type: 'number',
        system: false,
        required: true,
        options: {
          min: 1,
          max: null,
        },
      },
      {
        name: 'placed_at',
        type: 'date',
        system: false,
        required: true,
        options: {
          min: '',
          max: '',
        },
      },
    ],
    indexes: ['CREATE UNIQUE INDEX idx_unique_user_question ON bets (user, question)'],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  });

  return [usersCollection, questionsCollection, betsCollection];
}, (db) => {
  // Revert the changes
  const collections = ['users', 'questions', 'bets'];
  collections.forEach(collection => {
    db.deleteCollection(collection);
  });
});
