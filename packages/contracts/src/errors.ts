export const ERROR_MESSAGES = {
    choiceNamesRequired: 'Choice names are required.',
    duplicateChoiceNames: 'Choice names must be unique.',
    duplicatePollName: 'Vote with that name already exists.',
    duplicateVoteSubmission:
        'Vote has already been submitted for one or more selected choices.',
    emptyVoteSubmission: 'You must submit at least one vote.',
    invalidPollId: 'Invalid poll ID.',
    noValidVotes: 'You must submit at least one valid vote.',
    notEnoughChoices: 'Not enough choices.',
    pollNameRequired: 'Poll name is required.',
    pollNotFound: 'Poll not found.',
    voterNameRequired: 'Voter name is required.',
} as const;
