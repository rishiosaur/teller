import { gql } from 'graphql-request'
import { App } from '@slack/bolt'
import { userExists } from '../functions/users'
import { blocksAndText, postEphemeralUserCurry } from '../functions/chat'
import { client } from '../functions/graphql'

const create = async (app: App) => {
	app.command('/create', async ({ command, ack }) => {
		await ack()

		const { user_id: user, channel_id: channel } = command

		const sayEphemeral = postEphemeralUserCurry(channel, user)

		if (await userExists(user)) {
			sayEphemeral(
				...blocksAndText(
					`You already have a low-interest tax-free savings account with the HN Bank, <@${user}>!`
				)
			)
		} else {
			const query = gql`
				mutation CreateUser($user: String!) {
					createUser(id: $user) {
						secret
					}
				}
			`

			const created = await client.request(query, { user })

			await sayEphemeral(
				...blocksAndText(
					`I've created a bank account with 0‡ for you, <@${user}>! Use your HN wisely... \nYour private access token (IT IS *IMPERATIVE* THAT YOU DO NOT SHARE THIS) is \`${created.createUser.secret}\``
				)
			)
		}
	})

	app.command('/secret', async ({ command, ack }) => {
		await ack()

		const { user_id: user, channel_id: channel } = command
		const sayEphemeral = postEphemeralUserCurry(channel, user)

		const query = gql`
			mutation ResetToken($user: String!) {
				resetUserSecret(id: $user) {
					secret
					balance
				}
			}
		`

		const resetted = await client.request(query, { user })

		await sayEphemeral(
			...blocksAndText(
				`Alright, <@${user}>! I've reset your HN account with ${resetted.resetUserSecret.balance}‡. Your private access token (IT IS *IMPERATIVE* THAT YOU DO NOT SHARE THIS) is now \`${resetted.resetUserSecret.secret}\`.`
			)
		)
	})
}

export default create
