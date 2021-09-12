require("dotenv").config();
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.connect(process.env.MONGO_URI);


const __info = new Schema({
  prefix: { type: String, index: true, required: true, default: "_" },
  blacklist: { type: Array, index: true, default: [] },
  censors: { type: Array, index: true, default: JSON.parse(process.env.censors) },
  statuses: { type: Array, index: true, default: ["by myself", "with nothing", "dead"] },
  leaveMessages: { type: Array, index: true, default: ["bye :("] },
  censor: { type: Boolean, index: true, default: false },
  writeLeave: { type: Boolean, index: true, default: false },
  writeJoin: { type: Boolean, index: true, default: false }
})
const character = new Schema({
  name: { type: String, index: true },
  author: { type: String, index: true },
  description: { type: String, index: true },
  image: { type: String, index: true },
  race: { type: String, index: true },
  alignment: { type: String, index: true },
  link: { type: String, index: true }
})
const item = new Schema({
  name: { type: String, index: true },
  author: { type: String, index: true },
  description: { type: String, index: true },
  image: { type: String, index: true },
  link: { type: String, index: true }
})
const steed = new Schema({
  name: { type: String, index: true },
  owner: { type: String, index: true },
  author: { type: String, index: true },
  description: { type: String, index: true },
  image: { type: String, index: true },
  link: { type: String, index: true }
})
const Steed = mongoose.model("Steed", steed)
const Item = mongoose.model("Item", item);
const Char = mongoose.model("Char", character);
const Info = mongoose.model("Info", __info);

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
})

client.on("messageCreate", async (message) => {
  try {
    let info = await Info.findOne({ __v: 0 });
    let prefix = info.prefix;
    let cont = message.content;
    let guild = message.guild;
    function send(cont) {
      message.channel.send(cont.length === 0 ? "\u200b" : cont.slice(0, 2000)) + cont.length >= 2000 ? "..." : ""
    }

    if (cont.startsWith(info.prefix) && !message.author.bot) {
      let com = cont.split(info.prefix)[1];
      let comSplit = com.split` `;
      let command = comSplit.slice(1, comSplit.length).join` `;


      if (com === "help") {
        let helpEmbed = {
          color: 0x0099ff,
          title: 'Help Menu',
          fields: [
            {
              name: prefix + "help",
              value: 'Shows the help menu',
              inline: false
            },
            {
              name: prefix + "say",
              value: 'Deletes your message and says it.',
              inline: false
            },
          ],
        };
        send({ embeds: [helpEmbed] })
      }
      if (comSplit[0] === "say") {
        if (command.match(/\<\@.+\>/g) || command.includes("@everyone") || command.includes("@here")) {
          send("I'm not allowed to ping anyone");
        } else {
          message.delete();
          send("`" + command + "`")
          console.log(command);
        }
      }
      if (comSplit[0] === "create") {
        if (comSplit[1] === "oc") {
          if (com.includes(":;\n")) {
            let data = com.split`:;\n`;
            const ocembed = {
              color: 0x0099ff,
              title: data[0],
              url: data[5],
              description: data[2],
              thumbnail: {
                url: data[6] || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAGtJREFUOE+1ktERABAMQ2sJgxnUYJbgfPSOShsf+GzltQlJnFObdNsqWZKtHQUkjEAbYBWjaagPAUisWyhE77wFeIF602f9CBFBbLCrRQpgwYYAJqYWbOLIHrXAgr2yEP2LvwC2/v8Qb15hAAaYMxHJkEs9AAAAAElFTkSuQmCC",
              },
              fields: [
                {
                  name: 'Regular field title',
                  value: 'Some value here',
                },
                {
                  name: '\u200b',
                  value: '\u200b',
                  inline: false,
                },
                {
                  name: 'Inline field title',
                  value: 'Some value here',
                  inline: true,
                },
                {
                  name: 'Inline field title',
                  value: 'Some value here',
                  inline: true,
                },
                {
                  name: 'Inline field title',
                  value: 'Some value here',
                  inline: true,
                },
              ],
              image: {
                url: 'https://i.imgur.com/AfFp7pu.png',
              },
              timestamp: new Date(),
              footer: {
                text: 'Some footer text here',
                icon_url: 'https://i.imgur.com/AfFp7pu.png',
              },
            };
            message.channel.send({ embeds: [ocembed] })
          } else {
            send(`To add your OC to the dictionary, please format your post like this:
\`\`\`
create oc :;
<insert name>:;
<insert description (short, about 100 characters)>:;
<insert race>:;
<insert alignment>:;
<link to application>:;
<insert image url (optional)>
\`\`\`
An example will be
\`\`\`
create oc :;
Sauron:;
Sauron is the dark lord of the third age who tried to destroy middle earth:;
Umaiar:;
Lawful Evil:;
https://discord.com/channels/0123456789/9876543210:;
https://c.tenor.com/k0cPQlr82ycAAAAS/sauron-lotr.gif
\`\`\`
        `)
          }
        } else if (comSplit[1] === "item") {
          send("make item")
        } else if (comSplit[1] === "steed") {
          send("make steed")
        } else {
          send("You can't add a/an " + comSplit[1] + " to the dictionary.  The only things allowed are **oc**, **item**, and **steed**")
        }
      }







      if (comSplit[0] === "eval") {
        if (message.author.id === process.env.crtr) {
          send("Evaluated Output: ```javascript\n" + eval(command) + "\n```");
        } else {
          send("Sorry, only master can use this command");
        }
      }
    }

  } catch (err) {
    message.channel.send("Whoops, something went wrong.  There was an internal error.");
  }
})

client.login(process.env.BOT_TOKEN)