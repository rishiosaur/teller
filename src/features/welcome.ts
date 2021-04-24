import { App } from '@slack/bolt'
import { gql } from 'graphql-request'
import { HNChannel } from '../config'
import {
	blocksAndText,
	postEphemeralUserCurry,
	postMessage,
	postMessageCurry, removeActionsFromMessage,
	sendSequentially
} from '../functions/chat'
import { client } from '../functions/graphql'

const welcome = (app: App) => {
	app.event('member_joined_channel', async ({ body, event, say }) => {
		console.log(event.channel)
		console.log(HNChannel)
		console.log(event.channel === HNChannel)
		if (event.channel !== 'C01ECJRQKGT') return null;

		const postEphemeral = postEphemeralUserCurry(event.channel, event.user)

		await postEphemeral(...blocksAndText(`Whoa!!! :eyes_shaking:  (TL;DR for this welcome message: Head on over to <@U01EJ84MYS0>'s DMs) \n\n Welcome to the HN channel, <@${event.user}>! This is the hub of activity for all Hack Club economy-related things; where people talk through future features for the virtual currency, showcase their new bots and apps, and do wacky stuff!\n\nHN is nothing more than a simple coin; hackers can open HN accounts by running \`/balance\` to get started.\n\n HN as a currency can be traded using the HN GraphQL API :graphql:, which is what bots like <@U01AAM4E1M4> use to add HN payment support. You can find a full list of bots that allow HN usage (places where you can use HN) by heading on over to <@U01TM5UF249>'s Home tab.\n\n Anyways, that's enough talking for one day. Let's get you set up and all acquainted with HN :eyes: Head on over to <@U01EJ84MYS0>'s Messages tab to get started.`))

		// await postMessage(event.user, )

		const im = postMessageCurry(event.user)

		const introPieces: (string | [string, number])[] = [
			'????',
			':cake:',
			':parrot:?',
			':adorpheus:',
			':scrappy:',
			':glitched:',
			'~*AHEM*~',
			'.',
			'.',
			'.',
			'.',
			[
				'Sorry, I was a bit off there. Let me load some sentience :eggthink:',
				2500,
			],
			['`s̸̨̨̨̼͇̙̪̰͕̯̼̣̲̮̙̯͕̗̊̀͐̓͑͊̏̐̌̏̓̓̋̋̂̃̔͂̔̂ͅe̴̛͍̊̎͊̾̒͛̍́̑̊̈́̈͒̃͒͊̃͝͝͝ņ̶̢̢͕͙͚̘̺̬̥̜͓̩̬͚̭̣͈̞̂̓̒͜͜t̴͍̝̱̙̟̀ȋ̶̗̪̉̿͐̂̂̐̂̌̎̂̑̿̋̂̉̊̏͘͝͠ẹ̶̡̡̢̨͔̰̩̮̭̣͎̲͉̥̖̺͎̫̐͒́͜͠ͅn̷̜͗̏̍̆̐͌́̃͒̓̽́̇͊͊͑̚͘c̴̢̢͉̬̬̼̖̯̟̳̿̔̈́̈́͊e̸̫͙̼̊̑̎̊̏̑̈́̒̍͌̌͛̕ ̷̫̣͚̙̓͒͋̓́̎͑͘͝l̸͙̟̖͓̎̍͊̉o̸̧̧̨̙̝͇̩̠͓̤̳͖̭͓͎̥͇͊̈́̆͐̍̆̀͝a̵̱͕̗̪̺̟̲̻̳̙̯͍͓̹̦̋͒͋̀̀̓̔̓̿̿́̈́̚͝͝d̵̨͚͈̮͎̘̣̬̰̅̽͌́̉̐͆͋̈́̀̓̏̒̅͑̀͗̀͘̚̕ẻ̶̟̱̱͖̘̤͉̇̈͊̃̏̈́̍̄̄̃̔͘̕̚̕̕͠͝d̵̨͉̠̯͙͉̫̗͚͍̤͎̠̞̒́̊̿͆̈́̀͗̅̈́̇̕͜͝`', 2500],
			["I'm The Teller!~ it's lovely to meet you :smile: !", 2000],
			`Like all of the other :sparkles: *amazing* :sparkles: bots here, I can do a lot of things (we'll get into my purpose a little bit later)! However, my favourite thing is saying hello to new people, so.... hello! :wave:`,
		]

		await sendSequentially(introPieces, im)

		await im([
			{
				type: 'context',
				elements: [
					{
						type: 'mrkdwn',
						text: `Hai there!`,
					},
				],
			},
			{
				type: 'actions',
				elements: [
					{
						type: 'button',
						text: {
							type: 'plain_text',
							emoji: true,
							text: 'Heyoo! :wave::skin-tone-4: ',
						},
						style: 'primary',
						value: event.user,
						action_id: 'hello_hacker',
					},
				],
			},
		])})

		app.action('hello_hacker', async ({ ack, body, action }) => {
			await ack();

			await removeActionsFromMessage(body)

			const { value: user } = action as any

			const im = postMessageCurry(user)

			const introPieces: (string | [string, number])[] = [
				[
					`*flaps hand vigorously* Hello to you too (again), <@${user}>!`,
					1000,
				],
				[`Anyways, small talk over, let's get into the gist of things. I'm here to help you understand what HN is, and some ways that you might be able to use it.`, 2500],
				["Let's get started!", 1000],
				`First, you need to create an HN account: to do this, run \`/balance\` in here (this interaction will create an account for you, and then you'll be able to view your account balance by running it again or going to Teller's Home tab).`,
			]

		await sendSequentially(introPieces, im)

		await im([
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": `Let me know when you've finished running \`/balance\` :eyes:`
				}
			},
			{
				type: 'actions',
				elements: [
					{
						type: 'button',
						text: {
							type: 'plain_text',
							emoji: true,
							text: ':flying_money_with_wings: I\'ve created my account!',
						},
						style: 'primary',
						value: user,
						action_id: 'balance_hacker',
					},
				],
			},
		])
	})

	app.action('balance_hacker', async ({ ack, body, action }) => {
		await ack();

		await removeActionsFromMessage(body)

		const { value: user } = action as any
		const im = postMessageCurry(user)

		const introPieces: (string | [string, number])[] = [
			[
				`Woot woot! :yay:`,
				1000,
			],
			[`As I said before, \`/balance\` is a *slash command* that you can run anywhere (except threads) to get your current account balance :classical_building:. If you want to be a bit more discreet about it, you can run \`/peek\`. To see other peoples' balances, run \`/peek <@user>\`: something like \`/peek <@U013STH0TNG>\` (feel free to run it right now!)`, 2500],
			['To transfer money *out of your account*, there are a bunch of different commands that you can use. The simplest one is /send-hn, which allows you to, well, send HN to someone (or something).', 1000],
			`Let's try using that command, shall we?\n\n`,
		]

		await sendSequentially(introPieces, im)

		const query = gql`
        mutation Send(
            $to: String!
        ) {
            send(data: { to: $to, from: "U01EJ84MYS0", balance: 10, for: "joining HN!" }) {
                id
                validated
                balance
            }
        }`

		await client.request(query, {
			to: user
		})

		await sendSequentially([
			[
				`I've sent you exactly 10HN for this starting session. Hopefully I can count on you for not spending it egregiously; HN's pretty valuable!`,
				1000,
			],
			"Anyways, that's beyond the point. Go ahead and run `/send-hn 10 to @Fifty ` to get started with the `send` command! Fifty is a bot that gives you a 50/50 chance at getting insulted or complimented, and is just one of the many ways you can spend your hard-earned HN."
		], im)


		await im([
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": `Let me know when you've finished sending those sweet, sweet monies :eyes:`
				}
			},
			{
				type: 'actions',
				elements: [
					{
						type: 'button',
						text: {
							type: 'plain_text',
							emoji: true,
							text: ':flying_money_with_wings: I\'ve interacted with Fifty!',
						},
						style: 'primary',
						value: user,
						action_id: 'send_hacker',
					},
				],
			},
		])





	})

	app.action('send_hacker', async ({ ack, body, action }) => {
		await ack();

		await removeActionsFromMessage(body)

		const { value: user } = action as any

		const im = postMessageCurry(user)


		await sendSequentially([
			[
				`:yay: :hyperfastparrot: :yay: :hyperfastparrot: :yay: :hyperfastparrot: :yay: :hyperfastparrot:`,
				1000,
			],
			"Those two commands are the most important ones you'll run into in your HN career. Alongside sending money, you can also *request* it from someone; run `/invoice 20hn from <@U013STH0TNG>` to get 20hn to play with.",
			"Anyways, that's all the basics covered! Head on over to the HN channel and stir up some awesome stuff; there's usually an interesting game of Uno or some cool conversations going on. Play around with your hard-earned cash! Alternatively, you can head on over to <@U01TM5UF249>'s Home tab to see a full list of things you can do with HN."
		], im)


		await im([
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": `Once you're done, feel free to head back here to learn a bit more about HN :smile:`
				}
			},
			{
				type: 'actions',
				elements: [
					{
						type: 'button',
						text: {
							type: 'plain_text',
							emoji: true,
							text: 'I\'m done playing around!',
						},
						style: 'primary',
						value: user,
						action_id: 'advance_hacker',
					},
				],
			},
		])

	})

	app.action('advance_hacker', async ({ ack, body, action }) => {
		await ack();

		await removeActionsFromMessage(body)

		const { value: user } = action as any

		const im = postMessageCurry(user)


		await sendSequentially([
			[
				`Woot woot! Hopefully you had a bit of fun; we're in the final stages of learning about HN now! `,
				1000,
			],
			"All bots that use HN actually work with the HN API under the hood; it's a centralized place that allows anyone to modify their own user records—you can play around with it at https://hn.rishi.cx! Bots that use this API need what's known as a *bot token*, which you can request from <@UHFEGV147> after creating a Slack Bot.",
			"Even I use the API! All of my commands (the complete list of which you can see by clicking 'About') use some of its logic under the hood.",
			['You can find the source code of the HN API at https://z.rishi.cx/g/hn and the source code for yours truly at https://z.rishi.cx/g/teller.', 1000],
			'.',
			'.','.','.',
	"Oh no! It looks like HQ's calling me for an important debrief on a person known as 'Farquit P. Noonrind'? Not sure what that's all about, but it does mean that our time together's come to an end (for now, at least). \n\nI'll always be around to deal with your slash commands, but until then, happy hacking!",
			'Sincerely, \n\n Teller, Rishi, and the HN Team.'


		], im)
	})

}

export default welcome;
