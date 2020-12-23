import { postEphemeralCurry } from './../functions/chat'
import { App } from '@slack/bolt'
import { gql } from 'graphql-request'
import { client } from '../functions/graphql'
import { postEphemeralUserCurry, blocksAndText } from '../functions/chat'
import { unwrapUser, userExists } from '../functions/users'

const balance = async (app: App) => {
	app.command('/peek', async ({ ack, command, say }) => {
		await ack()
		const { channel_id: channel } = command

		const user =
			command.text === '' ? command.user_id : unwrapUser(command.text)

		console.log(user)

		const sayEphemeral = postEphemeralUserCurry(channel, command.user_id)

		const query = gql`
			query User($user: String!) {
				user(id: $user) {
					balance
				}
			}
		`

		const exists = await userExists(user)

		if (exists) {
			const x = await client.request(query, {
				user,
			})

			sayEphemeral(
				...blocksAndText(
					`It appears that <@${user}> has a balance of ${x.user.balance}‡. (Requested by <@${command.user_id}>)`
				)
			)
		} else {
			const query = gql`
				mutation CreateUser($user: String!) {
					createUser(id: $user) {
						id
					}
				}
			`

			await client.request(query, { user })

			await sayEphemeral(
				...blocksAndText(
					`Since they didn't have one before, I've created a bank account with 0‡ for <@${user}>! Feel free to let them know.`
				)
			)

			sayEphemeral(
				...blocksAndText(
					`It appears that <@${user}> has a balance of 0‡. (Requested by <@${command.user_id}>)`
				)
			)
		}
	})

	app.command('/balance', async ({ ack, command, say }) => {
		await ack()
		const { channel_id: channel } = command

		const user =
			command.text === '' ? command.user_id : unwrapUser(command.text)

		console.log(user)

		const sayEphemeral = postEphemeralUserCurry(channel, command.user_id)

		const query = gql`
			query User($user: String!) {
				user(id: $user) {
					balance
				}
			}
		`

		const exists = await userExists(user)

		if (exists) {
			const x = await client.request(query, {
				user,
			})

			say(
				`It appears that <@${user}> has a balance of ${x.user.balance}‡. (Requested by <@${command.user_id}>)`
			)
		} else {
			const query = gql`
				mutation CreateUser($user: String!) {
					createUser(id: $user) {
						id
					}
				}
			`

			await client.request(query, { user })

			await sayEphemeral(
				...blocksAndText(
					`Since they didn't have one before, I've created a bank account with 0‡ for <@${user}>! Feel free to let them know.`
				)
			)

			say(
				`It appears that <@${user}> has a balance of 0‡. (Requested by <@${command.user_id}>)`
			)
		}
	})
}

export default balance
