import { App } from '@slack/bolt'
import { gql } from 'graphql-request'
import {
	postMessageCurry,
	blocksAndText,
	postEphemeralUserCurry,
	postMessage,
} from '../functions/chat'
import { unwrapUser, userExists, createUser } from '../functions/users'
import { client } from '../functions/graphql'

import { extractNum } from '../functions/util'
const send = (app: App) => {
	app.command('/send-hn', async ({ ack, command, say }) => {
		// await ack()

		console.log(command.text.split(' '))

		const [_amount, _, _user, _for, ...forReasons] = command.text.split(' ')

		const from = command.user_id

		const to = unwrapUser(_user)
		const balance = extractNum(_amount)

		const sayEphemeral = postEphemeralUserCurry(
			command.channel_id,
			command.user_id
		)

		if (!(await userExists(from))) {
			await createUser(from)
		}

		if (!(await userExists(to))) {
			await createUser(to)
		}

		const query = gql`
			mutation Send(
				$to: String!
				$from: String!
				$balance: Float!
				$for: String
			) {
				send(data: { to: $to, from: $from, balance: $balance, for: $for }) {
					id
					validated
					balance
				}
			}
		`

		await client
			.request(
				query,
				_for && _for === 'for'
					? {
							from,
							to,
							balance,
							for: forReasons.join(' '),
					  }
					: {
							from,
							to,
							balance,
					  }
			)
			.catch(() => {
				sayEphemeral(
					...blocksAndText(
						`hehe you sneaky person; you can't send hn to yourself!`
					)
				)
			})
			.then(({ send }) => {
				if (send.validated) {
					await ack(
						`<@${from}> sent ${balance}‡ to <@${to}>${
							_for && _for === 'for' ? `for "${forReasons.join(' ')}"` : ''
						}! Transaction ID: \`${send.id}\``
					)
				} else {
					sayEphemeral(
						...blocksAndText(
							`Uh oh. It looks like you don't currently have enough HN to make that transaction go through. No worries; you can use \`/pay ${send.id}\` later to make the transaction go through.`
						)
					)
				}
			})
	})

	app.command('/slip', async ({ ack, command }) => {
		await ack()

		console.log(command.text.split(' '))

		const [_amount, _, _user, _for, ...forReasons] = command.text.split(' ')

		const from = command.user_id

		const to = unwrapUser(_user)
		const balance = extractNum(_amount)

		const sayEphemeral = postEphemeralUserCurry(
			command.channel_id,
			command.user_id
		)

		if (!(await userExists(from))) {
			await createUser(from)
		}

		if (!(await userExists(to))) {
			await createUser(to)
		}

		const query = gql`
			mutation Send(
				$to: String!
				$from: String!
				$balance: Float!
				$for: String
			) {
				send(data: { to: $to, from: $from, balance: $balance, for: $for }) {
					id
					validated
					balance
				}
			}
		`

		await client
			.request(
				query,
				_for && _for === 'for'
					? {
							from,
							to,
							balance,
							for: forReasons.join(' '),
					  }
					: {
							from,
							to,
							balance,
					  }
			)
			.catch(() => {
				sayEphemeral(
					...blocksAndText(
						`hehe you sneaky person; you can't send hn to yourself!`
					)
				)
			})
			.then(({ send }) => {
				if (send.validated) {
					sayEphemeral(
						...blocksAndText(
							`<@${from}> sent ${balance}‡ to <@${to}> ${
								_for && _for === 'for' ? `for "${forReasons.join(' ')}"` : ''
							}! Transaction ID: \`${send.id}\``
						)
					)
				} else {
					sayEphemeral(
						...blocksAndText(
							`Uh oh. It looks like you don't currently have enough HN to make that transaction go through. No worries; you can use \`/pay ${send.id}\` later to make the transaction go through.`
						)
					)
				}
			})
	})

	app.command('/transact', async ({ ack, command }) => {
		await ack()

		const [
			_amount,
			_f,
			_from,
			_,
			_to,
			_for,
			...forReasons
		] = command.text.split(' ')

		const from = unwrapUser(_from)

		const to = unwrapUser(_to)
		const balance = extractNum(_amount)

		const sayEphemeral = postEphemeralUserCurry(
			command.channel_id,
			command.user_id
		)

		if (!(await userExists(from))) {
			await createUser(from)
		}

		if (!(await userExists(to))) {
			await createUser(to)
		}

		const query = gql`
			mutation Send(
				$to: String!
				$from: String!
				$balance: Float!
				$for: String
			) {
				transact(data: { to: $to, from: $from, balance: $balance, for: $for }) {
					id
					validated
					balance
				}
			}
		`

		await client
			.request(
				query,
				_for && _for === 'for'
					? {
							from,
							to,
							balance,
							for: forReasons.join(' '),
					  }
					: {
							from,
							to,
							balance,
							for: '',
					  }
			)
			.then(async ({ transact }) => {
				await sayEphemeral(
					...blocksAndText(
						`Transaction created: ${
							transact.balance
						}‡ from <@${from}> :arrow_right: to <@${to}>${
							_for && _for === 'for' ? ` for ${forReasons.join(' ')}` : ''
						}! Transaction ID: \`${transact.id}\``
					)
				)
			})
			.catch(async () => {
				await sayEphemeral(
					...blocksAndText(
						`hehe you sneaky person; you can't send hn to yourself!`
					)
				)
			})
	})

	app.command('/inspect', async ({ ack, command }) => {
		await ack()

		const [_t] = command.text.split(' ')

		const sayEphemeral = postEphemeralUserCurry(
			command.channel_id,
			command.user_id
		)

		if (_t !== '') {
			try {
				const { transaction } = await client.request(
					gql`
						query Transaction($transaction: String!) {
							transaction(id: $transaction) {
								id
								validated
								balance
								from {
									id
									balance
								}

								to {
									id
									balance
								}
							}
						}
					`,
					{ transaction: _t }
				)

				sayEphemeral([
					{
						type: 'header',
						text: {
							type: 'plain_text',
							text: `Transaction inspection: Transaction #${transaction.id}`,
							emoji: true,
						},
					},
					{
						type: 'context',
						elements: [
							{
								type: 'mrkdwn',
								text: `*Flow*: <@${transaction.from.id}> (${transaction.from.balance}‡) :arrow_right: <@${transaction.to.id}> (${transaction.to.balance}‡)`,
							},
						],
					},

					{
						type: 'section',
						fields: [
							{
								type: 'mrkdwn',
								text: `*Balance*: ${transaction.balance}‡`,
							},
							{
								type: 'mrkdwn',
								text: `*Validated*: ${!transaction.validated ? 'No' : 'Yes'} ${
									transaction.validated ? ':white_check_mark:' : `:red_circle:`
								}`,
							},
						],
					},
				])
			} catch (err) {
				sayEphemeral(
					...blocksAndText(
						`It looks like \`${_t}\` isn't a transaction in this database. Please try another ID.`
					)
				)
			}
		} else {
			sayEphemeral(...blocksAndText('Please supply a transaction ID!'))
		}
	})

	app.command('/view', async ({ ack, command }) => {
		await ack()

		const [_t] = command.text.split(' ')

		const say = postMessageCurry(command.channel_id)

		const sayEphemeral = postEphemeralUserCurry(
			command.channel_id,
			command.user_id
		)

		if (_t !== '') {
			try {
				const { transaction } = await client.request(
					gql`
						query Transaction($transaction: String!) {
							transaction(id: $transaction) {
								id
								validated
								balance
								from {
									id
									balance
								}

								to {
									id
									balance
								}
							}
						}
					`,
					{ transaction: _t }
				)

				say([
					{
						type: 'header',
						text: {
							type: 'plain_text',
							text: `Transaction inspection: Transaction #${transaction.id}`,
							emoji: true,
						},
					},
					{
						type: 'context',
						elements: [
							{
								type: 'mrkdwn',
								text: `<@${transaction.from.id}> (${transaction.from.balance}‡) :arrow_right: <@${transaction.to.id}> (${transaction.to.balance}‡)`,
							},
						],
					},

					{
						type: 'section',
						fields: [
							{
								type: 'mrkdwn',
								text: `*Balance*: ${transaction.balance}‡`,
							},
							{
								type: 'mrkdwn',
								text: `*Validated*: ${!transaction.validated ? 'No' : 'Yes'} ${
									transaction.validated ? ':white_check_mark:' : `:red_circle:`
								}`,
							},
						],
					},
					{
						type: 'context',
						elements: [
							{
								type: 'mrkdwn',
								text: `Requested by <@${command.user_id}>`,
							},
						],
					},
				])
			} catch (err) {
				sayEphemeral(
					...blocksAndText(
						`It looks like \`${_t}\` isn't a transaction in this database. Please try another ID.`
					)
				)
			}
		} else {
			sayEphemeral(...blocksAndText('Please supply a transaction ID!'))
		}
	})

	app.command('/invoice', async ({ ack, command }) => {
		await ack()

		console.log(command.text.split(' '))

		const [_amount, _, _from, _for, ...forReasons] = command.text.split(' ')

		const from = unwrapUser(_from)

		const to = command.user_id
		const balance = extractNum(_amount)

		const sayEphemeral = postEphemeralUserCurry(
			command.channel_id,
			command.user_id
		)

		if (!(await userExists(from))) {
			await createUser(from)
		}

		if (!(await userExists(to))) {
			await createUser(to)
		}

		const query = gql`
			mutation Send(
				$to: String!
				$from: String!
				$balance: Float!
				$for: String
			) {
				transact(data: { to: $to, from: $from, balance: $balance, for: $for }) {
					id
					validated
					balance
				}
			}
		`

		await client
			.request(
				query,
				_for && _for === 'for'
					? {
							from,
							to,
							balance,
							for: forReasons.join(' '),
					  }
					: {
							from,
							to,
							balance,
							for: '',
					  }
			)
			.then(async ({ transact }) => {
				await sayEphemeral(
					...blocksAndText(
						`Transaction created: ${balance}‡ from <@${from}> :arrow_right: to <@${to}>! Transaction ID: \`${transact.id}\``
					)
				)

				await postMessage(
					from,
					...blocksAndText(
						`<@${to}> just invoiced you for ${transact.balance}‡! ${
							_for && _for === 'for' ? `Reason: "${forReasons.join(' ')}"` : ''
						}
					 Pay this invoice by running \`/pay ${transact.id}\``
					)
				)
			})
			.catch(async () => {
				await sayEphemeral(
					...blocksAndText(
						`hehe you sneaky person; you can't send hn to yourself!`
					)
				)
			})
	})

	app.command('/pay', async ({ ack, command }) => {
		await ack()

		const [id] = command.text.split(' ')

		const { channel_id: channel, user_id: user } = command

		const sayEphemeral = postEphemeralUserCurry(channel, user)

		const findTransaction = gql`
			query Query($id: String!) {
				transaction(id: $id) {
					from {
						id
					}

					to {
						id
					}
				}
			}
		`

		const transaction = await client
			.request(findTransaction, {
				id,
			})
			.then((t) => t)
			.catch(() => false)

		if (transaction && transaction.transaction.from.id === user) {
			const payTransaction = gql`
				mutation PayTransaction($id: String!) {
					pay(id: $id) {
						id
						balance

						validated
					}
				}
			`

			const { pay: paid } = await client.request(payTransaction, {
				id,
			})

			if (paid.validated) {
				sayEphemeral(
					...blocksAndText(
						`You've paid transaction \`${id}\` with ${paid.balance} HN.`
					)
				)
			} else {
				sayEphemeral(
					...blocksAndText(
						`Oh no! It looks like you don't have ${paid.balance} or more HN. This transaction cannot be completed at this time.`
					)
				)
			}
		} else {
			sayEphemeral(
				...blocksAndText(
					`It looks like I've run into an error! Either transaction \`${id}\` doesn't exist, or you aren't the person that made it.`
				)
			)
		}
	})
}

export default send
