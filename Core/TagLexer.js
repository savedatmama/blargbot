const chevrotain = require('chevrotain');
const Lexer = chevrotain.Lexer;
const { SubTag } = require('./Structures');
function createToken(name, pattern, group) {
    let token = chevrotain.createToken({ name, pattern });
    return token;
}

class TagLexer {
    constructor() {
        this.tokens = {
            TagOpen: createToken('TagOpen', /\{/),
            TagClose: createToken('TagClose', /\}/),
            ArgumentSeparator: createToken('ArgumentSeparator', /;/),
            NewLine: chevrotain.createToken({ name: 'NewLine', pattern: / *\n/ }),
            Identifier: createToken('Text', /[^\{\};]*/)
        };
        this.SelectLexer = new Lexer(Object.values(this.tokens));

        let types = {};
        const tokenNames = Object.keys(this.tokens);
        for (let i = 0; i < tokenNames.length; i++) {
            types[tokenNames[i]] = i + 2;
        }
        this.tokenTypes = types;
    }

    tokenize(input) {
        return this.SelectLexer.tokenize(input);
    }

    parse(input) {
        let lexed = this.tokenize(input);
        let tokens = lexed.tokens;
        const tokenTypes = this.tokenTypes;
        const map = [];
        const stack = [map];

        function last(arr) {
            return (arr || stack)[(arr || stack).length - 1];
        }

        function add(token, arr) {
            const lastThing = last(arr);
            if (lastThing == undefined) console.dir(stack, { depth: 10 });
            if (lastThing instanceof SubTag) {
                lastThing.addArgument(token);
            } else {
                lastThing.push(token);
            }
        }

        for (const token of tokens) {
            switch (token.tokenType) {
                case tokenTypes.TagOpen:
                    if (Array.isArray(last())) {
                        add(new SubTag(token.startColumn - 1, token.startLine - 1));
                        stack.push(last(last()));
                    } else {
                        add(new SubTag(token.startColumn - 1, token.startLine - 1), last().rawArgs);
                        stack.push(last(last(last().rawArgs)));
                    }
                    break;
                case tokenTypes.TagClose:
                    stack.pop();
                    break;
                case tokenTypes.ArgumentSeparator:
                    if (!(last() instanceof SubTag)) {
                        add(token.image);
                    }
                    break;
                case tokenTypes.Identifier:
                    add(token.image);
                    break;
                case tokenTypes.NewLine:
                    add('\n');
                    break;
            }
        }
        return map;
    }
}

module.exports = TagLexer;



/**
 * This is an example of what a parsed map may look like
 */

const map = ['Hello! My favourite number is ', // Each block is an array of strings/SubTags
    { // This is a SubTag
        name: 'randint', // This is the SubTag's name
        args: [['1'], ['10']] // As each argument is a block, it is an array
    },
    '! This is a nested tag:',
    { // This is another SubTag
        name: 'void',
        args: [['Hello',
            { // This is a SubTag within a SubTag
                name: 'randint',
                args: [['1'], ['10']]
            },
            'World!'
        ]/* , ['another argument here, etc'] */]
    }
];