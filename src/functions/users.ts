import { gql } from 'graphql-request'
import { client } from './graphql'

export const isUser = (user: string) => !!user.match(/<@(.+?)>/)

export const unwrapUser = (user: string) =>
	user.match(/<@(.+?)\|(.+?)>/)[1] || null

export const userExists = async (id: string) => {
	let exists = false
	await client
		.request(
			gql`
				query Query($id: String!) {
					user(id: $id) {
						id
					}
				}
			`,
			{ id }
		)
		.then(() => (exists = true))
		.catch(() => (exists = false)) // Throws error if DB doesn't exist

	return exists
}

export const createUser = async (user: string) =>
	client.request(
		gql`
			mutation CreateUser($user: String!) {
				createUser(id: $user) {
					id
					secret
				}
			}
		`,
		{ user }
	)
