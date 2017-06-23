const { Array } = require.main.require('./Tag/Classes');

class ForEachTag extends Array {
    constructor(client) {
        super(client, {
            name: 'foreach',
            args: [
                {
                    name: 'array'
                }, {
                    name: 'varName',
                    optional: true
                }, {
                    name: 'function'
                }
            ],
            minArgs: 2, maxArgs: 3
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args, false);
        args[0] = await ctx.processSub(args[0]);
        if (args.length === 3)
            args[1] = await ctx.processSub(args[1]);

        let arr = await this.loadArray(ctx, args[0]);
        let name = args.length === 3 ? args[1] : 'i';
        let code = args.length === 3 ? args[2] : args[1];
        let output;
        for (let i = 0; i < arr.length; i++) {
            ctx.client.TagVariableManager.executeSet(ctx, name, arr[i]);
            let result = await ctx.processSub(code);
            if (!output) output = result;
            else output = output.concat(result);
        }

        return res.setContent(output);
    }

}

module.exports = ForEachTag;