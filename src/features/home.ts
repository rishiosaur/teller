/* eslint-disable prefer-spread */
import { App } from '@slack/bolt'
import { gql } from 'graphql-request'
import { client } from '../functions/graphql'
import { userExists } from '../functions/users'

const generateHome = async (user: string) => {
	const sumTransactions = (x: any) =>
		(x as Array<any>).reduce(
			(acc, { balance, validated }) =>
				validated ? ((acc + (balance as number)) as number) : acc + 0,
			0
		)
	const { user: u } = await client.request(
		gql`
			query Query($user: String!) {
				user(id: $user) {
					incomingTransactions {
						balance
						validated
					}

					outgoingTransactions {
						balance
						validated
					}
					balance
				}
			}
		`,
		{
			user,
		}
	)

	const {
		user: { incomingTransactions, outgoingTransactions },
	} = await client.request(
		gql`
			query Query($user: String!) {
				user(id: $user) {
					incomingTransactions(
						options: { take: 5, sort: { field: "id", order: "DESC" } }
					) {
						...FT
					}

					outgoingTransactions(
						options: { take: 5, sort: { field: "id", order: "DESC" } }
					) {
						...FT
					}
				}
			}

			fragment FT on Transaction {
				balance
				id
				validated
				from {
					id
				}

				to {
					id
				}
			}
		`,
		{
			user,
		}
	)

	// console.log(firstFew)

	return {
		type: 'home',
		blocks: [
			{
				type: 'header',
				text: {
					type: 'plain_text',
					text: 'Your HN Dashboard',
					emoji: true,
				},
			},
			{
				type: 'context',
				elements: [
					{
						type: 'mrkdwn',
						text: `Let's get a quick look at your account details, <@${user}>!`,
					},
				],
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `:bank-hackclub: *Current Balance*: ${u.balance}‡ `,
					},
					{
						type: 'mrkdwn',
						text: `:take_my_money: *Total Transactions*: ${
							u.incomingTransactions.length + u.outgoingTransactions.length
						}`,
					},
					{
						type: 'mrkdwn',
						text: `:moneybag: *Total _validated_ income*: ${sumTransactions(
							u.incomingTransactions
						)}‡`,
					},
					{
						type: 'mrkdwn',
						text: `:flying_money_with_wings: *Total _validated_ expenses*: ${sumTransactions(
							u.outgoingTransactions
						)}‡`,
					},
					{
						type: 'mrkdwn',
						text: `:chart_with_downwards_trend: *Total outstanding expenses*: ${(u.outgoingTransactions as Array<
							any
						>).reduce(
							(acc, { balance, validated }) =>
								!validated ? acc + (balance as number) : acc,
							0
						)}‡`,
					},
				],
			},
			{
				type: 'header',
				text: {
					type: 'plain_text',
					text: 'Recent outgoing transactions',
					emoji: true,
				},
			},
			{
				type: 'context',
				elements: [
					{
						type: 'mrkdwn',
						text: ':thonk: Where have you recently put your HN?',
					},
				],
			},

			{
				type: 'divider',
			},
			...[].concat.apply(
				[],
				(outgoingTransactions as Array<any>).map((transaction) => [
					{
						type: 'section',
						fields: [
							{
								type: 'mrkdwn',
								text: `*Balance*: ${transaction.balance}‡`,
							},
							{
								type: 'mrkdwn',
								text: `*Participants*: <@${transaction.from.id}> :arrow_right: <@${transaction.to.id}>`,
							},
							{
								type: 'mrkdwn',
								text: `*Validated*: ${!transaction.validated ? 'No' : 'Yes'} ${
									transaction.validated
										? ':white_check_mark:'
										: `:red_circle: - Pay by running \`/pay ${transaction.id}\``
								}`,
							},
							{
								type: 'mrkdwn',
								text: `*ID*: ${transaction.id}`,
							},
						],
					},
					{
						type: 'divider',
					},
				])
			),
			{
				type: 'header',
				text: {
					type: 'plain_text',
					text: 'Recent incoming transactions',
					emoji: true,
				},
			},
			{
				type: 'context',
				elements: [
					{
						type: 'mrkdwn',
						text: "Oi! Where'd ya get all that moolah?",
					},
				],
			},

			{
				type: 'divider',
			},
			...[].concat.apply(
				[],
				(incomingTransactions as Array<any>).map((transaction) => [
					{
						type: 'section',
						fields: [
							{
								type: 'mrkdwn',
								text: `*Balance*: ${transaction.balance}‡`,
							},
							{
								type: 'mrkdwn',
								text: `*Participants*: <@${transaction.from.id}> :arrow_right: <@${transaction.to.id}>`,
							},
							{
								type: 'mrkdwn',
								text: `*Validated*: ${!transaction.validated ? 'No' : 'Yes'} ${
									transaction.validated
										? ':white_check_mark:'
										: `:red_circle: - Ask <@${transaction.from.id}> to pay by running \`/pay ${transaction.id}\``
								}`,
							},
							{
								type: 'mrkdwn',
								text: `*ID*: ${transaction.id}`,
							},
						],
					},
					{
						type: 'divider',
					},
				])
			),
		],
	}
}

const home = (app: App) => {
	app.event('app_home_opened', async ({ event, client }) => {
		await client.views.publish({
			user_id: event.user,
			view: (await userExists(event.user))
				? ((await generateHome(event.user)) as any)
				: {
						type: 'home',
						blocks: [
							{
								type: 'header',
								text: {
									type: 'plain_text',
									text:
										":octagonal_sign: Uh-oh! Looks like you don't have an HN Account yet!",
									emoji: true,
								},
							},
							{
								type: 'context',
								elements: [
									{
										type: 'mrkdwn',
										text: `Sign up by running \`/balance\`, <@${event.user}>! We'll see ya in a bit :D`,
									},
								],
							},
						],
				  },
		})
	})
}

export default home
