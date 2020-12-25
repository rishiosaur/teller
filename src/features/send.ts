import { App } from '@slack/bolt'
import { gql } from 'graphql-request'
import { unwrapUser, userExists, createUser } from '../functions/users'
import { client } from '../functions/graphql'
import {
	blocksAndText,
	postEphemeralUserCurry,
	postMessage,
} from '../functions/chat'
import { extractNum } from '../functions/util'
const send = (app: App) => {
	app.command('/send-hn', async ({ ack, command, say }) => {
		await ack()

		console.log(command.text.split(' '))

		const [_amount, _, _user] = command.text.split(' ')

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
			mutation Send($to: String!, $from: String!, $balance: Float!) {
				send(data: { to: $to, from: $from, balance: $balance }) {
					id
					validated
					balance
				}
			}
		`

		const { send } = await client.request(query, {
			from,
			to,
			balance,
		})

		if (send.validated) {
			say(
				`<@${from}> sent ${balance}‡ to <@${to}>! Transaction ID: \`${send.id}\``
			)
		} else {
			sayEphemeral(
				...blocksAndText(
					`Uh oh. It looks like you don't currently have enough HN to make that transaction go through. No worries; you can use \`/pay ${send.id}\` later to make the transaction go through.`
				)
			)
		}
	})

	app.command('/slip', async ({ ack, command }) => {
		await ack()

		const [_amount, _, _user] = command.text.split(' ')

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
			mutation Send($to: String!, $from: String!, $balance: Float!) {
				send(data: { to: $to, from: $from, balance: $balance }) {
					id
					validated
					balance
				}
			}
		`

		const { send } = await client.request(query, {
			from,
			to,
			balance,
		})

		if (send.validated) {
			sayEphemeral(
				...blocksAndText(
					`<@${from}> slipped ${balance}‡ to <@${to}>! Transaction ID: \`${send.id}\``
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

	app.command('/transact', async ({ ack, command }) => {
		await ack()

		console.log(command.text.split(' '))

		const [_amount, _f, _from, _, _to] = command.text.split(' ')

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
			mutation Send($to: String!, $from: String!, $balance: Float!) {
				transact(data: { to: $to, from: $from, balance: $balance }) {
					id
					validated
					balance
				}
			}
		`

		const { transact } = await client.request(query, {
			from,
			to,
			balance,
		})

		sayEphemeral(
			...blocksAndText(
				`Transaction created: ${transact.balance}‡ from <@${from}> :arrow_right: to <@${to}>! Transaction ID: \`${transact.id}\``
			)
		)
	})

	app.command('/invoice', async ({ ack, command }) => {
		await ack()

		console.log(command.text.split(' '))

		const [_amount, _, _from] = command.text.split(' ')

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
			mutation Send($to: String!, $from: String!, $balance: Float!) {
				transact(data: { to: $to, from: $from, balance: $balance }) {
					id
					validated
					balance
				}
			}
		`

		const { transact } = await client.request(query, {
			from,
			to,
			balance,
		})

		await sayEphemeral(
			...blocksAndText(
				`Transaction created: 5‡ from <@${from}> :arrow_right: to <@${to}>! Transaction ID: \`${transact.id}\``
			)
		)

		await postMessage(
			from,
			...blocksAndText(
				`<@${to}> just invoiced you for ${transact.balance}‡! Pay this invoice by running \`/pay ${transact.id}\``
			)
		)
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
