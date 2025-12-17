module.exports = {
  types: [
    { value: '🌈 Update', name: '🌈 Update:\tUpdating changes' },
    { value: '📍 Feat', name: '📍 Feat:\tAdd a new feature' },
    { value: '🔨 Fix', name: '🔨 Fix:\tModify production, UI,UX code' },
    { value: '📝 Docs', name: '📝 Docs:\tAdd or update documentation' },
    {
      value: '🎨 Style',
      name: '🎨 Style:\tAdd or update code format (not updation production, UI,UX code)',
    },
    {
      value: '🤖 Refactor',
      name: '🤖 Refactor:\tCode change that neither fixes a bug nor adds a feature',
    },
    {
      value: '✅ Test',
      name: '✅ Test:\tCode change related with tests cases',
    },
    {
      value: '🚚 Chore',
      name: '🚚 Chore:\tChanges to the build process or auxiliary tools\n\t\tand libraries such as documentation generation',
    },
    {
      value: '✂️ Remove',
      name: '✂️ Remove:\tRemove files ',
    },
    {
      value: '🔧 Rename',
      name: '🔧 Rename:\tmove file or rename folder names',
    },
  ],
  messages: {
    type: '커밋 변경유형을 선택해주세요.\n',
    subject: '커밋제목을 50자이내로 명확하게 작성해주세요.\n',
    body: '본문을 작성 해주세요. 여러줄 작성시 "|" 를 사용하여 줄바꿈하세요. (첫줄|둘째줄):\n',
    confirmCommit: '모든 커밋메시지를 제대로 입력하셨나요? (y | n)',
  },
  allowCustomScopes: false,
  skipQuestions: ['scope', 'customScope'],
  subjectLimit: 60,
};
