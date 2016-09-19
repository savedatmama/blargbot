var e = module.exports = {};
var bu = require('./../util.js');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'todo [remove <item id> | add <item>]';
e.info = 'Access your todo list.\n'
    + 'To add items, do `todo add <item>`.\n'
    + 'To remove items, do `todo remove <item id>`, where item id is the number shown when you do `todo` by itself.';
e.longinfo = `<p>Access your todo list.</p><p>To add items, do <code>todo add &lt;item&gt;</code>.</p><p>To remove items, do <code>todo remove &lt;item id&gt;</code>, where item id is the number shown when you do <code>&lt;todo&gt;</code> by itself.</p>`;
e.category = bu.CommandType.GENERAL;

e.execute = (msg, words) => {
    var db = bu.db;
    if (words.length > 1) {
        var itemid;
        switch (words[1].toLowerCase()) {
            case 'add':
                console.log('adding');
                if (words.length < 3) {
                    bu.send(msg.channel.id, 'Not enough arguments given!');
                    return;
                }
                db.query(`select itemid from todo where userid = ? order by itemid desc limit 1`, [msg.author.id], (err, rows) => {
                    itemid = 0;
                    console.log(err);
                    if (rows && rows[0]) {
                        itemid = rows[0].itemid + 1;
                    }
                    db.query(`insert into todo (userid, itemid, content) values (?, ?, ?)`,
                        [msg.author.id, itemid, words.slice(2, words.length).join(' ')]);
                    bu.send(msg.channel.id, 'Done');

                });
                break;
            case 'remove':
                console.log('removing');
                if (words.length < 3) {
                    bu.send(msg.channel.id, 'Not enough arguments given!');
                    return;
                }
                db.query(`select itemid, content from todo where userid = ?`, [msg.author.id], (err, rows) => {
                    if (!rows && !rows[0]) {
                        bu.send(msg.channel.id, 'There was nothing to delete.');
                    }
                    db.query(`delete from todo where userid = ?`, [msg.author.id], () => {
                        var itemid = 0;
                        for (var i = 0; i < rows.length; i++) {
                            if (rows[i].itemid != words[2]) {
                                db.query(`insert into todo (userid, itemid, content) values (?, ?, ?)`,
                                    [msg.author.id, itemid, rows[i].content]);
                                itemid++;
                            }
                            if (i == rows.length - 1) {
                                bu.send(msg.channel.id, 'Done');
                            }
                        }
                    });
                });
                break;
            default:
                defaultOption(msg, db);
        }
    } else {
        defaultOption(msg, db);
    }
};

function defaultOption(msg, db) {
    db.query(`select itemid, content from todo where userid = ?`, [msg.author.id], (err, rows) => {
        if (rows.length > 0) {
            var list = 'Here\'s your to-do list!\n';
            for (i = 0; i < rows.length; i++) {
                list += rows[i].itemid + '. ' + rows[i].content + '\n';
            }
            bu.send(msg.channel.id, list);
        } else {
            bu.send(msg.channel.id, 'You have nothing on your list!');
        }
    });
} 